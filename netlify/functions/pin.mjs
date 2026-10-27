// Staff sign-in: trade the staff PIN for a token. Rate limited so the PIN cannot be guessed quickly.
import { staffTokenFor } from "./lib/token.mjs";

const json = (d, status = 200) => new Response(JSON.stringify(d), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});

export default async (req) => {
  const pin = Netlify.env.get("STAFF_PIN");
  if (!pin) return json({ error: "STAFF_PIN is not set on this site" }, 503);
  const want = await staffTokenFor(pin);
  if (req.method === "GET") return json({ staff: req.headers.get("x-staff-token") === want });
  if (req.method !== "POST") return json({ error: "not found" }, 404);
  let given = "";
  try { given = String((await req.json()).pin || ""); } catch { given = ""; }
  if (given && given === String(pin)) return json({ token: want });
  await new Promise((r) => setTimeout(r, 900));
  return json({ error: "wrong pin" }, 401);
};

export const config = {
  path: "/api/pin",
  rateLimit: { windowLimit: 20, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
