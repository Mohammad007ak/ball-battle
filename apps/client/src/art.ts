import type { Balance } from '@chakachak/content';

/** Generated art in public/art (cut by tools/art/cut.py). Missing files fall back to canvas art. */
export interface Art {
  img: Record<string, HTMLImageElement>;
  url(name: string): string;
}

const base = import.meta.env.BASE_URL + 'art/';

/** Load every known asset before the UI starts (they are bundled with the app, so this is fast). */
export async function loadArt(_B: Balance, onProgress?: (done: number) => void): Promise<Art> {
  const names = [
    ...[0, 1, 2, 3, 4].flatMap((t) => [`chest-${t}`, `chest-${t}-open`, `league-${t}`]),
    'coin',
    'gem',
    'trophy',
    'gem-bag',
  ];
  const img: Record<string, HTMLImageElement> = {};
  let loaded = 0;
  await Promise.all(
    names.map(
      (n) =>
        new Promise<void>((done) => {
          const im = new Image();
          const finish = () => {
            onProgress?.(++loaded / names.length);
            done();
          };
          im.onload = () => {
            img[n] = im;
            finish();
          };
          im.onerror = finish;
          im.src = base + n + '.webp';
        }),
    ),
  );
  return { img, url: (n) => base + n + '.webp' };
}
