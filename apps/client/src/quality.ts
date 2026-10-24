/**
 * Render quality for the match canvas (rendering only; the simulation is unaffected).
 * Mid-range Android phones (e.g. Galaxy A32) cannot fill a ~1000 px canvas with dozens of
 * blurred glows per frame, so the resolution is capped and, if frames still run long,
 * quality steps down: lower resolution and no shadow blur.
 */
export interface Quality {
  /** Pixel ratio to size the match canvas with. */
  dpr(): number;
  /** Apply the current level to a canvas context (call after every resize). */
  apply(ctx: CanvasRenderingContext2D): void;
  /** Report one frame (ms); true when the level changed and the canvas must be resized. */
  frame(ms: number): boolean;
  level(): 'high' | 'low';
}

const KEY = 'chakachak-quality',
  SLOW_MS = 22,
  WINDOW = 90;

export function makeQuality(onChange?: (level: 'high' | 'low') => void): Quality {
  // Remembered across launches so a slow phone starts at the right level.
  let low = localStorage.getItem(KEY) === 'low',
    n = 0,
    sum = 0;
  return {
    dpr: () => Math.min(window.devicePixelRatio || 1, low ? 1.25 : 2),
    apply(ctx) {
      // An own property shadows the prototype accessor: glows are skipped, everything else draws.
      if (low)
        Object.defineProperty(ctx, 'shadowBlur', {
          configurable: true,
          get: () => 0,
          set: () => {},
        });
      else delete (ctx as unknown as Record<string, unknown>).shadowBlur;
    },
    frame(ms) {
      if (low || ms > 250) return false; // already lowest, or the app was paused
      sum += ms;
      if (++n < WINDOW) return false;
      const avg = sum / n;
      n = sum = 0;
      if (avg <= SLOW_MS) return false;
      low = true;
      localStorage.setItem(KEY, 'low');
      onChange?.('low');
      return true;
    },
    level: () => (low ? 'low' : 'high'),
  };
}
