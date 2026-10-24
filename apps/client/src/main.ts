import '@fontsource/lalezar/400.css';
import '@fontsource/vazirmatn/400.css';
import '@fontsource/vazirmatn/600.css';
import '@fontsource/vazirmatn/800.css';
import './styles/game.css';
import { defaultBalance } from '@chakachak/content';
import { loadArt } from './art';
import { makeBridge } from './bridge';
import type { Backend } from './net/backend';
import { HttpBackend } from './net/http-backend';
import { LocalBackend } from './net/local-backend';
import { native } from './native';
import { Telemetry } from './telemetry';

/** VITE_API_URL set → the real server; unset → offline fake server (development, with test tools). */
const api = import.meta.env.VITE_API_URL as string | undefined;
let http: HttpBackend | null = null;
const telemetry = new Telemetry(api ? { base: api, token: () => http?.token() ?? null } : null);
telemetry.catchErrors();
let backend: Backend,
  balance = defaultBalance;
if (api) {
  http = new HttpBackend(api);
  for (;;) {
    try {
      balance = await http.init();
      break;
    } catch {
      document.body.dataset.offline = '1';
      native.hideSplash();
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  delete document.body.dataset.offline;
  backend = http;
} else backend = new LocalBackend(defaultBalance);

const CK = makeBridge(backend, balance, await loadArt(balance), telemetry);
(globalThis as unknown as { CK: unknown }).CK = CK;
native.onActive((active) => {
  if (active) telemetry.track('session_start', { app: __APP_VERSION__ });
  else void telemetry.flush();
});
telemetry.track('session_start', { app: __APP_VERSION__ });
// The prototype-ported UI, concatenated into one module by vite.config.ts.
await import('virtual:legacy');
native.hideSplash();
