# Arpi's page

A personal page: a friendly guide to Budapest plus a life story.

- `index-1.html`: English page. `index-hu.html`: Hungarian page.
- `assets/img/`: photos as WebP (lazy loaded). `assets/fonts/`: self-hosted fonts (Bricolage Grotesque, Instrument Sans, JetBrains Mono, Newsreader).
- `audio/`: the "hello" clips behind the flag buttons (see `audio/README.md` for the list).

Host the HTML files together with the `assets/` and `audio/` folders, side by side. The pages load everything with relative paths, so no build step is needed.
The guest book only stores messages when the page runs inside Claude; elsewhere it falls back to sending a WhatsApp message.
