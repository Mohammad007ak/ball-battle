import type { Balance } from '@chakachak/content';
import * as EC from '@chakachak/economy';
import type { Profile } from '@chakachak/economy';
import type { MatchSetup } from '@chakachak/engine';
import type { Action, ActResult, Backend } from './backend';

const KEY = 'chakachak-profile-v1';

/**
 * Phase-3 stand-in for the game server: runs the shared economy rules on a profile kept in
 * localStorage. Phase 4 replaces it with an HTTP backend that implements the same interface.
 */
export class LocalBackend implements Backend {
  readonly dev = true;
  private S: Profile;
  /** Match handed out and not yet finished (abandoning it counts as a loss). */
  private pending: { id: string; setup: MatchSetup } | null = null;

  constructor(private B: Balance) {
    let raw: Partial<Profile>;
    try {
      raw = JSON.parse(localStorage.getItem(KEY) || '{}') as Partial<Profile>;
    } catch {
      raw = {};
    }
    // First launch offline: a new profile with the starter chest, like a new server account.
    this.S = Object.keys(raw).length ? EC.fixProfile(B, raw) : EC.freshProfile(B, Math.random);
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
      rand = Math.random;
    if (a.t === 'matchStart') {
      if (this.pending) EC.matchResult(B, S, false, this.pending.setup.mode);
      this.pending = { id: crypto.randomUUID(), setup: EC.matchSetup(B, S, a.mode, rand) };
      return this.pending;
    }
    if (a.t === 'match') {
      const p = this.pending;
      if (!p || p.id !== a.id) throw new EC.EconomyError('noMatch');
      this.pending = null;
      return EC.matchFinish(B, S, p.setup, a.log);
    }
    return EC.applyAction(B, S, a, { now: this.now(), dayKey: this.dayKey(), rand, dev: true });
  }
}
