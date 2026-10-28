import { describe, expect, it } from 'vitest';
import { PAGE } from './admin-page';
import { buildApp } from './app';
import { openDb } from './db';
import { ConsoleSms } from './sms';

describe('admin dashboard', () => {
  it('page script is valid JavaScript', () => {
    const js = /<script>([\s\S]*)<\/script>/.exec(PAGE)![1]!;
    expect(() => new Function(js)).not.toThrow();
  });

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
    expect(s).toMatchObject({
      players: 2,
      matches: 2,
      byMode: { bot: 2 },
      purchases: { count: 0 },
    });
    expect(s.days).toHaveLength(14);
    expect(s.config.gemPacks.find((p: { id: string }) => p.id === 'gems_80').toman).toBe(15000);
    expect(s.list[0]).toMatchObject({ id: ids[0], matches: 2 });
    expect(s.list[1].matches).toBe(0);
    expect(s.errors).toEqual([]);
    const f = await app.inject({ url: '/admin/fonts/vazirmatn-arabic-400-normal.woff2' });
    expect(f.statusCode).toBe(200);
    expect(f.headers['content-type']).toBe('font/woff2');
    expect((await app.inject({ url: '/admin/fonts/..%2Fsrc%2Fdb.ts' })).statusCode).toBe(400);
  });
});
