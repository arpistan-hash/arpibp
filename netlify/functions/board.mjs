// Bud Bud board: fellow tourists post short notes ("anyone for Széchenyi on Saturday?") and reply.
// No accounts. Posts expire after the trip ends. Contact details are refused in public posts.
// GET  /.netlify/functions/board                    -> { posts: [{ id, nick, topic, text, from, to, ts, replies: [{ id, nick, text, ts }] }] } (visible only, newest first)
// GET  /.netlify/functions/board?key=<key>          -> same, including expired and reported posts (with reports count), for Arpi
// POST /.netlify/functions/board  { nick?, topic?, text, from?, to?, "bot-field"? } -> { ok, id }
// POST /.netlify/functions/board  { post: "<id>", nick?, text }                    -> { ok }      (reply)
// POST /.netlify/functions/board  { report: "<id>" }                               -> { ok }      (3 reports hide a post until Arpi looks)
// POST /.netlify/functions/board  { key, remove: "<id>" }                          -> { ok }      (deletes a post and its replies)
import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";

// Only the SHA-256 of Arpi's private key lives in this public repo (same key as Ask Arpi and the table inbox).
const KEY_SHA256 = "2a4bc831536c0bb03c11c5c8f8e347012c50ab97263656e4b03819c924f4fd52";
const TOPICS = ["", "transport", "money", "baths", "safety"];
const MAX_SHOWN = 100;
const WAIT_MS = 30 * 1000; // one post, reply or report per visitor every 30 seconds
const HIDE_AT = 3; // reports that hide a post
const DEFAULT_LIFE_MS = 14 * 864e5; // posts without an end date live two weeks
const GRACE_MS = 2 * 864e5; // keep a post two days after the trip ends

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const clean = (v, max) => String(v == null ? "" : v).replace(/\s+/g, " ").trim().slice(0, max);
const isOwner = (key) => !!key && createHash("sha256").update(String(key)).digest("hex") === KEY_SHA256;
const validId = (id) => /^[0-9]{15}-[0-9a-z]+$/.test(id);
const validDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d));

// Public text must not carry links or contact details (spam and safety). Private messages are a later step.
const hasContact = (t) =>
  /https?:\/\/|www\./i.test(t) || /[^\s@]+@[^\s@]+\.[^\s@]+/.test(t) || /(?:\d[\s().-]?){8,}/.test(t);

async function readBody(req) {
  const type = req.headers.get("content-type") || "";
  if (type.includes("application/json")) return (await req.json()) || {};
  return Object.fromEntries(new URLSearchParams(await req.text()));
}

const expiresAt = (p) => (p.to && validDate(p.to) ? Date.parse(p.to) + 864e5 + GRACE_MS : p.ts + DEFAULT_LIFE_MS);

async function readAll(store, all) {
  const now = Date.now();
  const [{ blobs: pb }, { blobs: rb }] = await Promise.all([store.list({ prefix: "p/" }), store.list({ prefix: "r/" })]);
  const pkeys = pb.map((b) => b.key).sort().reverse();
  const rkeys = rb.map((b) => b.key).sort();
  const [prows, rrows] = await Promise.all([
    Promise.all(pkeys.map((k) => store.get(k, { type: "json" }).catch(() => null))),
    Promise.all(rkeys.map((k) => store.get(k, { type: "json" }).catch(() => null))),
  ]);
  const replies = {};
  rrows.forEach((r, i) => {
    if (!r || !r.text) return;
    const [pid, rid] = rkeys[i].slice(2).split("~");
    (replies[pid] = replies[pid] || []).push({ id: rid, nick: r.nick || "", text: r.text, ts: r.ts });
  });
  const out = [];
  prows.forEach((p, i) => {
    if (!p || !p.text) return;
    const id = pkeys[i].slice(2);
    const reports = (p.rep || []).length;
    const expired = expiresAt(p) < now;
    if (!all && (expired || reports >= HIDE_AT)) return;
    const post = { id, nick: p.nick || "", topic: p.topic || "", text: p.text, from: p.from || "", to: p.to || "", ts: p.ts, replies: replies[id] || [] };
    if (all) { post.reports = reports; post.expired = expired; }
    out.push(post);
  });
  return out.slice(0, MAX_SHOWN);
}

export default async (req, context) => {
  const store = getStore({ name: "board", consistency: "strong" });
  const url = new URL(req.url);

  if (req.method === "GET") {
    const key = url.searchParams.get("key");
    if (key && !isOwner(key)) return json(403, { error: "forbidden" });
    try {
      return json(200, { posts: await readAll(store, !!key) });
    } catch (e) {
      console.error("board list failed", e);
      return json(500, { posts: [], error: "load_failed" });
    }
  }

  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  let data;
  try {
    data = await readBody(req);
  } catch (e) {
    return json(400, { error: "bad_request" });
  }

  // Owner: delete a post and its replies.
  if (data.remove !== undefined) {
    if (!isOwner(data.key)) return json(403, { error: "forbidden" });
    const id = clean(data.remove, 40);
    if (!validId(id)) return json(400, { error: "bad_id" });
    await store.delete("p/" + id).catch(() => {});
    const { blobs } = await store.list({ prefix: "r/" + id + "~" });
    await Promise.all(blobs.map((b) => store.delete(b.key).catch(() => {})));
    return json(200, { ok: true });
  }

  if (data["bot-field"]) return json(200, { ok: true }); // quietly ignore bots

  // Everything below is public: one action per visitor every 30 seconds.
  const ip = (context && context.ip) || "unknown";
  const limits = getStore({ name: "board-limits", consistency: "strong" });
  const now = Date.now();
  try {
    const last = Number(await limits.get(ip)) || 0;
    if (now - last < WAIT_MS) return json(429, { error: "too_fast" });
  } catch (e) {
    console.error("board limit check failed", e);
  }
  const touch = () => limits.set(ip, String(Date.now())).catch(() => {});
  const who = createHash("sha256").update(ip).digest("hex").slice(0, 16); // not stored in readable form

  try {
    if (data.report !== undefined) {
      const id = clean(data.report, 40);
      if (!validId(id)) return json(400, { error: "bad_id" });
      const row = await store.get("p/" + id, { type: "json" }).catch(() => null);
      if (!row) return json(404, { error: "not_found" });
      const rep = row.rep || [];
      if (!rep.includes(who)) await store.setJSON("p/" + id, { ...row, rep: [...rep, who] });
      await touch();
      return json(200, { ok: true });
    }

    const text = clean(data.text, 500);
    const nick = clean(data.nick, 30);
    if (!text) return json(400, { error: "missing_text" });
    if (hasContact(text) || hasContact(nick)) return json(400, { error: "no_contact_details" });

    if (data.post !== undefined) {
      const pid = clean(data.post, 40);
      if (!validId(pid)) return json(400, { error: "bad_id" });
      if (!(await store.get("p/" + pid, { type: "json" }).catch(() => null))) return json(404, { error: "not_found" });
      const rid = String(now).padStart(15, "0") + "-" + Math.random().toString(36).slice(2, 8);
      await store.setJSON("r/" + pid + "~" + rid, { nick, text, ts: now });
      await touch();
      return json(200, { ok: true });
    }

    const topic = TOPICS.includes(clean(data.topic, 20)) ? clean(data.topic, 20) : "";
    const from = validDate(clean(data.from, 10)) ? clean(data.from, 10) : "";
    const to = validDate(clean(data.to, 10)) ? clean(data.to, 10) : "";
    const id = String(now).padStart(15, "0") + "-" + Math.random().toString(36).slice(2, 8);
    await store.setJSON("p/" + id, { nick, topic, text, from, to, ts: now });
    await touch();
    return json(200, { ok: true, id });
  } catch (e) {
    console.error("board save failed", e);
    return json(500, { error: "save_failed" });
  }
};
