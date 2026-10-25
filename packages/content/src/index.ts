import engine from './engine.json';
import gamedata from './gamedata.json';

/** Content and economy data extracted from the prototype. */
export type GameData = typeof gamedata;
/** Engine rules and per-ability numbers that were inline in the prototype. */
export type EngineData = typeof engine;
export type ClassKey = keyof GameData['CLASSES'];
export type ClassDef = GameData['CLASSES'][ClassKey];

/** Everything the simulation needs. Server remote config may replace any part of it. */
export interface Balance {
  game: GameData;
  engine: EngineData;
}

export const defaultGameData: GameData = gamedata;
export const defaultEngineData: EngineData = engine;
export const defaultBalance: Balance = { game: gamedata, engine };

export const CLASS_KEYS = Object.keys(gamedata.CLASSES) as ClassKey[];

/** Deep-merge a partial override onto the defaults (arrays are replaced, objects merged). */
export function mergeBalance(base: unknown, over: unknown): unknown {
  if (over === undefined) return base;
  if (Array.isArray(over) || typeof over !== 'object' || over === null) return over;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(over)) out[k] = mergeBalance(out[k], v);
  return out;
}
