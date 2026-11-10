# Bud Bud: your Budapest buddy

Static front end (`index.html`, `app.js`, `topics.js`, `style.css`) plus two Netlify functions:

- `netlify/functions/ask.mjs` (existing): visitor questions, answered by Arpi.
- `netlify/functions/board.mjs` (new): the "Fellow tourists" board. Anonymous nickname posts and replies, no accounts.
  - Posts expire two days after the "leaving" date (or after 14 days if none is given).
  - Links, emails and phone numbers are refused in public text.
  - Three reports hide a post; Arpi can delete one with the owner key (`POST {key, remove: id}`) and see everything with `GET ?key=`.
  - Optional meeting time and optional rough area: the phone snaps its GPS to a ~500 m grid cell before sending, the server snaps again and stores only the cell centre (Budapest area only). Shown as a link to the map.
  - One action per visitor every 30 seconds; honeypot field for bots.

Edit the knowledge base in `topics.js`. Texts are drafts: verify before publishing.

Not live yet: Netlify publishes only `blog-copy/`, and functions are built from `netlify/functions/`. To go live, copy this folder into `blog-copy/` (e.g. as `budbud/`) or point a new Netlify site at it.
Next step: private messages (needs a light sign-in, block and report).

The daily 6 PM meetup card is `window.MEETUP` in `topics.js`. Set the real public place before going live.

## Install as an app (PWA)
`manifest.webmanifest`, `sw.js` and the icons make Bud Bud installable ("Add to Home Screen" on phones, "Install" in Chrome/Edge). The topics work offline; the board and questions need a connection.
Use relative paths only, so the folder works from any URL path (e.g. `/budbud/`). Bump `CACHE` in `sw.js` when you change cached files.
