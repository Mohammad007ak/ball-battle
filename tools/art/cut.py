"""Cut generated art (assets/art-src) into game assets (apps/client/public/art).

  python3 tools/art/cut.py

Sprite sheets were generated on white: the white background (and the soft glow fading into it)
is made transparent by flood-filling near-white pixels from the image border and converting them
with "color to alpha"; items are then split by empty columns/rows and trimmed.
"""
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC, OUT = ROOT / 'assets/art-src', ROOT / 'apps/client/public/art'
OUT.mkdir(parents=True, exist_ok=True)


def remove_white(im: Image.Image, thresh=200) -> Image.Image:
    a = np.asarray(im.convert('RGB')).astype(np.float32)
    h, w, _ = a.shape
    light = a.min(axis=2) >= thresh
    bg = np.zeros((h, w), bool)
    q = deque((y, x) for y in range(h) for x in (0, w - 1)) + deque((y, x) for x in range(w) for y in (0, h - 1))
    for y, x in q:
        bg[y, x] = light[y, x]
    q = deque((y, x) for y, x in q if bg[y, x])
    while q:
        y, x = q.popleft()
        for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if 0 <= ny < h and 0 <= nx < w and not bg[ny, nx] and light[ny, nx]:
                bg[ny, nx] = True
                q.append((ny, nx))
    # colour-to-alpha against white for background pixels: alpha from the darkest channel
    alpha = np.full((h, w), 255.0)
    m = a.min(axis=2)
    al = np.clip((255 - m) / (255 - thresh), 0, 1)
    alpha[bg] = al[bg] * 255
    rgb = a.copy()
    safe = np.maximum(alpha[..., None] / 255, 1e-3)
    rgb[bg] = np.clip((a[bg] - 255 * (1 - safe[bg])) / safe[bg], 0, 255)
    return Image.fromarray(np.dstack([rgb, alpha]).astype(np.uint8), 'RGBA')


def runs(mask_1d, min_gap=8):
    """[(start, end)] of runs where mask is True, merging gaps shorter than min_gap."""
    out, start, gap = [], None, 0
    for i, v in enumerate(mask_1d):
        if v:
            if start is None:
                start = i
            gap = 0
        elif start is not None:
            gap += 1
            if gap >= min_gap:
                out.append((start, i - gap + 1))
                start, gap = None, 0
    if start is not None:
        out.append((start, len(mask_1d)))
    return out


def split(im: Image.Image, cols_first=True):
    al = np.asarray(im)[..., 3] > 40
    items = []
    for r0, r1 in runs(al.any(axis=1)):
        row = al[r0:r1]
        for c0, c1 in runs(row.any(axis=0)):
            items.append(im.crop((c0, r0, c1, r1)))
    return [trim(i) for i in items]


def trim(im: Image.Image) -> Image.Image:
    box = im.getchannel('A').point(lambda v: 255 if v > 10 else 0).getbbox()
    return im.crop(box) if box else im


def fit(im: Image.Image) -> Image.Image:
    """Center on a transparent square canvas at the item's native resolution (never rescaled)."""
    size = max(im.size)
    c = Image.new('RGBA', (size, size))
    c.paste(im, ((size - im.width) // 2, (size - im.height) // 2), im)
    return c


def save(im, name, q=None):
    """Lossless WebP by default (sprites); photos-like backgrounds pass a high lossy quality."""
    if q is None:
        im.save(OUT / name, 'WEBP', lossless=True, quality=100, method=6)
    else:
        im.save(OUT / name, 'WEBP', quality=q, method=6)
    print(name, im.size)


closed = split(remove_white(Image.open(SRC / 'chests-closed.png')))
opened = split(remove_white(Image.open(SRC / 'chests-open.png')))
assert len(closed) == 5 and len(opened) == 5, (len(closed), len(opened))
for i, (c, o) in enumerate(zip(closed, opened)):
    save(fit(c), f'chest-{i}.webp')
    save(fit(o), f'chest-{i}-open.webp')

icons = split(remove_white(Image.open(SRC / 'icons.png')))
assert len(icons) == 9, len(icons)
names = ['league-0', 'league-1', 'league-2', 'league-3', 'league-4', 'coin', 'gem', 'trophy', 'gem-bag']
for im, n in zip(icons, names):
    save(fit(im), n + '.webp')

for f in sorted(SRC.glob('arena-*.png')):
    idx = int(f.stem.split('-')[1]) - 1
    save(Image.open(f).convert('RGB'), f'arena-{idx}.webp', 95)

save(Image.open(SRC / 'menu-bg.png').convert('RGB'), 'menu-bg.webp', 95)
save(Image.open(SRC / 'splash.png').convert('RGB'), 'splash.webp', 95)
