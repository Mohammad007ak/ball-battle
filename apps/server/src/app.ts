import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import {
  ActRequestSchema,
  ErrorReportSchema,
  EventsRequestSchema,
  OtpRequestSchema,
  VerifyRequestSchema,
} from '@chakachak/protocol';
import type { z } from 'zod';
import {
  AuthError,
  authenticate,
  createGuest,
  deleteAccount,
  isLinked,
  logout,
  requestOtp,
  verifyOtp,
} from './auth';
import { RemoteConfig } from './config';
import type { DB } from './db';
import { act, loadProfile, me } from './game';
import { RateLimiter } from './ratelimit';
import type { SmsProvider } from './sms';
import { recordError, recordEvents } from './telemetry';

export interface Ctx {
  db: DB;
  sms: SmsProvider;
  secret: string;
  now: () => number;
  limit: RateLimiter;
  config: RemoteConfig;
  /** Allow the offline test tools ("cheat" actions). Never in production. */
  dev: boolean;
  /** Fixed OTP for development and tests (only with the console SMS provider). */
  testOtp?: string;
}

export interface AppOptions {
  db: DB;
  sms: SmsProvider;
  secret: string;
  now?: () => number;
  dev?: boolean;
  testOtp?: string;
}

const STATUS: Record<string, number> = { unauthorized: 401, rateLimited: 429, tooSoon: 429 };

export function buildApp(o: AppOptions) {
  const now = o.now ?? Date.now;
  const c: Ctx = {
    db: o.db,
    sms: o.sms,
    secret: o.secret,
    now,
    limit: new RateLimiter(now),
    config: new RemoteConfig(o.db, now),
    dev: !!o.dev,
    ...(o.testOtp ? { testOtp: o.testOtp } : {}),
  };
  const app = Fastify({ logger: false, bodyLimit: 512 * 1024, trustProxy: true });

  const parse = <T extends z.ZodTypeAny>(s: T, body: unknown): z.infer<T> => {
    const r = s.safeParse(body);
    if (!r.success) throw new AuthError('badRequest');
    return r.data;
  };
  const player = (req: FastifyRequest) => {
    const id = authenticate(c, req.headers.authorization);
    if (!c.limit.take('req:' + id, 120, 60_000)) throw new AuthError('rateLimited');
    return id;
  };

  app.setErrorHandler((e: unknown, _req, reply: FastifyReply) => {
    if (e instanceof AuthError) return reply.code(STATUS[e.code] ?? 400).send({ error: e.code });
    console.error(e);
    return reply.code(500).send({ error: 'internal' });
  });

  // The app (Capacitor WebView) calls from its own origin; auth is a bearer token, not cookies.
  app.addHook('onRequest', async (req, reply) => {
    reply.header('access-control-allow-origin', '*');
    reply.header('access-control-allow-headers', 'authorization, content-type');
    reply.header('access-control-allow-methods', 'GET, POST, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') return reply.code(204).send();
  });
  app.get('/health', async () => ({ ok: true }));
  app.get('/v1/config', async () => ({ version: c.config.version, balance: c.config.get() }));
  app.post('/v1/auth/otp', async (req) => {
    await requestOtp(c, parse(OtpRequestSchema, req.body).phone, req.ip);
    return { ok: true };
  });
  app.post('/v1/auth/guest', async (req) => {
    const { token, playerId } = createGuest(c, req.ip);
    return { token, linked: false, ...me(c, playerId) };
  });
  app.post('/v1/auth/verify', async (req) => {
    const b = parse(VerifyRequestSchema, req.body);
    if (!c.limit.take('verify-ip:' + req.ip, 30, 3600_000)) throw new AuthError('rateLimited');
    let current: string | null;
    try {
      current = req.headers.authorization ? authenticate(c, req.headers.authorization) : null;
    } catch {
      current = null;
    }
    const { token, playerId, outcome } = verifyOtp(c, b.phone, b.code, current);
    return { token, outcome, linked: true, ...me(c, playerId) };
  });
  app.post('/v1/auth/logout', async (req) => {
    logout(c, req.headers.authorization);
    return { ok: true };
  });
  app.delete('/v1/account', async (req) => {
    deleteAccount(c, player(req));
    return { ok: true };
  });
  app.get('/v1/me', async (req) => {
    const id = player(req);
    return { linked: isLinked(c, id), ...me(c, id) };
  });
  app.post('/v1/act', async (req) => {
    const id = player(req),
      b = parse(ActRequestSchema, req.body);
    return { ...act(c, id, b.action, b.idem), profile: loadProfile(c, id), now: c.now() };
  });
  app.post('/v1/events', async (req) => {
    const id = player(req),
      b = parse(EventsRequestSchema, req.body);
    if (!c.limit.take('events:' + id, 30, 60_000)) throw new AuthError('rateLimited');
    recordEvents(c.db, id, b.events, c.now());
    return { ok: true };
  });
  // Crash reports may come before login (or with an expired token), so auth is optional here.
  app.post('/v1/errors', async (req) => {
    const b = parse(ErrorReportSchema, req.body);
    if (!c.limit.take('errors:' + req.ip, 20, 60_000)) throw new AuthError('rateLimited');
    let id: string | null = null;
    try {
      if (req.headers.authorization) id = authenticate(c, req.headers.authorization);
    } catch {
      /* report anonymously */
    }
    recordError(c.db, id, b, c.now());
    return { ok: true };
  });
  return { app, ctx: c };
}
