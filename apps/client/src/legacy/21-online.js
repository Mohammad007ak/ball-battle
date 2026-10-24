// Online 1v1 (server-authoritative). The server runs the engine; this client sends inputs,
// renders interpolated snapshots and plays the same overlays as offline. "Me" is always team 0
// on screen: server sides are remapped with `G.side`.
const INTERP_MS = 100;
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
  Object.assign(G, { online: true, side: 0, room: null, snaps: [], teams: [[], []], score: [0, 0], hist: [] });
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
    case 'snap':
      G.snaps.push({ s: m.s, at: performance.now() });
      if (G.snaps.length > 30) G.snaps.splice(0, G.snaps.length - 30);
      onEvents(m.ev);
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
  // Mirror RoundState built from the server's fighters; snapshots update it in place.
  const fighters = m.fighters.map((f) => ({ ...f }));
  G.R = { tick: 0, phase: 'count', count: 3, time: 0, ins: 0, map: CK.E.buildMap(m.map, W, W, CK.B.engine.maps), f: fighters, arrows: [], zones: [], mines: [], drops: [], pups: [] };
  G.map = viewMap(m.map, W, G.R.map);
  G.active = mineFirst(m.active);
  const view = (ef) => {
    const side = ef.team,
      e = G.teams[loc(side)][G.active[loc(side)]];
    return { ...ef, team: loc(side), trail: [], ghost: ef.hp, flash: 0, roll: 0, skin: e.skin || '', name: side === G.side ? 'تو' : G.botName, isPlayer: side === G.side, entry: e };
  };
  G.byId = fighters.map(view);
  G.f = [...G.byId].sort((a, b) => a.team - b.team);
  G.snaps = [];
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

/** Per frame: draw the server state INTERP_MS in the past, interpolating ball positions. */
function onlineFrame() {
  if (!G.R || !G.snaps.length) return;
  const t = performance.now() - INTERP_MS;
  let i = G.snaps.length - 1;
  while (i > 0 && G.snaps[i].at > t) i--;
  const a = G.snaps[i],
    b = G.snaps[i + 1];
  CK.P.applySnapshot(G.R, a.s);
  if (b) {
    const k = Math.max(0, Math.min(1, (t - a.at) / (b.at - a.at || 1)));
    b.s.f.forEach((row, id) => {
      const f = G.R.f[id];
      if (f) {
        f.x += (row[0] - f.x) * k;
        f.y += (row[1] - f.y) * k;
      }
    });
  }
  if (G.phase === 'vs' && G.R.phase === 'count') {
    $('#ov').hidden = true;
    G.phase = 'count';
  }
  syncViewOnline();
}

function syncViewOnline() {
  const R = G.R;
  for (const ef of R.f) {
    const v = fv(ef.id),
      team = v.team;
    Object.assign(v, ef, { team });
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
