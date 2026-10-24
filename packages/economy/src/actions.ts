import { CLASS_KEYS, type Balance, type ClassKey } from '@chakachak/content';
import {
  EconomyError,
  buyChest,
  buySkin,
  equipSkin,
  freshProfile,
  openSlot,
  setAbility,
  setTeam,
  unlockSlot,
  upgrade,
  type Profile,
  type Rand,
} from './index';

/** Profile actions that need no match state. Matches are handled by the backend (they need storage). */
export type ProfileAction =
  | { t: 'unlock'; slot: number }
  | { t: 'open'; slot: number }
  | { t: 'buyChest'; tier: number }
  | { t: 'buySkin'; k: ClassKey; st: string }
  | { t: 'upgrade'; k: ClassKey }
  | { t: 'ability'; k: ClassKey; ab: number }
  | { t: 'equip'; k: ClassKey; st: string }
  | { t: 'team'; i: number; k: ClassKey }
  | { t: 'mode'; mode: '1v1' | '2v2' }
  | { t: 'cheat'; what: string };

export interface ActionCtx {
  now: number;
  dayKey: number;
  rand: Rand;
  /** Test tools allowed (offline/dev only, never in production). */
  dev: boolean;
}

/** Apply one action to `S` in place. Throws EconomyError when it is not allowed. */
export function applyAction(
  B: Balance,
  S: Profile,
  a: ProfileAction,
  c: ActionCtx,
): object | undefined {
  switch (a.t) {
    case 'unlock':
      return (unlockSlot(B, S, a.slot, c.now), undefined);
    case 'open':
      return openSlot(B, S, a.slot, c.now, c.rand);
    case 'buyChest':
      return buyChest(B, S, a.tier, c.rand);
    case 'buySkin':
      return (buySkin(B, S, a.k, a.st, c.dayKey), undefined);
    case 'upgrade':
      return upgrade(B, S, a.k);
    case 'ability':
      return (setAbility(B, S, a.k, a.ab), undefined);
    case 'equip':
      return (equipSkin(S, a.k, a.st), undefined);
    case 'team':
      return (setTeam(S, a.i, a.k), undefined);
    case 'mode':
      S.mode = a.mode;
      return undefined;
    case 'cheat':
      if (!c.dev) throw new EconomyError('forbidden');
      return (cheat(B, S, a.what, c), undefined);
  }
}

/** The prototype's test buttons. */
function cheat(B: Balance, S: Profile, what: string, c: ActionCtx) {
  const max = B.game.MAXLVL;
  if (what === 'unlock') for (const k of CLASS_KEYS) S.lv[k] ||= 1;
  if (what === 'coins') S.coins += 1000;
  if (what === 'gems') S.gems += 500;
  if (what === 'max') for (const k of CLASS_KEYS) if (S.lv[k]) S.lv[k] = max;
  if (what === 'tup') S.trophies += 300;
  if (what === 'tdown') S.trophies = Math.max(0, S.trophies - 300);
  if (what === 'fill')
    S.slots = S.slots.map((s) => s || { tier: Math.floor(c.rand() * 5), end: null });
  if (what === 'fast') S.slots.forEach((s) => s && (s.end = c.now));
  if (what === 'reset') Object.assign(S, freshProfile(B));
}
