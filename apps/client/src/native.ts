import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar } from '@capacitor/status-bar';

/** Phone features used by the legacy UI through `CK.N`. Every call is a no-op in a browser. */
export interface Native {
  readonly isNative: boolean;
  /** Short vibration: `light` on hits, `heavy` on big hits and finishers. */
  haptic(kind: 'light' | 'heavy'): void;
  /** Keep the screen on (during matches). */
  keepAwake(on: boolean): void;
  /** Android back button; the handler decides (close modal, leave match, exit). */
  onBack(fn: () => void): void;
  exit(): void;
  /** App goes to background (`false`) or comes back (`true`). */
  onActive(fn: (active: boolean) => void): void;
  hideSplash(): void;
}

const on = Capacitor.isNativePlatform();
const quiet = (p: Promise<unknown>) => void p.catch(() => {});
let lastBuzz = 0;

export const native: Native = {
  isNative: on,
  haptic(kind) {
    if (!on) return;
    // Hits can arrive several per frame; one buzz per 60 ms is plenty.
    const t = performance.now();
    if (t - lastBuzz < 60) return;
    lastBuzz = t;
    quiet(Haptics.impact({ style: kind === 'heavy' ? ImpactStyle.Heavy : ImpactStyle.Light }));
  },
  keepAwake(v) {
    if (on) quiet(v ? KeepAwake.keepAwake() : KeepAwake.allowSleep());
  },
  onBack(fn) {
    if (on) quiet(App.addListener('backButton', fn));
  },
  exit() {
    if (on) quiet(App.exitApp());
  },
  onActive(fn) {
    if (on) quiet(App.addListener('appStateChange', (s) => fn(s.isActive)));
    else document.addEventListener('visibilitychange', () => fn(!document.hidden));
  },
  hideSplash() {
    if (!on) return;
    quiet(StatusBar.setOverlaysWebView({ overlay: true }));
    quiet(SplashScreen.hide({ fadeOutDuration: 250 }));
  },
};
