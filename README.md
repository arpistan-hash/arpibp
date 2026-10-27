# Lounge table service

Guests scan the table QR code (or open the link), type their table number or name, and order.
No app, no account, no sign-in.

Staff open the same site with `#staff` at the end of the address and enter the staff PIN.
That phone then shows the staff board (live requests, tables, Notepad for Micros, menu editor).

- `public/` the page (`index.html`) and `shim.js`, which connects it to the API
- `netlify/functions/api.mjs` guest requests, staff board, menu (Netlify Blobs storage)
- `netlify/functions/pin.mjs` staff sign-in, rate limited
- `STAFF_PIN` environment variable on Netlify: the staff PIN. Change it to sign every phone out.

QR code for a table: `https://<site>/#t12` opens the menu already set to table 12.
