import { defaultBalance, type Balance } from '@chakachak/content';
import * as EC from '@chakachak/economy';
import * as E from '@chakachak/engine';
import * as P from '@chakachak/protocol';
import type { Backend } from './net/backend';

/** What the legacy (prototype-ported) scripts can reach: engine, data, economy rules and backend. */
export interface Bridge {
  E: typeof E;
  B: Balance;
  EC: typeof EC;
  P: typeof P;
  BK: Backend;
}

export function makeBridge(BK: Backend, B: Balance = defaultBalance): Bridge {
  return { E, B, EC, P, BK };
}
