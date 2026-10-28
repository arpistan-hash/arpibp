// Lounge table service API.
// Guests need no account: each phone gets a random id and can only read and write its own
// requests. Everything staff-only (the board, statuses, menu edits, sounds) needs the staff
// token, which the /api/pin endpoint hands out in exchange for the STAFF_PIN env var.
import { getStore } from "@netlify/blobs";
import SEED from "./lib/seed-menu.json" with { type: "json" };
import { staffTokenFor } from "./lib/token.mjs";

const DAY = 24 * 3600 * 1000;
const KEEP = 36 * 3600 * 1000;          // requests and statuses older than this are dropped
const UID = /^g_[A-Za-z0-9]{20,40}$/;
const ID = /^[A-Za-z0-9_-]{1,80}$/;
const MAX_BODY = 256 * 1024;
const MAX_SOUND = 3 * 1024 * 1024;

const store = () => getStore({ name: "lounge", consistency: "strong" });
const json = (d, status = 200) => new Response(JSON.stringify(d), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});
const fail = (message, status = 400) => json({ error: message }, status);

/* ---------- staff token ---------- */
function same(a, b) {
  a = String(a || ""); b = String(b || "");
  if (!a || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
async function isStaff(req) {
  const pin = Netlify.env.get("STAFF_PIN");
  if (!pin) return false;
  return same(req.headers.get("x-staff-token"), await staffTokenFor(pin));
}

/* ---------- reads, cached by etag while the function instance is warm ---------- */
const cache = new Map();
async function readPrefix(s, prefix) {
  const { blobs } = await s.list({ prefix });
  const out = [];
  await Promise.all(blobs.map(async (b) => {
    let c = cache.get(b.key);
    if (!c || c.etag !== b.etag) {
      const v = await s.get(b.key, { type: "json" }).catch(() => null);
      c = { etag: b.etag, v };
      cache.set(b.key, c);
    }
    if (c.v != null) out.push({ key: b.key, v: c.v });
  }));
  return out;
}
async function readMenu(s) {
  const m = await s.get("menu", { type: "json" }).catch(() => null);
  return m && typeof m === "object" ? m : SEED;
}
// menu edits are rare and staff-only; a conditional write keeps two phones from erasing each other
async function editMenu(s, change) {
  for (let i = 0; i < 5; i++) {
    const cur = await s.getWithMetadata("menu", { type: "json" });
    const base = cur && cur.data ? cur.data : structuredClone(SEED);
    const next = change(base);
    const res = cur ? await s.setJSON("menu", next, { onlyIfMatch: cur.etag }) : await s.setJSON("menu", next, { onlyIfNew: true });
    // older versions of the blobs library return nothing here (and write anyway): that counts as saved
    if (!res || res.modified !== false) return next;
    await new Promise((r) => setTimeout(r, 120 + Math.random() * 200));
  }
  throw new Error("busy");
}
// "_spotlight" was a short-lived extra; if a copy was saved, it is never sent out
/* "live": the bar's notice and today's host. Kept apart from the (large) menu so posting is one quick
   write, and sent with every guest and crew poll so phones see a change within seconds. */
async function readLive(s) {
  const v = await s.get("live", { type: "json" }).catch(() => null);
  return v && typeof v === "object" ? v : null;
}
async function writeLive(s, change) {
  let cur = await readLive(s);
  if (!cur) { // first write: carry over a notice or host that was saved inside the menu before
    const m = await s.get("menu", { type: "json" }).catch(() => null);
    cur = { notice: (m && m._notice) || null, host: (m && m._host) || null };
  }
  const next = change(Object.assign({ notice: null, host: null }, cur));
  next.v = Date.now();
  await s.setJSON("live", next);
  return next;
}
function liveDocs(live) {
  const out = [];
  if (live && live.notice && live.notice.text) out.push({ id: "_notice", data: live.notice });
  if (live && live.host) out.push({ id: "_host", data: live.host });
  return out;
}
const docs = (map) => Object.keys(map).filter((id) => id !== "_spotlight").map((id) => ({ id, data: map[id] }));

async function body(req, limit = MAX_BODY) {
  const text = await req.text();
  if (text.length > limit) throw Object.assign(new Error("too big"), { status: 413 });
  try { return text ? JSON.parse(text) : {}; } catch { throw Object.assign(new Error("bad json"), { status: 400 }); }
}
function cleanReqs(list) {
  if (!Array.isArray(list)) return null;
  const out = [];
  for (const r of list.slice(-30)) {
    if (!r || typeof r !== "object" || !ID.test(String(r.id || ""))) return null;
    out.push(r);
  }
  return out;
}

export default async (req, context) => {
  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  const [res, id] = parts;
  const m = req.method;
  const s = store();
  try {
    /* ---- public: menu and sounds ---- */
    if (res === "menu" && !id && m === "GET") {
      const [menu, live] = await Promise.all([readMenu(s), readLive(s)]);
      if (!live) return json({ docs: docs(menu).filter((d) => d.id !== "_spotlight"), live: null });
      return json({ docs: docs(menu).filter((d) => d.id.charAt(0) !== "_").concat(liveDocs(live)), live });
    }
    if (res === "sounds" && !id && m === "GET") {
      const list = await readPrefix(s, "sounds/");
      return json({ docs: list.map((x) => ({ id: x.key.slice(7), data: x.v })) });
    }

    /* ---- guests: their own requests, plus the status of those requests ---- */
    if (res === "guest" && m === "GET") {
      const uid = url.searchParams.get("uid") || "";
      if (!UID.test(uid)) return fail("bad id");
      const [mine, live] = await Promise.all([s.get("requests/" + uid, { type: "json" }).catch(() => null), readLive(s)]);
      const status = {};
      const ids = mine && Array.isArray(mine.reqs) ? mine.reqs.map((r) => r && r.id).filter((x) => ID.test(String(x || ""))) : [];
      await Promise.all(ids.map(async (rid) => {
        const st = await s.get("status/" + rid, { type: "json" }).catch(() => null);
        if (st) status[rid] = st;
      }));
      return json({ mine: mine || null, status, live });
    }
    if (res === "mine" && (m === "PUT" || m === "POST")) {
      const uid = url.searchParams.get("uid") || "";
      if (!UID.test(uid)) return fail("bad id");
      const b = await body(req);
      const reqs = cleanReqs(b.reqs);
      if (!reqs) return fail("bad requests");
      const doc = { reqs, updatedAt: Date.now() };
      await s.setJSON("requests/" + uid, doc);
      return json({ ok: true });
    }

    /* ---- the crew app (/crew) works without a PIN, as the Lounge asked: the board, marking
       requests on it or served, and the guest notice. Menu edits and sounds stay PIN-only. ---- */
    if (res === "menu" && id === "_notice") {
      if (m === "PUT") {
        const b = await body(req, 2048);
        const text = String(b.text || "").trim().slice(0, 200);
        if (!text) return fail("empty notice");
        const live = await writeLive(s, (cur) => { cur.notice = { text, at: Date.now() }; return cur; });
        return json({ ok: true, live });
      }
      if (m === "DELETE") { const live = await writeLive(s, (cur) => { cur.notice = null; return cur; }); return json({ ok: true, live }); }
    }
    // "Your host today is …" under the review card, set by the crew for each shift
    if (res === "menu" && id === "_host" && m === "PUT") {
      const b = await body(req, 1024);
      const who = String(b.who || "").trim().slice(0, 40);
      const live = await writeLive(s, (cur) => { cur.host = { who, at: Date.now(), createdAt: 0 }; return cur; });
      return json({ ok: true, live });
    }
    if (res === "staff" && m === "GET") {
      const now = Date.now();
      const [reqDocs, stDocs, live] = await Promise.all([readPrefix(s, "requests/"), readPrefix(s, "status/"), readLive(s)]);
      const requests = [], status = {}, stale = [];
      for (const x of reqDocs) {
        if ((x.v.updatedAt || 0) < now - KEEP) stale.push(x.key); else requests.push({ id: x.key.slice(9), data: x.v });
      }
      for (const x of stDocs) {
        const t = x.v.doneAt || x.v.seenAt || 0;
        if (t && t < now - KEEP) stale.push(x.key); else status[x.key.slice(7)] = x.v;
      }
      if (stale.length) context.waitUntil(Promise.all(stale.slice(0, 50).map((k) => s.delete(k).then(() => cache.delete(k)).catch(() => {}))));
      return json({ requests, status, live });
    }
    if (res === "status" && id && ID.test(id)) {
      if (m === "PUT") { const b = await body(req, 4096); await s.setJSON("status/" + id, b); return json({ ok: true }); }
      if (m === "DELETE") { await s.delete("status/" + id); cache.delete("status/" + id); return json({ ok: true }); }
    }

    /* ---- everything below is staff only (PIN) ---- */
    if (!(await isStaff(req))) return fail("staff only", 401);

    if (res === "menu") {
      if (!id && m === "POST") {
        const b = await body(req);
        const nid = "n" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        await editMenu(s, (cur) => { cur[nid] = b; return cur; });
        return json({ id: nid });
      }
      if (id && ID.test(id)) {
        if (m === "PATCH") {
          const b = await body(req);
          await editMenu(s, (cur) => {
            const next = Object.assign({}, cur[id] || {}, b);
            for (const k of Object.keys(next)) if (next[k] && typeof next[k] === "object" && next[k].__delete__) delete next[k];
            cur[id] = next; return cur;
          });
          return json({ ok: true });
        }
        if (m === "PUT") { const b = await body(req); await editMenu(s, (cur) => { cur[id] = b; return cur; }); return json({ ok: true }); }
        if (m === "DELETE") { await editMenu(s, (cur) => { delete cur[id]; return cur; }); return json({ ok: true }); }
      }
    }
    if (res === "sounds" && id && ID.test(id)) {
      if (m === "PUT") { const b = await body(req, MAX_SOUND); await s.setJSON("sounds/" + id, b); return json({ ok: true }); }
      if (m === "DELETE") { await s.delete("sounds/" + id); cache.delete("sounds/" + id); return json({ ok: true }); }
    }
    return fail("not found", 404);
  } catch (e) {
    if (e && e.status) return fail(e.message, e.status);
    console.error(e);
    return fail("server error", 500);
  }
};

export const config = { path: ["/api/menu", "/api/menu/*", "/api/sounds", "/api/sounds/*", "/api/guest", "/api/mine", "/api/staff", "/api/status/*"] };
// The /api/pin GET check lives in pin.mjs together with the sign-in (it is rate limited there).
