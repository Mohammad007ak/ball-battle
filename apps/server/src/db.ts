import { DatabaseSync } from 'node:sqlite';

export type DB = DatabaseSync;

/**
 * One SQLite file on the server's persistent disk (no separate database service).
 * Each entry runs once, in order; never edit a released migration, append a new one.
 */
const MIGRATIONS = [
  `create table players (
     id text primary key,
     phone_hash text unique,
     profile text not null,
     created_at integer not null,
     deleted_at integer
   )`,
  `create table sessions (
     token_hash text primary key,
     player_id text not null references players(id),
     created_at integer not null,
     expires_at integer not null
   )`,
  `create table otp (
     phone_hash text primary key,
     code_hash text not null,
     attempts integer not null default 0,
     sent_at integer not null,
     expires_at integer not null
   )`,
  `create table ledger (
     id integer primary key,
     player_id text not null,
     key text not null,
     delta integer not null,
     after integer not null,
     reason text not null,
     ref text,
     at integer not null
   )`,
  `create index ledger_player on ledger(player_id, at)`,
  `create table idem (
     player_id text not null,
     key text not null,
     response text not null,
     at integer not null,
     primary key (player_id, key)
   )`,
  `create table matches (
     id text primary key,
     player_id text not null,
     mode text not null,
     setup text not null,
     log text,
     result text,
     started_at integer not null,
     finished_at integer
   )`,
  `create index matches_open on matches(player_id, finished_at)`,
  `create table remote_config (
     version integer primary key,
     json text not null,
     active integer not null default 0,
     note text,
     at integer not null
   )`,
  `create table events (
     id integer primary key,
     player_id text not null,
     name text not null,
     data text,
     client_at integer not null,
     at integer not null
   )`,
  `create index events_name on events(name, at)`,
  `create index events_player on events(player_id, at)`,
  `create table errors (
     id integer primary key,
     player_id text,
     kind text not null,
     message text not null,
     stack text,
     source text,
     app text not null,
     device text,
     at integer not null
   )`,
  `create index errors_at on errors(at)`,
];

export function openDb(path: string): DB {
  const db = new DatabaseSync(path);
  db.exec('pragma journal_mode = wal; pragma foreign_keys = on; pragma busy_timeout = 5000');
  db.exec('create table if not exists migrations (n integer primary key)');
  const done =
    (db.prepare('select max(n) as n from migrations').get() as { n: number | null }).n ?? -1;
  for (let i = done + 1; i < MIGRATIONS.length; i++)
    tx(db, () => {
      db.exec(MIGRATIONS[i]!);
      db.prepare('insert into migrations (n) values (?)').run(i);
    });
  return db;
}

/**
 * Run `fn` in one write transaction. node:sqlite is synchronous and Node runs one request
 * handler at a time between awaits, so a synchronous `fn` can never interleave with another.
 */
export function tx<T>(db: DB, fn: () => T): T {
  db.exec('begin immediate');
  try {
    const r = fn();
    db.exec('commit');
    return r;
  } catch (e) {
    db.exec('rollback');
    throw e;
  }
}
