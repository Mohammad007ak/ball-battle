import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { buildApp } from './app';
import { backup } from './backup';
import { openDb } from './db';
import { ConsoleSms, KavenegarSms } from './sms';

/** Configuration comes from the environment (Hamravesh app settings). See docs/DEPLOY.md. */
const env = process.env;
const dataDir = env.DATA_DIR ?? './data';
mkdirSync(dataDir, { recursive: true });
const secret = env.SECRET;
if (!secret || secret.length < 32) throw new Error('SECRET (32+ chars) is required');
const sms =
  env.SMS_PROVIDER === 'kavenegar'
    ? new KavenegarSms(env.KAVENEGAR_KEY ?? '', env.KAVENEGAR_TEMPLATE ?? 'chakachak')
    : new ConsoleSms();
const dev = env.DEV_TOOLS === '1';
const db = openDb(join(dataDir, 'chakachak.db'));
const { app } = buildApp({
  db,
  sms,
  secret,
  dev,
  ...(env.SMS_PROVIDER !== 'kavenegar' && env.TEST_OTP ? { testOtp: env.TEST_OTP } : {}),
});
await app.listen({ host: '0.0.0.0', port: Number(env.PORT ?? 8080) });
console.log(
  `chakachak server on :${env.PORT ?? 8080} (data: ${dataDir}, sms: ${env.SMS_PROVIDER ?? 'console'})`,
);

// Backups: one snapshot every BACKUP_HOURS (default 6), newest 14 kept.
const every = Number(env.BACKUP_HOURS ?? 6) * 3600_000;
setInterval(() => {
  try {
    console.log('backup:', backup(db, dataDir, new Date()));
  } catch (e) {
    console.error('backup failed', e);
  }
}, every).unref();
