import { CLASS_KEYS, type ClassKey } from '@chakachak/content';
import { z } from 'zod';

/** Client ↔ server HTTP contract. Every request body is validated against these on the server. */

const cls = z.enum(CLASS_KEYS as [ClassKey, ...ClassKey[]]);
const int = z.number().int();

const input = z.union([
  z.object({
    t: z.literal('boost'),
    fid: z.literal(0),
    x: z.number().finite(),
    y: z.number().finite(),
  }),
  z.object({ t: z.literal('ability'), fid: z.literal(0) }),
]);

/** Recorded inputs of a match against bots (see engine `replayMatch`). */
export const MatchLogSchema = z.object({
  rounds: z
    .array(
      z.object({
        pick: int.min(0).max(1),
        inputs: z.array(z.tuple([int.min(0).max(5000), z.array(input).max(4)])).max(3000),
      }),
    )
    .max(3),
  surrender: z.boolean().optional(),
});

export const ActionSchema = z.discriminatedUnion('t', [
  z.object({ t: z.literal('unlock'), slot: int.min(0).max(3) }),
  z.object({ t: z.literal('open'), slot: int.min(0).max(3) }),
  z.object({ t: z.literal('buyChest'), tier: int.min(0).max(4) }),
  z.object({ t: z.literal('buySkin'), k: cls, st: z.string().max(30) }),
  z.object({ t: z.literal('upgrade'), k: cls }),
  z.object({ t: z.literal('ability'), k: cls, ab: int.min(0).max(2) }),
  z.object({ t: z.literal('equip'), k: cls, st: z.string().max(30) }),
  z.object({ t: z.literal('team'), i: int.min(0).max(1), k: cls }),
  z.object({ t: z.literal('mode'), mode: z.enum(['1v1', '2v2']) }),
  z.object({ t: z.literal('matchStart'), mode: z.enum(['1v1', '2v2']) }),
  z.object({ t: z.literal('match'), id: z.string().max(64), log: MatchLogSchema }),
  z.object({ t: z.literal('cheat'), what: z.string().max(20) }),
]);
export type Action = z.infer<typeof ActionSchema>;

/** POST /v1/act — `idem` makes retries safe: the same key returns the stored response. */
export const ActRequestSchema = z.object({ action: ActionSchema, idem: z.string().min(8).max(64) });

export const OtpRequestSchema = z.object({ phone: z.string().min(10).max(16) });
export const VerifyRequestSchema = z.object({
  phone: z.string().min(10).max(16),
  code: z.string().regex(/^\d{5}$/),
});

export type ActResult = { ok: true; data?: unknown } | { ok: false; code: string; need?: number };
export * from './snapshot';

/* ---------- online matches (WebSocket /v1/ws), client → server ---------- */
export const ClientMsgSchema = z.discriminatedUnion('t', [
  z.object({ t: z.literal('hello'), token: z.string().max(100) }),
  z.object({ t: z.literal('queue'), mode: z.literal('1v1') }),
  z.object({ t: z.literal('cancel') }),
  z.object({ t: z.literal('rejoin'), room: z.string().max(40) }),
  z.object({ t: z.literal('pick'), i: int.min(0).max(1) }),
  z.object({
    t: z.literal('in'),
    i: z.union([
      z.object({ t: z.literal('boost'), x: z.number().finite(), y: z.number().finite() }),
      z.object({ t: z.literal('ability') }),
    ]),
  }),
  z.object({ t: z.literal('emo'), k: z.enum(['laugh', 'thumb', 'love', 'wow', 'angry', 'cry']) }),
  z.object({ t: z.literal('fin') }),
  z.object({ t: z.literal('surrender') }),
]);
export type ClientMsg = z.infer<typeof ClientMsgSchema>;

/* ---------- telemetry (our own server; no foreign analytics services) ---------- */
const eventName = z.string().regex(/^[a-z][a-z0-9_]{1,31}$/);
const scalar = z.union([z.string().max(64), z.number().finite(), z.boolean()]);

/** POST /v1/events — a batch of gameplay/retention events, sent by a logged-in client. */
export const EventsRequestSchema = z.object({
  events: z
    .array(
      z.object({
        n: eventName,
        /** Client time (ms); the server also stores its own receive time. */
        t: z.number().int().nonnegative(),
        d: z.record(z.string().max(24), scalar).optional(),
      }),
    )
    .min(1)
    .max(50),
});
export type TelemetryEvent = z.infer<typeof EventsRequestSchema>['events'][number];

/** POST /v1/errors — JS errors from the WebView and native crashes (login not required). */
export const ErrorReportSchema = z.object({
  kind: z.enum(['error', 'rejection', 'native']),
  message: z.string().max(500),
  stack: z.string().max(4000).optional(),
  source: z.string().max(200).optional(),
  app: z.string().max(32),
  device: z.string().max(120).optional(),
});
export type ErrorReport = z.infer<typeof ErrorReportSchema>;
