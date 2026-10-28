import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { ChestSlot } from '@chakachak/economy';

/** Notification texts (fa). */
const T = {
  chestTitle: 'صندوقچه‌ات باز شد! 🎁',
  chestBody: (name: string) => `صندوقچهٔ ${name} آماده است؛ بیا و جایزه‌هایت را بگیر.`,
  idleTitle: 'میدان منتظر توست ⚔️',
  idleBody: 'یک روز است مبارزه نکرده‌ای. یک مسابقهٔ سریع؟',
  idleChestBody: 'صندوقچه‌های قفل داری؛ یکی را باز کن تا تا فردا آماده شود.',
};

/** Reminder after this long away from the game. */
const IDLE_MS = 24 * 3600_000;
const CHEST_ID = 100,
  IDLE_ID = 1;

export interface Planned {
  id: number;
  at: number;
  title: string;
  body: string;
}

/**
 * What to show while the player is away. `slots` carry server time; `offset` = server − phone
 * clock, so each notification fires on the phone's clock. Pure, for tests.
 */
export function plan(
  slots: (ChestSlot | null)[],
  chestNames: string[],
  serverNow: number,
  offset: number,
): Planned[] {
  const out: Planned[] = [];
  slots.forEach((s, i) => {
    if (s?.end != null && s.end > serverNow)
      out.push({
        id: CHEST_ID + i,
        at: s.end - offset,
        title: T.chestTitle,
        body: T.chestBody(chestNames[s.tier] ?? ''),
      });
  });
  const locked = slots.some((s) => s && s.end == null);
  out.push({
    id: IDLE_ID,
    at: serverNow - offset + IDLE_MS,
    title: T.idleTitle,
    body: locked && !out.length ? T.idleChestBody : T.idleBody,
  });
  return out;
}

const on = Capacitor.isNativePlatform();
const quiet = (p: Promise<unknown>) => void p.catch(() => {});

/** Ask for the Android 13+ permission once, when it is first useful (a chest starts unlocking). */
export function askNotify(): void {
  if (!on) return;
  quiet(
    LocalNotifications.checkPermissions().then((p) =>
      p.display === 'prompt' || p.display === 'prompt-with-rationale'
        ? LocalNotifications.requestPermissions()
        : p,
    ),
  );
}

/** Going to background: schedule; coming back: clear (the player is here). */
export async function syncNotify(away: boolean, list: () => Planned[]): Promise<void> {
  if (!on) return;
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length)
      await LocalNotifications.cancel({
        notifications: pending.notifications.map((n) => ({ id: n.id })),
      });
    if (!away) return;
    if ((await LocalNotifications.checkPermissions()).display !== 'granted') return;
    await LocalNotifications.schedule({
      notifications: list().map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        schedule: { at: new Date(n.at), allowWhileIdle: true },
        smallIcon: 'ic_stat_chakachak',
      })),
    });
  } catch {
    /* notifications are best-effort */
  }
}
