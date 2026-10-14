# Arpi · personal site

A fast, dependency-free static site: plain HTML, CSS and a little vanilla JS. No build step, so it deploys as-is on Netlify, GitHub Pages or any static host.

```
index.html            the whole page (content lives here)
assets/css/styles.css design tokens, light/dark theme, layout
assets/js/main.js     interactions (theme, maps, lightbox, form, live clock)
assets/img/           photos (WebP) + og.png social preview
assets/fonts/         self-hosted fonts, so no third-party requests
favicon.svg
archive/              the previous single-file version of the site, kept as a backup
```

## Everyday edits

- **Contact details:** change `CONTACT` at the top of `assets/js/main.js`. It rewrites every WhatsApp, email and Revolut link on the page. The same values are also in `index.html` as the no-JavaScript fallback, so update both.
- **Text:** edit `index.html` directly. Each life chapter is an `<article class="chapter">`.
- **Photos:** drop a WebP into `assets/img/` and add a `<button class="ph" style="--ar:W/H">` inside the matching `data-gallery` block. `--ar` is the width divided by the height, which lets the mosaic keep every photo's proportions.
- **Colours:** the palette is a handful of CSS variables at the top of `styles.css` (coral, teal, gold, navy). The dark theme overrides the same variables.

## Notes

- **Message form:** it uses [Netlify Forms](https://docs.netlify.com/forms/setup/) (`data-netlify="true"`), so submissions appear in the Netlify dashboard, and your email address stays private. Make sure form detection is enabled for the site. On any other host the POST fails and the page falls back to a pre-filled WhatsApp message.
- **Social preview:** `og:image` in `index.html` is a relative path. Some platforms only accept absolute URLs, so once the domain is final, change it to `https://your-domain/assets/img/og.png`.
- **Maps:** country outlines come from Natural Earth (via `world-atlas`) and are baked into the HTML as SVG, so there are no map libraries to load.
