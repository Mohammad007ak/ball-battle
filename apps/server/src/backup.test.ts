import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { backup } from './backup';
import { openDb } from './db';

it('snapshots the database and keeps the newest copies', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ck-')),
    db = openDb(join(dir, 'x.db'));
  for (let i = 0; i < 4; i++) backup(db, dir, new Date(1_700_000_000_000 + i * 1000), 2);
  const files = readdirSync(join(dir, 'backups'));
  expect(files).toHaveLength(2);
  const copy = openDb(join(dir, 'backups', files[1]!));
  expect(copy.prepare('select count(*) n from migrations').get()).toMatchObject({ n: 9 });
});
