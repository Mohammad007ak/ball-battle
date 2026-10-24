# معماری چکاچک

> مرحلهٔ ۱ از `docs/PROMPTS.md`. این سند نقشه است؛ هر تغییر بزرگ اول اینجا ثبت می‌شود.
> میزبانی: **همروش (Hamravesh)** — PaaS ایرانی مبتنی بر کانتینر/Docker.
> دیتابیس: **SQLite** داخل همان سرویس سرور (فایل روی دیسک ماندگار)؛ بدون دیتابیس یا Redis جدا.

---

## ۱. ساختار مونوریپو

```
packages/engine/    شبیه‌سازی خالص و قطعی (بدون DOM، شبکه، زمان واقعی). مشترک کلاینت و سرور.
packages/content/   داده‌ها: balance (از docs/gamedata.json)، شخصیت‌ها، قابلیت‌ها، اسکین‌ها، صندوقچه‌ها، لیگ‌ها، رشته‌های fa.
packages/protocol/  تایپ‌ها و schemaهای پیام‌های شبکه (zod) — مشترک کلاینت و سرور.
packages/economy/   منطق خالص اقتصاد (rollChest، هزینهٔ ارتقا، چرخهٔ صندوقچه، skipCost) — سرور اجرا می‌کند، کلاینت فقط برای نمایش احتمال‌ها.
apps/client/        Vite + TS + Canvas 2D. رندر، UI، صدا، ورودی. Capacitor (اندروید) + PWA.
apps/server/        Node + Colyseus (اتاق‌ها/صف) + HTTP API (Fastify) + SQLite (Drizzle روی better-sqlite3، حالت WAL).
apps/admin/         (مرحلهٔ ۷) پنل مدیریت.
tools/sim/          شبیه‌ساز بالانس و تنظیم‌کنندهٔ خودکار (CLI).
tools/loadtest/     (مرحلهٔ ۵) تست بار ۲۰۰ مسابقهٔ هم‌زمان.
```

قانون وابستگی (ESLint بررسی می‌کند):
`engine → content` · `economy → content` · `client → engine, content, economy, protocol` · `server → همه` · `engine` هرگز به `client`/`server` وابسته نیست.

دو پکیج `protocol` و `economy` به پیشنهاد CLAUDE.md اضافه شده‌اند تا منطق اقتصاد و قرارداد پیام‌ها یک منبع داشته باشند.

---

## ۲. موتور (`packages/engine`)

### ۲.۱ چالش اصلی پورت
در prototype شبیه‌سازی و افکت در هم تنیده‌اند:
- `Math.random` حدود ۶۷ بار (هم در منطق، هم در ذرات).
- `later()` روی `setTimeout` (۱۷ مورد) — باید به **تایمرهای تیک‌محور** داخل وضعیت تبدیل شود.
- `burst`, `ring`, `sfx`, `banner`, `addText`, `G.shake` وسط منطق صدا زده می‌شوند — در موتور به **رویداد** تبدیل می‌شوند و کلاینت آن‌ها را به ذره/صدا ترجمه می‌کند.
- ارجاع مستقیم به اشیا (`charmBy`, `owner`, `b: e`) — در موتور با **id عددی** جایگزین می‌شود تا snapshot قابل سریال‌سازی باشد.
- `update()` بیش از ۱۴۰ خط و `useAbility` یک switch بزرگ است — به ماژول‌ها شکسته می‌شود: `physics`, `contact`, `status`, `abilities/<class>.ts`, `projectiles`, `zones`, `maps`, `pickups`, `bot`.

### ۲.۲ رابط عمومی

```ts
interface MatchConfig {
  seed: number;
  mode: '1v1' | '2v2';
  mapId: string;                 // انتخاب زمین را لایهٔ مسابقه (چرخ) انجام می‌دهد
  fighters: FighterSpec[];       // { id, team, cls, lvl, ab, skin, hp? }  hp برای ادامهٔ راند قبل
  balance: Balance;              // از packages/content یا remote config
}

type Input =
  | { t: 'boost'; fid: number; x: number; y: number }
  | { t: 'ability'; fid: number }
  | { t: 'surrender'; team: number };

function createRound(cfg: MatchConfig): RoundState;
function step(s: RoundState, inputs: Input[]): StepResult;   // دقیقاً 1/60 ثانیه
interface StepResult { events: GameEvent[]; ended?: RoundResult }
function snapshot(s: RoundState): Snapshot;                  // کمینه، برای شبکه و رندر
function hashState(s: RoundState): string;                   // برای تست قطعیت و ضدتقلب
function botInputs(s: RoundState, fid: number, rng: Rng): Input[]; // هوش ربات، با PRNG جدا
```

- `RoundState` داده خالص است (JSON-پذیر)، و PRNG (`mulberry32`/`sfc32`) وضعیتش داخل آن است.
- `GameEvent`: `hit`, `ability`, `projectile`, `explode`, `wall`, `pickup`, `shrinkStart`, `death`, `revive`, … — کلاینت از روی آن‌ها ذره، لرزش، عدد آسیب و `SFX` می‌سازد. روی سرور فقط دور ریخته می‌شوند.
- **فینیشر و ایموت در موتور نیستند**؛ نمایشی‌اند و کامل در کلاینت اجرا می‌شوند (نتیجه پیش از فینیشر قطعی است).
- لایهٔ «مسابقه» (`match.ts`): بهترین از ۳، چرخ زمین (بدون تکرار پشت سر هم)، انتقال جان برنده، حالت ۲ در ۲. این لایه هم خالص است تا سرور و حالت آفلاین یکی باشند.

### ۲.۳ قطعیت
- گام ثابت 1/60؛ کلاینت با accumulator اجرا می‌کند.
- ممنوع در `engine` (قانون ESLint): `Math.random`, `Date`, `performance`, `setTimeout`, `window`, `document`.
- `Math.sin/cos/atan2/hypot` در V8 روی یک پلتفرم قطعی‌اند؛ چون شبیه‌سازی معتبر فقط روی سرور اجرا می‌شود، اختلاف جزئی موبایل مشکلی ایجاد نمی‌کند (کلاینت حدس نمی‌زند، snapshot می‌گیرد). اگر بعداً replay روی کلاینت لازم شد، به ریاضی fixed/جدول‌محور می‌رویم.
- تست: یک seed + یک توالی ورودی، دو اجرا، `hashState` یکسان در هر ۶۰ تیک.

---

## ۳. مدل داده‌های سرور (SQLite + Drizzle)

| جدول | ستون‌های اصلی |
|---|---|
| `players` | id (text uuid), phone (unique, hashed + encrypted), name, trophies, best_trophies, coins, gems, team (json: [cls, cls]), created_at, deleted_at |
| `sessions` | id, player_id, token_hash, device, expires_at |
| `otp_codes` | phone_hash, code_hash, attempts, expires_at |
| `player_cards` | player_id, cls, level, cards, ability (0..2) — PK (player_id, cls) |
| `player_skins` | player_id, skin_id, equipped |
| `chest_slots` | player_id, slot (0..3), tier, unlock_started_at, unlock_ends_at |
| `chest_cycle` | player_id, index |
| `ledger` | id, player_id, currency (coins/gems/cards:<cls>/trophies), delta, balance_after, reason, ref_type, ref_id, idempotency_key (unique), created_at |
| `purchases` | id, player_id, store (bazaar/myket), sku, purchase_token (unique), state, verified_at |
| `matches` | id, mode, seed, players (json), inputs (blob، فشرده), result, trophies_delta, created_at |
| `remote_config` | version, json, active, created_at |
| `daily_shop` | date, items (json) |
| `analytics_events` | id, player_id, type, props (json), at (پاک‌سازی دوره‌ای / آرشیو ماهانه) |

قوانین:
- **هر تغییر ارز فقط از تابع `applyLedger(tx, entries)`** در یک تراکنش `BEGIN IMMEDIATE` (SQLite نوشتن‌ها را سریالی می‌کند، پس قفل ردیف لازم نیست)؛ CHECK روی موجودی غیرمنفی؛ `idempotency_key` از کلاینت برای هر عملیات.
- باز کردن صندوقچه: `UPDATE chest_slots … WHERE … AND tier IS NOT NULL RETURNING` اتمی؛ درخواست دوم چیزی برنمی‌گرداند.
- نتیجهٔ `rollChest` با PRNG سرور (crypto) و ثبت در ledger.
- بدون Redis: صف matchmaking، rate limit، کش remote config و presence اتاق‌ها در حافظهٔ همان پروسه (یک نمونهٔ سرور).
- پشتیبان‌گیری: `VACUUM INTO` / backup API هر چند ساعت به فضای ذخیره‌سازی ابری (S3-سازگار همروش/آروان) + نگه‌داری چند نسخه.

### API (HTTP, JSON, `/v1`)
`POST /auth/otp` · `POST /auth/verify` · `DELETE /account` · `GET /me` · `POST /team` · `POST /cards/:cls/upgrade` · `POST /cards/:cls/ability` · `POST /chests/:slot/unlock` · `POST /chests/:slot/open` · `POST /chests/:slot/skip` · `POST /shop/chest/:tier` · `GET /shop/daily` · `POST /shop/skin/:id` · `POST /iap/verify` · `GET /config`.
همه با schema (zod)، احراز توکن، و rate limit.

---

## ۴. پروتکل مسابقهٔ آنلاین (Colyseus، WebSocket)

- سرور `engine` را با ۶۰ تیک در ثانیه اجرا می‌کند؛ **۲۰ snapshot در ثانیه** (هر ۳ تیک) با پیام باینری سفارشی (نه Schema خودکار Colyseus، برای کنترل حجم): موقعیت/سرعت کوانتیزه‌شده (int16)، hp، تایمرهای نمایشی، پرتابه‌ها/زون‌ها/مین‌ها، و رویدادهای این بازه.
- کلاینت ← سرور:
  - `in {seq, t:'boost', x, y}` · `in {seq, t:'ability'}` · `emote {k}` · `pick {i}` (انتخاب شخصیت) · `surrender` · `finGo`
  - `seq` افزایشی؛ سرور ورودی تکراری/قدیمی را دور می‌ریزد؛ حداکثر ۱۰ ورودی در ثانیه.
- سرور ← کلاینت: `phase` (search/reveal/pick/count/fight/roundEnd/finish/end)، `snap`، `ack {seq}`، `result` (جام، صندوقچه — از اقتصاد سرور).
- **تأخیر ورودی ~۱۰۰ms:** سرور ورودی را در تیک `now + 6` اعمال می‌کند؛ کلاینت بلافاصله انیمیشن «جمع شدن/فنر» روی توپ خودی و حلقهٔ لمس را نشان می‌دهد تا تأخیر حس نشود. کلاینت با بافر درون‌یابی ~۱۰۰ms رندر می‌کند.
- **اتصال دوباره:** `allowReconnection(client, 15)` در Colyseus + توکن اتاق در حافظهٔ اپ؛ پس از بازگشت آخرین snapshot کامل ارسال می‌شود. بعد از ۱۵ ثانیه ربات جای بازیکن را می‌گیرد.
- Matchmaking: صف درون‌حافظه بر اساس جام، بازه هر ۲ ثانیه بازتر؛ پس از ~۸ ثانیه ربات هم‌سطح با نام انسانی.
- ذخیرهٔ seed + ورودی‌ها در `matches` برای بازپخش و ضدتقلب.

---

## ۵. کلاینت (`apps/client`)

- لایه‌ها: `render/` (پورت `drawBall`, `paintArena`, `drawChest`, `FIN`…) · `audio/` (پورت `SFX`, `TRACKS`) · `ui/` (صفحه‌ها با DOM سبک + CSS، بدون فریم‌ورک سنگین) · `net/` (`Backend` interface: `LocalFakeBackend` در مرحلهٔ ۳، `HttpBackend` در مرحلهٔ ۴) · `i18n/` (fa، اعداد فارسی).
- فونت‌های Lalezar و Vazirmatn self-host در `apps/client/public/fonts`؛ هیچ درخواست به CDN خارجی.
- آفلاین در برابر ربات: همان `engine` و لایهٔ مسابقه، محلی.

---

## ۶. استقرار روی همروش

- دو سرویس Docker: `client` (فایل‌های ثابت با nginx، یا CDN آروان) و `server` (Node؛ API + Colyseus در یک پروسه برای شروع).
- فایل SQLite روی **دیسک ماندگار (volume)** سرویس سرور؛ فقط **یک نمونه** از سرور اجرا می‌شود (یک نویسنده).
- WebSocket روی دامنهٔ اختصاصی.
- Secrets (کلید پیامک، کلیدهای بازار/مایکت) در متغیرهای محیطی همروش.
- CI: GitHub Actions — lint، typecheck، test، شبیه‌ساز سریع بالانس؛ ساخت image و دیپلوی.

---

## ۷. ریسک‌ها

1. **پورت ۶۳ قابلیت با حفظ رفتار** — بزرگ‌ترین حجم کار. راهکار: پورت تابع‌به‌تابع، تست رفتاری برای هر قابلیت، و مقایسهٔ آماری با شبیه‌ساز prototype (درصد بردها باید نزدیک بمانند).
2. **حذف `setTimeout`/ارجاع‌ها** ممکن است زمان‌بندی‌ها را کمی جابه‌جا کند (تیک ۱۶.۷ms). قابل قبول؛ در شبیه‌ساز کنترل می‌شود.
3. **بالانس پس از قطعی‌سازی** ممکن است از بازهٔ ۴۵–۵۵٪ بیرون بزند → تنظیم‌کنندهٔ خودکار، و هر تغییر عدد به تو گزارش می‌شود (قانون «عدد را بی‌اجازه عوض نکن»).
4. **تأخیر و قطعی اینترنت موبایل** → سرور داخل ایران، بافر درون‌یابی، reconnect، ربات جایگزین.
5. **SQLite = یک نمونهٔ سرور.** تا چند هزار بازیکن هم‌زمان کافی است (تست بار مرحلهٔ ۵ عدد واقعی را می‌دهد). اگر روزی لازم شد، اتاق‌های مسابقه را به نمونه‌های جدای بی‌دیتابیس می‌بریم و فقط سرویس اقتصاد روی SQLite می‌ماند؛ یا به PostgreSQL مهاجرت می‌کنیم (Drizzle این را ساده می‌کند). خطر از دست رفتن دیسک → پشتیبان خودکار. WebSocket طولانی روی همروش هم در مرحلهٔ ۵ تست می‌شود.
6. **کارایی رندر روی گوشی ضعیف** — کش sprite توپ‌ها/زمین روی offscreen canvas (prototype هم همین را دارد)؛ PixiJS فقط اگر پروفایل نیاز داشت.
7. **پیامک OTP و هزینه/سوءاستفاده** → rate limit بر اساس شماره و IP، captcha ساده در صورت حمله.

---

## ۸. ترتیب پیاده‌سازی

1. اسکلت مونوریپو (این مرحله) ✅
2. `content` از `gamedata.json` + `engine` (فیزیک → برخورد → شتاب/جایزه/تنگ شدن → نقشه‌ها → قابلیت‌ها کلاس‌به‌کلاس → ربات → لایهٔ مسابقه) + `tools/sim`
3. کلاینت آفلاین با `LocalFakeBackend`
4. سرور و اقتصاد
5. مسابقهٔ آنلاین
6. اندروید (Capacitor) + بازار/مایکت + PWA
7. پنل مدیریت، ضدتقلب، انتشار

---

## ۹. یادداشت‌های پیاده‌سازی مرحلهٔ ۲

- **داده:** اعدادی که در prototype داخل کد بودند (پارامترهای ۶۳ قابلیت، قوانین برخورد، نقشه‌ها، ربات) به `packages/content/src/engine.json` منتقل شدند. موتور هیچ عدد بالانسی در کد ندارد.
- **فایل‌ها:** `round.ts` (ساخت راند و `step`)، `tick.ts` (حرکت، وضعیت‌ها، ویژگی ذاتی، جایزه)، `world.ts` (برخورد توپ‌ها، پرتابه، مین، زون)، `abilities*.ts`، `combat.ts` (`hurt`/`contact`)، `maps.ts`، `bot.ts`، `match.ts` (بهترین از ۳ و ۲ در ۲)، `hash.ts`.
- **رویدادها:** هر `burst`/`ring`/`sfx`/`banner`/عدد آسیب prototype به یک `GameEvent` با همان رنگ و اندازه تبدیل شد؛ فقط وقتی `fx: true` باشد ساخته می‌شوند (سرور و شبیه‌ساز خاموش).
- **تفاوت عمدی با prototype:** در prototype «hitstop» و «slow-motion» پایان راند خودِ شبیه‌سازی را کند می‌کردند. در موتور قطعی این‌ها فقط نمایشی‌اند و کلاینت باید آن‌ها را روی رندر اعمال کند. `setTimeout`ها حذف شدند؛ ترتیب فاز راند (چرخ، انتخاب، شمارش) در لایهٔ مسابقه/کلاینت است.
- **شبیه‌ساز:** prototype شبیه‌ساز قابل پورت نداشت؛ `tools/sim` از نو ساخته شد: ۲۱×۲۰ جفت مرتب × ۶ زمین × ۹ ترکیب قابلیت = ۲۲٬۶۸۰ راند، موازی روی همهٔ هسته‌ها (~۴۵ ثانیه روی ۴ هسته).

## ۱۰. یادداشت‌های مرحلهٔ ۳ (کلاینت آفلاین)

- **لایهٔ prototype:** کد رابط کاربری، هنر Canvas، فینیشرها، صندوقچه و صدا تقریباً خط‌به‌خط در `apps/client/src/legacy/*.js` منتقل شده تا ظاهر و زمان‌بندی دقیقاً همان بماند. این فایل‌ها JS ساده با دامنهٔ مشترک‌اند (مثل prototype) و `vite.config.ts` آن‌ها را به ترتیب شماره در یک ماژول به هم می‌چسباند. از typecheck و lint خارج‌اند؛ تبدیل تدریجی به ماژول‌های TS بدهی فنی ثبت‌شده است.
- **چیزهای جایگزین‌شده:** شبیه‌سازی (`09-sim.js` موتور را با گام ثابت اجرا می‌کند و رویدادهایش را به ذره/حلقه/متن/صدا تبدیل می‌کند)، اعداد (از `packages/content`)، و اقتصاد (هر تغییری از `act()` ← `Backend`).
- **Backend:** `src/net/backend.ts` قرارداد است؛ `LocalBackend` همان `packages/economy` را روی localStorage اجرا می‌کند. مرحلهٔ ۴ یک `HttpBackend` با همین رابط می‌سازد.
- **فونت‌ها** از `@fontsource` باندل و self-host می‌شوند؛ هیچ درخواست خارجی در زمان اجرا نیست.
- **ربات:** مهارت ربات از جام بازیکن (`botSkillFor`) و سطح کارت‌هایش مثل prototype از لیگ.

## ۱۱. یادداشت‌های مرحلهٔ ۴ (سرور و اقتصاد)

- **تقسیم کار:** بیشتر بازی سمت کلاینت اجرا می‌شود (گرافیک، صدا، رابط، و مسابقه در برابر ربات). سرور فقط کارهای لازم را انجام می‌دهد: حساب، پروفایل، اقتصاد (صندوقچه، ارتقا، فروشگاه، جام) و تأیید نتیجهٔ مسابقه.
- **تأیید مسابقه با بازپخش:** `matchStart` روی سرور seed و ترکیب ربات‌ها را می‌سازد؛ کلاینت بازی می‌کند و ورودی‌های بازیکن را با شمارهٔ تیک ثبت می‌کند؛ `match` روی سرور همان مسابقه را با موتور بازپخش می‌کند (چند میلی‌ثانیه) و برنده را خودش تعیین می‌کند. مسابقهٔ رهاشده = باخت.
- **حساب:** مثل کلش رویال؛ اولین اجرا حساب مهمان می‌سازد. در تنظیمات «ثبت پیشرفت با شمارهٔ موبایل» پیشنهاد می‌شود (OTP). اگر شماره قبلاً حساب داشته باشد، به آن حساب برمی‌گردد. شماره فقط به‌صورت HMAC ذخیره می‌شود.
- **داده:** به‌جای جدول‌های جدا برای کارت/اسکین، پروفایل به‌صورت JSON در `players.profile` ذخیره می‌شود (همان ساختار `packages/economy`) و هر تغییر عددی (سکه، الماس، جام، کارت، سطح، اسکین) یک ردیف در `ledger` دارد، در همان تراکنش. `idem` تکرار درخواست را بی‌اثر می‌کند. Drizzle کنار گذاشته شد؛ `node:sqlite` داخلی Node با SQL ساده کافی است.
- **API:** `POST /v1/auth/guest`، `POST /v1/auth/otp`، `POST /v1/auth/verify`، `DELETE /v1/account`، `GET /v1/me`، `POST /v1/act` (همهٔ اکشن‌ها، schema در `packages/protocol`)، `GET /v1/config`.
- **ریسک:** `node:sqlite` در Node 22 هنوز «experimental» است (پایدار در نسخه‌های بعدی)؛ اگر مشکلی دیدیم به better-sqlite3 می‌رویم (همان SQL).

## ۱۲. یادداشت‌های مرحلهٔ ۵ (مسابقهٔ آنلاین ۱ در ۱)

- **اتصال:** WebSocket روی همان سرور (`/v1/ws`، کتابخانهٔ `ws` با فشرده‌سازی permessage-deflate). Colyseus لازم نشد. اولین پیام `hello` با توکن است.
- **صف:** درون‌حافظه، بازهٔ جام ۱۰۰ و هر ثانیه ۵۰ بازتر؛ بعد از ۸ ثانیه ربات هم‌سطح با نام انسانی (`online/lobby.ts`).
- **اتاق (`online/room.ts`):** موتور روی سرور با ۶۰ گام در ثانیه؛ ۲۰ snapshot در ثانیه (`protocol/snapshot.ts`)؛ ورودی‌ها با ۶ تیک (~۱۰۰ms) تأخیر اعمال می‌شوند. چرخ زمین، انتخاب شخصیت (۱۰ ثانیه)، بهترین از ۳ و فینیشر مثل آفلاین؛ نتیجه، جام و صندوقچه فقط از سرور و در همان تراکنش با ledger.
- **اتصال دوباره:** جای بازیکن ۱۵ ثانیه نگه داشته می‌شود؛ کلاینت خودکار وصل می‌شود و کل وضعیت را دوباره می‌گیرد؛ بعد از آن ربات جایش بازی می‌کند.
- **کلاینت (`legacy/21-online.js`):** وضعیت را ۱۰۰ms عقب‌تر از سرور با درون‌یابی رسم می‌کند؛ «من» همیشه سمت خودی نمایش داده می‌شود. بدون سرور (حالت آفلاین) همان مسابقهٔ محلی با ربات اجرا می‌شود. ۲ در ۲ فعلاً آفلاین است.
- **حجم داده:** هر snapshot حدود ۹۰۰ بایت خام و ~۳۴۰ بایت فشرده؛ حدود ۷ کیلوبایت در ثانیه برای هر بازیکن در شلوغ‌ترین حالت.
