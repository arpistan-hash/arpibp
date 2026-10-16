#!/usr/bin/env python3
"""Builds the blog copy from the main site's index.html.

Every tip and story chapter on the main page becomes its own blog post page,
and the home page lists them all as cards. Run it again after editing the main
page to refresh the blog:

    python3 blog-copy/tools/build.py
"""
import html
import pathlib
import re
import shutil

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "blog-copy"
SRC = (ROOT / "index.html").read_text(encoding="utf-8")

NAME = "Arpi"
SITE_TITLE = "Arpi from Budapest"
SITE_DESC = "Friendly Budapest tips and the story of a life across three continents."
WHATSAPP = "+36 20 223 9524"
EMAIL = "arpistan@gmail.com"
MAIN_SITE = "https://budapesthungry.com"

# Each post gets the color of the feeling it should give (see assets/blog.css, "mood colors"):
# joy = yellow, excited = saturated red-orange, love = warm pink-red,
# calm = soft blue, nostalgic = dusty violet, sad = muted grey-blue.
MOODS = {
    "tip1": "calm", "tip2": "calm", "tip3": "calm", "trip": "joy", "tip6": "excited", "tip7": "joy",
    "pal": "excited", "tip9": "calm", "tip8": "joy", "hist": "sad", "tip4": "calm", "tip5": "joy",
    "tip11": "sad", "tip12": "love", "tip13": "nostalgic", "tip14": "excited", "tip10": "joy",
    "ch1": "nostalgic", "ch2": "love", "ch3": "sad", "ch4": "excited", "ch5": "joy", "ch6": "excited",
    "ch7": "nostalgic", "ch8": "joy", "ch9": "nostalgic", "ch10": "excited", "ch11": "sad",
    "countries": "excited", "mom": "love", "tobi": "joy",
}
MOOD_WORD = {"joy": "happy", "excited": "exciting", "love": "warm", "calm": "calm", "nostalgic": "nostalgic", "sad": "bittersweet"}


def mood_style(p):
    m = MOODS.get(p["id"], "joy")
    return f"--chap:var(--m-{m});--tint:var(--m-{m}-bg)"


body = SRC[SRC.find("<body"):SRC.find("<script")]


def block(src, start):
    """Inner HTML of the <div> opening at index `start` (handles nested divs)."""
    i = src.index(">", start) + 1
    depth = 1
    for t in re.finditer(r"<(/?)div\b", src[i:]):
        depth += -1 if t.group(1) else 1
        if depth == 0:
            return src[i:i + t.start()]
    raise ValueError("unclosed div")


def text(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s)).strip()


def slugify(s):
    s = text(s).lower()
    s = re.sub(r"[áàâä]", "a", s); s = re.sub(r"[éèêë]", "e", s); s = re.sub(r"[íìîï]", "i", s)
    s = re.sub(r"[óòôöőõ]", "o", s); s = re.sub(r"[úùûüű]", "u", s)
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")[:60]


# ---------- collect posts ----------
posts = []
for m in re.finditer(r'<div class="chapter[^"]*" id="([^"]+)"[^>]*>', body):
    cid, inner = m.group(1), block(body, m.start())
    section = [x.group(1) for x in re.finditer(r'<section[^>]*aria-labelledby="([^"]+)"', body[:m.start()])][-1]
    groups = [x.group(1) for x in re.finditer(r'<h3 class="tipgroup[^"]*" id="tips-[^"]+">([^<]*)', body[:m.start()])]
    kind = text(re.search(r'class="chap-k">(.*?)</p>', inner).group(1))
    title = re.search(r"<h3>(.*?)</h3>", inner, re.S).group(1).strip()
    hook = re.search(r'<p class="chap-hook">(.*?)</p>', inner, re.S)
    art = re.search(r'<svg class="chap-art"[^>]*>.*?</svg>', inner, re.S)
    facts = re.search(r'<ul class="facts">(.*?)</ul>', inner, re.S)
    rest = inner
    for pat in (r'<p class="chap-k">.*?</p>', r"<h3>.*?</h3>", r'<p class="chap-hook">.*?</p>', r'<ul class="facts">.*?</ul>'):
        rest = re.sub(pat, "", rest, count=1, flags=re.S)
    if art:
        rest = rest.replace(art.group(0), "", 1)
    rest = rest.replace('src="assets/', 'src="../assets/')
    rest = re.sub(r"\n\s*\n+", "\n", rest).strip()
    is_tip = section == "tips-h"
    words = len(text(rest).split())
    posts.append({
        "id": cid,
        "topic": "tips" if is_tip else "story",
        "topic_name": "Budapest tips" if is_tip else "My life",
        "group": groups[-1] if is_tip and groups else kind,
        "kind": kind,
        "title": title,
        "title_txt": text(title),
        "hook": hook.group(1).strip() if hook else "",
        "art": art.group(0) if art else "",
        "facts": facts.group(1) if facts else "",
        "body": rest,
        "mins": max(1, round(words / 230)),
        "slug": slugify(title),
    })

# Story first in reading order? Keep the main page order: tips, then story.
scene = re.search(r'<figure class="scene">\s*(<svg.*?</svg>)', body, re.S).group(1)
man = re.search(r"<!-- man -->\s*(<g>.*?</g>)\s*\n\s*<!-- dog -->", scene, re.S).group(1)
AVATAR = ('<svg viewBox="108 126 84 84" aria-hidden="true"><rect x="108" y="126" width="84" height="84" fill="#ffc94d"/>'
          + man + "</svg>")
about = re.search(r'<section class="story about".*?</section>', body, re.S).group(0)
about_ps = [p for p in re.findall(r"<p>(.*?)</p>", about, re.S)]

# ---------- travel posts: countries, traveling with mom, Tobi ----------
been = re.search(r'<section class="story" aria-labelledby="been-h".*?</section>', body, re.S).group(0)
world = re.search(r'<figure class="atlas">.*?(<svg.*?</svg>)', been, re.S).group(1)
regions = re.findall(r'<h3>(.*?)</h3><ul class="chips">(.*?)</ul>', been, re.S)
names = {code: text(re.sub(r'<span class="flag".*?</span>', "", li))
         for code, li in re.findall(r'<li[^>]*data-hello="(\w+)"[^>]*>(.*?)</li>', been, re.S)}
flags = dict(re.findall(r'<li[^>]*data-hello="(\w+)"[^>]*><span class="flag" aria-hidden="true">(.*?)</span>', been, re.S))
store = been[been.find('<div id="place-store"'):been.find('<h3 class="mom-h">')]
galleries = ""
for code, inner in re.findall(r'<div data-place="(\w+)">(.*?)</div>', store, re.S):
    if "<img" in inner:
        galleries += (f'<h3><span aria-hidden="true">{flags.get(code, "")}</span> {html.escape(names.get(code, code))}</h3>'
                      f'<div class="photos">{inner.strip()}</div>')
lede = text(re.search(r'<p class="lede">(.*?)</p>', been, re.S).group(1))
# The moves map with its flight arcs (from "My moves, on the map"), and the flag list where a tap
# says hello and opens that country's photos. Both reuse the main page's scripts.
moves_html = re.search(r'<div class="moves-wrap">(.*?)</ol>\s*</div>', body, re.S).group(1) + "</ol>"
moves_html = re.sub(r'<button class="expand"[^>]*>.*?</button>', "", moves_html)
chips = "".join(f'<h3>{t}</h3><ul class="chips">{c}</ul>' for t, c in regions)
store_html = store.replace('src="assets/', 'src="../assets/')
countries_body = (
    f"<p>Here is where I've been: {lede[0].lower() + lede[1:]}</p>"
    '<h3>My moves</h3><p class="map-hint">Tap a move to see its flight on the map.</p>'
    f'<div class="moves-wrap">{moves_html}</div>'
    '<h3>Every country, with a flag</h3><p class="map-hint">Tap a flag to hear hello. A camera means I have photos from there, and they open right below.</p>'
    f'<div class="regions">{chips}</div><div class="place-panel" id="place-panel" hidden></div>{store_html}'
)
scripts = re.findall(r"<script>.*?</script>", SRC[SRC.find("<body"):], re.S)
MAP_JS = (
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.17/d3.min.js"></script>\n'
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/topojson/1.6.9/topojson.min.js"></script>\n'
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/datamaps/0.5.9/datamaps.world.min.js"></script>\n'
    + "\n".join(sc for sc in scripts if any(k in sc for k in (
        "Swaps the hand-drawn coastlines", "var SPEECH =", 'getElementById("place-store")', 'querySelector("ol.moves")')))
)
# Style for the map, the moves list, the flags and the photo panel, taken from the main page.
css_main = "".join(re.findall(r"<style>(.*?)</style>", SRC[:SRC.find("<body")], re.S))
css_main = re.sub(r"/\*.*?\*/", "", css_main, flags=re.S)
KEEP = re.compile(r"atlas|\.arc\b|\.place\b|g\.place|\.moves|\.pill|\.callout|\.leader|arrowhead|\.chips|\.place-|\.pp-|\.regions|\.city|\.dot\b|\.ring\b|\.visit|\.carousel|\.focus|\.hot\b|\.saying|has-photos|\.star\b|\.when\b")


def pick_rules(css):
    out, i = [], 0
    while i < len(css):
        j = css.find("{", i)
        if j < 0:
            break
        sel = css[i:j].strip()
        if sel.startswith("@"):
            depth, k = 1, j + 1
            while depth and k < len(css):
                depth += {"{": 1, "}": -1}.get(css[k], 0); k += 1
            inner = pick_rules(css[j + 1:k - 1])
            if inner and (sel.startswith("@media") or sel.startswith("@supports")):
                out.append(sel + " {\n" + inner + "\n}")
            elif sel.startswith("@keyframes") and any(n in css_main for n in ()):
                pass
            i = k
            continue
        k = css.find("}", j)
        if KEEP.search(sel) and "body" not in sel:
            out.append(sel + " { " + css[j + 1:k].strip() + " }")
        i = k + 1
    return "\n".join(out)


kf = "\n".join(m.group(0) for m in re.finditer(r"@keyframes\s+[\w-]+\s*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}", css_main))
(OUT / "assets").mkdir(parents=True, exist_ok=True)
(OUT / "assets" / "map.css").write_text(
    "/* Map, moves list, flags and photo panel: copied from the main page by tools/build.py. Do not edit by hand. */\n"
    ":root { --sea: #cfe6f7; --land: #f0d9a8; --gold: #f5a623; --edge: #1b1f3b; --r: 20px; }\n"
    "@media (prefers-color-scheme: dark) { :root:not([data-theme=\"light\"]) { --sea: #0b1a36; --land: #1d3a63; --gold: #ffc94d; --edge: #000; } }\n"
    ":root[data-theme=\"dark\"] { --sea: #0b1a36; --land: #1d3a63; --gold: #ffc94d; --edge: #000; }\n"
    + pick_rules(css_main) + "\n" + kf + "\n"
    "/* blog copy: bigger letters, nothing under 16px */\n"
    ".prose .moves .when { font-size: 16px; } .prose .moves li, .prose .moves li span { font-size: 19px; }\n"
    ".prose .regions h3 { font: 700 16px var(--font-mono); letter-spacing: .08em; text-transform: uppercase; margin: 1.4em 0 .6em; }\n"
    ".prose .chips li { font-size: 18px; } .prose .place-panel button, .prose .pp-nav span, .prose .place-panel small { font-size: 16px; }\n"
    ".prose .place-panel h4 { font-size: 24px; margin: 0; } .prose .map-hint { font-size: 19px; color: var(--muted); }\n"
    ".prose .moves { padding-left: 0; } .prose .moves li { margin: 0; }\n"
    ".prose .moves-wrap > figure.atlas { position: sticky; top: 118px; z-index: 5; margin: 0 0 12px; }\n", encoding="utf-8")

mom_start = been.find('<h3 class="mom-h">')
mom_p = re.search(r"<p>(.*?)</p>", been[mom_start:], re.S).group(1)
mom_photos = re.search(r'<div class="carousel">(.*?)</div>', been[mom_start:], re.S).group(1).strip()
mom_body = f'<p>{mom_p}</p><div class="photos">{mom_photos}</div>'

dog = re.search(r"<!-- dog -->\s*(<g>.*?</g>)\s*\n\s*<path", scene, re.S).group(1)
passport = re.search(r'<article class="passport">.*?</article>', been, re.S).group(0)
tobi_txt = re.search(r"(Now I have Tobi.*?Budapest\.)", " ".join(about_ps), re.S)
tobi_body = (f"<p>{tobi_txt.group(1) if tobi_txt else 'Meet Tobi, my dog.'} He is the real star of this blog, "
             "and he has the stamps to prove it.</p>" + passport)

ART = {
    "countries": '<svg class="chap-art" viewBox="0 0 320 100" aria-hidden="true"><rect class="g" x="0" y="82" width="320" height="18"/><circle cx="110" cy="48" r="34" style="fill:var(--m-calm);stroke:var(--ink);stroke-width:2.5px"/><path d="M88 30 Q100 22 112 28 Q118 38 108 44 Q96 46 90 40 Z M114 52 Q128 48 134 58 Q130 72 118 74 Q110 64 114 52 Z M82 52 Q90 54 92 62 Q86 66 80 60 Z" style="fill:var(--m-joy);stroke:var(--ink);stroke-width:1.5px"/><path class="dash" d="M150 40 Q200 0 250 36"/><path class="k" d="M248 30 L270 26 L258 44 Z"/><circle class="s" cx="282" cy="22" r="10"/></svg>',
    "mom": '<svg class="chap-art" viewBox="0 0 320 100" aria-hidden="true"><rect class="g" x="0" y="82" width="320" height="18"/><path class="c" d="M120 80 C92 60 76 48 76 32 C76 20 85 12 96 12 C104 12 112 16 120 26 C128 16 136 12 144 12 C155 12 164 20 164 32 C164 48 148 60 120 80Z"/><path class="dash" d="M176 50 Q220 18 262 40"/><path class="k" d="M260 34 L284 30 L270 50 Z"/><circle class="s" cx="290" cy="18" r="9"/></svg>',
    "tobi": '<svg class="chap-art" viewBox="160 278 280 124" aria-hidden="true"><rect class="g" x="160" y="388" width="280" height="14"/>' + dog + '<circle class="s" cx="400" cy="300" r="10"/><g class="c"><path d="M340 330 c-6-8-20-4-16 6 l16 14 16-14 c4-10-10-14-16-6z"/></g></svg>',
}
for key, title, hook, body_html in (
    ("countries", "My moves and 37 countries", "Three continents, a lot of flights and a lot of hellos.", countries_body),
    ("mom", "Traveling with my mom", "She keeps all the pictures.", mom_body),
    ("tobi", "Meet Tobi, my very good dog", "From the Cayman Islands to Budapest, with a passport full of stamps.", tobi_body),
):
    body_html = body_html.replace('src="assets/', 'src="../assets/')
    posts.append({
        "id": key, "topic": "story", "topic_name": "My life", "group": "Travels", "kind": "Travels",
        "title": title, "title_txt": title, "hook": hook, "art": ART[key], "facts": "",
        "body": body_html, "mins": max(1, round(len(text(body_html).split()) / 230)),
        "slug": slugify(title),
    })

ICON_WA = ('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">'
           '<path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H10l-4 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/></svg>')
ICON_MAIL = ('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">'
             '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7.5l9 6 9-6"/></svg>')


def head(title, desc, depth, theme_color="#fff3dc", body_style="", extra_head="", path=""):
    up = "../" * depth
    url = f"{MAIN_SITE}/{path}"
    body_attr = f' class="tinted" style="{body_style}"' if body_style else ""
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:image" content="{MAIN_SITE}/assets/share.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Cartoon of Arpi and Tobi the dog on the Danube bank at night, with Parliament lit up behind them">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="{theme_color}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 64 64%27%3E%3Crect width=%2764%27 height=%2764%27 rx=%2718%27 fill=%27%23ffc94d%27/%3E%3Ctext x=%2714%27 y=%2748%27 font-family=%27sans-serif%27 font-weight=%27800%27 font-size=%2738%27 fill=%27%231b1f3b%27%3EA%3C/text%3E%3C/svg%3E">
<script>try{{var t=localStorage.getItem("blog-theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}}catch(e){{}}</script>
<link rel="stylesheet" href="{up}assets/fonts.css">
<link rel="stylesheet" href="{up}assets/blog.css">
{extra_head}</head>
<body{body_attr}>
<a class="skip" href="#main">Skip to content</a>
<header class="bar"><div class="in">
  <a class="brand" href="{up}index.html">{NAME}</a>
  <nav aria-label="Main">
    <a href="{up}index.html#tips"><span class="long">Budapest </span>tips</a>
    <a href="{up}index.html#story">My life</a>
    <a href="{up}table.html">Order</a>
    <a href="{up}index.html#guestbook">Guest book</a>
  </nav>
  <button class="theme" type="button" aria-label="Light or dark">&#9790;</button>
</div></header>
"""


def foot(depth, extra_js=""):
    up = "../" * depth
    digits = re.sub(r"\D", "", WHATSAPP)
    return f"""<footer class="foot"><div class="in">
  <div class="links">
    <a class="btn primary" href="https://wa.me/{digits}" target="_blank" rel="noopener">{ICON_WA} WhatsApp</a>
    <a class="btn" href="mailto:{EMAIL}">{ICON_MAIL} {EMAIL}</a>
    <a class="btn" href="{MAIN_SITE}" target="_blank" rel="noopener">My main site</a>
  </div>
  <small>This is my own private blog. Everything on it is my personal opinion and has nothing to do with any employer, past or present. Recommendations are friendly suggestions, not professional advice, so please check opening hours, prices, timetables and safety before you go.</small>
</div></footer>
<script src="{up}assets/blog.js"></script>
{extra_js}</body>
</html>
"""


def card(p, featured=False):
    style = mood_style(p)
    href = f"posts/{p['slug']}.html"
    meta = f'<span class="meta">{p["mins"]} min read</span>'
    tag = f'<span class="tag">{html.escape(p["group"])}</span>'
    if featured:
        return (f'<a class="featured" href="{href}" style="{style}"><div class="art">{p["art"]}</div>'
                f'<div class="txt">{tag}<h3>{p["title"]}</h3><p>{p["hook"]}</p>{meta}</div></a>')
    return (f'<li class="card" data-topic="{p["topic"]}" style="{style}"><a href="{href}">'
            f'<div class="art">{p["art"]}</div><div class="txt">{tag}<h3>{p["title"]}</h3>'
            f'<p>{p["hook"]}</p>{meta}</div></a></li>')


# ---------- home page ----------
home = head(SITE_TITLE, SITE_DESC, 0) + f"""<main id="main">
<div class="wrap-wide">
  <section class="hero">
    <figure class="postcard">{scene}<figcaption>Tobi and I, on the Danube</figcaption></figure>
    <div>
      <p class="eyebrow"><span class="dot" aria-hidden="true"></span>Budapest, Hungary</p>
      <h1>Hi, this is {NAME}</h1>
      <p class="aka">or Arpy, RP, AARP and many others</p>
      <p class="lede">It's really &Aacute;rp&aacute;d. I'm honored to have your attention online. What would you like to do today?</p>
    </div>
  </section>

  <a class="live" href="table.html">
    <span class="live-dot" aria-hidden="true"></span>
    <b>LIVE SERVER</b>
    <span><span class="long">At one of my tables? </span>Order here</span>
    <span class="arrow" aria-hidden="true">&rarr;</span>
  </a>

  <ul class="doors">
    <li style="--chap:var(--m-calm);--tint:var(--m-calm-bg)"><a href="#tips">
      <svg viewBox="0 0 120 90" aria-hidden="true"><rect x="8" y="58" width="104" height="22" rx="4" style="fill:var(--m-joy);stroke:var(--ink);stroke-width:3px"/><rect x="48" y="30" width="24" height="28" style="fill:var(--m-joy);stroke:var(--ink);stroke-width:3px"/><path d="M48 30 Q60 6 72 30Z" style="fill:var(--m-excited);stroke:var(--ink);stroke-width:3px"/><path d="M20 58 V40 L26 30 L32 40 V58 M88 58 V40 L94 30 L100 40 V58" style="fill:var(--m-joy);stroke:var(--ink);stroke-width:3px"/><path d="M0 84 H120" style="stroke:var(--m-calm);stroke-width:6px"/></svg>
      <b>Tips and fun facts for your Budapest / Hungary trip</b>
      <span>Getting around, food and drink, history and culture</span>
    </a></li>
    <li style="--chap:var(--m-love);--tint:var(--m-love-bg)"><a href="#story">
      <svg viewBox="0 0 120 90" aria-hidden="true"><path d="M70 84 Q66 50 76 22" style="fill:none;stroke:var(--ink);stroke-width:5px;stroke-linecap:round"/><path d="M76 22 Q60 8 40 16 M76 22 Q92 6 110 14 M76 22 Q96 22 106 38 M76 22 Q58 26 50 42" style="fill:none;stroke:var(--m-calm);stroke-width:7px;stroke-linecap:round"/><circle cx="40" cy="62" r="20" style="fill:#8b5a2b;stroke:var(--ink);stroke-width:3px"/><circle cx="33" cy="57" r="3" style="fill:var(--ink)"/><circle cx="46" cy="57" r="3" style="fill:var(--ink)"/><circle cx="40" cy="67" r="3" style="fill:var(--ink)"/></svg>
      <b>My life in a (coco)nutshell</b>
      <span>From socialist Hungary to Canada, the Cayman Islands and back, plus travels and Tobi</span>
    </a></li>
  </ul>

  <section id="tips" aria-labelledby="tips-h">
    <div class="sec-h"><h2 id="tips-h">Tips and fun facts</h2><span class="meta">{sum(p["topic"] == "tips" for p in posts)} posts</span></div>
    <ul class="grid">
      {"".join(card(p) for p in posts if p["topic"] == "tips")}
    </ul>
  </section>

  <section id="story" aria-labelledby="story-h">
    <div class="sec-h"><h2 id="story-h">My life in a (coco)nutshell</h2><span class="meta">{sum(p["topic"] != "tips" for p in posts)} posts</span></div>
    <ul class="grid">
      {"".join(card(p) for p in posts if p["topic"] != "tips")}
    </ul>
  </section>

  <section class="about" id="about" aria-labelledby="about-h">
    <div class="ava">{AVATAR}</div>
    <div>
      <h2 id="about-h">Who am I?</h2>
      {"".join(f"<p>{p}</p>" for p in about_ps)}
    </div>
  </section>

  <section class="guestbook" id="guestbook" aria-labelledby="gb-h">
    <div class="sec-h"><h2 id="gb-h">Guest book</h2></div>
    <form class="gb-form" id="gb-form" novalidate>
      <p hidden><label>Do not fill this in: <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
      <label>Your name<input name="name" maxlength="60" autocomplete="name" required></label>
      <label>Your email (optional, only I see it)<input name="email" type="email" maxlength="120" autocomplete="email"></label>
      <label>Your message<textarea name="msg" maxlength="600" rows="4" required></textarea></label>
      <button type="submit" class="btn primary">Sign the guest book</button>
      <p class="gb-status" id="gb-status" role="status" aria-live="polite"></p>
      <p class="gb-note">Your name and message are public. Your email stays private and is only used to reply to you.</p>
    </form>
    <ol class="gb-list" id="gb-list" aria-label="Guest book messages"></ol>
  </section>
</div>
</main>
""" + foot(0)
(OUT / "index.html").write_text(home, encoding="utf-8")

# ---------- post pages ----------
(OUT / "posts").mkdir(exist_ok=True)
for old in (OUT / "posts").glob("*.html"):
    old.unlink()
for i, p in enumerate(posts):
    prev_p = posts[i - 1] if i > 0 else None
    next_p = posts[i + 1] if i + 1 < len(posts) else None
    facts = f'<ul class="facts" aria-label="At a glance">{p["facts"]}</ul>' if p["facts"] else ""
    pager = '<nav class="pager" aria-label="More posts">'
    if prev_p:
        pager += f'<a href="{prev_p["slug"]}.html"><small>&larr; Previous</small><b>{prev_p["title"]}</b></a>'
    else:
        pager += "<span></span>"
    if next_p:
        pager += f'<a class="next" href="{next_p["slug"]}.html"><small>Next &rarr;</small><b>{next_p["title"]}</b></a>'
    pager += "</nav>"
    page = head(f'{p["title_txt"]} · {SITE_TITLE}', text(p["hook"]) or SITE_DESC, 1, body_style=mood_style(p), extra_head='<link rel="stylesheet" href="../assets/map.css">\n' if p["id"] == "countries" else "", path=f'posts/{p["slug"]}.html') + f"""<main id="main">
<article>
  <div class="wrap post-head">
    <a class="tag" href="../index.html#{p['topic']}">{html.escape(p['topic_name'] if p['topic_name'] == p['group'] else p['topic_name'] + ' · ' + p['group'])}</a>
    <h1>{p['title']}</h1>
    {f'<p class="sub">{p["hook"]}</p>' if p['hook'] else ''}
    <div class="byline"><span class="ava">{AVATAR}</span><span><b>{NAME}</b><span class="meta">{p['mins']} min read · {MOOD_WORD[MOODS.get(p['id'], 'joy')]}</span></span></div>
  </div>
  <div class="cover"><div class="frame">{p['art']}</div></div>
  <div class="wrap">
    {facts}
    <div class="prose">
{p['body']}
    </div>
    <div class="post-end">
      <p>Enjoyed this? Leave me a note.</p>
      <a class="btn primary" href="../index.html#guestbook">Sign the guest book</a>
    </div>
    {pager}
  </div>
</article>
</main>
""" + foot(1, MAP_JS if p["id"] == "countries" else "")
    (OUT / "posts" / f'{p["slug"]}.html').write_text(page, encoding="utf-8")

# ---------- assets: fonts and only the photos the posts use ----------
(OUT / "assets" / "img").mkdir(parents=True, exist_ok=True)
shutil.copytree(ROOT / "assets" / "fonts", OUT / "assets" / "fonts", dirs_exist_ok=True)
faces = re.findall(r"@font-face \{[^}]*\}", SRC[:SRC.find("<body")])
(OUT / "assets" / "fonts.css").write_text("\n".join(f.replace('url("assets/fonts/', 'url("fonts/') for f in faces) + "\n", encoding="utf-8")
used = set(re.findall(r'assets/img/([\w.-]+)', "".join(p["body"] for p in posts)))
for old in (OUT / "assets" / "img").iterdir():
    if old.name not in used:
        old.unlink()
for name in used:
    shutil.copy(ROOT / "assets" / "img" / name, OUT / "assets" / "img" / name)

# ---------- order pad: the table page, the private inbox and its function ----------
for f in ("table.html", "tables-qr.html", "inbox.html", "inbox-sw.js", "inbox.webmanifest"):
    shutil.copy(ROOT / f, OUT / f)
for f in ("table.js", "table.css", "menu.js"):
    shutil.copy(ROOT / "assets" / f, OUT / "assets" / f)
with open(OUT / "assets" / "table.css", "a", encoding="utf-8") as fh:
    fh.write("\n/* blog copy: no text smaller than 16px */\n.tbl-kicker { font-size: 16px; }\n"
             ".tbl-panel .item .info small, .tbl-panel .item .price { font-size: 16px; }\n"
             "/* darker teal so the kicker reads well on cream (about 5:1) */\n"
             ".tbl-kicker { color: #0b6e63; }\n"
             "@media (prefers-color-scheme: dark) { .tbl-kicker { color: var(--p2, #12a594); } }\n")
shutil.copytree(ROOT / "assets" / "app", OUT / "assets" / "app", dirs_exist_ok=True)
(OUT / "netlify" / "functions").mkdir(parents=True, exist_ok=True)
for f in ("guestbook.mjs", "table.mjs"):
    shutil.copy(ROOT / "netlify" / "functions" / f, OUT / "netlify" / "functions" / f)

# ---------- for search engines: sitemap and robots ----------
urls = [f"{MAIN_SITE}/"] + [f'{MAIN_SITE}/posts/{p["slug"]}.html' for p in posts]
(OUT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                                 + "".join(f"  <url><loc>{u}</loc></url>\n" for u in urls) + "</urlset>\n", encoding="utf-8")
(OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {MAIN_SITE}/sitemap.xml\n", encoding="utf-8")

print(f"{len(posts)} posts, {len(used)} photos")
