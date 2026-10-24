import type { Balance, ClassKey } from '@chakachak/content';
import type { Rng } from './rng';

export type MapId = 'classic' | 'pillars' | 'spikes' | 'pinball' | 'portal' | 'spinner';
export type Phase = 'count' | 'fight' | 'ended';
export type Mode = '1v1' | '2v2';

/** What a lobby/match layer hands the engine for one fighter. */
export interface FighterSpec {
  team: 0 | 1;
  cls: ClassKey;
  lvl: number;
  ab: 0 | 1 | 2;
  /** Current hp when carried over from a previous round; full hp if omitted. */
  hp?: number;
  revived?: boolean;
  /** Engine drives this fighter with the built-in bot. */
  bot?: boolean;
}

export interface RoundConfig {
  seed: number;
  mode: Mode;
  map: MapId;
  fighters: FighterSpec[];
  balance: Balance;
  /** Bot difficulty, the league index 0..4 in the prototype. */
  botLevel?: number;
  /** Emit cosmetic events (rings, bursts, texts). Off on the server and in the simulator. */
  fx?: boolean;
}

export interface Fighter {
  id: number;
  cls: ClassKey;
  lvl: number;
  m: number;
  team: 0 | 1;
  bot: boolean;
  out: boolean;
  ab: number;
  r: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  hitCd: number;
  rageBonus: number;
  poison: number;
  poisonAcc: number;
  poisonDecay: number;
  arrowT: number;
  abilityCd: number;
  abilityMax: number;
  buffT: number;
  invulnT: number;
  aiDelay: number;
  charges: number;
  chargeT: number;
  boostT: number;
  kbT: number;
  powT: number;
  botT: number;
  spikeCd: number;
  obsCd: number;
  barCd: number;
  portCd: number;
  slowT: number;
  freezeT: number;
  reflectT: number;
  invisT: number;
  ghostNext: boolean;
  revived: boolean;
  zapT: number;
  zapQ: number;
  zapQT: number;
  mineT: number;
  fireT: number;
  spineT: number;
  burnAcc: number;
  aura: Aura | null;
  auraAcc: number;
  rapidT: number;
  thirstT: number;
  zapFastT: number;
  spikyT: number;
  stoneT: number;
  dmgRedT: number;
  nextBonus: number;
  rootT: number;
  dazeT: number;
  charmT: number;
  charmBy: number;
  bubbleT: number;
  cocoonT: number;
  lifeT: number;
  warT: number;
  healHitT: number;
  rainbowT: number;
  rbT: number;
  dotT: number;
  dotDps: number;
  dotAcc: number;
  dotSrc: number;
  hits: number;
  shotT: number;
}

export type AuraKind = 'snow' | 'elec' | 'sun' | 'petal';
export interface Aura {
  t: number;
  r: number;
  dps: number;
  slow?: boolean;
  heal?: number;
  kind: AuraKind;
}

export type ProjectileKind =
  | 'arrow'
  | 'heavy'
  | 'bat'
  | 'ice'
  | 'grenade'
  | 'shard'
  | 'spine'
  | 'feather'
  | 'rock'
  | 'claw'
  | 'bubble'
  | 'spear'
  | 'bfly';

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  owner: number;
  dmg: number;
  life: number;
  kind: ProjectileKind;
  home: number;
  slow: number;
  knock: number;
  explode: { dmg: number; R: number } | null;
  rad: number;
  bleed: { t: number; dps: number } | null;
  ported: boolean;
  done: boolean;
}

export type ZoneKind = 'fire' | 'acid' | 'tornado' | 'rainbow' | 'dust';
export interface Zone {
  x: number;
  y: number;
  r: number;
  life: number;
  max: number;
  owner: number;
  dps: number;
  slow?: boolean;
  daze?: boolean;
  home?: number;
  kind: ZoneKind;
}

export interface Mine {
  x: number;
  y: number;
  owner: number;
  arm: number;
  t: number;
  kind?: 'flower';
  dmg?: number;
  R?: number;
  dead?: boolean;
}

export interface Drop {
  x: number;
  y: number;
  t: number;
  t0: number;
  owner: number;
  dmg: number;
  R: number;
  dead?: boolean;
}

export type PickupType = 'heal' | 'power' | 'charge';
export interface Pickup {
  x: number;
  y: number;
  type: PickupType;
  t: number;
  taken?: boolean;
}

export interface Circle {
  x: number;
  y: number;
  R: number;
  hit: number;
}
export interface Portal {
  bx: number;
  by: number;
  x: number;
  y: number;
}
export interface Bar {
  base: number;
  len: number;
  w: number;
  ang: number;
  spd: number;
}
export interface MapState {
  id: MapId;
  pillars: Circle[];
  bumpers: Circle[];
  portals: Portal[];
  bar: Bar | null;
  spikes: boolean;
  /** Obstacle opacity; obstacles stop colliding below 0.5 once the arena shrinks. */
  obsA: number;
}

export interface RoundState {
  mode: Mode;
  W: number;
  H: number;
  tick: number;
  phase: Phase;
  count: number;
  time: number;
  ins: number;
  shrinkWarned: boolean;
  botLevel: number;
  rng: Rng;
  map: MapState;
  f: Fighter[];
  arrows: Projectile[];
  zones: Zone[];
  mines: Mine[];
  drops: Drop[];
  pups: Pickup[];
  pupAt: number[];
  fx: boolean;
  result: RoundResult | null;
}

export interface RoundResult {
  winner: 0 | 1;
  /** Remaining hp and revive flag per fighter id. */
  fighters: { hp: number; maxHp: number; revived: boolean }[];
  surrender: boolean;
}

export type Input =
  | { t: 'boost'; fid: number; x: number; y: number }
  | { t: 'ability'; fid: number }
  | { t: 'surrender'; team: 0 | 1 };
