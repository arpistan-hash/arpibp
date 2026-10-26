// Guest book: saves and lists messages in Netlify Blobs, so it works without any
// tokens or settings in the Netlify dashboard.
// GET  /.netlify/functions/guestbook -> { entries: [{ id, name, msg, ts, reply? }] } (newest first)
// POST /.netlify/functions/guestbook  { name, email?, msg, "bot-field"? } -> { ok, entry }
// POST /.netlify/functions/guestbook  { key, import: "old" } -> { ok, added } (one-time copy of the messages people
//                                     left on the old Netlify copy of the site; already-copied ones are skipped)
// POST /.netlify/functions/guestbook  { key, reply: "<id>", msg } -> { ok, reply } (Arpi answers under a message;
//                                     an empty msg removes the answer). key is the same private key as the table inbox.
// Every message is shown right away. Email addresses are kept in a separate private
// store and are never returned.
import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";

// Only the SHA-256 of Arpi's private key lives in this public repo (same key as the table inbox).
const KEY_SHA256 = "2a4bc831536c0bb03c11c5c8f8e347012c50ab97263656e4b03819c924f4fd52";
// The old copy of the site where the first guest book messages were left (its public list, no emails).
const OLD_SITE = "https://luminous-toffee-bd5ddd.netlify.app/.netlify/functions/guestbook";
const isOwner = (key) => !!key && createHash("sha256").update(String(key)).digest("hex") === KEY_SHA256;

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
  return rows
    .map((r, i) => (r && r.name && r.msg ? { id: keys[i].slice(2), name: r.name, msg: r.msg, ts: r.ts, reply: r.reply || null } : null))
    .filter(Boolean);
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

  if (data.import !== undefined) {
    if (!isOwner(data.key)) return json(403, { error: "forbidden" });
    let old;
    try {
      const r = await fetch(OLD_SITE, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error("status " + r.status);
      old = ((await r.json()) || {}).entries || [];
    } catch (e) {
      console.error("guestbook import fetch failed", e);
      return json(502, { error: "old_site_unreachable" });
    }
    let added = 0;
    for (const e of old) {
      const id = clean(e && e.id, 40), name = clean(e && e.name, 60), msg = clean(e && e.msg, 600), ts = Number(e && e.ts) || 0;
      if (!/^[0-9]{15}-[0-9a-z]+$/.test(id) || !name || !msg || !ts) continue;
      if (await store.get("e/" + id, { type: "json" }).catch(() => null)) continue; // copied before
      const reply = e.reply && e.reply.msg ? { msg: clean(e.reply.msg, 1000), ts: Number(e.reply.ts) || ts } : null;
      await store.setJSON("e/" + id, reply ? { name, msg, ts, reply } : { name, msg, ts });
      added++;
    }
    return json(200, { ok: true, added });
  }

  if (data.reply !== undefined) {
    if (!isOwner(data.key)) return json(403, { error: "forbidden" });
    const id = clean(data.reply, 40);
    if (!/^[0-9]{15}-[0-9a-z]+$/.test(id)) return json(400, { error: "bad_id" });
    const entry = await store.get("e/" + id, { type: "json" }).catch(() => null);
    if (!entry) return json(404, { error: "not_found" });
    const text = clean(data.msg, 1000);
    const reply = text ? { msg: text, ts: Date.now() } : null;
    const { reply: _old, ...rest } = entry;
    await store.setJSON("e/" + id, reply ? { ...rest, reply } : rest);
    return json(200, { ok: true, reply });
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
    return json(200, { ok: true, entry: { id: key.slice(2), ...entry, reply: null } });
  } catch (e) {
    console.error("guestbook save failed", e);
    return json(500, { error: "save_failed" });
  }
};
