#!/usr/bin/env python3
"""Makes the share-preview card and the app icons from the hero illustration (tools/hero.svg).

Run once whenever the illustration changes, then rebuild the pages:

    python3 blog-copy/tools/make_assets.py
    python3 blog-copy/tools/build.py

Needs LibreOffice (soffice) to draw the SVG and Pillow to resize and compose.
Writes into blog-copy/assets/: share.png and icons/ (icon.svg, favicon-32.png, apple-touch-icon.png,
icon-192.png, icon-512.png, icon-maskable-512.png).
"""
import pathlib
import re
import shutil
import subprocess
import tempfile

from PIL import Image, ImageDraw, ImageFont

TOOLS = pathlib.Path(__file__).resolve().parent
ASSETS = TOOLS.parent / "assets"
ICONS = ASSETS / "icons"
ICONS.mkdir(parents=True, exist_ok=True)

HERO = (TOOLS / "hero.svg").read_text(encoding="utf-8")
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
INK, YELLOW, CREAM = "#1b1f3b", "#ffc94d", "#ffe9c2"


def raster(svg, width, height):
    """Draw an SVG string to a PIL image with LibreOffice."""
    svg = svg.replace("var(--font-display)", "Arial, Helvetica, sans-serif")
    ns = "" if "xmlns=" in svg.split(">", 1)[0] else 'xmlns="http://www.w3.org/2000/svg" '
    svg = re.sub(r"<svg ", f'<svg {ns}width="{width}" height="{height}" ', svg, count=1)
    with tempfile.TemporaryDirectory() as tmp:
        src = pathlib.Path(tmp) / "in.svg"
        src.write_text(svg, encoding="utf-8")
        subprocess.run(["soffice", "--headless", "--convert-to", "png", "--outdir", tmp, str(src)],
                       check=True, capture_output=True, timeout=180)
        im = Image.open(pathlib.Path(tmp) / "in.png").convert("RGB")
        im.load()
    return im.resize((width, height), Image.LANCZOS) if im.size != (width, height) else im


# ---------- icon: Arpi's face on yellow, from the hero artwork ----------
face = HERO[HERO.index("<!-- ears and head -->"):HERO.index("<!-- wobbling stack of plates -->")]


def icon_svg(rounded, scale):
    bg = '<rect width="512" height="512" rx="112" fill="#ffc94d"/>' if rounded else '<rect width="512" height="512" fill="#ffc94d"/>'
    pre = f'<g transform="translate(256 256) scale({scale}) translate(-256 -256)">'
    return (
        '<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">' + bg + pre +
        '<g stroke-linejoin="round" stroke-linecap="round">'
        '<rect x="222" y="380" width="68" height="60" fill="#f2c096" stroke="#1b1f3b" stroke-width="8"/>'
        '<path d="M56 520 C56 450 150 412 256 412 C362 412 456 450 456 520 Z" fill="#fffaf0" stroke="#1b1f3b" stroke-width="8"/>'
        '<path d="M214 416 L298 416 C304 450 322 470 340 520 L172 520 C190 470 208 450 214 416 Z" fill="#8a5a34" stroke="#1b1f3b" stroke-width="8"/>'
        '<g transform="translate(-120 -9.6) scale(1.6)">' + face + "</g></g></g></svg>"
    )


(ICONS / "icon.svg").write_text(icon_svg(True, 1.0), encoding="utf-8")
(ICONS / "icon-maskable.svg").write_text(icon_svg(False, 0.78), encoding="utf-8")
rounded = raster(icon_svg(True, 1.0), 1024, 1024)
full = raster(icon_svg(False, 0.9), 1024, 1024)
mask = raster(icon_svg(False, 0.78), 1024, 1024)
rounded.resize((512, 512), Image.LANCZOS).save(ICONS / "icon-512.png", optimize=True)
rounded.resize((192, 192), Image.LANCZOS).save(ICONS / "icon-192.png", optimize=True)
rounded.resize((32, 32), Image.LANCZOS).save(ICONS / "favicon-32.png", optimize=True)
full.resize((180, 180), Image.LANCZOS).save(ICONS / "apple-touch-icon.png", optimize=True)
mask.resize((512, 512), Image.LANCZOS).save(ICONS / "icon-maskable-512.png", optimize=True)

# ---------- share card, 1200 x 630 ----------
card = Image.new("RGB", (1200, 630), INK)
card.paste(raster(HERO, 900, 630), (0, 0))
d = ImageDraw.Draw(card)


def fit(text, max_w, size):
    while size > 12:
        f = ImageFont.truetype(BOLD, size)
        if d.textlength(text, font=f) <= max_w:
            return f
        size -= 1
    return ImageFont.truetype(BOLD, 12)


x0, w = 924, 252
d.text((x0, 150), "Budapest", font=fit("Budapest", w, 54), fill=YELLOW)
d.text((x0, 218), "Hungry", font=fit("Hungry", w, 54), fill=YELLOW)
d.line([(x0, 300), (x0 + 60, 300)], fill="#e8452c", width=6)
small = fit("from a local waiter", w, 24)
d.text((x0, 322), "Honest tips", font=small, fill=CREAM)
d.text((x0, 354), "from a local", font=small, fill=CREAM)
d.text((x0, 386), "waiter. Never", font=small, fill=CREAM)
d.text((x0, 418), "sponsored.", font=small, fill=CREAM)
d.text((x0, 560), "budapesthungry.com", font=fit("budapesthungry.com", w, 20), fill=YELLOW)
card = card.quantize(colors=96, method=Image.MEDIANCUT, dither=Image.NONE)
card.save(ASSETS / "share.png", optimize=True)

for f in sorted(ICONS.iterdir()):
    print(f.relative_to(ASSETS.parent), f.stat().st_size)
print("assets/share.png", (ASSETS / "share.png").stat().st_size)
