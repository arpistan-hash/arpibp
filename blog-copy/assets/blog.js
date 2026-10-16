// Blog behaviour: light/dark switch, reading progress bar, topic filter, guest book.
(function () {
  var root = document.documentElement;

  // Light / dark switch, remembered on this device.
  var tg = document.querySelector(".theme");
  function dark() { var t = root.getAttribute("data-theme"); return t ? t === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches; }
  function label() { if (tg) tg.textContent = dark() ? "☀" : "☾"; }
  if (tg) tg.addEventListener("click", function () {
    var n = dark() ? "light" : "dark"; root.setAttribute("data-theme", n);
    try { localStorage.setItem("blog-theme", n); } catch (e) {}
    label();
  });
  label();

  // Reading progress bar on post pages.
  if (document.querySelector(".prose")) {
    var bar = document.createElement("div"); bar.className = "readbar"; bar.setAttribute("aria-hidden", "true"); document.body.appendChild(bar);
    var upd = function () { var h = root.scrollHeight - root.clientHeight; bar.style.width = (h > 0 ? Math.min(100, window.pageYOffset / h * 100) : 0) + "%"; };
    window.addEventListener("scroll", upd, { passive: true }); upd();
  }

  // "Copy" buttons next to promo codes.
  document.querySelectorAll(".promo button").forEach(function (b) {
    b.addEventListener("click", function () {
      var done = function () { b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy"; }, 1600); };
      try { navigator.clipboard.writeText(b.getAttribute("data-code")).then(done, function () {}); } catch (e) {}
    });
  });

  // Topic filter on the home page (?topic=tips or ?topic=story also works as a link).
  var filters = document.querySelectorAll(".filters button");
  function show(topic) {
    filters.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-topic") === topic)); });
    document.querySelectorAll(".grid .card").forEach(function (c) { c.hidden = topic !== "all" && c.getAttribute("data-topic") !== topic; });
  }
  if (filters.length) {
    filters.forEach(function (b) { b.addEventListener("click", function () { show(b.getAttribute("data-topic")); }); });
    var q = new URLSearchParams(location.search).get("topic");
    if (q === "tips" || q === "story" || q === "travels") show(q);
  }

  // Guest book (Netlify function in netlify/functions/guestbook.mjs).
  var form = document.getElementById("gb-form");
  if (!form) return;
  var list = document.getElementById("gb-list"), status = document.getElementById("gb-status");
  var API = "/.netlify/functions/guestbook";
  function fmt(ts) { try { return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); } catch (e) { return ""; } }
  function add(e, top) {
    var li = document.createElement("li"), who = document.createElement("span"), when = document.createElement("span"), txt = document.createElement("p");
    who.className = "who"; who.textContent = e.name || "Someone";
    when.className = "when"; when.textContent = fmt(e.ts);
    txt.className = "txt"; txt.textContent = e.msg || "";
    li.appendChild(who); li.appendChild(when); li.appendChild(txt);
    if (top) list.insertBefore(li, list.firstChild); else list.appendChild(li);
  }
  fetch(API, { headers: { accept: "application/json" } })
    .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
    .then(function (d) { ((d && d.entries) || []).forEach(function (e) { add(e, false); }); })
    .catch(function () {});
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var name = form.name.value.trim(), email = form.email.value.trim(), msg = form.msg.value.trim();
    if (!name || !msg) { status.textContent = "Please write your name and a message."; return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { status.textContent = "That email doesn't look right. You can also leave it empty."; return; }
    if (form["bot-field"].value) return;
    var btn = form.querySelector("button[type=submit]"); btn.disabled = true; status.textContent = "Signing...";
    fetch(API, { method: "POST", headers: { "Content-Type": "application/json", accept: "application/json" }, body: JSON.stringify({ name: name, email: email, msg: msg, "bot-field": "" }) })
      .then(function (r) { if (r.status === 429) return "wait"; if (!r.ok) throw new Error(); return r.json(); })
      .then(function (d) {
        if (d === "wait") { status.textContent = "Thanks! Please wait a few seconds before sending another message."; return; }
        add(d.entry || { name: name, msg: msg, ts: Date.now() }, true);
        status.textContent = "Thank you for signing, " + name + "!"; form.msg.value = "";
      })
      .catch(function () { status.textContent = "That didn't go through. Please try again in a moment."; })
      .then(function () { btn.disabled = false; });
  });
})();
