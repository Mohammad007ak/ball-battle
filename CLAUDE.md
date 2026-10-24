# CLAUDE.md — Chakachak (چکاچک)

Real-time mobile PvP game: every character is a bouncing ball; players tap to boost their ball and trigger one special ability. Clash Royale–style progression (chests → cards → upgrades → trophies/leagues). Persian (RTL) first.

## Source of truth
- `prototype/ball-battle.html` — complete single-file playable prototype. **It is the reference for game feel, visuals, animation timing, audio and every number.** When unsure how something should look or behave, read the matching function there and port it faithfully. Do not "improve" game design silently.
- `docs/GDD.md` — game design document (Persian). Rules, modes, economy, content tables.
- `docs/gamedata.json` — machine-readable numbers extracted from the prototype (characters, abilities, chests, skins, leagues, constants).
- `docs/PROMPTS.md` — the phased build plan. Work one phase at a time.

### Where things live in the prototype
| Area | Prototype symbols |
|---|---|
| Content & numbers | `CLASSES`, `RAR`, `CHESTS`, `CYCLE`, `SHOP`, `UPCOST`, `AB_REQ`, `SKINS`, `MAPS`, `LEAGUES`, `ARENAS`, `PUPS` |
| Simulation | `makeFighter`, `update`, `contact`, `hurt`, `useAbility` (switch on `cls+index`), `fire`, `explode`, `mapPhysics`, `botThink`, `endMatch` |
| Rendering | `drawBall` (+ `pattern`, `backFeat`, `frontFeat`, `face`, `PART`, `skinPat`), `draw`, `drawProjectile`, `drawZone`, `drawAura`, `paintArena`, `drawChest` |
| Finishers | `FIN` table, `startFinish`, `finUpdate`, `drawFin`, `drawFinOverlay` |
| Emotes | `EMOTES`, `emoteFace`, `drawEmote` |
| Audio | `SFX` (procedural Web Audio), `TRACKS`, `musicFor` |
| Economy/UI | `rollChest`, `applyItems`, `slotTap`, `skipCost`, `dailySkins`, `renderCards`, chest opening scene (`showChest`, `chRender`) |
| Modes | 1v1 best-of-3 (`startMatch`, `showReveal`, `showPick`, `choose`), 2v2 (`startMatch2`, `showPick2`, `choose2`) |

## Architecture (target)
Monorepo, TypeScript everywhere, pnpm workspaces.

```
packages/engine/    Pure simulation. No DOM, no rendering, no network. Shared by client and server.
packages/content/   Data: balance.json, characters, abilities, skins, chests, leagues, i18n strings (fa).
apps/client/        Vite + TS + Canvas 2D (PixiJS only if profiling demands it). Rendering, UI, audio, input.
                    Packaged with Capacitor (Android first; iOS later) and as a PWA.
apps/server/        Node + Colyseus (rooms/matchmaking) + SQLite (Drizzle, WAL, file on persistent volume). No separate DB/Redis.
apps/admin/         (later) Live-ops panel: remote config, daily shop, player support.
tools/sim/          Headless balance simulator + auto-tuner (port of the prototype's).
```

## Non-negotiable rules
1. **Server is authoritative.** Economy (coins, gems, cards, chests, timers, skins, trophies) is computed and stored only on the server. The client never grants itself anything; it only renders server state.
2. **Online matches are server-simulated.** The server runs `engine`; clients send inputs (`boost(x,y)`, `ability`, `emote`) and render interpolated snapshots. The server decides the result. Add ~100 ms input delay masked by a wind-up animation; support reconnect into a running match.
3. **Engine is deterministic and pure.** Fixed timestep 1/60 s. No `Math.random` (use a seeded PRNG passed into the match), no `Date.now`/`performance.now`, no DOM. Same seed + same inputs ⇒ same state hash. Rendering-only randomness (particles, shake) stays in the client.
4. **Data-driven content.** All balance numbers live in `packages/content` and can be overridden by server remote config without an app update. No magic numbers for balance inside engine code.
5. **Balance gate.** Any change to characters/abilities/numbers must run the simulator; every character and every ability must stay within 45–55% win rate (round-robin, all maps). CI runs a fast version.
6. **No copyrighted/trademarked characters or names** (no Kratos, Batman, Sonic, "Clash", "Royale"…). Use Persian mythology, public-domain figures and original archetypes.
7. **No gambling, no cash-out.** Currencies cannot be converted to money. Show drop odds for every chest before purchase/opening.
8. **Persian RTL first.** All UI strings go through i18n (`fa` default). Use Persian digits in UI. Self-host fonts (Lalezar, Vazirmatn) — **no Google Fonts or foreign CDNs at runtime** (Iranian networks can block them). Same for any third-party script.
9. Hosting targets servers inside Iran (e.g. ArvanCloud). Assume unreliable international connectivity.

## Conventions
- TypeScript `strict`. ESLint + Prettier. Small focused modules; no file over ~400 lines.
- Tests with Vitest. Engine: unit tests per ability + determinism test. Server: economy and IAP tests. Client: smoke tests of screens via Playwright.
- Validate every client message on the server (schema, rate limits, ownership).
- IAP purchases (Cafe Bazaar Poolakey, Myket) are verified server-side before granting gems.
- Keep `docs/GDD.md` in sync when design changes; note the change in the PR description.

## Workflow
- Work in the phase order of `docs/PROMPTS.md`. Plan first (list files, interfaces, risks), wait for approval on big changes, then implement in small commits.
- Port from the prototype instead of reinventing; keep visual parity (compare screenshots against the prototype).
- When a number in the prototype looks wrong, ask — do not change it.

## Commands
```
pnpm install        # install all workspaces
pnpm dev:client     # Vite dev server for apps/client
pnpm dev:server     # (Phase 4) API + Colyseus
pnpm test           # Vitest, all packages
pnpm typecheck      # tsc -b (project references)
pnpm lint           # ESLint (engine purity rules included)
pnpm format         # Prettier
pnpm sim            # (Phase 2) balance simulator
```
Android build commands are added in Phase 6.
