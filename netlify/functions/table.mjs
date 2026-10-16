// Table messages: guests at Arpi's tables send a note ("Table 5: two more beers please"),
// and Arpi watches them arrive on the private inbox page (/inbox.html#<key>).
// POST /.netlify/functions/table  { table, msg, allergy?, "bot-field"? } -> { ok }  (allergy is flagged red in the inbox)
// GET  /.netlify/functions/table?key=<key>                              -> { messages: [...] } (inbox only)
// POST /.netlify/functions/table  { key, done: "<id>" }                 -> { ok } (inbox marks one handled)
// GET  /.netlify/functions/table?key=<key>&vapid=1                      -> { publicKey } (for phone notifications)
// POST /.netlify/functions/table  { key, subscribe: <PushSubscription> } -> { ok } (this phone gets a push per message)
// POST /.netlify/functions/table  { key, test: true }                   -> { ok, sent } (sends a test push)
// Push keys are made on first use and kept in Netlify Blobs, so there is nothing to configure.
// Only the SHA-256 of the inbox key lives in this public repo; the key itself is Arpi's link.
import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";
import webpush from "web-push";

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

// Phone notifications (Web Push). The VAPID key pair is created once and stored with the subscriptions.
async function vapid(push) {
  let v = await push.get("vapid", { type: "json" });
  if (!v) {
    v = webpush.generateVAPIDKeys();
    const { modified } = await push.setJSON("vapid", v, { onlyIfNew: true });
    if (!modified) v = await push.get("vapid", { type: "json" });
  }
  return v;
}

async function notify(push, payload) {
  const v = await vapid(push);
  const { blobs } = await push.list({ prefix: "s/" });
  let sent = 0;
  await Promise.all(
    blobs.map(async ({ key }) => {
      const sub = await push.get(key, { type: "json" }).catch(() => null);
      if (!sub) return;
      try {
        await webpush.sendNotification(sub, JSON.stringify(payload), {
          vapidDetails: { subject: "https://budapesthungry.com", publicKey: v.publicKey, privateKey: v.privateKey },
          TTL: 3600,
          urgency: "high",
          timeout: 5000,
        });
        sent++;
      } catch (e) {
        if (e && (e.statusCode === 404 || e.statusCode === 410)) await push.delete(key).catch(() => {});
        else console.error("push failed", e && e.statusCode, e && e.body);
      }
    })
  );
  return sent;
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
  const push = getStore({ name: "table-push", consistency: "strong" });
  const url = new URL(req.url);

  if (req.method === "GET") {
    if (!isOwner(url.searchParams.get("key"))) return json(403, { error: "forbidden" });
    if (url.searchParams.get("vapid")) return json(200, { publicKey: (await vapid(push)).publicKey });
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

  if (data.subscribe !== undefined) {
    if (!isOwner(data.key)) return json(403, { error: "forbidden" });
    const sub = data.subscribe || {};
    if (typeof sub.endpoint !== "string" || !/^https:\/\//.test(sub.endpoint) || !sub.keys || !sub.keys.p256dh || !sub.keys.auth)
      return json(400, { error: "bad_subscription" });
    const id = createHash("sha256").update(sub.endpoint).digest("hex").slice(0, 32);
    await push.setJSON("s/" + id, { endpoint: sub.endpoint, keys: { p256dh: String(sub.keys.p256dh), auth: String(sub.keys.auth) } });
    return json(200, { ok: true });
  }

  if (data.test !== undefined) {
    if (!isOwner(data.key)) return json(403, { error: "forbidden" });
    const sent = await notify(push, { title: "Table 7", body: "This is a test. Your phone will buzz like this for every table.", tag: "test" });
    return json(200, { ok: true, sent });
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
    await notify(push, {
      title: (allergy ? "\u26A0\uFE0F ALLERGY \u00b7 " : "") + "Table " + table,
      body: [allergy, msg].filter(Boolean).join("\n").slice(0, 400),
      tag: "table-" + id,
      urgent: !!allergy,
    }).catch((e) => console.error("notify failed", e));
    return json(200, { ok: true });
  } catch (e) {
    console.error("table save failed", e);
    return json(500, { error: "save_failed" });
  }
};
