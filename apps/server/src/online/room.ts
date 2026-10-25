import type { Balance } from '@chakachak/content';
import {
  applyRoundResult,
  botPick,
  createRound,
  nextMap,
  roundConfig,
  step,
  type GameEvent,
  type Input,
  type MatchState,
  type RoundState,
} from '@chakachak/engine';
import { encodeSnapshot } from '@chakachak/protocol';

/** One side of an online match: a connected player, or a server bot (also used after a disconnect). */
export interface Seat {
  playerId: string | null;
  name: string;
  skins: string[];
  send: ((msg: object) => void) | null;
  /** When the connection dropped (ms), for the reconnect grace period. */
  goneAt: number | null;
}

export type RoomPhase = 'reveal' | 'pick' | 'vs' | 'round' | 'roundEnd' | 'finish' | 'end';

/** Timings copied from the prototype's match flow (ms). */
export const T = {
  reveal: 4100,
  pick: 10_000,
  vs: 1700,
  roundEnd: 4100,
  finishPrompt: 3600,
  finisher: 6500,
  inputDelayTicks: 6, // ~100 ms, masked by the client's wind-up animation
  snapEvery: 2, // 60 Hz sim → 30 snapshots/s (smoother motion; ~50% more bandwidth)
  reconnect: 15_000,
  emoteGap: 2500,
} as const;

/**
 * Server-authoritative online 1v1 (best of 3, as offline): the engine runs here at 60 Hz;
 * clients only send inputs and render snapshots. All times come from `now()`.
 */
export class Room {
  phase: RoomPhase = 'reveal';
  phaseEnd: number;
  round: RoundState | null = null;
  map = '';
  picks: (number | null)[] = [null, null];
  winner: 0 | 1 | null = null;
  private queued: { tick: number; seat: 0 | 1; input: Input }[] = [];
  private evBuf: GameEvent[] = [];
  private emoAt = [0, 0];
  private finW: 0 | 1 = 0;

  constructor(
    public id: string,
    public m: MatchState,
    public seats: [Seat, Seat],
    private B: Balance,
    private now: () => number,
    private botSkill: number,
    private onEnd: (room: Room, winner: 0 | 1, surrender: boolean) => void,
  ) {
    this.phaseEnd = now();
    this.startReveal();
  }

  /* ---------- messages ---------- */
  private to(i: 0 | 1, msg: object) {
    this.seats[i].send?.(msg);
  }
  private all(msg: object) {
    this.to(0, msg);
    this.to(1, msg);
  }
  /** Full state for a (re)connecting seat. */
  welcome(i: 0 | 1) {
    this.to(i, {
      t: 'start',
      room: this.id,
      you: i,
      names: this.seats.map((s) => s.name),
      skins: this.seats.map((s) => s.skins),
      teams: this.m.teams,
    });
    this.to(i, { t: 'score', score: this.m.score, hist: this.m.hist, teams: this.m.teams });
    if (this.phase === 'reveal')
      this.to(i, { t: 'reveal', round: this.m.round + 1, map: this.map });
    if (this.phase === 'pick') this.to(i, { t: 'pick', left: this.phaseEnd - this.now() });
    if (this.round && (this.phase === 'round' || this.phase === 'vs'))
      this.to(i, { t: 'round', map: this.map, active: this.m.active, fighters: this.round.f });
  }

  /* ---------- flow ---------- */
  private set(phase: RoomPhase, ms: number) {
    this.phase = phase;
    this.phaseEnd = this.now() + ms;
  }
  private startReveal() {
    this.map = nextMap(this.m);
    this.picks = [null, null];
    this.set('reveal', T.reveal);
    this.all({ t: 'reveal', round: this.m.round + 1, map: this.map });
  }
  private startPick() {
    this.set('pick', T.pick);
    this.all({ t: 'pick', left: T.pick });
    for (const i of [0, 1] as const) if (this.isBot(i)) this.picks[i] = botPick(this.m, i);
  }
  private startRound() {
    const pick = (i: 0 | 1) => {
      const p = this.picks[i] ?? null;
      if (p != null && this.m.teams[i][p]?.alive) return p;
      // Timed out: send the healthiest survivor (prototype `showPick` default).
      const alive = this.m.teams[i].map((e, k) => ({ e, k })).filter((x) => x.e.alive);
      return alive.sort((a, b) => b.e.hp / b.e.maxHp - a.e.hp / a.e.maxHp)[0]!.k;
    };
    const cfg = roundConfig(this.m, this.map as never, [pick(0), pick(1)], this.B, {
      fx: true,
      botSkill: this.botSkill,
    });
    cfg.fighters.forEach((f, i) => (f.bot = this.isBot(i as 0 | 1)));
    this.round = createRound(cfg);
    this.queued = [];
    this.set('vs', T.vs);
    this.all({ t: 'round', map: this.map, active: this.m.active, fighters: this.round.f });
  }

  isBot(i: 0 | 1) {
    const s = this.seats[i];
    return !s.playerId || (s.goneAt !== null && this.now() - s.goneAt > T.reconnect);
  }

  /** Advance one 1/60 s simulation tick and the phase timers. Called by the room loop. */
  tick() {
    const now = this.now();
    // A seat that stayed away too long becomes a bot for the rest of the match.
    if (this.round) for (const i of [0, 1] as const) if (this.isBot(i)) this.round.f[i]!.bot = true;
    if (this.phase === 'round' && this.round) {
      const s = this.round;
      const inputs = this.queued.filter((q) => q.tick <= s.tick).map((q) => q.input);
      this.queued = this.queued.filter((q) => q.tick > s.tick);
      this.evBuf.push(...step(s, inputs, this.B));
      if (s.tick % T.snapEvery === 0 || s.result) {
        this.all({ t: 'snap', s: encodeSnapshot(s), ev: this.evBuf });
        this.evBuf = [];
      }
      if (s.result) this.endRound(s.result.winner, s.result.surrender);
      return;
    }
    if (now < this.phaseEnd) return;
    if (this.phase === 'reveal') this.startPick();
    else if (this.phase === 'pick') this.startRound();
    else if (this.phase === 'vs') this.phase = 'round';
    else if (this.phase === 'roundEnd') this.startReveal();
    else if (this.phase === 'finish') this.finishMatch(false);
  }

  private endRound(w: 0 | 1, surrender: boolean) {
    const r = this.round!.result!;
    applyRoundResult(this.m, r);
    this.all({
      t: 'score',
      score: this.m.score,
      hist: this.m.hist,
      teams: this.m.teams,
      roundWinner: w,
    });
    if (surrender) {
      this.winner = w;
      this.finishMatch(true);
    } else if (this.m.winner !== null) {
      this.winner = this.m.winner;
      this.finW = this.m.winner;
      // Finisher: purely visual; the result is already decided. Loser's client shows it too.
      this.set('finish', T.finishPrompt + T.finisher);
      this.all({ t: 'finish', w: this.finW });
    } else this.set('roundEnd', T.roundEnd);
  }

  private finishMatch(surrender: boolean) {
    if (this.phase === 'end') return;
    this.phase = 'end';
    this.onEnd(this, this.winner!, surrender);
  }

  /* ---------- client input ---------- */
  onPick(i: 0 | 1, k: number) {
    if (this.phase === 'pick' && this.m.teams[i][k]?.alive) this.picks[i] = k;
    if (this.phase === 'pick' && this.picks.every((p) => p !== null)) this.phaseEnd = this.now();
  }
  onInput(i: 0 | 1, inp: { t: 'boost'; x: number; y: number } | { t: 'ability' }) {
    if (this.phase !== 'round' || !this.round || this.queued.filter((q) => q.seat === i).length > 8)
      return;
    const input: Input =
      inp.t === 'boost' ? { t: 'boost', fid: i, x: inp.x, y: inp.y } : { t: 'ability', fid: i };
    this.queued.push({ tick: this.round.tick + T.inputDelayTicks, seat: i, input });
  }
  onEmote(i: 0 | 1, k: string) {
    const now = this.now();
    if (now - this.emoAt[i]! < T.emoteGap) return;
    this.emoAt[i] = now;
    this.all({ t: 'emo', side: i, k });
  }
  onFinisher(i: 0 | 1) {
    if (this.phase === 'finish' && i === this.finW) this.all({ t: 'finGo' });
  }
  onSurrender(i: 0 | 1) {
    if (this.phase === 'end') return;
    this.winner = i === 0 ? 1 : 0;
    this.finishMatch(true);
  }
}
