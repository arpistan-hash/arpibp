# Arpi's blog copy

A blog version of the main site, using the reading layout people find most comfortable
(the Medium style: one calm column, big serif text, about 60 characters per line),
dressed in the main site's own look: cream paper, navy outlines, coral and teal, the cartoon.

- `index.html` is the home page: hero, a featured post, all posts as cards, about, guest book.
- `posts/` has one page per tip and story chapter (28 in total).
- `tools/build.py` rebuilds everything from the main site's `index.html`, so edits there carry over:
  `python3 blog-copy/tools/build.py`
- The guest book runs on the Netlify function in `netlify/functions/guestbook.mjs`.

To put it online, make a new Netlify site from this repository with **blog-copy** as the base directory.
Nothing here changes the main site.
