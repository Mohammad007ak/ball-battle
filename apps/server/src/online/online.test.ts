import { describe, expect, it } from 'vitest';
import { buildApp } from '../app';
import { openDb } from '../db';
import { loadProfile } from '../game';
import { ConsoleSms } from '../sms';
import { Lobby, MM } from './lobby';
import { T } from './room';

function world() {
  let t = 1_700_000_000_000;
  const { app, ctx } = buildApp({
    db: openDb(':memory:'),
    sms: new ConsoleSms(),
    secret: 'x'.repeat(32),
    now: () => t,
  });
  const lobby = new Lobby(ctx);
  const guest = async () => {
    const r = await app.inject({ method: 'POST', url: '/v1/auth/guest' });
    return r.json().playerId ?? (r.json() as { profile: unknown; token: string }).token;
  };
  const inbox = () => {
    const msgs: { t: string; [k: string]: unknown }[] = [];
    return { msgs, send: (m: object) => msgs.push(m as never) };
  };
  /** Advance simulated time, ticking rooms at 60 Hz. */
  const run = (ms: number) => {
    for (let k = 0; k < ms / (1000 / 60); k++) {
      t += 1000 / 60;
      lobby.pump(t);
    }
  };
  return { ctx, lobby, guest, inbox, run, advance: (ms: number) => (t += ms) };
}

async function playerIds(w: ReturnType<typeof world>, n: number) {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    await w.guest();
    out.push(
      (
        w.ctx.db.prepare('select id from players order by rowid desc limit 1').get() as {
          id: string;
        }
      ).id,
    );
  }
  return out;
}

describe('online 1v1', () => {
  it('pairs two players by trophies and plays a server-decided match to the end', async () => {
    const w = world();
    const [a, b] = await playerIds(w, 2);
    const A = w.inbox(),
      Bx = w.inbox();
    w.lobby.join(a!, A.send);
    w.lobby.join(b!, Bx.send);
    w.lobby.matchmake();
    expect(w.lobby.rooms.size).toBe(1);
    expect(A.msgs.find((m) => m.t === 'start')).toMatchObject({ you: 0 });
    expect(Bx.msgs.find((m) => m.t === 'start')).toMatchObject({ you: 1 });
    // Nobody presses anything: rounds time out on the server clock and the match still ends.
    for (let i = 0; i < 400 && w.lobby.rooms.size; i++) w.run(1000);
    const ra = A.msgs.find((m) => m.t === 'result')!,
      rb = Bx.msgs.find((m) => m.t === 'result')!;
    expect(ra.win).toBe(!rb.win);
    const pa = loadProfile(w.ctx, a!),
      pb = loadProfile(w.ctx, b!);
    expect(pa.trophies + pb.trophies).toBe(30); // winner +30, loser at 0 stays 0
    expect(A.msgs.some((m) => m.t === 'snap')).toBe(true);
  });

  it('fills with a bot after waiting, and the bot plays', async () => {
    const w = world();
    const [a] = await playerIds(w, 1);
    const A = w.inbox();
    w.lobby.join(a!, A.send);
    w.lobby.matchmake();
    expect(w.lobby.rooms.size).toBe(0);
    w.advance(MM.botAfter);
    w.lobby.matchmake();
    const room = [...w.lobby.rooms.values()][0]!;
    expect(room.seats[1].playerId).toBeNull();
    w.run(T.reveal + T.pick + T.vs + 200);
    expect(room.round?.f[1]?.bot).toBe(true);
    expect(room.round?.f[0]?.bot).toBe(false);
  });

  it('inputs are applied by the server with a fixed delay, only for the sender', async () => {
    const w = world();
    const [a] = await playerIds(w, 1);
    const A = w.inbox();
    w.lobby.join(a!, A.send);
    w.advance(MM.botAfter);
    w.lobby.matchmake();
    const room = [...w.lobby.rooms.values()][0]!;
    w.run(T.reveal + T.pick + T.vs + 3500); // into the fight
    expect(room.phase).toBe('round');
    const f = room.round!.f[0]!,
      charges = f.charges;
    room.onInput(0, { t: 'boost', x: 0, y: 0 });
    w.run(50);
    expect(f.charges).toBe(charges);
    w.run(100);
    expect(f.charges).toBe(charges - 1);
  });

  it('a dropped player can rejoin; after 15 s a bot takes the seat', async () => {
    const w = world();
    const [a] = await playerIds(w, 1);
    w.lobby.join(a!, w.inbox().send);
    w.advance(MM.botAfter);
    w.lobby.matchmake();
    const room = [...w.lobby.rooms.values()][0]!;
    w.run(T.reveal + T.pick + T.vs + 3500);
    w.lobby.disconnect(a!);
    w.run(5000);
    expect(room.round!.f[0]!.bot).toBe(false);
    const back = w.inbox();
    w.lobby.rejoin(a!, back.send);
    expect(back.msgs.map((m) => m.t)).toContain('round');
    w.lobby.disconnect(a!);
    w.run(T.reconnect + 500);
    expect(room.round?.f[0]?.bot ?? true).toBe(true);
  });

  it('surrender ends the match as a loss', async () => {
    const w = world();
    const [a, b] = await playerIds(w, 2);
    const A = w.inbox();
    w.lobby.join(a!, A.send);
    w.lobby.join(b!, w.inbox().send);
    w.lobby.matchmake();
    const room = [...w.lobby.rooms.values()][0]!;
    room.onSurrender(0);
    expect(A.msgs.find((m) => m.t === 'result')).toMatchObject({ win: false, surrender: true });
    expect(w.lobby.rooms.size).toBe(0);
  });
});
