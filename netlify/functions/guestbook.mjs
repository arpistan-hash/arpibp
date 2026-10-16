// Guest book: saves and lists messages in Netlify Blobs, so it works without any
// tokens or settings in the Netlify dashboard.
// GET  /.netlify/functions/guestbook -> { entries: [{ name, msg, ts }] } (newest first)
// POST /.netlify/functions/guestbook  { name, email?, msg, "bot-field"? } -> { ok, entry }
// Every message is shown right away. Email addresses are kept in a separate private
// store and are never returned.
import { getStore } from "@netlify/blobs";

const MAX_SHOWN = 200;
const WAIT_MS = 30 * 1000; // one message per visitor every 30 seconds

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const clean = (v, max) => String(v == null ? "" : v).trim().slice(0, max);

async function readBody(req) {
  const type = req.headers.get("content-type") || "";
  if (type.includes("application/json")) return (await req.json()) || {};
  return Object.fromEntries(new URLSearchParams(await req.text()));
}

async function list(store) {
  const { blobs } = await store.list({ prefix: "e/" });
  const keys = blobs.map((b) => b.key).sort().reverse().slice(0, MAX_SHOWN);
  const rows = await Promise.all(keys.map((k) => store.get(k, { type: "json" }).catch(() => null)));
  return rows.filter((r) => r && r.name && r.msg).map((r) => ({ name: r.name, msg: r.msg, ts: r.ts }));
}

export default async (req, context) => {
  const store = getStore({ name: "guestbook", consistency: "strong" });

  if (req.method === "GET") {
    try {
      return json(200, { entries: await list(store) });
    } catch (e) {
      console.error("guestbook list failed", e);
      return json(500, { entries: [], error: "load_failed" });
    }
  }

  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  let data;
  try {
    data = await readBody(req);
  } catch (e) {
    return json(400, { error: "bad_request" });
  }
  if (data["bot-field"]) return json(200, { ok: true }); // quietly ignore bots

  const name = clean(data.name, 60);
  const msg = clean(data.msg, 600);
  const email = clean(data.email, 200);
  if (!name || !msg) return json(400, { error: "missing_fields" });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: "bad_email" });

  try {
    const ip = (context && context.ip) || "unknown";
    const limits = getStore({ name: "guestbook-limits", consistency: "strong" });
    const last = Number(await limits.get(ip)) || 0;
    const now = Date.now();
    if (now - last < WAIT_MS) return json(429, { error: "too_fast" });
    await limits.set(ip, String(now));

    const key = "e/" + String(now).padStart(15, "0") + "-" + Math.random().toString(36).slice(2, 8);
    const entry = { name, msg, ts: now };
    await store.setJSON(key, entry);
    if (email) await getStore("guestbook-private").setJSON(key, { name, email, ts: now });
    return json(200, { ok: true, entry });
  } catch (e) {
    console.error("guestbook save failed", e);
    return json(500, { error: "save_failed" });
  }
};
