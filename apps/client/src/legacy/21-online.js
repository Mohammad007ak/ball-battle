// Online 1v1 (server-authoritative). The server runs the engine and decides the result; it relays
// every input with the tick it applies on, so this client runs the same deterministic engine
// locally and smoothly (see the playback section below) and plays the same overlays as offline. "Me" is always team 0
// on screen: server sides are remapped with `G.side`.
let WS = null,
  wsRetry = 0;

function onlineSend(m) {
  if (WS && WS.readyState === 1) WS.send(JSON.stringify(m));
}
/** Server side index → local (0 = me). */
const loc = (side) => (side === G.side ? 0 : 1);
const mineFirst = (pair) => (G.side === 0 ? pair : [pair[1], pair[0]]);

function startOnline() {
  setWorld(CK.B.engine.rules.world1v1);
  const li = leagueOf(S.trophies);
  G = baseG('1v1', li);
  Object.assign(G, { online: true, side: 0, room: null, teams: [[], []], score: [0, 0], hist: [] });
  G.botName = '…';
  openMatchScreen(li);
  // Online opponents may be players or stand-in bots; the player is not told which.
  $('.foe .tag').hidden = true;
  $('#mm').hidden = false;
  $('#mm').innerHTML = `<div><b class="dots">در حال یافتن حریف</b><small>آرنای ${fa(li + 1)}: ${ARENAS[li].name}</small></div>`;
  connectOnline(true);
}

/** (Re)connect; on reconnect during a match the server resends the full state. */
function connectOnline(queue) {
  const myG = G;
  const ws = new WebSocket(CK.BK.onlineUrl());
  WS = ws;
  ws.onopen = () => {
    wsRetry = 0;
    ws.send(JSON.stringify({ t: 'hello', token: CK.BK.token() }));
  };
  ws.onmessage = (e) => {
    if (G !== myG) return;
    const m = JSON.parse(e.data);
    if (m.t === 'welcome') ws.send(JSON.stringify(m.inMatch ? { t: 'rejoin', room: G.room || '' } : queue && !G.room ? { t: 'queue', mode: '1v1' } : { t: 'rejoin', room: G.room || '' }));
    else onlineMsg(m);
  };
  ws.onclose = () => {
    if (G !== myG || G.done || WS !== ws) return;
    // Mobile networks drop; keep trying (the server holds the seat for 15 s, then a bot plays it).
    const wait = Math.min(4000, 500 * ++wsRetry);
    if (wsRetry === 1) banner('اتصال قطع شد؛ در حال اتصال دوباره…', '#ff6b6b', 2.5);
    setTimeout(() => G === myG && !G.done && connectOnline(false), wait);
  };
}
function closeOnline() {
  const ws = WS;
  WS = null;
  if (ws) ws.close();
}

function onlineMsg(m) {
  switch (m.t) {
    case 'noOpponent':
      // Nobody to play online: continue with a bot match run on the phone (server-verified).
      closeOnline();
      cancelAnimationFrame(raf);
      clearTimeout(G.pickT);
      G = null;
      startMatch(true);
      break;
    case 'start': {
      const first = !G.room;
      G.room = m.room;
      G.side = m.you;
      G.botName = m.names[1 - m.you];
      $('#foeName').textContent = G.botName;
      G.skins = mineFirst(m.skins);
      setTeams(m.teams);
      if (first) {
        const foe = G.teams[1];
        $('#mm').innerHTML = `<div><b>${G.botName}</b><div class="foeline" style="justify-content:center">${foe.map((e) => `<img src="${icon(e.cls, e.skin)}" alt="">`).join('')}</div><small>${foe.map((e) => CLASSES[e.cls].name + '، سطح ' + fa(e.lvl)).join(' و ')}</small></div>`;
      }
      renderRosters();
      break;
    }
    case 'score': {
      G.score.splice(0, 2, ...mineFirst(m.score));
      G.hist.splice(0, G.hist.length, ...m.hist.map(loc));
      setTeams(m.teams);
      renderRosters();
      if (m.roundWinner !== undefined) onlineRoundEnd(loc(m.roundWinner));
      break;
    }
    case 'reveal': {
      $('#mm').hidden = true;
      resetRound();
      G.round = m.round;
      G.map = viewMap(m.map, W);
      G.phase = 'reveal';
      hudIdle();
      renderRosters();
      showReveal(MAPS.find((x) => x.id === m.map));
      break;
    }
    case 'round':
      onlineRound(m);
      break;
    case 'in':
      netInput(m.k, m.i);
      break;
    case 'tk':
      netClock(m.n);
      break;
    case 'state':
      netState(m.s);
      break;
    case 'bot':
      if (NET) {
        NET.bots.push(m);
        if (m.k <= NET.P.tick) NET.dirty = true;
      }
      break;
    case 'finish': {
      const w = loc(m.w);
      const atk = G.f.find((f) => f.team === w),
        vic = G.f.find((f) => f.team !== w);
      startFinish(w, atk, vic);
      break;
    }
    case 'finGo':
      if (G.fin && G.fin.w === 1) finGo();
      break;
    case 'emo':
      if (m.side !== G.side) sendEmote(1, m.k);
      break;
    case 'result':
      G.onlineResult = m;
      CK.BK.setProfile && CK.BK.setProfile(m.profile);
      S = CK.BK.profile();
      closeOnline();
      if (G.done) showResult(m.win, G.quit, m);
      else if (m.surrender) finishMatch(m.win, false);
      break;
    case 'noRoom':
      // The match ended while we were away.
      closeOnline();
      toast('مسابقه تمام شد');
      closeMatch();
      CK.BK.refresh && CK.BK.refresh().then(() => setTab('battle'));
      break;
  }
}

/** Server rosters (absolute sides) → G.teams with "me" first, skins attached. */
function setTeams(teams) {
  const t = mineFirst(teams);
  G.teams = t.map((side, i) => side.map((e, j) => ({ ...e, skin: (G.skins && G.skins[i][j]) || '' })));
}

function onlineRound(m) {
  netStart(m);
  const fighters = G.R.f;
  G.active = mineFirst(m.active);
  const view = (ef) => {
    const side = ef.team,
      e = G.teams[loc(side)][G.active[loc(side)]];
    return { ...ef, team: loc(side), trail: [], ghost: ef.hp, flash: 0, roll: 0, skin: e.skin || '', name: side === G.side ? 'تو' : G.botName, isPlayer: side === G.side, entry: e };
  };
  G.byId = fighters.map(view);
  G.f = [...G.byId].sort((a, b) => a.team - b.team);
  setupHud();
  renderRosters();
  const [me, foe] = G.f,
    MC = CLASSES[me.cls],
    FC = CLASSES[foe.cls];
  $('#ov').innerHTML = `<div class="vs"><div class="l"><img src="${icon(me.cls, me.skin)}" alt=""><b>${MC.name}</b><small>${MC.ab[me.ab].n}</small></div><span class="vsx">در برابر</span><div class="r"><img src="${icon(foe.cls, foe.skin)}" alt=""><b>${FC.name}</b><small>${FC.ab[foe.ab].n}</small></div></div>`;
  $('#ov').hidden = false;
  G.phase = 'vs';
}

function onlinePick(i) {
  onlineSend({ t: 'pick', i });
  $('#ov').innerHTML = `<div class="rv-top">منتظر حریف…</div>`;
}

/*
 * Online playback. The phone keeps two copies of the round:
 *  - C, confirmed: the server's state stepped with the relayed inputs up to the server's tick.
 *    The engine is deterministic, so C equals the server's state exactly (a full state arrives
 *    every second anyway and replaces it).
 *  - P, presented: C advanced to the display tick at 60 Hz. Inputs apply ~100 ms after they are
 *    sent and are relayed on arrival, so P almost always already knows every input it needs.
 * When an input or state arrives for a tick P has already simulated, P is rebuilt from C and the
 * on-screen jump is smoothed away over a few frames.
 */
let NET = null;
const cloneState = (s) => (typeof structuredClone === 'function' ? structuredClone(s) : JSON.parse(JSON.stringify(s)));
function netStart(m) {
  const now = performance.now();
  NET = { C: m.s, P: cloneState(m.s), inputs: new Map(), bots: [], n: m.s.tick, at: now, D: m.s.tick, shown: m.s.tick, dirty: false, off: {}, prev: new Map() };
  for (const [k, i] of m.q || []) netInput(k, i);
  G.R = NET.P;
  G.map = viewMap(m.map, W, NET.P.map);
}
function netInput(k, i) {
  if (!NET) return;
  const a = NET.inputs.get(k) || [];
  a.push(i);
  NET.inputs.set(k, a);
  if (k <= NET.P.tick) NET.dirty = true;
}
/** Step a state to `to`, applying relayed inputs and bot takeovers exactly where the server did. */
function netStep(st, to, emit) {
  while (st.tick < to && !st.result) {
    for (const b of NET.bots) if (b.k === st.tick) st.f[b.seat].bot = true;
    const ev = CK.E.step(st, NET.inputs.get(st.tick) || [], CK.B);
    if (emit && st.tick > NET.shown) {
      NET.shown = st.tick;
      onEvents(ev);
    }
  }
}
function netClock(n) {
  if (!NET || n <= NET.n) return;
  NET.n = n;
  NET.at = performance.now();
  netStep(NET.C, n, false);
  for (const k of NET.inputs.keys()) if (k < NET.C.tick - 120) NET.inputs.delete(k);
}
function netState(s) {
  if (!NET) return;
  netStep(NET.C, s.tick, false);
  if (s.tick > NET.n) {
    NET.n = s.tick;
    NET.at = performance.now();
  }
  // Same tick, same state expected (deterministic engine). Only a real divergence costs a rebuild.
  if (NET.C.tick !== s.tick || CK.E.hashState(NET.C) !== CK.E.hashState(s)) {
    NET.ds = (NET.ds || 0) + 1;
    if (PROF) window.__desync = [JSON.stringify(NET.C), JSON.stringify(s)];
    NET.C = s;
    NET.dirty = true;
  }
}
function onlineFrame(dt) {
  if (!NET || !G.R) return;
  const N = NET,
    now = performance.now();
  // Display tick: the server's tick as of now, a step behind; never past the inputs we know.
  const target = Math.min(N.n + ((now - N.at) / 1000) * 60 - 1, N.n + T_LEAD);
  if (Math.abs(target - N.D) > 30) N.D = target;
  else N.D = Math.max(N.D, Math.min(N.D + dt * 60 + (target - N.D) * 0.06, N.n + T_LEAD));
  const Tk = Math.max(N.C.tick, Math.floor(N.D));
  if (N.dirty || N.P.tick > Tk) {
    // Rebuild from the confirmed state; remember where things were drawn to hide the jump.
    for (const v of G.byId) N.off[v.id] = { x: v.x, y: v.y, pending: true };
    N.P = cloneState(N.C);
    N.rb = (N.rb || 0) + 1;
    N.prev = new Map();
    N.dirty = false;
  }
  if (N.P.tick < Tk) {
    if (N.P.tick === Tk - 1) for (const f of N.P.f) N.prev.set(f.id, { x: f.x, y: f.y });
    else N.prev = new Map();
    netStep(N.P, Tk, true);
  }
  G.R = N.P;
  if (G.map !== N.P.map) G.map = viewMap(N.P.map.id, W, N.P.map);
  if (G.phase === 'vs' && N.n > 0) {
    $('#ov').hidden = true;
    G.phase = 'count';
  }
  syncViewOnline(Math.min(1, N.D - Tk), dt);
}
/** Ticks the display may run ahead of the server's last known tick (inputs are relayed ~6 early). */
const T_LEAD = 4;

function syncViewOnline(al, dt) {
  const R = G.R,
    N = NET;
  for (const ef of R.f) {
    const v = fv(ef.id),
      team = v.team;
    Object.assign(v, ef, { team });
    // Glide between the last two simulated ticks.
    const p = N.prev.get(ef.id);
    if (p && Math.abs(ef.x - p.x) + Math.abs(ef.y - p.y) < 40) {
      v.x = p.x + (ef.x - p.x) * al;
      v.y = p.y + (ef.y - p.y) * al;
    }
    // After a correction, start from where the ball was drawn and fade the difference out.
    const o = N.off[ef.id];
    if (o) {
      if (o.pending) {
        o.dx = o.x - v.x;
        o.dy = o.y - v.y;
        o.pending = false;
        if (Math.abs(o.dx) + Math.abs(o.dy) > 60) o.dx = o.dy = 0; // teleports just jump
      }
      const k = Math.exp(-dt * 14);
      o.dx *= k;
      o.dy *= k;
      v.x += o.dx;
      v.y += o.dy;
      if (Math.abs(o.dx) + Math.abs(o.dy) < 0.05) delete N.off[ef.id];
    }
    if (ef.aura) v.aura = { ...ef.aura, col: AURA_COL[ef.aura.kind] };
  }
  G.arrows = R.arrows.map((a, i) => ({ ...a, owner: fv(a.owner), spin: G.clock * 9 + i }));
  G.zones = R.zones.map((z) => ({ ...z, owner: fv(z.owner), hue: (z.x * 7 + z.y * 3) % 360 }));
  G.mines = R.mines.map((m) => ({ ...m, owner: fv(m.owner) }));
  G.drops = R.drops;
  G.pups = R.pups;
  G.time = R.time;
  G.count = R.count;
  G.ins = R.ins;
  if (G.phase === 'count' && R.phase === 'fight') G.phase = 'fight';
  for (const f of G.f) {
    if (f.out) continue;
    f.trail.push({ x: f.x, y: f.y });
    if (f.trail.length > 12) f.trail.shift();
  }
}

/** Round result visuals (the server already moved on; the next 'reveal' starts the next round). */
function onlineRoundEnd(w) {
  if (G.ended) return;
  G.ended = true;
  G.phase = 'end';
  if (G.score[0] >= 2 || G.score[1] >= 2) return; // the finisher follows
  const win = w === 0,
    lf = G.f[1 - w] || G.f[0];
  burst(lf.x, lf.y, CLASSES[lf.cls].c1, 50, 1.5);
  ring(lf.x, lf.y, lf.r, '#ffffff', 0.7, 6);
  G.shake = 14;
  G.slow = 0.8;
  banner(win ? 'راند را بردی' : 'راند را باختی', win ? '#4ade80' : '#ff6b6b');
  sfx(win ? 'roundWin' : 'roundLose');
  const we = G.teams[w][G.active[w]],
    le = G.teams[1 - w][G.active[1 - w]];
  later(() => {
    $('#ov').innerHTML = `<div class="rres"><div class="rv-top">پایان راند ${fa(G.round)}</div><h3 style="color:${win ? 'var(--win)' : 'var(--lose)'}">${win ? 'این راند را بردی' : 'این راند را باختی'}</h3>
      <div class="scoreb"><span>تو</span><b>${fa(G.score[0])}</b><span>-</span><b>${fa(G.score[1])}</b><span>${G.botName}</span></div>
      <small>${CLASSES[we.cls].name} با ${fa(Math.ceil(we.hp))} جان به راند بعد می‌رود</small><small>${CLASSES[le.cls].name} از مسابقه بیرون رفت</small></div>`;
    $('#ov').hidden = false;
  }, 1500);
}
