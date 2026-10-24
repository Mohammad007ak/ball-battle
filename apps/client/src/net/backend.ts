import type { ClassKey } from '@chakachak/content';
import type { Item, Profile } from '@chakachak/economy';

/** Everything the UI can ask the game server to do. The server decides; the client only renders. */
export type Action =
  | { t: 'unlock'; slot: number }
  | { t: 'open'; slot: number }
  | { t: 'buyChest'; tier: number }
  | { t: 'buySkin'; k: ClassKey; st: string }
  | { t: 'upgrade'; k: ClassKey }
  | { t: 'ability'; k: ClassKey; ab: number }
  | { t: 'equip'; k: ClassKey; st: string }
  | { t: 'team'; i: number; k: ClassKey }
  | { t: 'mode'; mode: '1v1' | '2v2' }
  | { t: 'match'; win: boolean; mode: '1v1' | '2v2' }
  | { t: 'cheat'; what: string };

export interface ChestResult {
  tier: number;
  items: Item[];
}
export interface MatchReward {
  trophies: number;
  tier: number;
  slot: number;
  before: number;
  after: number;
}

export type ActResult =
  | { ok: true; data?: ChestResult | MatchReward | object }
  | { ok: false; code: string; need?: number };

export interface Backend {
  /** Offline test tools are available (never on the real server). */
  readonly dev: boolean;
  /** Last known profile from the server. */
  profile(): Profile;
  /** Server time in ms (chest timers). */
  now(): number;
  /** Server day for the daily shop, as yyyymmdd. */
  dayKey(): number;
  act(a: Action): Promise<ActResult>;
}
