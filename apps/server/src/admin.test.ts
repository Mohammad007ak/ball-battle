import { describe, expect, it } from 'vitest';
import { buildApp } from './app';
import { openDb } from './db';
import { ConsoleSms } from './sms';

describe('admin dashboard', () => {
  it('counts players and their finished matches, only with the admin token', async () => {
    const db = openDb(':memory:');
    const { app } = buildApp({
      db,
      sms: new ConsoleSms(),
      secret: 'x'.repeat(32),
      adminToken: 'k'.repeat(20),
    });
    const a = (await app.inject({ method: 'POST', url: '/v1/auth/guest' })).json().token;
    await app.inject({ method: 'POST', url: '/v1/auth/guest' });
    expect(a).toBeTruthy();
    const ids = (db.prepare('select id from players').all() as { id: string }[]).map((r) => r.id);
    const ins = db.prepare(
      'insert into matches (id, player_id, mode, setup, started_at, finished_at) values (?, ?, ?, ?, ?, ?)',
    );
    ins.run('m1', ids[0]!, 'bot', '{}', 1, 2);
    ins.run('m2', ids[0]!, 'bot', '{}', 1, 3);
    ins.run('m3', ids[0]!, 'bot', '{}', 1, null);
    expect((await app.inject({ url: '/admin/stats' })).statusCode).toBe(401);
    expect((await app.inject({ url: '/admin/stats?key=wrong' })).statusCode).toBe(401);
    const s = (await app.inject({ url: '/admin/stats?key=' + 'k'.repeat(20) })).json();
    expect(s).toMatchObject({ players: 2, matches: 2 });
    expect(s.list[0]).toMatchObject({ id: ids[0], matches: 2 });
    expect(s.list[1].matches).toBe(0);
  });
});
