# Arpi's page

A personal page: a friendly guide to Budapest plus a life story.

- `index-1.html`: the page (the website copy is `index.html` on `main`, kept in sync automatically).
- `assets/img/`: photos as WebP (lazy loaded). `assets/fonts/`: self-hosted fonts (Bricolage Grotesque, Instrument Sans, JetBrains Mono, Newsreader).

Host the HTML files together with the `assets/` folder, side by side. The pages load everything with relative paths, so no build step is needed.
The guest book only stores messages when the page runs inside Claude; elsewhere it falls back to sending a WhatsApp message.

The flag buttons say hello with the visitor's own device voice (the browser's speech synthesis), so there are no sound files to host. If a device has no voice for a language, that flag stays silent.

## Design

"Night Danube": dark-first navy theme with a light option (toggle in the top bar, remembered in the browser), sticky top navigation, chapter cards with scroll reveal, and a single sound toggle for the hello flags and route sounds. Contact details live once at the end of the page; the bottom bar hides when they are in view. Both language files share the same CSS and JS.
