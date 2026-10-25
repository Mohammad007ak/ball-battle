# Handoff — start of Phase 6 (Android app)

Read `CLAUDE.md` first (rules + commands), then this file. Everything below is already on branch
`claude/eager-babbage-7fp06u` (pushed). `docs/ARCHITECTURE.md` §9–§12 has per-phase details.

## State (phases 0–5 done)
| Area | Where | Status |
|---|---|---|
| Engine (deterministic, 21 chars, 63 abilities, 6 maps, bot with trophy-based skill, replay) | `packages/engine` | done, tested |
| Content/balance data (incl. engine numbers, 10 leagues, ECON) | `packages/content/src/*.json` (keep `docs/gamedata.json` in sync) | done |
| Economy rules (chests, upgrades, shop, match setup/finish) | `packages/economy` | done, tested |
| Protocol (zod schemas, online snapshots) | `packages/protocol` | done |
| Client (Vite; prototype UI/art ported as shared-scope JS in `src/legacy/*.js`, concatenated by a Vite plugin) | `apps/client` | done; offline + server mode |
| Server (Fastify + node:sqlite, guest accounts + optional OTP phone link, `/v1/act` with ledger/idempotency, replay-verified bot matches, online 1v1 over `/v1/ws`) | `apps/server` | done, tested; **not yet deployed** |
| Tools | `tools/sim` (balance + progression sims), `tools/loadtest`, `tools/art/cut.py` | done |
| Generated art (chests, icons, 5 league badges, 6/10 arenas, menu bg, splash) | sources `assets/art-src`, output `apps/client/public/art` (≈6 MB) | done |

Tests: `pnpm test` (116 green), `pnpm typecheck`, `pnpm lint`, `pnpm sim --full --check` (balance gate) all pass.

## Decisions already made by the user (do not re-ask)
- **Android only.** No web app / PWA release. iOS later, maybe.
- Stores: **Cafe Bazaar** (Poolakey) and **Myket**. The user has developer accounts on both.
- Hosting: **Hamravesh** (Docker PaaS). One server instance, SQLite on a persistent disk at `/data`. Deploy guide: `docs/DEPLOY.md`.
- Most of the game runs on the phone; the server only does what must be secure (accounts, profile, economy, match verification, online PvP).
- Login is **not** required: guest account on first launch; "save progress with phone number" is offered in settings (Clash Royale style).
- Losing gives no chest. Chests unlock in 15 min / 3 h / 8 h / 12 h / 24 h; progression is paced over months (`tools/sim/src/progress.ts` + test).
- 10 leagues = real places in Iran from lowest (Caspian shore −28 m) to highest (Damavand 5609 m); data-driven so more can be added later.
- **Online 2v2 is postponed** (2v2 currently runs offline vs bots).
- **APK/AAB size target: 40–60 MB.** The user feels a smaller game looks "fake". Reach it with real content, not padding (see below).

## Phase 6 tasks (from `docs/PROMPTS.md`, adjusted)
1. **Capacitor Android project** in `apps/client` (`@capacitor/core`, `@capacitor/android`): app id (suggest `ir.chakachak.game`, confirm with user), name «چکاچک», icon from `assets/icon/app-icon.png` (adaptive icon), splash from `apps/client/public/art/splash.webp`, portrait lock, keep screen on during matches, Android back button (close sheet/modal → leave match with confirm → exit), haptics on hits and finisher. Build with `VITE_API_URL` pointing at the production server.
2. **Payments behind one interface** (`apps/client/src/net/` + server): Bazaar Poolakey and Myket in-app billing for gem packs; server-side purchase verification before granting gems (`purchases` table: unique purchase token, idempotent grant, ledger reason `iap`); consume after grant. Gem pack prices/amounts from remote config (`/v1/config`). `gem-bag.webp` art exists for the shop. Two build flavours (bazaar / myket) since each store needs its own billing library.
3. **Shop UI**: gem packs section in the cards → shop tab (legacy `07-cards-tab.js`); purchase flow with loading/error/success.
4. **Analytics without foreign services**: server endpoint + table for events (session start, match, chest open, purchase, retention D1/D7/D30).
5. **Crash/error reporting** to our own server (global error handlers in the WebView + native crash if feasible).
6. **Size 40–60 MB with real content**, e.g.: replace procedural Web Audio music/SFX with high-quality OGG/MP3 files (biggest legit lever), ship arena/chest art at higher resolution (ask the user for single 1024² chest images and the remaining 4 arenas: Persepolis, Tochal, Sabalan, Damavand — prompts were given earlier, see `assets/art-src` naming), add a store-feature/intro video only if the user wants. Measure with the release AAB.
7. **Release**: signed AAB + APK, `docs/RELEASE.md` (keystore handling, Bazaar and Myket listing steps, screenshots, age rating, privacy policy link, chest-odds disclosure).

## Phase 6 progress
- [x] 1. Capacitor 8 Android project (`apps/client/android`, `capacitor.config.ts`): id `ir.chakachak.game`
  (**not yet confirmed by the user**), icons/splash (`tools/art/android.py`), portrait, keep-awake in
  matches, back button (`src/legacy/22-back.js`), haptics (`src/native.ts`, bridge `CK.N`), store
  flavours `bazaar`/`myket` (`BuildConfig.STORE`), release signing from `keystore.properties`.
  Debug APK builds (≈25 MB); not yet run on a real device.
- [x] 4. Analytics: `events` table, `POST /v1/events`, `retention()` (D1/D7/D30) in
  `apps/server/src/telemetry.ts`; client `src/telemetry.ts` (`CK.T.track`): session_start, match, chest_open.
- [x] 5. Error reports: `errors` table, `POST /v1/errors` (no login needed); WebView global handlers;
  native crashes saved by `MainActivity` and sent on next launch.
- [x] Device feedback round (Galaxy A32, server on Hamravesh `https://chakachak.darkube.ir`):
  adaptive render quality (`src/quality.ts`), portrait 2:3 arena 300×450 / 400×600
  (`rules.aspect`, re-tuned balance), painted arenas (arena photos unused), menu backdrop removed,
  loading screen with logo + progress (`src/boot.ts`), starter chest of 2 random commons,
  phone login hidden without SMS, startup hardening.
- [x] Online netcode reworked: the server relays inputs with their apply tick (on arrival, ~6 ticks
  early), a tick clock (`tk`, 30/s) and the full state once a second; phones run the same engine
  locally (`21-online.js`: confirmed state C + presented state P, rebuild + smoothing on mismatch).
  Engine uses `dmath.ts` (fdlibm sin/cos/atan2, sqrt hypot) so Node and WebView are bit-identical
  (lint forbids Math.sin & co. in the engine). Bot fallback runs locally (`noOpponent`).
  ~0.8 KB/s per player. Own taps show after RTT + 100 ms input delay (own-input prediction = later).
- [ ] 2. IAP (Poolakey / Myket native plugins + server verification), 3. shop UI, 6. size, 7. release
  (`docs/RELEASE.md` started). App id `ir.chakachak.game` still unconfirmed; gem pack prices unknown.
- Sandbox note: Maven Central returned 429 here; a local `~/.gradle/init.d` mirror script was used (not in repo).

## Things to know
- `apps/client/src/legacy/*.js` is the prototype's UI, loaded as one module (`vite.config.ts` plugin). It is not type-checked or linted on purpose; new logic goes in typed TS modules (`src/net`, `src/art.ts`, …) and is reached from legacy code via the `CK` bridge (`src/bridge.ts`).
- Backend choice in `src/main.ts`: `VITE_API_URL` set → `HttpBackend` (real server, auto guest login), unset → `LocalBackend` (offline fake server with test tools). Online 1v1 is used automatically with a real server.
- `?speed=8` fast-forwards offline matches (dev only).
- Not yet verified on real devices: 60 fps on low-end Android, two phones on Iranian mobile internet, Docker image build (no Docker daemon in the previous environment), Kavenegar SMS.
- The user writes in Persian; answer in Persian, keep explanations short.
