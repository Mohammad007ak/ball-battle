import { defaultBalance, type Balance } from '@chakachak/content';
import * as EC from '@chakachak/economy';
import * as E from '@chakachak/engine';
import * as P from '@chakachak/protocol';
import type { Art } from './art';
import type { Backend } from './net/backend';
import { native, type Native } from './native';
import { makeQuality, type Quality } from './quality';
import { Telemetry } from './telemetry';

/** What the legacy (prototype-ported) scripts can reach: engine, data, economy rules and backend. */
export interface Bridge {
  E: typeof E;
  B: Balance;
  EC: typeof EC;
  P: typeof P;
  BK: Backend;
  ART: Art | null;
  /** Phone features (haptics, keep-awake, back button). */
  N: Native;
  /** Analytics events to our own server. */
  T: Telemetry;
  /** Match canvas render quality (adapts to slow phones). */
  Q: Quality;
}

export function makeBridge(
  BK: Backend,
  B: Balance = defaultBalance,
  ART: Art | null = null,
  T: Telemetry = new Telemetry(null),
): Bridge {
  const Q = makeQuality((level) => T.track('quality', { level }));
  return { E, B, EC, P, BK, ART, N: native, T, Q };
}
