import '@fontsource/lalezar/400.css';
import '@fontsource/vazirmatn/400.css';
import '@fontsource/vazirmatn/600.css';
import '@fontsource/vazirmatn/800.css';
import './styles/game.css';
import { defaultBalance } from '@chakachak/content';
import { makeBridge } from './bridge';
import { LocalBackend } from './net/local-backend';

(globalThis as unknown as { CK: unknown }).CK = makeBridge(new LocalBackend(defaultBalance));
// The prototype-ported UI, concatenated into one module by vite.config.ts.
await import('virtual:legacy');
