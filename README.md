# Lounge table service

Guests scan the table QR code (or open the link), type their table number or name, and order.
No app, no account, no sign-in.

The guest app and the staff app are two separate pages:

- `/` is the guest app. Each phone gets its own random id and only ever sees its own table
  (one table, or two pushed together for a big group). "Finish and clear this phone" wipes it.
  There is no way into staff screens from here.
- `/crew` is the staff app (Orders and Notepad). It asks for the staff PIN first.
  From the Orders tab staff can post a notice ("running low on...") that shows on the guest menu.

- `public/` the two pages and `shim.js`, which connects them to the API
- `netlify/functions/api.mjs` guest requests, staff board, menu and notice (Netlify Blobs storage)
- `netlify/functions/pin.mjs` staff sign-in, rate limited
- `STAFF_PIN` environment variable on Netlify: the staff PIN. Change it to sign every phone out.

QR code for a table: `https://<site>/#t12` opens the menu already set to table 12.
