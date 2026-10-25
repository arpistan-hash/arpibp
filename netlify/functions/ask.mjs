// Ask Arpi: visitors ask a question about Budapest, Arpi answers within 24 hours, and the
// answered questions are shown on the blog. Unanswered questions stay private.
// GET  /.netlify/functions/ask                      -> { questions: [{ id, name, q, ts, a, ats }] } (answered only, newest first)
// GET  /.netlify/functions/ask?key=<key>            -> { questions: [...] } (all, incl. unanswered and emails, for Arpi)
// POST /.netlify/functions/ask  { name?, email?, q, "bot-field"? } -> { ok }
// POST /.netlify/functions/ask  { key, answer: "<id>", msg }      -> { ok, a } (empty msg hides the answer again)
// POST /.netlify/functions/ask  { key, remove: "<id>" }           -> { ok } (delete spam)
// A new question buzzes Arpi's phone through the same push subscriptions as the table inbox.
import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";
import webpush from "web-push";

// Only the SHA-256 of Arpi's private key lives in this public repo (same key as the table inbox).
const KEY_SHA256 = "2a4bc831536c0bb03c11c5c8f8e347012c50ab97263656e4b03819c924f4fd52";
const MAX_SHOWN = 200;
const WAIT_MS = 30 * 1000; // one question per visitor every 30 seconds

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const clean = (v, max) => String(v == null ? "" : v).trim().slice(0, max);
const isOwner = (key) => !!key && createHash("sha256").update(String(key)).digest("hex") === KEY_SHA256;
const validId = (id) => /^[0-9]{15}-[0-9a-z]+$/.test(id);

async function readBody(req) {
  const type = req.headers.get("content-type") || "";
  if (type.includes("application/json")) return (await req.json()) || {};
  return Object.fromEntries(new URLSearchParams(await req.text()));
}

async function list(store, all) {
  const { blobs } = await store.list({ prefix: "q/" });
  const keys = blobs.map((b) => b.key).sort().reverse();
  const rows = await Promise.all(keys.map((k) => store.get(k, { type: "json" }).catch(() => null)));
  return rows
    .map((r, i) => (r && r.q ? { id: keys[i].slice(2), name: r.name || "", q: r.q, ts: r.ts, a: r.a || "", ats: r.ats || null } : null))
    .filter((r) => r && (all || r.a))
    .slice(0, MAX_SHOWN);
}

// Best effort: a failed buzz never loses the question.
async function buzz(title, body) {
  const push = getStore({ name: "table-push", consistency: "strong" });
  const v = await push.get("vapid", { type: "json" });
  if (!v) return;
  const { blobs } = await push.list({ prefix: "s/" });
  await Promise.all(
    blobs.map(async ({ key }) => {
      const sub = await push.get(key, { type: "json" }).catch(() => null);
      if (!sub) return;
      try {
        await webpush.sendNotification(sub, JSON.stringify({ title, body, tag: "ask" }), {
          vapidDetails: { subject: "https://budapesthungry.com", publicKey: v.publicKey, privateKey: v.privateKey },
          TTL: 86400,
          timeout: 5000,
        });
      } catch (e) {
        if (e && (e.statusCode === 404 || e.statusCode === 410)) await push.delete(key).catch(() => {});
      }
    })
  );
}

export default async (req, context) => {
  const store = getStore({ name: "ask", consistency: "strong" });
  const url = new URL(req.url);

  if (req.method === "GET") {
    const key = url.searchParams.get("key");
    if (key && !isOwner(key)) return json(403, { error: "forbidden" });
    try {
      const questions = await list(store, !!key);
      if (key) {
        // Arpi sees the asker's email (if they left one) so he can also write back privately.
        const priv = getStore("ask-private");
        await Promise.all(questions.map(async (q) => {
          const p = await priv.get("q/" + q.id, { type: "json" }).catch(() => null);
          if (p && p.email) q.email = p.email;
        }));
      }
      return json(200, { questions });
    } catch (e) {
      console.error("ask list failed", e);
      return json(500, { questions: [], error: "load_failed" });
    }
  }

  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  let data;
  try {
    data = await readBody(req);
  } catch (e) {
    return json(400, { error: "bad_request" });
  }

  if (data.answer !== undefined || data.remove !== undefined) {
    if (!isOwner(data.key)) return json(403, { error: "forbidden" });
    const id = clean(data.answer !== undefined ? data.answer : data.remove, 40);
    if (!validId(id)) return json(400, { error: "bad_id" });
    const row = await store.get("q/" + id, { type: "json" }).catch(() => null);
    if (!row) return json(404, { error: "not_found" });
    if (data.remove !== undefined) {
      await store.delete("q/" + id);
      await getStore("ask-private").delete("q/" + id).catch(() => {});
      return json(200, { ok: true });
    }
    const a = clean(data.msg, 2000);
    const { a: _a, ats: _ats, ...rest } = row;
    await store.setJSON("q/" + id, a ? { ...rest, a, ats: Date.now() } : rest);
    return json(200, { ok: true, a });
  }

  if (data["bot-field"]) return json(200, { ok: true }); // quietly ignore bots
  const q = clean(data.q, 600);
  const name = clean(data.name, 60);
  const email = clean(data.email, 200);
  if (!q) return json(400, { error: "missing_question" });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: "bad_email" });

  try {
    const ip = (context && context.ip) || "unknown";
    const limits = getStore({ name: "ask-limits", consistency: "strong" });
    const last = Number(await limits.get(ip)) || 0;
    const now = Date.now();
    if (now - last < WAIT_MS) return json(429, { error: "too_fast" });
    await limits.set(ip, String(now));
    const key = "q/" + String(now).padStart(15, "0") + "-" + Math.random().toString(36).slice(2, 8);
    await store.setJSON(key, { name, q, ts: now });
    if (email) await getStore("ask-private").setJSON(key, { name, email, ts: now });
    await buzz("New question for Ask Arpi", (name ? name + ": " : "") + q.slice(0, 300)).catch((e) => console.error("ask buzz failed", e));
    return json(200, { ok: true });
  } catch (e) {
    console.error("ask save failed", e);
    return json(500, { error: "save_failed" });
  }
};
