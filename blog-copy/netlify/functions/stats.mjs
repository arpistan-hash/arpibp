// Visitor counter: tells Arpi how many people read the blog, which pages, and where they came from
// (Google, Pinterest, Reddit, his QR card...). No cookies and nothing personal is stored: only daily
// totals per page, per referring site and per source tag, so no cookie banner is needed.
// POST /.netlify/functions/stats  { p: "/posts/x.html", r: "www.google.com", s: "card" } -> 204
// GET  /.netlify/functions/stats?key=<key>&days=30 -> { days: [{ d, views }], pages, refs, src, total }
import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";

// Only the SHA-256 of Arpi's private key lives in this public repo (same key as the table inbox).
const KEY_SHA256 = "2a4bc831536c0bb03c11c5c8f8e347012c50ab97263656e4b03819c924f4fd52";
const MAX_KEYS = 300; // per list per day, so a flood of made-up pages can't grow a day without limit
const BOTS = /bot|crawl|spider|slurp|preview|headless|lighthouse|pingdom|monitor/i;

const json = (status, body) =>
  new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const isOwner = (key) => !!key && createHash("sha256").update(String(key)).digest("hex") === KEY_SHA256;
const today = (offset = 0) =>
  new Date(Date.now() - offset * 86400000).toLocaleDateString("en-CA", { timeZone: "Europe/Budapest" });

// Only shapes this site really produces are counted, so nobody can write junk into Arpi's numbers.
const cleanPage = (v) => {
  const p = String(v || "").split(/[?#]/)[0];
  if (p === "/" || p === "/index.html") return "/";
  return /^\/posts\/[a-z0-9-]{1,80}\.html$/.test(p) ? p : "";
};
const cleanHost = (v) => {
  const h = String(v || "").toLowerCase().replace(/^www\./, "");
  return /^[a-z0-9.-]{3,60}$/.test(h) && h.includes(".") ? h : "";
};
const cleanTag = (v) => {
  const s = String(v || "").toLowerCase();
  return /^[a-z0-9_-]{1,30}$/.test(s) ? s : "";
};

const bump = (map, k) => {
  if (!k) return;
  if (k in map || Object.keys(map).length < MAX_KEYS) map[k] = (map[k] || 0) + 1;
};
const top = (map, n) => Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, n);

export default async (req) => {
  const store = getStore({ name: "stats", consistency: "strong" });

  if (req.method === "GET") {
    const url = new URL(req.url);
    if (!isOwner(url.searchParams.get("key"))) return json(403, { error: "forbidden" });
    const n = Math.min(Math.max(parseInt(url.searchParams.get("days"), 10) || 30, 1), 365);
    const dates = Array.from({ length: n }, (_, i) => today(i));
    const rows = await Promise.all(dates.map((d) => store.get("d/" + d, { type: "json" }).catch(() => null)));
    const pages = {}, refs = {}, src = {};
    let total = 0;
    const days = rows.map((r, i) => {
      const v = (r && r.views) || 0;
      total += v;
      for (const [map, part] of [[pages, "pages"], [refs, "refs"], [src, "src"]])
        for (const [k, c] of Object.entries((r && r[part]) || {})) map[k] = (map[k] || 0) + c;
      return { d: dates[i], views: v };
    });
    return json(200, { days, total, pages: top(pages, 15), refs: top(refs, 15), src: top(src, 15) });
  }

  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });
  if (BOTS.test(req.headers.get("user-agent") || "")) return json(204, null);
  let data;
  try {
    data = (await req.json()) || {};
  } catch (e) {
    return json(400, { error: "bad_request" });
  }
  const page = cleanPage(data.p);
  if (!page) return json(204, null);
  try {
    // Read, add one, write back. Two visits in the same instant can rarely miss one count; fine for a blog.
    const k = "d/" + today();
    const day = (await store.get(k, { type: "json" }).catch(() => null)) || { views: 0, pages: {}, refs: {}, src: {} };
    day.views = (day.views || 0) + 1;
    bump(day.pages, page);
    bump(day.refs, cleanHost(data.r));
    bump(day.src, cleanTag(data.s));
    await store.setJSON(k, day);
  } catch (e) {
    console.error("stats save failed", e);
  }
  return json(204, null);
};
