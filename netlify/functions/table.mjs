// Table messages: guests at Arpi's tables send a note ("Table 5: two more beers please"),
// and Arpi watches them arrive on the private inbox page (/inbox.html#<key>).
// POST /.netlify/functions/table  { table, msg, allergy?, "bot-field"? } -> { ok }  (allergy is flagged red in the inbox)
// GET  /.netlify/functions/table?key=<key>                              -> { messages: [...] } (inbox only)
// POST /.netlify/functions/table  { key, done: "<id>" }                 -> { ok } (inbox marks one handled)
// Only the SHA-256 of the inbox key lives in this public repo; the key itself is Arpi's link.
import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";

const KEY_SHA256 = "e098fdb3ccaba18e92f70171233174fd8ad6f66d813129d7fe8bcc804f87a2ed";
const KEEP_MS = 12 * 60 * 60 * 1000; // messages older than 12 hours are cleared
const WAIT_MS = 8 * 1000; // one message per guest every 8 seconds

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const clean = (v, max) => String(v == null ? "" : v).trim().slice(0, max);
const isOwner = (key) => !!key && createHash("sha256").update(String(key)).digest("hex") === KEY_SHA256;

async function readBody(req) {
  const type = req.headers.get("content-type") || "";
  if (type.includes("application/json")) return (await req.json()) || {};
  return Object.fromEntries(new URLSearchParams(await req.text()));
}

async function listMessages(store) {
  const { blobs } = await store.list({ prefix: "m/" });
  const now = Date.now(), out = [];
  await Promise.all(
    blobs.map(async ({ key }) => {
      const m = await store.get(key, { type: "json" }).catch(() => null);
      if (!m || now - (m.ts || 0) > KEEP_MS) { await store.delete(key).catch(() => {}); return; }
      out.push({ id: key.slice(2), table: m.table, msg: m.msg, allergy: m.allergy || "", ts: m.ts, done: !!m.done });
    })
  );
  return out.sort((a, b) => b.ts - a.ts);
}

export default async (req, context) => {
  const store = getStore({ name: "table-messages", consistency: "strong" });
  const url = new URL(req.url);

  if (req.method === "GET") {
    if (!isOwner(url.searchParams.get("key"))) return json(403, { error: "forbidden" });
    try {
      return json(200, { messages: await listMessages(store) });
    } catch (e) {
      console.error("table list failed", e);
      return json(500, { error: "load_failed" });
    }
  }

  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  let data;
  try {
    data = await readBody(req);
  } catch (e) {
    return json(400, { error: "bad_request" });
  }

  if (data.done !== undefined) {
    if (!isOwner(data.key)) return json(403, { error: "forbidden" });
    const id = clean(data.done, 80);
    if (!/^[0-9a-z-]+$/.test(id)) return json(400, { error: "bad_id" });
    const m = await store.get("m/" + id, { type: "json" });
    if (m) await store.setJSON("m/" + id, { ...m, done: true });
    return json(200, { ok: true });
  }

  if (data["bot-field"]) return json(200, { ok: true }); // quietly ignore bots
  const table = clean(data.table, 12);
  const msg = clean(data.msg, 1200);
  const allergy = clean(data.allergy, 300);
  if (!table || (!msg && !allergy)) return json(400, { error: "missing_fields" });

  try {
    const ip = (context && context.ip) || "unknown";
    const limits = getStore({ name: "table-limits", consistency: "strong" });
    const last = Number(await limits.get(ip)) || 0;
    const now = Date.now();
    if (now - last < WAIT_MS) return json(429, { error: "too_fast" });
    await limits.set(ip, String(now));
    const id = String(now).padStart(15, "0") + "-" + Math.random().toString(36).slice(2, 8);
    await store.setJSON("m/" + id, { table, msg, allergy, ts: now, done: false });
    return json(200, { ok: true });
  } catch (e) {
    console.error("table save failed", e);
    return json(500, { error: "save_failed" });
  }
};
