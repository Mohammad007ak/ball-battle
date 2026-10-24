import { randomBytes, randomInt } from 'node:crypto';
import * as EC from '@chakachak/economy';
import { createMatch } from '@chakachak/engine';
import type { Ctx } from '../app';
import { tx } from '../db';
import { loadProfile } from '../game';
import { writeLedger } from '../ledger';
import { Room, type Seat } from './room';

const rand = () => randomInt(0, 2 ** 47) / 2 ** 47;
const BOT_NAMES = [
  'آرش',
  'نیما',
  'سارا',
  'پویا',
  'مهسا',
  'کیان',
  'رضا',
  'الناز',
  'بردیا',
  'یاسمن',
  'امید',
  'ترانه',
];

/** Matchmaking: trophy window widens while waiting; after `botAfter` ms a same-level bot is used. */
export const MM = { baseRange: 100, rangePerSec: 50, botAfter: 8000 } as const;

interface Waiting {
  playerId: string;
  trophies: number;
  since: number;
  send: (msg: object) => void;
}

/** Online rooms and the queue, all in this single server process. */
export class Lobby {
  rooms = new Map<string, Room>();
  /** player → room they are in (for reconnect). */
  playerRoom = new Map<string, Room>();
  queue: Waiting[] = [];

  constructor(private c: Ctx) {}

  join(playerId: string, send: (m: object) => void) {
    if (this.playerRoom.has(playerId) || this.queue.some((q) => q.playerId === playerId)) return;
    const S = loadProfile(this.c, playerId);
    this.queue.push({ playerId, trophies: S.trophies, since: this.c.now(), send });
    send({ t: 'queued' });
  }
  cancel(playerId: string) {
    this.queue = this.queue.filter((q) => q.playerId !== playerId);
  }

  /** Pair waiting players; fall back to a bot. Called a few times per second. */
  matchmake() {
    const now = this.c.now();
    this.queue.sort((a, b) => a.since - b.since);
    const used = new Set<Waiting>();
    for (const a of this.queue) {
      if (used.has(a)) continue;
      const range = MM.baseRange + (MM.rangePerSec * (now - a.since)) / 1000;
      const b = this.queue.find(
        (q) => q !== a && !used.has(q) && Math.abs(q.trophies - a.trophies) <= range,
      );
      if (b) {
        used.add(a).add(b);
        this.create(a, b);
      } else if (now - a.since >= MM.botAfter) {
        used.add(a);
        this.create(a, null);
      }
    }
    this.queue = this.queue.filter((q) => !used.has(q));
  }

  private create(a: Waiting, b: Waiting | null) {
    const B = this.c.config.get(),
      Sa = loadProfile(this.c, a.playerId),
      setupA = EC.matchSetup(B, Sa, '1v1', rand);
    const Sb = b ? loadProfile(this.c, b.playerId) : null;
    const teamB = Sb ? EC.matchSetup(B, Sb, '1v1', rand).teams[0] : setupA.teams[1];
    const m = createMatch('1v1', randomInt(0, 2 ** 32), [setupA.teams[0], teamB], B);
    const seat = (w: Waiting | null, S: EC.Profile | null): Seat => ({
      playerId: w?.playerId ?? null,
      name: w ? 'بازیکن' : BOT_NAMES[randomInt(0, BOT_NAMES.length)]!,
      skins: S ? S.team.map((k) => S.skin[k] || '') : ['', ''],
      send: w?.send ?? null,
      goneAt: null,
    });
    const id = randomBytes(9).toString('base64url');
    // Bots play at the skill the player would meet offline; between two humans it only matters after a disconnect.
    const room = new Room(
      id,
      m,
      [seat(a, Sa), seat(b, Sb)],
      B,
      this.c.now,
      setupA.botSkill,
      (r, w, sur) => this.finish(r, w, sur),
    );
    this.rooms.set(id, room);
    for (const i of [0, 1] as const) {
      const p = room.seats[i].playerId;
      if (p) this.playerRoom.set(p, room);
      room.welcome(i);
    }
  }

  /** Rewards for each human seat, computed and stored by the server only. */
  private finish(room: Room, winner: 0 | 1, surrender: boolean) {
    const B = this.c.config.get(),
      now = this.c.now();
    for (const i of [0, 1] as const) {
      const pid = room.seats[i].playerId;
      if (!pid) continue;
      this.playerRoom.delete(pid);
      const res = tx(this.c.db, () => {
        const before = loadProfile(this.c, pid),
          S = structuredClone(before),
          r = EC.matchResult(B, S, i === winner, '1v1');
        this.c.db
          .prepare('update players set profile = ? where id = ?')
          .run(JSON.stringify(S), pid);
        writeLedger(this.c.db, pid, before, S, 'online', room.id, now);
        return { ...r, profile: S };
      });
      room.seats[i].send?.({
        t: 'result',
        win: i === winner,
        surrender,
        score: room.m.score,
        ...res,
      });
    }
    this.c.db
      .prepare(
        'insert into matches (id, player_id, mode, setup, result, started_at, finished_at) values (?, ?, ?, ?, ?, ?, ?)',
      )
      .run(
        room.id,
        room.seats[0].playerId ?? 'bot',
        'online',
        JSON.stringify({ seats: room.seats.map((s) => s.playerId) }),
        JSON.stringify({ winner, score: room.m.score }),
        now,
        now,
      );
    this.rooms.delete(room.id);
  }

  /** A connection dropped: keep the seat for the reconnect grace period. */
  disconnect(playerId: string) {
    this.cancel(playerId);
    const room = this.playerRoom.get(playerId);
    if (!room) return;
    const seat = room.seats.find((s) => s.playerId === playerId);
    if (seat) {
      seat.send = null;
      seat.goneAt = this.c.now();
    }
  }
  /** Same player is back (any connection): resume their seat. */
  rejoin(playerId: string, send: (m: object) => void) {
    const room = this.playerRoom.get(playerId);
    if (!room) return send({ t: 'noRoom' });
    const i = room.seats.findIndex((s) => s.playerId === playerId) as 0 | 1;
    Object.assign(room.seats[i], { send, goneAt: null });
    room.welcome(i);
  }
  seatOf(playerId: string): [Room, 0 | 1] | null {
    const room = this.playerRoom.get(playerId);
    if (!room) return null;
    return [room, room.seats.findIndex((s) => s.playerId === playerId) as 0 | 1];
  }

  /** Run every room at 60 Hz (catching up after timer jitter, at most 10 ticks per call). */
  private last = 0;
  private acc = 0;
  pump(nowMs: number) {
    if (!this.last) this.last = nowMs;
    this.acc = Math.min(this.acc + (nowMs - this.last), 1000 / 6);
    this.last = nowMs;
    while (this.acc >= 1000 / 60) {
      this.acc -= 1000 / 60;
      for (const r of this.rooms.values()) r.tick();
    }
  }
}
