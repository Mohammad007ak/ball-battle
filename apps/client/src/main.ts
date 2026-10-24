import '@fontsource/lalezar/400.css';
import '@fontsource/vazirmatn/400.css';
import '@fontsource/vazirmatn/600.css';
import '@fontsource/vazirmatn/800.css';
import './styles/game.css';
import { defaultBalance } from '@chakachak/content';
import { makeBridge } from './bridge';
import type { Backend } from './net/backend';
import { HttpBackend } from './net/http-backend';
import { LocalBackend } from './net/local-backend';

/** VITE_API_URL set → the real server; unset → offline fake server (development, with test tools). */
const api = import.meta.env.VITE_API_URL as string | undefined;
let backend: Backend,
  balance = defaultBalance;
if (api) {
  const http = new HttpBackend(api);
  for (;;) {
    try {
      balance = await http.init();
      break;
    } catch {
      document.body.dataset.offline = '1';
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  delete document.body.dataset.offline;
  backend = http;
} else backend = new LocalBackend(defaultBalance);

(globalThis as unknown as { CK: unknown }).CK = makeBridge(backend, balance);
// The prototype-ported UI, concatenated into one module by vite.config.ts.
await import('virtual:legacy');
