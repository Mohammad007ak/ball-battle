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
