import { CLASS_KEYS, type Balance } from '@chakachak/content';
import * as EC from '@chakachak/economy';
import type { Profile } from '@chakachak/economy';
import type { Action, ActResult, Backend } from './backend';

const KEY = 'chakachak-profile-v1';

/**
 * Phase-3 stand-in for the game server: runs the shared economy rules on a profile kept in
 * localStorage. Phase 4 replaces it with an HTTP backend that implements the same interface.
 */
export class LocalBackend implements Backend {
  readonly dev = true;
  private S: Profile;

  constructor(private B: Balance) {
    let raw: Partial<Profile>;
    try {
      raw = JSON.parse(localStorage.getItem(KEY) || '{}') as Partial<Profile>;
    } catch {
      raw = {};
    }
    this.S = EC.fixProfile(B, raw);
  }

  profile(): Profile {
    return this.S;
  }
  now(): number {
    return Date.now();
  }
  dayKey(): number {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }

  async act(a: Action): Promise<ActResult> {
    // Work on a copy so a failed action never leaves a half-applied profile.
    const S = structuredClone(this.S);
    try {
      const data = this.run(S, a) ?? undefined;
      this.S = S;
      try {
        localStorage.setItem(KEY, JSON.stringify(S));
      } catch {
        /* storage full or blocked: keep playing in memory */
      }
      return { ok: true, data };
    } catch (e) {
      if (e instanceof EC.EconomyError)
        return { ok: false, code: e.code, ...(e.need ? { need: e.need } : {}) };
      throw e;
    }
  }

  private run(S: Profile, a: Action): object | void {
    const B = this.B,
      now = this.now(),
      rand = Math.random;
    switch (a.t) {
      case 'unlock':
        return EC.unlockSlot(B, S, a.slot, now);
      case 'open':
        return EC.openSlot(B, S, a.slot, now, rand);
      case 'buyChest':
        return EC.buyChest(B, S, a.tier, rand);
      case 'buySkin':
        return EC.buySkin(B, S, a.k, a.st, this.dayKey());
      case 'upgrade':
        return EC.upgrade(B, S, a.k);
      case 'ability':
        return EC.setAbility(B, S, a.k, a.ab);
      case 'equip':
        return EC.equipSkin(S, a.k, a.st);
      case 'team':
        return EC.setTeam(S, a.i, a.k);
      case 'mode':
        S.mode = a.mode;
        return;
      case 'match':
        return EC.matchResult(B, S, a.win, a.mode);
      case 'cheat':
        return this.cheat(S, a.what, now);
    }
  }

  /** The prototype's test buttons. */
  private cheat(S: Profile, what: string, now: number) {
    const max = this.B.game.MAXLVL;
    if (what === 'unlock') for (const k of CLASS_KEYS) S.lv[k] ||= 1;
    if (what === 'coins') S.coins += 1000;
    if (what === 'gems') S.gems += 500;
    if (what === 'max') for (const k of CLASS_KEYS) if (S.lv[k]) S.lv[k] = max;
    if (what === 'tup') S.trophies += 300;
    if (what === 'tdown') S.trophies = Math.max(0, S.trophies - 300);
    if (what === 'fill')
      S.slots = S.slots.map((s) => s || { tier: Math.floor(Math.random() * 5), end: null });
    if (what === 'fast') S.slots.forEach((s) => s && (s.end = now));
    if (what === 'reset') Object.assign(S, EC.freshProfile(this.B));
    return undefined;
  }
}
