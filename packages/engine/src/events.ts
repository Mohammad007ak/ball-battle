/**
 * Cosmetic and audio events. The engine emits them only when `fx` is on; the client turns them
 * into particles, rings, floating numbers, shake and sound. They never affect simulation state.
 * Colors are carried as in the prototype so the client can reproduce its look exactly.
 */
export type TextKey =
  | 'block'
  | 'dodge'
  | 'bubblePop'
  | 'reflect'
  | 'nineLives'
  | 'revived'
  | 'boostHit'
  | 'crit'
  | 'out'
  | 'ability';

export type GameEvent =
  | { e: 'ring'; x: number; y: number; r: number; c: string; max: number; w: number; grow?: number }
  | { e: 'burst'; x: number; y: number; c: string; n: number; spd?: number }
  | { e: 'text'; x: number; y: number; key: TextKey; c: string; big?: boolean; fid?: number }
  | { e: 'dmg'; fid: number; x: number; y: number; n: number; c?: string; src: number }
  | { e: 'beam'; a: number; b: number; life: number; col?: string }
  | { e: 'bolt'; a: number; b: number; ax: number; ay: number }
  | {
      e: 'banner';
      key: 'start' | 'shrink' | 'phoenix' | 'pickup' | 'pupSpawn';
      c: string;
      fid?: number;
      type?: string;
    }
  | { e: 'shake'; v: number }
  | { e: 'sfx'; n: string; fid?: number }
  | { e: 'ability'; fid: number }
  | { e: 'boost'; fid: number; a: number }
  | { e: 'swap'; a: number; b: number }
  | { e: 'teleport'; fid: number };
