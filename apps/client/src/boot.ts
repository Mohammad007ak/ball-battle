/** Loading screen over the splash art: progress bar + status line while the game starts. */
const el = document.getElementById('boot');
let shown = 0;

if (el)
  el.innerHTML =
    '<div class="boot-ui"><div class="boot-bar"><i></i></div><b class="boot-txt">در حال بارگذاری…</b></div>';

/** Move the bar to `p` (0–1, never backwards) and optionally change the status text. */
export function bootProgress(p: number, text?: string) {
  if (!el) return;
  shown = Math.max(shown, Math.min(1, p));
  el.style.setProperty('--boot', String(shown));
  const t = el.querySelector('.boot-txt');
  if (t && text) t.textContent = text;
}

/** Fill the bar, then fade the loading screen out. */
export async function bootDone() {
  bootProgress(1, 'آماده!');
  await new Promise((r) => setTimeout(r, 450));
  el?.classList.add('gone');
  setTimeout(() => el?.remove(), 500);
}
