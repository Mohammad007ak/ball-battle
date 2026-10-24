import type { Item, Profile } from '@chakachak/economy';
import type { MatchSetup } from '@chakachak/engine';

/** Everything the UI can ask the game server to do (schema in packages/protocol). */
export type { Action } from '@chakachak/protocol';
import type { Action } from '@chakachak/protocol';

export interface ChestResult {
  tier: number;
  items: Item[];
}
export interface MatchStart {
  id: string;
  setup: MatchSetup;
}
export interface MatchReward {
  win: boolean;
  score: [number, number];
  trophies: number;
  tier: number;
  slot: number;
  before: number;
  after: number;
}

export type ActResult =
  | { ok: true; data?: ChestResult | MatchStart | MatchReward | object }
  | { ok: false; code: string; need?: number };

/** Optional account linking (Clash Royale style: play as guest, save progress with a phone). */
export interface AccountApi {
  linked(): boolean;
  requestOtp(phone: string): Promise<ActResult>;
  verify(phone: string, code: string): Promise<ActResult>;
  deleteAccount(): Promise<ActResult>;
}

export interface Backend {
  /** Present when the backend is a real server. */
  readonly account?: AccountApi;
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
