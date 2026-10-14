# Arpi · budapesthungry.com

A fast, dependency-free static site: plain HTML, CSS and a little vanilla JS. There is no build step, so it deploys as-is on Netlify, GitHub Pages or any static host.

```
index.html             the whole page (content lives here)
assets/css/styles.css  design tokens, light/dark theme, layout
assets/js/main.js      interactions (theme, maps, lightbox, form, live clock)
assets/img/            photos (WebP) + og.png social preview
assets/fonts/          self-hosted Geist, Geist Mono, Instrument Serif
favicon.svg  robots.txt  sitemap.xml
archive/               the previous single-file version of the site, kept as a backup
```

## Putting it on budapesthungry.com (GoDaddy)

The repo was created from Netlify, so these steps assume Netlify is hosting. Do them in your own Netlify and GoDaddy accounts; never share your passwords with anyone.

1. **Netlify → your site → Domain management → Add a domain** → `budapesthungry.com`. Make the apex domain (`budapesthungry.com`) the *primary* and let `www` redirect to it.
2. **Connect the domain in GoDaddy**, using either option:
   - **A. Use Netlify DNS (easiest, recommended).** Netlify shows four name servers after you choose *Set up Netlify DNS*. In GoDaddy open *My Products → budapesthungry.com → DNS → Nameservers → Change → "I'll use my own nameservers"*, paste Netlify's four, and save.
   - **B. Keep GoDaddy DNS.** In *DNS → Records*, delete the default parked/"WebsiteBuilder" `A` record for `@`, and any domain forwarding. Then add an `A` record `@` → the load-balancer IP that Netlify shows for your site (currently `75.2.60.5`), and a `CNAME` record `www` → `<your-site-name>.netlify.app`.
3. Wait for DNS to propagate (usually minutes, at most 24–48 hours). In Netlify click **Verify DNS**, then **HTTPS → Provision certificate**, and enable **Force HTTPS**.

If the site is hosted on GitHub Pages instead: add four `A` records for `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`, a `CNAME` for `www` → `arpistan-hash.github.io`, set the custom domain in the repo's *Settings → Pages*, and tick *Enforce HTTPS*.

`index.html` already points its canonical, `og:url`, and preview image at `https://budapesthungry.com/`, so link previews work once the domain is live.

## Everyday edits

- **Contact details:** change `CONTACT` at the top of `assets/js/main.js`. It rewrites every WhatsApp, email and Revolut link on the page. The same values are also in `index.html` as the no-JavaScript fallback, so update both.
- **Text:** edit `index.html` directly. Each life chapter is an `<article class="chapter">`.
- **Photos:** drop a WebP into `assets/img/` and add a `<button class="ph" style="--ar:W/H">` inside the matching `data-gallery` block. `--ar` is the width divided by the height, so the mosaic keeps every photo's proportions.
- **Colours:** the palette is a handful of CSS variables at the top of `styles.css` (a coral to amber accent on ink and paper). The dark theme overrides the same variables.

## Notes

- **Message form:** it uses [Netlify Forms](https://docs.netlify.com/forms/setup/) (`data-netlify="true"`), so submissions appear in the Netlify dashboard and your email address stays private. Make sure form detection is enabled for the site. On any other host the POST fails and the page offers a pre-filled WhatsApp message instead.
- **Maps:** country outlines come from Natural Earth (via `world-atlas`) and are baked into the HTML as SVG, so there are no map libraries to load and no third-party requests at runtime.
