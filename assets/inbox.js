// Table inbox: polls the table function for guest requests, rings and shows a full-screen alert for
// each new one, and registers this phone for Web Push so it also buzzes when the inbox is closed.
// The private key comes from the link (#key) and is remembered on this phone.
(() => {
  "use strict";

  const API = "/.netlify/functions/table";
  const KEY_STORE = "arpi-inbox-key";
  const POLL_MS = 4000;
  const RETRY_MS = 8000;
  const REPEAT_MS = 6000;
  const TIMEOUT_MS = 10000; // a stuck request must never stop the inbox
  const $ = (id) => document.getElementById(id);

  const store = {
    get() { try { return localStorage.getItem(KEY_STORE) || ""; } catch (e) { return ""; } },
    set(v) { try { localStorage.setItem(KEY_STORE, v); } catch (e) { /* private mode: link still works */ } },
  };

  let key = decodeURIComponent(location.hash.slice(1));
  if (key) store.set(key); else key = store.get();
  if (!key) return askForLink();
  if (!location.hash) history.replaceState(null, "", "#" + encodeURIComponent(key));

  const el = {
    list: $("list"), empty: $("empty"), live: $("live"), liveText: $("live-t"), start: $("start"),
    alert: $("alert"), big: $("alert-big"), alg: $("alert-alg"), what: $("alert-what"), more: $("alert-more"),
    install: $("install"), installBtn: $("install-btn"), iosSteps: $("ios-steps"),
    pushBox: $("push-box"), pushText: $("push-t"), testBtn: $("test-btn"),
  };
  const baseTitle = document.title;
  let messages = [];
  let seen = null; // ids from the previous poll; null until the first one, so old messages don't ring
  let audio = null;
  let queue = []; // new orders waiting in the full-screen alert
  let repeat = null;

  // ---------- first visit without a key ----------
  function askForLink() {
    $("app").innerHTML = '<div class="paste"><p class="bad">This page needs your private inbox link.</p>' +
      '<input id="paste" type="url" placeholder="Paste your inbox link here" autocomplete="off">' +
      '<button class="start" id="paste-go" type="button">Open my inbox</button></div>';
    $("paste-go").onclick = () => {
      const v = $("paste").value.trim();
      const i = v.indexOf("#");
      const k = decodeURIComponent(i >= 0 ? v.slice(i + 1) : v);
      if (!k) return;
      store.set(k);
      location.replace("inbox.html#" + encodeURIComponent(k));
      location.reload();
    };
  }

  // ---------- network ----------
  const call = (url, opts = {}) => {
    const stop = new AbortController(); // (AbortSignal.timeout is missing on older iPhones)
    const timer = setTimeout(() => stop.abort(), TIMEOUT_MS);
    return fetch(url, { cache: "no-store", ...opts, signal: stop.signal }).finally(() => clearTimeout(timer));
  };
  // Fire and forget: if it fails, the next poll shows the server's state again.
  const post = (body) =>
    call(API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
      .catch(() => {});

  async function load() {
    const r = await call(API + "?key=" + encodeURIComponent(key), { headers: { accept: "application/json" } });
    if (r.status === 403) throw new Error("key");
    if (!r.ok) throw new Error("net");
    return (await r.json()).messages || [];
  }

  // ---------- sound, vibration, system notification ----------
  function ding(urgent) {
    if (!audio) return;
    try {
      (urgent ? [0, 0.18, 0.36, 0.6, 0.78, 0.96] : [0, 0.18]).forEach((t, i) => {
        const o = audio.createOscillator(), g = audio.createGain(), at = audio.currentTime + t;
        o.type = "sine";
        o.frequency.value = urgent ? (i % 2 ? 660 : 990) : (i ? 1320 : 880);
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(0.4, at + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, at + 0.35);
        o.connect(g); g.connect(audio.destination);
        o.start(at); o.stop(at + 0.4);
      });
    } catch (e) { /* no sound is better than a broken inbox */ }
  }
  const buzz = (pattern) => { if (navigator.vibrate) navigator.vibrate(pattern); };
  const allergyLabel = (m) => "⚠️ ALLERGY: " + m.allergy;

  // ---------- list ----------
  function ago(ts) {
    const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
    if (s < 60) return "just now";
    if (s < 3600) return Math.round(s / 60) + " min ago";
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function div(cls, text) {
    const d = document.createElement("div");
    d.className = cls;
    if (text !== undefined) d.textContent = text;
    return d;
  }

  function row(m, isNew) {
    const li = document.createElement("li");
    li.className = m.done ? "done" : "open" + (isNew ? " new" : "") + (m.allergy ? " allergy" : "");
    const tn = div("tn");
    const label = document.createElement("small");
    label.textContent = "Table";
    tn.append(label, m.table);
    const body = div("body");
    if (m.allergy) body.append(div("alg", allergyLabel(m)));
    if (m.msg) body.append(div("msg", m.msg));
    body.append(div("ago", ago(m.ts)));
    li.append(tn, body);
    if (!m.done) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "done-btn"; b.textContent = "Done ✓";
      b.onclick = () => markDone(m);
      li.append(b);
    }
    return li;
  }

  function render(fresh = new Set()) {
    el.list.replaceChildren(...messages.map((m) => row(m, fresh.has(m.id))));
    el.empty.hidden = messages.length > 0;
    const open = messages.filter((m) => !m.done).length;
    document.title = (open ? "(" + open + ") " : "") + baseTitle;
  }

  function markDone(m) {
    m.done = true;
    post({ key, done: m.id });
    render();
    showAlert();
  }

  // ---------- full-screen alert: blinks and rings every few seconds until tapped ----------
  function showAlert() {
    queue = queue.filter((q) => !q.done);
    if (!queue.length) {
      el.alert.hidden = true;
      clearInterval(repeat); repeat = null;
      return;
    }
    const m = queue[0];
    el.alert.className = "alert" + (m.allergy ? " urgent" : "");
    el.big.textContent = m.table;
    el.alg.hidden = !m.allergy;
    el.alg.textContent = m.allergy ? allergyLabel(m) : "";
    el.what.textContent = m.msg || "";
    el.more.hidden = queue.length < 2;
    el.more.textContent = "+" + (queue.length - 1) + " more waiting";
    el.alert.hidden = false;
    if (!repeat) repeat = setInterval(() => {
      const urgent = queue.some((q) => q.allergy);
      ding(urgent);
      buzz(urgent ? [400, 120, 400] : [200, 100, 200]);
    }, REPEAT_MS);
  }
  $("alert-ok").onclick = () => { queue.shift(); showAlert(); };
  $("alert-done").onclick = () => { const m = queue.shift(); if (m) markDone(m); else showAlert(); };

  function announce(fresh) {
    const urgent = fresh.some((m) => m.allergy);
    ding(urgent);
    buzz(urgent ? [400, 120, 400, 120, 400] : [200, 100, 200]);
    fresh.forEach((m) => { if (!queue.some((q) => q.id === m.id)) queue.push(m); });
    queue.sort((a, b) => !!b.allergy - !!a.allergy); // allergies first (stable, so order otherwise kept)
    showAlert(); // when the inbox is closed or hidden, the push from the function buzzes the phone instead
  }

  // ---------- polling (one request at a time, slower after an error) ----------
  function setLive(state, text) { el.live.className = "live" + (state ? " " + state : ""); el.liveText.textContent = text; }

  let polling = false;
  async function poll() {
    if (polling) return;
    polling = true;
    clearTimeout(pollTimer);
    let delay = POLL_MS;
    try {
      messages = (await load()).sort((a, b) => (a.done - b.done) || (b.ts - a.ts));
      const fresh = seen ? messages.filter((m) => !seen.has(m.id) && !m.done) : [];
      seen = new Set(messages.map((m) => m.id));
      render(new Set(fresh.map((m) => m.id)));
      setLive("on", audio ? "Listening" : "Updating (tap Start for sound)");
      if (fresh.length) announce(fresh);
    } catch (e) {
      const bad = e && e.message === "key";
      setLive("err", bad ? "This link isn't right" : "Offline, retrying…");
      delay = bad ? 60000 : RETRY_MS; // a wrong key won't fix itself, so check it rarely
    }
    polling = false;
    pollTimer = setTimeout(poll, delay);
  }
  let pollTimer = null;

  // ---------- start button: sound, notifications, keep the screen awake ----------
  let wakeLock = null;
  const keepAwake = () => {
    if (navigator.wakeLock) navigator.wakeLock.request("screen").then((l) => { wakeLock = l; }).catch(() => {});
  };

  el.start.addEventListener("click", () => {
    try { audio = new (window.AudioContext || window.webkitAudioContext)(); ding(); } catch (e) { audio = null; }
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
    keepAwake();
    el.start.textContent = "🔔 Listening";
    el.start.disabled = true;
    el.liveText.textContent = "Listening";
    turnOnPush();
  });

  // ---------- phone notifications (Web Push) and "add to home screen" ----------
  const standalone = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const canPush = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  let installPrompt = null;

  const save = (sub) => post({ key, subscribe: sub.toJSON() });

  function base64ToBytes(s) {
    const raw = atob((s + "=".repeat((4 - s.length % 4) % 4)).replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(raw, (c) => c.charCodeAt(0));
  }

  function pushStatus(text, ok) {
    el.pushBox.hidden = false;
    el.pushText.className = ok ? "ok-line" : "";
    el.pushText.textContent = text;
    el.testBtn.hidden = !ok;
  }

  async function turnOnPush() {
    if (!canPush) { if (isIOS && !standalone) el.install.hidden = false; return; }
    try {
      const reg = await navigator.serviceWorker.ready;
      if (await Notification.requestPermission() !== "granted") {
        return pushStatus("Notifications are blocked. Allow them for this site in your phone's settings so it can buzz.", false);
      }
      const r = await call(API + "?vapid=1&key=" + encodeURIComponent(key));
      const { publicKey } = await r.json();
      const sub = (await reg.pushManager.getSubscription()) ||
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64ToBytes(publicKey) }));
      await save(sub);
      pushStatus("✅ Notifications are on for this phone.", true);
    } catch (e) { /* stays off; the in-page alert still works */ }
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("inbox-sw.js", { scope: "/inbox" }).then(async (reg) => {
      if (canPush && Notification.permission === "granted") {
        const sub = await reg.pushManager.getSubscription();
        if (sub) { save(sub); pushStatus("\u2705 Notifications are on for this phone.", true); } else turnOnPush();
      }
    }).catch(() => {});
  }

  if (!standalone) {
    if (isIOS) { el.install.hidden = false; el.iosSteps.hidden = false; }
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      installPrompt = e;
      el.install.hidden = false; el.installBtn.hidden = false;
    });
    el.installBtn.onclick = async () => {
      if (!installPrompt) return;
      installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
      el.install.hidden = true;
    };
    window.addEventListener("appinstalled", () => { el.install.hidden = true; });
  }

  el.testBtn.onclick = async () => {
    const b = el.testBtn;
    b.disabled = true; b.textContent = "Sending…";
    await post({ key, test: true });
    setTimeout(() => { b.disabled = false; b.textContent = "Send me a test buzz"; }, 3000);
  };

  // ---------- go ----------
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    if (audio) {
      audio.resume().catch(() => {}); // phones suspend sound while the page is in the background
      keepAwake(); // and release the screen lock
    }
    poll();
  });
  setInterval(() => render(), 30000); // refresh "x min ago"
  poll();
})();
