# My Budapest Childhood

A small static web app: a walking tour of Budapest told through personal childhood memories.

- Map with numbered stops; tap one to read the story, hear it read aloud, or get walking directions.
- Walk mode uses GPS and opens the story when you are within 40 m of a stop.
- "+ Add memory" lets you tap the map (or use your location), write a story and attach a photo. Memories are stored in the browser (localStorage); use Export / Import to back them up or move them between devices.
- Optional "then and now" slider when a story has both `photo` and `photoNow`.

## Run it
Open `index.html` in a browser, or serve the folder (`python3 -m http.server`). Geolocation needs https or localhost.
Leaflet is bundled in `vendor/`; map tiles come from OpenStreetMap and need a connection.

## Edit the starter stories
`stories.js`. Entries marked EXAMPLE are placeholders. Coordinates are approximate.

## Photos
Fortepan photos are CC BY-SA 3.0: keep the photo ID and credit in the `credit` field.
Not part of the live blog: Netlify publishes only `blog-copy/`.
