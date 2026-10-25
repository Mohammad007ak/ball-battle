import '@fontsource/lalezar/400.css';
import '@fontsource/vazirmatn/400.css';
import '@fontsource/vazirmatn/600.css';
import '@fontsource/vazirmatn/800.css';
import './styles/game.css';
import { defaultBalance, mergeBalance, type Balance } from '@chakachak/content';
import { loadArt } from './art';
import { bootDone, bootProgress } from './boot';
import { makeBridge } from './bridge';
import type { Backend } from './net/backend';
import { HttpBackend } from './net/http-backend';
import { GemStore } from './net/store';
import { LocalBackend } from './net/local-backend';
import { native } from './native';
import { Telemetry } from './telemetry';

/** VITE_API_URL set → the real server; unset → offline fake server (development, with test tools). */
const api = import.meta.env.VITE_API_URL as string | undefined;
let http: HttpBackend | null = null;
const telemetry = new Telemetry(api ? { base: api, token: () => http?.token() ?? null } : null);
telemetry.catchErrors();
// The web loading screen (same splash art) takes over from the native splash.
native.hideSplash();
bootProgress(0.1);
let backend: Backend,
  balance = defaultBalance;
if (api) {
  http = new HttpBackend(api);
  for (;;) {
    try {
      // Keys an older server does not send yet fall back to the app's own defaults.
      balance = mergeBalance(defaultBalance, await http.init()) as Balance;
      break;
    } catch (e) {
      const code = (e as Error).message;
      bootProgress(
        0.2,
        code === 'network' || code.includes('fetch')
          ? 'در حال اتصال به سرور…'
          : `خطای سرور (${code})، تلاش دوباره…`,
      );
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  backend = http;
} else backend = new LocalBackend(defaultBalance);

bootProgress(0.3, 'بارگذاری تصاویر…');
const art = await loadArt(balance, (d) => bootProgress(0.3 + d * 0.5));
const iap = new GemStore(http);
await iap.init();
const CK = makeBridge(backend, balance, art, telemetry, iap);
(globalThis as unknown as { CK: unknown }).CK = CK;
native.onActive((active) => {
  if (active) telemetry.track('session_start', { app: __APP_VERSION__ });
  else void telemetry.flush();
});
telemetry.track('session_start', { app: __APP_VERSION__ });
// The prototype-ported UI, concatenated into one module by vite.config.ts.
bootProgress(0.85, 'آماده‌سازی میدان…');
try {
  await import('virtual:legacy');
  await bootDone();
} catch (e) {
  // Never leave the player on an endless loading bar: say so and report it.
  bootProgress(1, 'خطا در اجرای بازی؛ لطفاً برنامه را دوباره باز کن');
  telemetry.report({
    kind: 'error',
    message: String((e as Error)?.message ?? e).slice(0, 500),
    source: 'startup',
  });
  void telemetry.flush();
}
