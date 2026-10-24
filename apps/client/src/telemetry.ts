import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import type { ErrorReport, TelemetryEvent } from '@chakachak/protocol';

export const APP_VERSION: string = __APP_VERSION__;

/** Where reports go: the game server (base URL) and the current session token. */
export interface Sink {
  base: string;
  token(): string | null;
}

/**
 * Analytics and crash reports go to our own server only (no foreign services; they can be blocked
 * in Iran). Events are batched and flushed every 30 s and when the app goes to background.
 */
export class Telemetry {
  private queue: TelemetryEvent[] = [];
  private timer = 0;
  private sent = new Set<string>();

  constructor(private sink: Sink | null) {
    if (sink) this.timer = window.setInterval(() => void this.flush(), 30_000);
  }

  /** Record an event, e.g. `track('match', { mode: '1v1', win: true })`. */
  track(n: string, d?: Record<string, string | number | boolean>) {
    if (!this.sink) return;
    this.queue.push({ n, t: Date.now(), ...(d ? { d } : {}) });
    if (this.queue.length >= 50) void this.flush();
  }

  async flush() {
    const s = this.sink;
    if (!s || !this.queue.length || !s.token()) return;
    const events = this.queue.splice(0, 50);
    try {
      await this.post('/v1/events', { events });
    } catch {
      // Keep them for the next try, but never grow without bound on a dead connection.
      this.queue = events.concat(this.queue).slice(-200);
    }
  }

  report(r: Omit<ErrorReport, 'app'>) {
    if (!this.sink) return console.error('[error]', r.message);
    // The same error in a render loop would otherwise be sent 60 times a second.
    const key = r.kind + r.message;
    if (this.sent.has(key) || this.sent.size > 30) return;
    this.sent.add(key);
    this.post('/v1/errors', {
      ...r,
      app: APP_VERSION,
      device: navigator.userAgent.slice(0, 120),
    }).catch(() => this.sent.delete(key));
  }

  /** Global handlers for the WebView, plus a native crash saved by MainActivity on the last run. */
  catchErrors() {
    window.addEventListener('error', (e) =>
      this.report({
        kind: 'error',
        message: String(e.message).slice(0, 500),
        ...(e.error instanceof Error && e.error.stack
          ? { stack: e.error.stack.slice(0, 4000) }
          : {}),
        source: `${e.filename}:${e.lineno}:${e.colno}`.slice(0, 200),
      }),
    );
    window.addEventListener('unhandledrejection', (e) => {
      const r: unknown = e.reason;
      this.report({
        kind: 'rejection',
        message: String(r instanceof Error ? r.message : r).slice(0, 500),
        ...(r instanceof Error && r.stack ? { stack: r.stack.slice(0, 4000) } : {}),
      });
    });
    if (Capacitor.isNativePlatform()) void this.nativeCrash();
  }

  private async nativeCrash() {
    const { value } = await Preferences.get({ key: 'nativeCrash' });
    if (!value) return;
    await Preferences.remove({ key: 'nativeCrash' });
    const [message = 'native crash', ...rest] = value.split('\n');
    this.report({
      kind: 'native',
      message: message.slice(0, 500),
      stack: rest.join('\n').slice(0, 4000),
    });
  }

  private async post(path: string, body: unknown) {
    const s = this.sink!,
      t = s.token();
    const r = await fetch(s.base + path, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(t ? { authorization: 'Bearer ' + t } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) throw new Error(String(r.status));
  }
}
