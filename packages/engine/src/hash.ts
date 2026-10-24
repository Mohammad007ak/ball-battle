import type { RoundState } from './types';

/** FNV-1a over the canonical JSON of the state. Same seed + same inputs ⇒ same hash. */
export function hashState(s: RoundState): string {
  const str = JSON.stringify(s);
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
