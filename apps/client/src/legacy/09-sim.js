// Offline match runner. Replaces the prototype's in-page simulation (makeFighter … update/endMatch)
// with packages/engine: the engine owns every gameplay number and outcome; this file keeps the
// prototype's match flow and turns engine state + events into the view objects `draw()` expects.
const SIM_DT = CK.E.DT;
/** Dev only (offline backend): `?speed=8` fast-forwards matches for testing. */
const DEV_SPEED = CK.BK.dev ? Number(new URLSearchParams(location.search).get('speed')) || 1 : 1;
const AURA_COL = { snow: '191,243,255', elec: '129,140,248', sun: '255,207,112', petal: '253,164,175' };
const TXT = {
  block: 'دفع',
  dodge: 'جاخالی',
  bubblePop: 'حباب ترکید',
  reflect: 'بازتاب',
  nineLives: 'نُه جان!',
  revived: 'دوباره زنده شد!',
  boostHit: 'ضربهٔ شتاب!',
  crit: 'چنگ!',
  out: 'حذف شد',
};
/** Client-only look of engine objects (projectile spin, rainbow hue), keyed by the engine object. */
const LOOK = new WeakMap();
/** View fighter for an engine fighter id (online, G.f is reordered so G.f[0] is the player). */
const fv = (id) => (G.byId ? G.byId[id] : G.f[id]);

function later(fn, ms) {
  const id = G && G.id;
  return setTimeout(() => {
    if (G && G.id === id) fn();
  }, ms);
}
const bounds = () => {
  const ins = G.ins || 0;
  return { x0: ins, y0: ins, x1: W - ins, y1: H - ins };
};
/** Nearest living enemy (same rule as the engine), for the look direction of faces. */
function other(f) {
  let best = null,
    bd = 1e9;
  for (const e of G.f) {
    if (e.team === f.team) continue;
    const d = (e.hp > 0 && !e.out ? 0 : 1e6) + Math.hypot(e.x - f.x, e.y - f.y);
    if (d < bd) {
      bd = d;
      best = e;
    }
  }
  return best || f;
}
const sideF = (side) =>
  side === 0 ? G.f[0] : G.f.find((f) => f.team === 1 && !f.out) || G.f.find((f) => f.team === 1);

function resetRound() {
  Object.assign(G, {
    fin: null, R: null, acc: 0, inputs: [], f: [], drops: [], zones: [], mines: [], bolts: [], arrows: [],
    parts: [], texts: [], beams: [], rings: [], taps: [], pups: [], banner: null, time: 0, count: 3, ins: 0,
    ended: false,
  }); // prettier-ignore
}

/** Engine map plus the prototype's display fields (name, color, portal colors). */
function viewMap(id, w, live) {
  const m = live || CK.E.buildMap(id, w, w, CK.B.engine.maps),
    meta = MAPS.find((x) => x.id === id);
  Object.assign(m, { name: meta.name, color: meta.color, desc: meta.desc });
  m.portals.forEach((p, i) => (p.c = ['#d06bff', '#6ee7f9'][i]));
  return m;
}

/* ---------- match setup (prototype startMatch / startMatch2) ---------- */
/** Roster entry for display before the engine match exists (2v2 pick screen). */
function rosterOf(p) {
  const maxHp = CLASSES[p.cls].hp * mult(p.lvl);
  return { ...p, hp: maxHp, maxHp, alive: true, revived: false };
}
/** Engine match from the server's setup; skins are cosmetic and chosen here. */
function newMatch(pick2) {
  const M = CK.E.matchFromSetup(G.setup, CK.B, pick2);
  M.teams.forEach((t, i) => t.forEach((e) => (e.skin = withSkin(e, i === 0 && e.bot !== true).skin)));
  return M;
}
const withSkin = (p, mine) => ({ ...p, skin: mine ? S.skin[p.cls] || '' : Math.random() < 0.35 ? pickOne(skinsOf(p.cls)) : '' });
/** Ask the backend for a match (seed + rosters); it later verifies the recorded inputs. */
async function requestMatch(mode) {
  const r = await act({ t: 'matchStart', mode });
  if (!r) return null;
  return r;
}
function baseG(mode, li) {
  return {
    mode, id: Math.random(), emo: [], emoCd: 0, li, round: 0, active: null, lastMap: null, map: null,
    phase: 'mm', done: false, clock: 0, shake: 0, hitstop: 0, slow: 0, lastDead: [null, null],
    log: { rounds: [] },
  }; // prettier-ignore
}
function openMatchScreen(li) {
  resetRound();
  $('.foe .tag').hidden = false;
  document.body.style.setProperty('--tint', ARENAS[li].accent);
  showMatch();
  sizeCanvas();
  $('#foeName').textContent = G.botName;
  $('#ov').hidden = true;
  hudIdle();
  renderRosters();
  cancelAnimationFrame(raf);
  last = performance.now();
  raf = requestAnimationFrame(loop);
}

async function startMatch() {
  if (S.mode === '2v2') {
    startMatch2();
    return;
  }
  if (CK.BK.onlineUrl && CK.BK.onlineUrl()) {
    startOnline();
    return;
  }
  const req = await requestMatch('1v1');
  if (!req) return;
  setWorld(CK.B.engine.rules.world1v1);
  const li = leagueOf(S.trophies);
  G = baseG('1v1', li);
  // Bots get smarter as the player's trophies grow; the server decides (setup.botSkill).
  Object.assign(G, { setup: req.setup, matchId: req.id, skill: req.setup.botSkill });
  G.botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
  G.M = newMatch(0);
  Object.assign(G, { teams: G.M.teams, score: G.M.score, hist: G.M.hist });
  openMatchScreen(li);
  const mm = $('#mm');
  mm.hidden = false;
  mm.innerHTML = `<div><b class="dots">در حال یافتن حریف</b><small>آرنای ${fa(li + 1)}: ${ARENAS[li].name}</small></div>`;
  later(() => {
    mm.innerHTML = `<div><b>${G.botName}</b><div class="foeline" style="justify-content:center">${G.teams[1].map((e) => `<img src="${icon(e.cls, e.skin)}" alt="">`).join('')}</div><small>${G.teams[1].map((e) => CLASSES[e.cls].name + '، سطح ' + fa(e.lvl)).join(' و ')}</small></div>`;
  }, 1100);
  later(() => {
    mm.hidden = true;
    nextRound();
  }, 2600);
}

async function startMatch2() {
  const req = await requestMatch('2v2');
  if (!req) return;
  setWorld(CK.B.engine.rules.world2v2);
  const li = leagueOf(S.trophies),
    mine = req.setup.teams[0].map((p) => withSkin(p, true)),
    [ally, ...foes] = req.setup.teams[1].map((p) => withSkin(p, false)),
    nm = [...BOT_NAMES].sort(() => Math.random() - 0.5);
  G = baseG('2v2', li);
  Object.assign(G, {
    setup: req.setup,
    matchId: req.id,
    skill: req.setup.botSkill,
    teams: [[rosterOf(mine[0]), rosterOf(ally)], foes.map(rosterOf)],
    myOpts: mine.map(rosterOf),
    score: [0, 0],
    hist: [],
    botName: nm[1] + ' و ' + nm[2],
    allyName: nm[0],
    foeNames: [nm[1], nm[2]],
  });
  G.map = viewMap('classic', W);
  openMatchScreen(li);
  const mm = $('#mm');
  mm.hidden = false;
  mm.innerHTML = `<div><b class="dots">در حال یافتن هم‌تیمی و حریف</b><small>نبرد ۲ در ۲</small></div>`;
  const a = G.teams[0][1];
  later(() => {
    mm.innerHTML = `<div class="m2"><div class="mside"><small>هم‌تیمی</small><img src="${icon(a.cls, a.skin)}" alt=""><b>${G.allyName}</b><small>${CLASSES[a.cls].name}</small></div><span class="vsx">در برابر</span><div class="mside"><small>حریف‌ها</small><span class="duo">${G.teams[1].map((e) => `<img src="${icon(e.cls, e.skin)}" alt="">`).join('')}</span><b>${G.botName}</b></div></div>`;
  }, 1100);
  later(() => {
    mm.hidden = true;
    showPick2();
  }, 2800);
}

function showPick2() {
  G.phase = 'pick2';
  const card = (e, i) => {
    const C = CLASSES[e.cls];
    return `<button class="opt" data-opt2="${i}"><img src="${icon(e.cls, e.skin)}" alt=""><b>${C.name}</b><small>سطح ${fa(e.lvl)}</small><small class="abn">${C.ab[e.ab].n}</small></button>`;
  };
  const al = G.teams[0][1];
  $('#ov').innerHTML = `<div class="rv-top">نبرد ۲ در ۲، میدان کلاسیک</div><h3>با کدام شخصیت بازی می‌کنی؟</h3><div class="opts">${G.myOpts.map(card).join('')}</div>
    <div class="foeline">هم‌تیمی <img src="${icon(al.cls, al.skin)}" alt=""> حریف‌ها ${G.teams[1].map((e) => `<img src="${icon(e.cls, e.skin)}" alt="">`).join('')}</div><div class="ptimer" style="--d:10s"><i></i></div>`;
  $('#ov').hidden = false;
  clearTimeout(G.pickT);
  G.pickT = later(() => {
    if (G.phase === 'pick2') choose2(0);
  }, 10000);
}

function choose2(i) {
  if (!G || G.phase !== 'pick2') return;
  clearTimeout(G.pickT);
  G.phase = 'vs';
  const shown = [[G.myOpts[i], G.teams[0][1]], G.teams[1]];
  G.M = newMatch(i);
  G.M.teams.forEach((t, a) => t.forEach((e, b) => (e.skin = shown[a][b].skin)));
  G.log.rounds.push({ pick: i, inputs: [] });
  Object.assign(G, { teams: G.M.teams, score: G.M.score, hist: G.M.hist });
  beginRound(CK.E.roundConfig(G.M, 'classic', [0, 0], CK.B, { fx: true, botSkill: G.skill }), [
    'تو',
    G.allyName,
    ...G.foeNames,
  ]);
  const [me, al, f1, f2] = G.f;
  $('#ov').innerHTML = `<div class="vs"><div class="l"><span class="duo"><img src="${icon(me.cls, me.skin)}" alt=""><img src="${icon(al.cls, al.skin)}" alt=""></span><b>تو و ${G.allyName}</b></div><span class="vsx">در برابر</span><div class="r"><span class="duo">${[f1, f2].map((f) => `<img src="${icon(f.cls, f.skin)}" alt="">`).join('')}</span><b>${G.botName}</b></div></div>`;
  later(() => {
    $('#ov').hidden = true;
    G.phase = 'count';
  }, 1700);
}

function nextRound() {
  resetRound();
  G.round++;
  G.active = null;
  const id = CK.E.nextMap(G.M),
    mp = MAPS.find((m) => m.id === id);
  G.lastMap = id;
  G.map = viewMap(id, W);
  G.phase = 'reveal';
  hudIdle();
  renderRosters();
  showReveal(mp);
}

function choose(i) {
  if (!G || G.phase !== 'pick') return;
  clearTimeout(G.pickT);
  G.phase = 'vs';
  if (G.online) {
    onlinePick(i);
    return;
  }
  G.log.rounds.push({ pick: i, inputs: [] });
  const bi = CK.E.botPick(G.M, 1);
  beginRound(CK.E.roundConfig(G.M, G.map.id, [i, bi], CK.B, { fx: true, botSkill: G.skill }), ['تو', G.botName]);
  G.active = G.M.active;
  renderRosters();
  const [me, foe] = G.f,
    MC = CLASSES[me.cls],
    FC = CLASSES[foe.cls];
  $('#ov').innerHTML = `<div class="vs"><div class="l"><img src="${icon(me.cls, me.skin)}" alt=""><b>${MC.name}</b><small>${MC.ab[me.ab].n}</small></div><span class="vsx">در برابر</span><div class="r"><img src="${icon(foe.cls, foe.skin)}" alt=""><b>${FC.name}</b><small>${FC.ab[foe.ab].n}</small></div></div>`;
  later(() => {
    $('#ov').hidden = true;
    G.phase = 'count';
  }, 1700);
}

/** Create the engine round and the matching view fighters (fighter 0 is always the player). */
function beginRound(cfg, names) {
  G.R = CK.E.createRound(cfg);
  G.map = viewMap(cfg.map, W, G.R.map);
  const roster = (id) => (G.mode === '2v2' ? G.teams[id < 2 ? 0 : 1][id % 2] : G.teams[id][G.M.active[id]]);
  G.f = G.R.f.map((ef, id) => {
    const e = roster(id);
    return { ...ef, trail: [], ghost: ef.hp, flash: 0, roll: 0, skin: e.skin || '', name: names[id], isPlayer: id === 0, entry: e };
  });
  setupHud();
}

/* ---------- per-frame update ---------- */
function nudge(f, x, y) {
  if (!G || !G.R || G.phase !== 'fight' || !f.isPlayer || f.charges < 1 || f.out || f.hp <= 0) return false;
  if (G.online) onlineSend({ t: 'in', i: { t: 'boost', x, y } });
  else G.inputs.push({ t: 'boost', fid: f.id, x, y });
  return true;
}
function useAbility(f) {
  if (!G || !G.R || G.phase !== 'fight' || !f.isPlayer) return;
  if (G.online) onlineSend({ t: 'in', i: { t: 'ability' } });
  else G.inputs.push({ t: 'ability', fid: f.id });
}

function syncView() {
  const R = G.R;
  for (const ef of R.f) {
    const v = fv(ef.id);
    Object.assign(v, ef);
    if (ef.aura) v.aura = { ...ef.aura, col: AURA_COL[ef.aura.kind] };
  }
  const look = (o, init) => {
    let l = LOOK.get(o);
    if (!l) LOOK.set(o, (l = init()));
    return l;
  };
  G.arrows = R.arrows.map((a) => ({ ...a, owner: fv(a.owner), spin: look(a, () => ({ spin: Math.random() * TAU })).spin }));
  G.zones = R.zones.map((z) => ({ ...z, owner: fv(z.owner), hue: look(z, () => ({ hue: (G.clock * 360) % 360 })).hue }));
  G.mines = R.mines.map((m) => ({ ...m, owner: fv(m.owner) }));
  G.drops = R.drops;
  G.pups = R.pups;
  G.time = R.time;
  G.count = R.count;
  G.ins = R.ins;
  if (G.phase === 'count' && R.phase === 'fight') G.phase = 'fight';
}

function onEvents(evs) {
  for (const e of evs) {
    switch (e.e) {
      case 'ring': ring(e.x, e.y, e.r, e.c, e.max, e.w, e.grow); break; // prettier-ignore
      case 'burst': burst(e.x, e.y, e.c, e.n, e.spd); break; // prettier-ignore
      case 'shake': G.shake = Math.max(G.shake, e.v); break; // prettier-ignore
      case 'sfx': sfx(e.n); break; // prettier-ignore
      case 'beam': G.beams.push({ a: fv(e.a), b: fv(e.b), life: e.life, col: e.col }); break; // prettier-ignore
      case 'bolt': G.bolts.push({ ax: e.ax, ay: e.ay, b: fv(e.b), life: 0.25, seed: Math.random() }); break; // prettier-ignore
      case 'swap': fv(e.a).trail = []; fv(e.b).trail = []; break; // prettier-ignore
      case 'teleport': fv(e.fid).trail = []; break; // prettier-ignore
      case 'dmg': {
        const f = fv(e.fid);
        addText(e.x + (Math.random() * 16 - 8), e.y, fa(e.n), e.c || (f.isPlayer ? '#ff6b6b' : '#ffc53d'), e.n >= 14);
        f.flash = 0.12;
        if (f.isPlayer || e.n >= 12) CK.N.haptic(e.n >= 12 ? 'heavy' : 'light');
        if (e.n >= 12) G.hitstop = 0.07;
        break;
      }
      case 'text': {
        const f = e.fid !== undefined ? fv(e.fid) : null;
        const t = e.key === 'ability' ? CLASSES[f.cls].ab[f.ab].n + '!' : TXT[e.key];
        addText(e.x, e.y, t, e.c, e.big);
        if (e.key === 'out') {
          G.lastDead[f.team] = f;
          f.entry.hp = 0;
          f.entry.alive = false;
          renderRosters();
        }
        break;
      }
      case 'banner': {
        const f = e.fid !== undefined ? fv(e.fid) : null,
          P = e.type ? PUPS[e.type] : null;
        if (e.key === 'start') banner('شروع!', e.c);
        else if (e.key === 'shrink') banner('زمین کوچک می‌شود!', e.c);
        else if (e.key === 'phoenix') banner('ققنوس از خاکستر برخاست', e.c);
        else if (e.key === 'pupSpawn') banner('جایزه روی زمین: ' + P.name, e.c);
        else if (e.key === 'pickup') {
          addText(f.x, f.y - f.r - 18, P.msg, P.color, true);
          banner((f.isPlayer ? 'تو ' : f.name + ' ') + 'جایزه را گرفت', e.c);
        }
        break;
      }
      case 'boost': {
        const f = fv(e.fid);
        if (!f.isPlayer) break;
        sfx('tap');
        for (let i = 0; i < 8; i++) {
          const s = (Math.random() - 0.5) * 1.2;
          G.parts.push({ x: f.x - Math.cos(e.a) * f.r, y: f.y - Math.sin(e.a) * f.r, vx: -Math.cos(e.a + s) * 160, vy: -Math.sin(e.a + s) * 160, life: 0.3, max: 0.3, c: CLASSES[f.cls].c1, sz: 2.5 }); // prettier-ignore
        }
        break;
      }
    }
  }
}

function update(dt) {
  G.clock += dt;
  if (G.emo) {
    G.emo.forEach((e) => (e.life -= dt));
    G.emo = G.emo.filter((e) => e.life > 0);
  }
  if (G.emoCd > 0) G.emoCd -= dt;
  G.parts.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.9; p.vy *= 0.9; p.life -= dt; }); // prettier-ignore
  G.parts = G.parts.filter((p) => p.life > 0);
  G.texts.forEach((t) => { t.y -= 36 * dt; t.life -= dt; }); // prettier-ignore
  G.texts = G.texts.filter((t) => t.life > 0);
  for (const k of ['beams', 'bolts', 'taps']) {
    G[k].forEach((b) => (b.life -= dt));
    G[k] = G[k].filter((b) => b.life > 0);
  }
  G.rings.forEach((r) => { r.life -= dt; r.r = r.r0 + (1 - r.life / r.max) * r.grow; }); // prettier-ignore
  G.rings = G.rings.filter((r) => r.life > 0);
  if (G.banner) {
    G.banner.life -= dt;
    if (G.banner.life <= 0) G.banner = null;
  }
  G.shake = Math.max(0, G.shake - 30 * dt);
  for (const f of G.f) {
    f.ghost += (f.hp - f.ghost) * Math.min(1, dt * 3);
    if (f.ghost < f.hp) f.ghost = f.hp;
    f.flash -= dt;
  }
  for (const a of G.arrows) {
    const l = LOOK.get(a);
    if (l) l.spin += dt * 9;
  }
  if (G.phase === 'finish') {
    finUpdate(dt);
    return;
  }
  if (G.online) {
    onlineFrame();
    return;
  }
  if ((G.phase !== 'count' && G.phase !== 'fight') || !G.R || G.R.result) return;
  // Fixed-step engine; hitstop/slow-motion only change how fast steps are consumed (presentation).
  G.acc += dt * DEV_SPEED;
  while (G.acc >= SIM_DT && !G.R.result) {
    const inp = G.inputs.splice(0);
    // Record inputs with the tick they apply on; the backend replays them to verify the result.
    if (inp.length) G.log.rounds[G.log.rounds.length - 1].inputs.push([G.R.tick, inp]);
    onEvents(CK.E.step(G.R, inp, CK.B));
    G.acc -= SIM_DT;
  }
  syncView();
  for (const f of G.f) {
    if (f.out) continue;
    f.roll += ((Math.hypot(f.vx, f.vy) * dt) / f.r) * 0.35 * (f.vx >= 0 ? 1 : -1);
    f.trail.push({ x: f.x, y: f.y });
    if (f.trail.length > 12) f.trail.shift();
  }
  if (G.R.result) endRound(G.R.result);
}

/** Round finished in the engine (prototype `endMatch`). */
function endRound(res) {
  if (G.ended) return;
  G.ended = true;
  G.phase = 'end';
  const w = res.winner,
    l = 1 - w,
    win = w === 0;
  if (G.mode === '2v2') {
    CK.E.applyRoundResult(G.M, res);
    const atk = G.f.filter((f) => f.team === w && f.hp > 0).sort((a, b) => (b.isPlayer ? 1 : 0) - (a.isPlayer ? 1 : 0))[0] || G.f.find((f) => f.team === w); // prettier-ignore
    const vic = G.lastDead[l] || G.f.filter((f) => f.team === l).sort((a, b) => (b.isPlayer ? 1 : 0) - (a.isPlayer ? 1 : 0))[0]; // prettier-ignore
    G.f.forEach((f) => {
      if (f !== atk && f !== vic) f.out = true;
    });
    renderRosters();
    startFinish(w, atk, vic);
    return;
  }
  const lf = G.f[l],
    we = G.teams[w][G.active[w]],
    le = G.teams[l][G.active[l]];
  CK.E.applyRoundResult(G.M, res);
  if (G.M.winner !== null) {
    renderRosters();
    startFinish(w);
    return;
  }
  if (Math.random() < 0.65) later(() => sendEmote(1, w === 1 ? pickOne(['laugh', 'thumb', 'love']) : pickOne(['angry', 'cry', 'wow'])), 500); // prettier-ignore
  burst(lf.x, lf.y, CLASSES[lf.cls].c1, 50, 1.5);
  ring(lf.x, lf.y, lf.r, '#ffffff', 0.7, 6);
  G.shake = 14;
  G.slow = 0.8;
  banner(win ? 'راند را بردی' : 'راند را باختی', win ? '#4ade80' : '#ff6b6b');
  sfx(win ? 'roundWin' : 'roundLose');
  renderRosters();
  later(() => {
    $('#ov').innerHTML = `<div class="rres"><div class="rv-top">پایان راند ${fa(G.round)}</div><h3 style="color:${win ? 'var(--win)' : 'var(--lose)'}">${win ? 'این راند را بردی' : 'این راند را باختی'}</h3>
      <div class="scoreb"><span>تو</span><b>${fa(G.score[0])}</b><span>-</span><b>${fa(G.score[1])}</b><span>${G.botName}</span></div>
      <small>${CLASSES[we.cls].name} با ${fa(Math.ceil(we.hp))} جان به راند بعد می‌رود</small><small>${CLASSES[le.cls].name} از مسابقه بیرون رفت</small></div>`;
    $('#ov').hidden = false;
    later(nextRound, 2600);
  }, 1500);
}

function hud() {
  if (!G.f.length) return;
  const A = G.f[0];
  let TA = A, TB = G.f[1];
  if (G.mode === '2v2') {
    const agg = (t) => {
      const fs = G.f.filter((f) => f.team === t);
      return {
        hp: fs.reduce((q, f) => q + Math.max(0, f.hp), 0),
        maxHp: Math.round(fs.reduce((q, f) => q + f.maxHp, 0)),
        ghost: fs.reduce((q, f) => q + Math.max(0, f.ghost), 0),
      };
    };
    TA = agg(0);
    TB = agg(1);
  }
  $('#meHp').style.width = (TA.hp / TA.maxHp) * 100 + '%';
  $('#foeHp').style.width = (TB.hp / TB.maxHp) * 100 + '%';
  $('#meGhost').style.width = (TA.ghost / TA.maxHp) * 100 + '%';
  $('#foeGhost').style.width = (TB.ghost / TB.maxHp) * 100 + '%';
  $('#meHpT').textContent = `${fa(Math.ceil(TA.hp))} / ${fa(TA.maxHp)}`;
  $('#foeHpT').textContent = `${fa(Math.ceil(TB.hp))} / ${fa(TB.maxHp)}`;
  const left = Math.max(0, Math.ceil(MATCH_TIME - G.time));
  $('#clock').textContent = fa(left);
  $('#clock').classList.toggle('hot', G.time >= SHRINK_AT && G.phase === 'fight');
  const btn = $('#abilityBtn'),
    ready = A.abilityCd <= 0 && G.phase === 'fight';
  btn.classList.toggle('ready', ready);
  btn.style.setProperty('--p', 1 - A.abilityCd / A.abilityMax);
  $('#abCd').textContent = ready ? 'آماده! بزن' : `${fa(Math.ceil(A.abilityCd))} ثانیه`;
  document.querySelectorAll('#pips .pip').forEach((el, i) => {
    const p = i < A.charges ? 1 : i === A.charges ? A.chargeT / NUDGE_RECHARGE : 0;
    el.style.setProperty('--p', p);
    el.classList.toggle('full', p >= 1);
  });
}

function loop(ts) {
  if (!G) return;
  let dt = Math.min(0.033, (ts - last) / 1000);
  last = ts;
  if (G.hitstop > 0) {
    G.hitstop -= dt;
    dt *= 0.15;
  }
  if (G.slow > 0) {
    G.slow -= dt;
    dt *= 0.35;
  }
  update(dt);
  draw();
  hud();
  raf = requestAnimationFrame(loop);
}
