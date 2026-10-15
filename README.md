# Arpi's page

A personal page: a friendly guide to Budapest plus a life story.

- `index-1.html`: English page. `index-hu.html`: Hungarian page.
- `assets/img/`: photos as WebP (lazy loaded). `assets/fonts/`: self-hosted fonts (Bricolage Grotesque, Instrument Sans, JetBrains Mono, Newsreader).

Host the HTML files together with the `assets/` folder, side by side. The pages load everything with relative paths, so no build step is needed.
The guest book only stores messages when the page runs inside Claude; elsewhere it falls back to sending a WhatsApp message.

The flag buttons say hello with the visitor's own device voice (the browser's speech synthesis), so there are no sound files to host. If a device has no voice for a language, that flag stays silent.
