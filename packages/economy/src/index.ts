import { CLASS_KEYS, type Balance, type ClassKey } from '@chakachak/content';

/**
 * Pure economy rules, ported from the prototype (`rollChest`, `applyItems`, `slotTap`, upgrades,
 * shop, `finishMatch`). The server is the only caller that persists results; the offline client
 * runs the same functions behind its local fake backend. `now` (ms) and `rand` are injected.
 */

export type Rand = () => number;

export interface ChestSlot {
  tier: number;
  /** Unlock finish time in ms, or null while still locked. */
  end: number | null;
}

/** Same shape as the prototype's saved state `S`. */
export interface Profile {
  coins: number;
  gems: number;
  trophies: number;
  wins: number;
  losses: number;
  team: ClassKey[];
  lv: Record<ClassKey, number>;
  cards: Record<ClassKey, number>;
  ab: Record<ClassKey, number>;
  skins: Partial<Record<ClassKey, string[]>>;
  skin: Partial<Record<ClassKey, string>>;
  cycle: number;
  slots: (ChestSlot | null)[];
  mode: '1v1' | '2v2';
}

export type Item =
  | { type: 'coins'; n: number }
  | { type: 'gems'; n: number }
  | { type: 'card'; k: ClassKey; n: number; isNew?: boolean }
  | { type: 'skin'; k: ClassKey; st: string };

export class EconomyError extends Error {
  constructor(
    public code: string,
    public need?: number,
  ) {
    super(code);
  }
}
const fail = (code: string, need?: number): never => {
  throw new EconomyError(code, need);
};

export function freshProfile(B: Balance): Profile {
  const F = B.game.fresh;
  const rec = (v: (k: ClassKey) => number) =>
    Object.fromEntries(CLASS_KEYS.map((k) => [k, v(k)])) as Record<ClassKey, number>;
  return {
    coins: F.coins,
    gems: F.gems,
    trophies: 0,
    wins: 0,
    losses: 0,
    team: [...(B.game.STARTERS as ClassKey[])],
    lv: rec((k) => ((B.game.STARTERS as string[]).includes(k) ? 1 : 0)),
    cards: rec(() => 0),
    ab: rec(() => 0),
    skins: {},
    skin: {},
    cycle: 0,
    slots: F.slots.map((s) => (s ? { tier: s.tier, end: null } : null)),
    mode: '1v1',
  };
}

/** Repair a stored profile (prototype `fixState` + `validateSkins`). */
export function fixProfile(B: Balance, raw: Partial<Profile>): Profile {
  const d = freshProfile(B),
    S: Profile = { ...d, ...raw };
  S.lv = { ...d.lv, ...raw.lv };
  S.cards = { ...d.cards, ...raw.cards };
  S.ab = { ...d.ab, ...raw.ab };
  if (!Array.isArray(S.slots) || S.slots.length !== 4) S.slots = d.slots;
  S.team = (Array.isArray(S.team) ? S.team : [])
    .filter((k, i, a) => B.game.CLASSES[k] && S.lv[k] && a.indexOf(k) === i)
    .slice(0, 2);
  for (const k of CLASS_KEYS) {
    if (S.team.length >= 2) break;
    if (S.lv[k] && !S.team.includes(k)) S.team.push(k);
  }
  for (const k of CLASS_KEYS) {
    if (S.ab[k] && S.lv[k] < B.game.AB_REQ[S.ab[k]]!) S.ab[k] = 0;
    if (S.lv[k] > B.game.MAXLVL) S.lv[k] = B.game.MAXLVL;
  }
  const skins = B.game.SKINS as Record<string, { k: string }>;
  for (const k of Object.keys(S.skins) as ClassKey[])
    S.skins[k] = (S.skins[k] || []).filter((id) => skins[id]?.k === k);
  for (const k of Object.keys(S.skin) as ClassKey[])
    if (S.skin[k] && !(S.skins[k] || []).includes(S.skin[k]!)) S.skin[k] = '';
  if (S.mode !== '2v2') S.mode = '1v1';
  return S;
}

export const leagueOf = (B: Balance, t: number) => {
  let i = 0;
  B.game.LEAGUES.forEach((l, k) => {
    if (t >= l.min) i = k;
  });
  return i;
};

export function skinsOf(B: Balance, k: ClassKey): string[] {
  return Object.entries(B.game.SKINS as Record<string, { k: string }>)
    .filter(([, s]) => s.k === k)
    .map(([id]) => id);
}

export const needFor = (B: Balance, S: Profile, k: ClassKey) => {
  const l = S.lv[k];
  return l > 0 && l < B.game.MAXLVL ? B.game.RAR[B.game.CLASSES[k].rar as 'common'].need[l]! : 0;
};
export const canUpgrade = (B: Balance, S: Profile, k: ClassKey) => {
  const l = S.lv[k];
  return (
    l > 0 && l < B.game.MAXLVL && S.cards[k] >= needFor(B, S, k) && S.coins >= B.game.UPCOST[l]!
  );
};

export type SlotState = 'empty' | 'locked' | 'unlocking' | 'ready';
export function slotState(s: ChestSlot | null, now: number): SlotState {
  if (!s) return 'empty';
  if (s.end == null) return 'locked';
  return now >= s.end ? 'ready' : 'unlocking';
}
/** Gems to finish an unlocking chest now: 1 per `ECON.skipSecPerGem` seconds left, at least 1. */
export const skipCost = (B: Balance, s: ChestSlot, now: number) =>
  Math.max(1, Math.ceil((s.end! - now) / 1000 / B.game.ECON.skipSecPerGem));

function pickW(B: Balance, arr: ClassKey[], rand: Rand): ClassKey {
  const w = arr.map((k) => B.game.RAR[B.game.CLASSES[k].rar as 'common'].w);
  let r = rand() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < arr.length; i++) {
    r -= w[i]!;
    if (r <= 0) return arr[i]!;
  }
  return arr[arr.length - 1]!;
}

export function rollChest(B: Balance, S: Profile, tier: number, rand: Rand): Item[] {
  const G = B.game,
    T = G.CHESTS[tier]!,
    lm = 1 + B.game.ECON.leagueBonus * leagueOf(B, S.trophies),
    items: Item[] = [];
  items.push({
    type: 'coins',
    n: Math.round((T.coins[0]! + rand() * (T.coins[1]! - T.coins[0]!)) * lm),
  });
  const gn = Math.round(T.gems[0]! + rand() * (T.gems[1]! - T.gems[0]!));
  if (gn > 0) items.push({ type: 'gems', n: gn });
  const locked = CLASS_KEYS.filter((k) => !S.lv[k]),
    owned = CLASS_KEYS.filter((k) => S.lv[k]),
    used = new Set<ClassKey>();
  let stacks = T.stacks;
  if (locked.length && rand() < T.newP) {
    const k = pickW(B, locked, rand);
    items.push({ type: 'card', k, n: 1, isNew: true });
    used.add(k);
    stacks--;
  }
  const total = Math.round(T.cards * lm),
    shares = Array.from({ length: stacks }, () => 0.4 + rand()),
    sum = shares.reduce((a, b) => a + b, 0);
  for (let i = 0; i < stacks; i++) {
    let pool = owned.filter((k) => !used.has(k));
    if ('epic' in T && T.epic && i === 0) {
      const hi = pool.filter((k) => ['epic', 'legendary'].includes(G.CLASSES[k].rar));
      if (hi.length) pool = hi;
    }
    if (!pool.length) break;
    const k = pickW(B, pool, rand);
    used.add(k);
    items.push({
      type: 'card',
      k,
      n: Math.max(
        1,
        Math.round((total * shares[i]!) / sum / G.RAR[G.CLASSES[k].rar as 'common'].div),
      ),
    });
  }
  if (rand() < T.skinP) {
    const cand: [ClassKey, string][] = [];
    owned.forEach((k) =>
      skinsOf(B, k).forEach((st) => {
        if (!(S.skins[k] || []).includes(st)) cand.push([k, st]);
      }),
    );
    if (cand.length) {
      const [k, st] = cand[Math.floor(rand() * cand.length)]!;
      items.push({ type: 'skin', k, st });
    }
  }
  return items;
}

/** Drop odds shown before opening/buying (CLAUDE.md rule 7). */
export function chestOdds(B: Balance, tier: number) {
  const T = B.game.CHESTS[tier]!;
  return {
    coins: T.coins,
    gems: T.gems,
    cards: T.cards,
    stacks: T.stacks,
    newCard: T.newP,
    skin: T.skinP,
  };
}

export function applyItems(S: Profile, items: Item[]) {
  for (const it of items) {
    if (it.type === 'coins') S.coins += it.n;
    else if (it.type === 'gems') S.gems += it.n;
    else if (it.type === 'skin') {
      const own = (S.skins[it.k] ||= []);
      if (!own.includes(it.st)) own.push(it.st);
    } else if (it.isNew) S.lv[it.k] = Math.max(1, S.lv[it.k]);
    else S.cards[it.k] += it.n;
  }
}

/* ---------- actions: each mutates S in place and returns what the UI needs ---------- */

export function unlockSlot(B: Balance, S: Profile, i: number, now: number) {
  const s = S.slots[i] ?? null;
  if (slotState(s, now) !== 'locked') fail('notLocked');
  if (S.slots.some((x) => slotState(x, now) === 'unlocking')) fail('oneAtATime');
  s!.end = now + B.game.CHESTS[s!.tier]!.sec * 1000;
}

/** Open a ready chest, or an unlocking one by paying gems. */
export function openSlot(B: Balance, S: Profile, i: number, now: number, rand: Rand) {
  const s = S.slots[i] ?? null,
    st = slotState(s, now);
  if (st === 'unlocking') {
    const c = skipCost(B, s!, now);
    if (S.gems < c) fail('gems', c);
    S.gems -= c;
  } else if (st !== 'ready') fail('notReady');
  S.slots[i] = null;
  const items = rollChest(B, S, s!.tier, rand);
  applyItems(S, items);
  return { tier: s!.tier, items };
}

export function buyChest(B: Balance, S: Profile, tier: number, rand: Rand) {
  const o = B.game.SHOP.find((x) => x.tier === tier) ?? fail('noOffer');
  if (S.gems < o.price) fail('gems', o.price);
  S.gems -= o.price;
  const items = rollChest(B, S, tier, rand);
  applyItems(S, items);
  return { tier, items };
}

/** Three daily skins, the same for everyone on a given day (prototype `dailySkins`). */
export function dailySkins(B: Balance, dayKey: number): [ClassKey, string][] {
  let x = dayKey;
  const rand = () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
  for (let i = 0; i < 5; i++) rand();
  const all: [ClassKey, string][] = [];
  CLASS_KEYS.forEach((k) => skinsOf(B, k).forEach((st) => all.push([k, st])));
  const out: [ClassKey, string][] = [];
  while (out.length < 3) {
    const q = all[Math.floor(rand() * all.length)]!;
    if (!out.some((o) => o[0] === q[0])) out.push(q);
  }
  return out;
}

export function buySkin(B: Balance, S: Profile, k: ClassKey, st: string, dayKey: number) {
  if (!dailySkins(B, dayKey).some(([a, b]) => a === k && b === st)) fail('notOffered');
  const own = (S.skins[k] ||= []);
  if (own.includes(st)) fail('owned');
  const price = (B.game.SKINS as Record<string, { price: number }>)[st]!.price;
  if (S.gems < price) fail('gems', price);
  S.gems -= price;
  own.push(st);
  if (S.lv[k]) S.skin[k] = st;
}

export function upgrade(B: Balance, S: Profile, k: ClassKey) {
  if (!canUpgrade(B, S, k)) fail('cannotUpgrade');
  const l = S.lv[k];
  S.coins -= B.game.UPCOST[l]!;
  S.cards[k] -= needFor(B, S, k);
  S.lv[k] = l + 1;
  return { level: l + 1, newAbility: B.game.AB_REQ.indexOf(l + 1) };
}

export function setAbility(B: Balance, S: Profile, k: ClassKey, ab: number) {
  if (!S.lv[k] || ab < 0 || ab > 2 || S.lv[k] < B.game.AB_REQ[ab]!) fail('abilityLocked');
  S.ab[k] = ab;
}

export function equipSkin(S: Profile, k: ClassKey, st: string) {
  if (!S.lv[k] || (st && !(S.skins[k] || []).includes(st))) fail('skinLocked');
  S.skin[k] = st;
}

export function setTeam(S: Profile, i: number, k: ClassKey) {
  if (!S.lv[k] || (i !== 0 && i !== 1)) fail('badTeam');
  const j = S.team.indexOf(k);
  if (j === i) return;
  if (j >= 0) S.team[j] = S.team[i]!;
  S.team[i] = k;
}

/** Trophies and chest for a finished match (prototype `finishMatch`). */
export function matchResult(B: Balance, S: Profile, win: boolean, mode: '1v1' | '2v2') {
  const before = leagueOf(B, S.trophies);
  let dt: number;
  if (win) {
    dt = 30;
    S.wins++;
  } else {
    dt = -Math.min(20, S.trophies);
    S.losses++;
  }
  if (mode === '2v2') dt = 0;
  S.trophies += dt;
  // Only wins give a chest (GDD §2), from the fixed cycle, into the first free slot.
  let tier = -1,
    slot = -1;
  if (win || B.game.ECON.lossChest) {
    tier = B.game.CYCLE[S.cycle % B.game.CYCLE.length]!;
    S.cycle++;
    slot = S.slots.findIndex((s) => !s);
    if (slot >= 0) S.slots[slot] = { tier, end: null };
  }
  return { trophies: dt, tier, slot, before, after: leagueOf(B, S.trophies) };
}

export * from './match';
export * from './actions';
