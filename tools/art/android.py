"""Android launcher icons and splash screens from the game art (run after `cap add android`).

  python3 tools/art/android.py

Icon: assets/icon/app-icon.png (full-bleed art) → legacy + round icons and the adaptive-icon
foreground (the launcher mask shows its middle ~2/3). Splash: apps/client/public/art/splash.webp,
centre-cropped to every Capacitor splash size on the game's navy background.
"""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
RES = ROOT / 'apps/client/android/app/src/main/res'
ICON = Image.open(ROOT / 'assets/icon/app-icon.png').convert('RGBA')
SPLASH = Image.open(ROOT / 'apps/client/public/art/splash.webp').convert('RGB')
DENS = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
PORT = {'mdpi': (320, 480), 'hdpi': (480, 800), 'xhdpi': (720, 1280), 'xxhdpi': (960, 1600),
        'xxxhdpi': (1280, 1920)}


def cover(im: Image.Image, w: int, h: int) -> Image.Image:
    s = max(w / im.width, h / im.height)
    r = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    x, y = (r.width - w) // 2, (r.height - h) // 2
    return r.crop((x, y, x + w, y + h))


def round_icon(n: int) -> Image.Image:
    im = ICON.resize((n, n), Image.LANCZOS)
    m = Image.new('L', (n * 4, n * 4), 0)
    ImageDraw.Draw(m).ellipse((0, 0, n * 4 - 1, n * 4 - 1), fill=255)
    im.putalpha(m.resize((n, n), Image.LANCZOS))
    return im


for d, k in DENS.items():
    out = RES / f'mipmap-{d}'
    out.mkdir(parents=True, exist_ok=True)
    n = round(48 * k)
    ICON.resize((n, n), Image.LANCZOS).save(out / 'ic_launcher.png')
    round_icon(n).save(out / 'ic_launcher_round.png')
    ICON.resize((round(108 * k),) * 2, Image.LANCZOS).save(out / 'ic_launcher_foreground.png')
    w, h = PORT[d]
    for orient, size in (('port', (w, h)), ('land', (h, w))):
        p = RES / f'drawable-{orient}-{d}'
        p.mkdir(parents=True, exist_ok=True)
        cover(SPLASH, *size).save(p / 'splash.png', optimize=True)
cover(SPLASH, 480, 320).save(RES / 'drawable/splash.png', optimize=True)
print('android icons and splash written to', RES)
