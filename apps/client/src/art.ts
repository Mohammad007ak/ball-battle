import type { Balance } from '@chakachak/content';

/** Generated art in public/art (cut by tools/art/cut.py). Missing files fall back to canvas art. */
export interface Art {
  img: Record<string, HTMLImageElement>;
  url(name: string): string;
}

const base = import.meta.env.BASE_URL + 'art/';

/** Load every known asset before the UI starts (they are bundled with the app, so this is fast). */
export async function loadArt(B: Balance): Promise<Art> {
  const names = [
    ...[0, 1, 2, 3, 4].flatMap((t) => [`chest-${t}`, `chest-${t}-open`, `league-${t}`]),
    'coin',
    'gem',
    'trophy',
    'gem-bag',
    'menu-bg',
    ...B.game.ARENAS.flatMap((a) => ('art' in a && a.art ? [a.art.replace(/\.webp$/, '')] : [])),
  ];
  const img: Record<string, HTMLImageElement> = {};
  await Promise.all(
    names.map(
      (n) =>
        new Promise<void>((done) => {
          const im = new Image();
          im.onload = () => {
            img[n] = im;
            done();
          };
          im.onerror = () => done();
          im.src = base + n + '.webp';
        }),
    ),
  );
  return { img, url: (n) => base + n + '.webp' };
}
