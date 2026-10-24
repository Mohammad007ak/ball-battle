import gamedata from './gamedata.json';

/** Balance data extracted from the prototype. Server remote config may override it. */
export type GameData = typeof gamedata;
export type ClassKey = keyof GameData['CLASSES'];

export const defaultGameData: GameData = gamedata;
