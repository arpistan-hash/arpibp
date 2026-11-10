# Bud Bud: your Budapest buddy

Static front end (`index.html`, `app.js`, `topics.js`, `style.css`) plus two Netlify functions:

- `netlify/functions/ask.mjs` (existing): visitor questions, answered by Arpi.
- `netlify/functions/board.mjs` (new): the "Fellow tourists" board. Anonymous nickname posts and replies, no accounts.
  - Posts expire two days after the "leaving" date (or after 14 days if none is given).
  - Links, emails and phone numbers are refused in public text.
  - Three reports hide a post; Arpi can delete one with the owner key (`POST {key, remove: id}`) and see everything with `GET ?key=`.
  - One action per visitor every 30 seconds; honeypot field for bots.

Edit the knowledge base in `topics.js`. Texts are drafts: verify before publishing.

Not live yet: Netlify publishes only `blog-copy/`, and functions are built from `netlify/functions/`. To go live, copy this folder into `blog-copy/` (e.g. as `budbud/`) or point a new Netlify site at it.
Next step: private messages (needs a light sign-in, block and report).
