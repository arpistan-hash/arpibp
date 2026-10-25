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

  // Photo groups: the button says "Hide photos" while they are open.
  document.querySelectorAll("details.pics").forEach(function (d) {
    var sp = d.querySelector("summary span"); if (!sp) return;
    var shut = sp.textContent;
    d.addEventListener("toggle", function () { sp.textContent = d.open ? (/photos/.test(shut) ? "Hide photos" : "Hide the photo") : shut; });
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
  var list = document.getElementById("gb-list"), status = document.getElementById("gb-status"), empty = document.getElementById("gb-empty");
  var WA = "36202239524";
  function settle() { if (empty) { empty.hidden = list.children.length > 0; empty.textContent = "No messages yet. Be the first to sign!"; } }
  var API = "/.netlify/functions/guestbook";
  function fmt(ts) { try { return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); } catch (e) { return ""; } }
  // Arpi's private key (the table inbox key). Opening the blog with #gbkey=<key> remembers it on this phone;
  // the inbox page stores it under the same name. With it, every message gets a Reply button.
  var KEY_STORE = "arpi-inbox-key", ownerKey = "";
  try {
    var hk = /(?:^#|&)gbkey=([^&]+)/.exec(location.hash);
    if (hk) { localStorage.setItem(KEY_STORE, decodeURIComponent(hk[1])); history.replaceState(null, "", location.pathname + location.search + "#guestbook"); }
    ownerKey = localStorage.getItem(KEY_STORE) || "";
  } catch (e) {}
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

  // Ask Arpi (netlify/functions/ask.mjs): visitors ask, Arpi answers on this page with his key.
  (function () {
    var af = document.getElementById("ask-form");
    if (!af) return;
    var AAPI = "/.netlify/functions/ask", alist = document.getElementById("ask-list"), astatus = document.getElementById("ask-status");
    var owner = document.getElementById("ask-owner"), pending = document.getElementById("ask-pending");
    function qa(x, editable) {
      var li = el("li");
      var head = el("p", "ask-q"); head.appendChild(el("b", null, x.q));
      li.appendChild(head);
      li.appendChild(el("span", "when", (x.name ? x.name + " · " : "") + fmt(x.ts) + (editable && x.email ? " · " + x.email : "")));
      var ans = el("div", "ask-a");
      function showAns() { ans.textContent = ""; ans.hidden = !x.a; if (x.a) { ans.appendChild(el("span", "who", "Arpi's answer")); ans.appendChild(el("p", "txt", x.a)); } }
      showAns(); li.appendChild(ans);
      if (editable) {
        var ta = el("textarea"); ta.rows = 3; ta.maxLength = 2000; ta.value = x.a || ""; ta.setAttribute("aria-label", "Your answer");
        var save = el("button", "btn primary", x.a ? "Save answer" : "Post answer"), del = el("button", "btn", "Delete"), note = el("p", "gb-status");
        save.type = del.type = "button";
        var post = function (body) {
          return fetch(AAPI, { method: "POST", headers: { "Content-Type": "application/json", accept: "application/json" }, body: JSON.stringify(body) })
            .then(function (r) { if (!r.ok) throw new Error(r.status === 403 ? "key" : "net"); return r.json(); });
        };
        save.onclick = function () {
          save.disabled = true; note.textContent = "Saving...";
          post({ key: ownerKey, answer: x.id, msg: ta.value.trim() }).then(function (d) {
            x.a = d.a; showAns(); note.textContent = x.a ? "Posted. It's now on the blog." : "Answer removed."; save.textContent = x.a ? "Save answer" : "Post answer";
          }).catch(function (e) { note.textContent = e.message === "key" ? "This phone doesn't have your private key. Open your inbox link first." : "That didn't save. Please try again."; })
            .then(function () { save.disabled = false; });
        };
        del.onclick = function () {
          if (!confirm("Delete this question?")) return;
          post({ key: ownerKey, remove: x.id }).then(function () { li.remove(); }).catch(function () { note.textContent = "That didn't delete. Please try again."; });
        };
        var acts = el("div", "gb-reply-acts"); acts.appendChild(save); acts.appendChild(del);
        var f = el("div", "gb-reply-form"); f.appendChild(ta); f.appendChild(acts); f.appendChild(note);
        li.appendChild(f);
      }
      return li;
    }
    function load() {
      var url = AAPI + (ownerKey ? "?key=" + encodeURIComponent(ownerKey) : "");
      fetch(url, { headers: { accept: "application/json" }, cache: "no-store" })
        .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
        .then(function (d) {
          var qs = (d && d.questions) || [];
          alist.textContent = ""; pending.textContent = "";
          qs.forEach(function (x) {
            if (ownerKey) (x.a ? alist : pending).appendChild(qa(x, true));
            else if (x.a) alist.appendChild(qa(x, false));
          });
          owner.hidden = !ownerKey || !pending.children.length;
        })
        .catch(function () {});
    }
    load();
    af.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var q = af.q.value.trim(), name = af.name.value.trim(), email = af.email.value.trim();
      if (!q) { astatus.textContent = "Please write your question."; af.q.focus(); return; }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { astatus.textContent = "That email doesn't look right. You can also leave it empty."; return; }
      if (af["bot-field"].value) return;
      var btn = af.querySelector("button[type=submit]"); btn.disabled = true; astatus.textContent = "Sending...";
      fetch(AAPI, { method: "POST", headers: { "Content-Type": "application/json", accept: "application/json" }, body: JSON.stringify({ q: q, name: name, email: email, "bot-field": "" }) })
        .then(function (r) { if (r.status === 429) return "wait"; if (!r.ok) throw new Error(); return r.json(); })
        .then(function (d) {
          if (d === "wait") { astatus.textContent = "Got it! Please wait a few seconds before asking another one."; return; }
          astatus.textContent = "Thanks" + (name ? ", " + name : "") + "! I'll answer within 24 hours, right here on this page."; af.q.value = "";
          if (ownerKey) load();
        })
        .catch(function () {
          var a = el("a", null, "ask me on WhatsApp");
          a.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent("Ask Arpi" + (name ? " from " + name : "") + ":\n" + q);
          a.target = "_blank"; a.rel = "noopener";
          astatus.textContent = "That didn't go through. Your question is still here, so try again, or ";
          astatus.appendChild(a); astatus.appendChild(document.createTextNode(" instead."));
        })
        .then(function () { btn.disabled = false; });
    });
  })();
  function showReply(box, e) {
    box.textContent = "";
    box.hidden = !e.reply;
    if (!e.reply) return;
    box.appendChild(el("span", "who", "Arpi replied"));
    box.appendChild(el("span", "when", fmt(e.reply.ts)));
    box.appendChild(el("p", "txt", e.reply.msg));
  }
  function replyTools(li, e, box) {
    var btn = el("button", "gb-reply-btn", e.reply ? "Edit reply" : "Reply");
    btn.type = "button";
    btn.onclick = function () {
      btn.hidden = true;
      var f = el("div", "gb-reply-form"), ta = el("textarea"), save = el("button", "btn primary", "Post reply"), cancel = el("button", "btn", "Cancel"), note = el("p", "gb-status");
      ta.rows = 3; ta.maxLength = 1000; ta.value = e.reply ? e.reply.msg : ""; ta.setAttribute("aria-label", "Your reply to " + (e.name || "this message"));
      save.type = cancel.type = "button";
      if (e.reply) save.textContent = "Save reply";
      cancel.onclick = function () { f.remove(); btn.hidden = false; };
      save.onclick = function () {
        save.disabled = true; note.textContent = "Saving...";
        fetch(API, { method: "POST", headers: { "Content-Type": "application/json", accept: "application/json" }, body: JSON.stringify({ key: ownerKey, reply: e.id, msg: ta.value.trim() }) })
          .then(function (r) { if (r.status === 403) throw new Error("key"); if (!r.ok) throw new Error(); return r.json(); })
          .then(function (d) {
            e.reply = d.reply; showReply(box, e);
            btn.textContent = e.reply ? "Edit reply" : "Reply"; f.remove(); btn.hidden = false;
          })
          .catch(function (err) {
            save.disabled = false;
            note.textContent = err && err.message === "key" ? "This phone doesn't have your private key. Open your inbox link first." : "That didn't save. Please try again.";
          });
      };
      var acts = el("div", "gb-reply-acts"); acts.appendChild(save); acts.appendChild(cancel);
      f.appendChild(ta); f.appendChild(acts); f.appendChild(note);
      li.appendChild(f); ta.focus();
    };
    li.appendChild(btn);
  }
  function add(e, top) {
    var li = el("li");
    li.appendChild(el("span", "who", e.name || "Someone"));
    li.appendChild(el("span", "when", fmt(e.ts)));
    li.appendChild(el("p", "txt", e.msg || ""));
    var box = el("div", "gb-reply"); showReply(box, e); li.appendChild(box);
    if (ownerKey && e.id) replyTools(li, e, box);
    if (top) list.insertBefore(li, list.firstChild); else list.appendChild(li);
    if (empty) empty.hidden = true;
  }
  fetch(API, { headers: { accept: "application/json" } })
    .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
    .then(function (d) { ((d && d.entries) || []).forEach(function (e) { add(e, false); }); })
    .catch(function () {})
    .then(settle);
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
      .catch(function () {
        // Keep the message: offer it on WhatsApp, already written out.
        var a = document.createElement("a");
        a.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent("Guest book from " + name + (email ? " (" + email + ")" : "") + ":\n" + msg);
        a.target = "_blank"; a.rel = "noopener"; a.textContent = "send it on WhatsApp";
        status.textContent = "That didn't go through. Your message is still here, so try again, or ";
        status.appendChild(a); status.appendChild(document.createTextNode(" instead."));
      })
      .then(function () { btn.disabled = false; });
  });
})();
