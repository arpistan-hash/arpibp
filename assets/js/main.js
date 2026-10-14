/* Arpi · personal site. Vanilla JS, no dependencies. */
(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Edit these values to change every contact link on the page.
  // ---------------------------------------------------------------------------
  var CONTACT = {
    whatsapp: "+36 20 223 9524",
    email: "arpistan@gmail.com",
    tip: "https://revolut.me/arpadqsln"
  };
  var BORN = "1979-11-27T00:00:00+01:00"; // for the live day counter (Budapest midnight)
  var TZ = "Europe/Budapest";

  var doc = document;
  var root = doc.documentElement;
  var $ = function (sel, ctx) { return (ctx || doc).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  // One observer helper: call fn(el) the first time el is on screen.
  function onceVisible(els, fn, opts) {
    if (!("IntersectionObserver" in window)) { els.forEach(fn); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { io.unobserve(e.target); fn(e.target); }
      });
    }, opts || { threshold: 0.15 });
    els.forEach(function (el) { io.observe(el); });
  }

  // ---------------------------------------------------------------------------
  // Contact links
  // ---------------------------------------------------------------------------
  (function contact() {
    var digits = CONTACT.whatsapp.replace(/\D/g, "");
    var wa = "https://wa.me/" + digits;
    $$("[data-wa]").forEach(function (a) { a.href = wa; });
    $$("[data-wa-text]").forEach(function (n) { n.textContent = CONTACT.whatsapp; });
    $$("[data-mail-text]").forEach(function (n) { n.textContent = CONTACT.email; });
    $$("[data-mail]").forEach(function (a) { a.href = "mailto:" + CONTACT.email; });
    $$("[data-tip]").forEach(function (a) { a.href = CONTACT.tip; });
    $$("[data-tip-text]").forEach(function (n) { n.textContent = CONTACT.tip.replace(/^https?:\/\//, ""); });

    var btn = $("#copy-btn");
    if (btn) btn.addEventListener("click", function () {
      var done = function () {
        btn.textContent = "Copied!";
        setTimeout(function () { btn.textContent = "Copy address"; }, 1800);
      };
      var fallback = function () {
        var r = doc.createRange();
        r.selectNodeContents($("#mail-text"));
        var s = window.getSelection();
        s.removeAllRanges(); s.addRange(r);
        btn.textContent = "Selected, press copy";
      };
      try { navigator.clipboard.writeText(CONTACT.email).then(done, fallback); } catch (e) { fallback(); }
    });

    var dockMail = $("#dock-mail");
    if (dockMail) dockMail.addEventListener("click", function () {
      var row = $("#email-row");
      row.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      row.classList.add("flash");
      setTimeout(function () { row.classList.remove("flash"); }, 1600);
    });
  })();

  // ---------------------------------------------------------------------------
  // Theme toggle (the initial theme is set by a tiny inline script in <head>)
  // ---------------------------------------------------------------------------
  (function theme() {
    var btn = $("#theme-btn");
    if (!btn) return;
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    function isDark() {
      var t = root.getAttribute("data-theme");
      return t ? t === "dark" : mq.matches;
    }
    function sync() {
      btn.setAttribute("aria-pressed", isDark() ? "true" : "false");
      var m = $('meta[name="theme-color"]');
      if (m) m.setAttribute("content", isDark() ? "#08111b" : "#f6f2ea");
    }
    btn.addEventListener("click", function () {
      var next = isDark() ? "light" : "dark";
      root.setAttribute("data-theme", next);
      store.set("theme", next);
      sync();
    });
    sync();
  })();

  // ---------------------------------------------------------------------------
  // Top bar: solid after the hero, progress bar, active section, mobile menu
  // ---------------------------------------------------------------------------
  (function chrome() {
    var bar = $(".topbar"), prog = $(".progress i");
    var links = $$(".nav a");
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY || 0;
        var max = Math.max(1, doc.documentElement.scrollHeight - window.innerHeight);
        if (prog) prog.style.transform = "scaleX(" + Math.min(1, y / max).toFixed(4) + ")";
        if (bar) bar.classList.toggle("solid", y > 40);
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var secs = Object.keys(map).map(function (id) { return doc.getElementById(id); }).filter(Boolean);
    if ("IntersectionObserver" in window && secs.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          links.forEach(function (a) { a.classList.remove("on"); });
          if (map[e.target.id]) map[e.target.id].classList.add("on");
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      secs.forEach(function (s) { io.observe(s); });
    }

    var menuBtn = $("#menu-btn"), mnav = $("#mnav");
    if (menuBtn && mnav) {
      function setMenu(open) {
        mnav.hidden = !open;
        menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
        if (open && bar) bar.classList.add("solid");
        else onScroll();
      }
      menuBtn.addEventListener("click", function () { setMenu(mnav.hidden); });
      mnav.addEventListener("click", function (e) { if (e.target.tagName === "A") setMenu(false); });
      doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && !mnav.hidden) { setMenu(false); menuBtn.focus(); } });
    }
  })();

  // ---------------------------------------------------------------------------
  // Scroll reveal, counters, age pins
  // ---------------------------------------------------------------------------
  onceVisible($$(".reveal"), function (el) { el.classList.add("in"); }, { threshold: 0.12 });
  onceVisible($$(".ag-row"), function (el) {
    var i = $$(".ag-row").indexOf(el);
    setTimeout(function () { el.classList.add("in"); }, reduce ? 0 : 120 * i);
  }, { threshold: 0.4 });

  onceVisible($$("[data-count]"), function (el) {
    var target = parseInt(el.getAttribute("data-count"), 10), suffix = el.getAttribute("data-suffix") || "";
    if (reduce || !isFinite(target)) { el.textContent = target + suffix; return; }
    var t0 = performance.now(), dur = 1400;
    (function step(now) {
      var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e) + suffix;
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }, { threshold: 0.6 });

  // ---------------------------------------------------------------------------
  // Clock + day counter
  // ---------------------------------------------------------------------------
  (function clocks() {
    var clock = $("#clock"), clockPill = $(".clock"), heroClock = $("#hero-clock");
    function tick() {
      try {
        var now = new Date();
        var txt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ }).format(now);
        if (clock) clock.textContent = txt;
        if (heroClock) heroClock.textContent = txt;
        var h = parseInt(txt.slice(0, 2), 10);
        if (clockPill) clockPill.classList.toggle("night", h < 7 || h >= 23);
      } catch (e) {}
    }
    tick(); setInterval(tick, 20000);

    var days = $("#age-days"), ord = $("#age-ord"), hms = $("#age-hms"), stat = $("#stat-days"), statHms = $("#stat-hms");
    if (!days && !stat) return;
    var born = new Date(BORN).getTime();
    function pad(n) { return (n < 10 ? "0" : "") + n; }
    function day() {
      var s = Math.floor((Date.now() - born) / 1000);
      if (s < 0) return;
      var rem = s % 86400, n = Math.floor(s / 86400) + 1, m = n % 100, d = n % 10;
      var t = pad(Math.floor(rem / 3600)) + ":" + pad(Math.floor((rem % 3600) / 60)) + ":" + pad(rem % 60);
      var ordinal = (m >= 11 && m <= 13) ? "th" : d === 1 ? "st" : d === 2 ? "nd" : d === 3 ? "rd" : "th";
      if (days) days.textContent = n.toLocaleString("en-US");
      if (ord) ord.textContent = ordinal;
      if (hms) hms.textContent = t;
      if (stat) stat.textContent = n.toLocaleString("en-US");
      if (statHms) statHms.textContent = t;
    }
    day(); setInterval(day, 1000);
  })();

  // ---------------------------------------------------------------------------
  // Hero: pointer tilt on the scene
  // ---------------------------------------------------------------------------
  (function tilt() {
    var hero = $(".hero"), frame = $(".scene-frame");
    if (!hero || !frame || reduce || !finePointer) return;
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      frame.style.setProperty("--ry", (x * 7).toFixed(2) + "deg");
      frame.style.setProperty("--rx", (-y * 5).toFixed(2) + "deg");
    });
    hero.addEventListener("pointerleave", function () {
      frame.style.setProperty("--ry", "0deg"); frame.style.setProperty("--rx", "0deg");
    });
  })();

  // ---------------------------------------------------------------------------
  // Story chapter navigation: highlight the chapter in view
  // ---------------------------------------------------------------------------
  (function chapters() {
    var links = $$(".chapnav a");
    if (!links.length || !("IntersectionObserver" in window)) return;
    var by = {};
    links.forEach(function (a) { by[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove("on"); });
        var a = by[e.target.id];
        if (!a) return;
        a.classList.add("on");
        var nav = a.parentNode;
        if (nav.scrollWidth > nav.clientWidth) { // horizontal chip bar on small screens
          nav.scrollTo({ left: a.offsetLeft - 24, behavior: reduce ? "auto" : "smooth" });
        }
      });
    }, { rootMargin: "-35% 0px -55% 0px" });
    $$(".chapter").forEach(function (c) { io.observe(c); });
  })();

  // ---------------------------------------------------------------------------
  // Maps
  // ---------------------------------------------------------------------------
  var tip = null;
  function showTip(x, y, flag, name) {
    if (!tip) { tip = doc.createElement("div"); tip.className = "maptip"; tip.setAttribute("role", "status"); doc.body.appendChild(tip); }
    tip.textContent = "";
    if (flag) { var f = doc.createElement("span"); f.className = "flag"; f.textContent = flag; tip.appendChild(f); }
    tip.appendChild(doc.createTextNode(name));
    tip.style.left = x + "px"; tip.style.top = y + "px"; tip.hidden = false;
  }
  function hideTip() { if (tip) tip.hidden = true; }

  (function worldMap() {
    var svg = $(".wm");
    if (!svg) return;
    $$(".country.visited", svg).forEach(function (p, i) { p.style.setProperty("--i", i); });
    onceVisible([svg], function () { svg.classList.add("in"); }, { threshold: 0.3 });
    if (reduce) svg.classList.add("in");

    var targets = $$(".country.visited, .pin", svg);
    targets.forEach(function (t) {
      function move(e) { showTip(e.clientX, e.clientY, t.getAttribute("data-flag"), t.getAttribute("data-name")); }
      t.addEventListener("pointerenter", move);
      t.addEventListener("pointermove", move);
      t.addEventListener("pointerleave", hideTip);
      t.addEventListener("click", function (e) { e.stopPropagation(); move(e); });
    });
    doc.addEventListener("click", hideTip);
    window.addEventListener("scroll", hideTip, { passive: true });

    // Hovering a chip lights up its country on the map.
    $$(".chips li").forEach(function (li) {
      var name = li.getAttribute("data-name");
      if (!name) return;
      function set(on) { $$('[data-name="' + name.replace(/"/g, "") + '"]', svg).forEach(function (n) { n.classList.toggle("hl", on); }); li.classList.toggle("hl", on); }
      li.addEventListener("pointerenter", function () { set(true); });
      li.addEventListener("pointerleave", function () { set(false); });
      li.addEventListener("click", function () { set(true); setTimeout(function () { set(false); }, 1800); });
    });
  })();

  (function movesMap() {
    var svg = $(".mm");
    if (!svg) return;
    var legs = $$(".leg", svg), items = $$(".moves li[data-leg]");
    legs.forEach(function (l) { l.querySelector(".arc").style.setProperty("--i", l.getAttribute("data-i")); l.style.setProperty("--i", l.getAttribute("data-i")); });
    var timer = null;
    function play() {
      clearTimeout(timer);
      svg.classList.remove("draw", "done");
      void svg.getBBox(); // restart the CSS animations
      svg.classList.add("draw");
      timer = setTimeout(function () { svg.classList.add("done"); }, (legs.length * 0.85 + 1.6) * 1000);
    }
    onceVisible([svg], function () { if (reduce) svg.classList.add("done", "draw"); else play(); }, { threshold: 0.35 });
    var replay = $("#replay");
    if (replay) replay.addEventListener("click", play);

    function hot(key, on) {
      svg.classList.toggle("has-hot", on);
      svg.classList.toggle("hot-h", on && key === "h");
      legs.forEach(function (l) { l.classList.toggle("hot", on && l.getAttribute("data-i") === key); });
      items.forEach(function (li) { li.classList.toggle("hot", on && li.getAttribute("data-leg") === key); });
    }
    items.forEach(function (li) {
      var key = li.getAttribute("data-leg");
      li.addEventListener("pointerenter", function () { hot(key, true); });
      li.addEventListener("pointerleave", function () { hot(key, false); });
      li.addEventListener("focus", function () { hot(key, true); });
      li.addEventListener("blur", function () { hot(key, false); });
    });
    legs.forEach(function (l) {
      var key = l.getAttribute("data-i");
      l.addEventListener("pointerenter", function () { hot(key, true); });
      l.addEventListener("pointerleave", function () { hot(key, false); });
    });
    var hk = $(".halkida", svg);
    if (hk) {
      hk.addEventListener("pointerenter", function () { hot("h", true); });
      hk.addEventListener("pointerleave", function () { hot("h", false); });
    }
  })();

  // Expand a map into a zoomable full-screen dialog.
  (function mapDialog() {
    var dlg = $("#mapdlg");
    if (!dlg || typeof dlg.showModal !== "function") { $$(".expand").forEach(function (b) { b.hidden = true; }); return; }
    var body = $("#mapdlg-body"), title = $("#mapdlg-title"), zoom = 2, shown = null;
    function setZoom(z) { zoom = Math.max(1, Math.min(5, z)); if (shown) shown.style.width = (zoom * 100) + "%"; }
    $$(".expand[data-title]").forEach(function (b) {
      b.addEventListener("click", function () {
        var svg = $("svg", b.parentNode);
        shown = svg.cloneNode(true);
        shown.removeAttribute("aria-labelledby");
        shown.setAttribute("aria-hidden", "true");
        var t = $("title", shown); if (t) t.parentNode.removeChild(t);
        shown.classList.add("in", "draw", "done");
        body.textContent = ""; body.appendChild(shown);
        title.textContent = b.getAttribute("data-title");
        setZoom(2);
        dlg.showModal();
        root.style.overflow = "hidden";
      });
    });
    $("#zoom-in").addEventListener("click", function () { setZoom(zoom + 1); });
    $("#zoom-out").addEventListener("click", function () { setZoom(zoom - 1); });
    $("#map-close").addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("close", function () { root.style.overflow = ""; body.textContent = ""; shown = null; });
  })();

  // ---------------------------------------------------------------------------
  // Photo lightbox
  // ---------------------------------------------------------------------------
  (function lightbox() {
    var dlg = $("#lb");
    if (!dlg || typeof dlg.showModal !== "function") return;
    var img = $("#lb-img"), capText = $("#lb-text"), count = $("#lb-count"), title = $("#lb-title"), stage = $(".lb-stage", dlg);
    var items = [], idx = 0, label = "";

    function load(i) {
      var it = items[i];
      if (!it) return;
      img.src = it.src; img.alt = it.alt; img.width = it.w; img.height = it.h;
      capText.textContent = it.cap || "";
      count.textContent = (i + 1) + " / " + items.length;
      title.textContent = label;
      [i - 1, i + 1].forEach(function (j) { if (items[j]) { var pre = new Image(); pre.src = items[j].src; } });
      $(".lb-nav.prev", dlg).hidden = items.length < 2;
      $(".lb-nav.next", dlg).hidden = items.length < 2;
    }
    function step(d) { if (items.length < 2) return; idx = (idx + d + items.length) % items.length; load(idx); }
    function open(group, i) {
      var figs = $$('[data-gallery="' + group + '"] .ph');
      if (!figs.length) return;
      items = figs.map(function (f) {
        var im = $("img", f), c = $(".cap", f);
        return { src: im.getAttribute("src"), alt: im.alt, w: im.getAttribute("width"), h: im.getAttribute("height"), cap: c ? c.textContent : "" };
      });
      label = $('[data-gallery="' + group + '"]').getAttribute("data-label") || "";
      idx = Math.max(0, Math.min(items.length - 1, i || 0));
      load(idx);
      dlg.showModal();
      root.style.overflow = "hidden";
    }

    doc.addEventListener("click", function (e) {
      var ph = e.target.closest && e.target.closest(".ph");
      if (ph) {
        var g = ph.closest("[data-gallery]");
        if (g) open(g.getAttribute("data-gallery"), $$(".ph", g).indexOf(ph));
        return;
      }
      var d = e.target.closest && e.target.closest("[data-open]");
      if (d) open(d.getAttribute("data-open"), 0);
    });
    $(".lb-nav.prev", dlg).addEventListener("click", function () { step(-1); });
    $(".lb-nav.next", dlg).addEventListener("click", function () { step(1); });
    $("#lb-close").addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("close", function () { root.style.overflow = ""; img.removeAttribute("src"); });
    dlg.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
    });
    stage.addEventListener("click", function (e) { if (e.target === stage) dlg.close(); });

    var x0 = null;
    stage.addEventListener("pointerdown", function (e) { x0 = e.clientX; });
    stage.addEventListener("pointerup", function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    });
    stage.addEventListener("pointercancel", function () { x0 = null; });
  })();

  // ---------------------------------------------------------------------------
  // Tobi's passport
  // ---------------------------------------------------------------------------
  (function tobi() {
    var b = $("#tobi-btn"), p = $("#tobi-pass");
    if (!b || !p) return;
    var barks = 0;
    b.addEventListener("click", function () {
      var open = b.getAttribute("aria-expanded") === "true";
      b.setAttribute("aria-expanded", open ? "false" : "true");
      p.hidden = open;
      if (!open) {
        p.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
        var w = doc.createElement("span");
        w.className = "woof"; w.textContent = ["Vau!", "Vau vau!", "Vau!!"][barks++ % 3]; w.setAttribute("aria-hidden", "true");
        b.parentNode.insertBefore(w, b);
        setTimeout(function () { if (w.parentNode) w.parentNode.removeChild(w); }, 1700);
      }
    });
  })();

  // ---------------------------------------------------------------------------
  // Message form: Netlify Forms when hosted there, WhatsApp as the fallback
  // ---------------------------------------------------------------------------
  (function form() {
    var f = $("#gb-form");
    if (!f) return;
    var status = $("#gb-status"), send = $("#gb-send");
    function say(msg, ok) { status.textContent = msg; status.classList.toggle("ok", !!ok); }
    function whatsappFallback(name, email, msg) {
      var url = "https://wa.me/" + CONTACT.whatsapp.replace(/\D/g, "") + "?text=" +
        encodeURIComponent("Hi Arpi, it's " + name + " (" + email + "):\n" + msg);
      status.classList.remove("ok");
      status.textContent = "That didn't go through from here. ";
      var a = doc.createElement("a");
      a.href = url; a.target = "_blank"; a.rel = "noopener"; a.textContent = "Send it on WhatsApp instead";
      status.appendChild(a);
      try { window.open(url, "_blank", "noopener"); } catch (e) {} // some browsers block this after a network call, hence the link
    }
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var name = f.elements.name.value.trim(), email = f.elements.email.value.trim(), msg = f.elements.message.value.trim();
      if (f.elements["bot-field"] && f.elements["bot-field"].value) return; // honeypot
      if (!name || !msg || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { say("Please fill in your name, a valid email and a message."); return; }
      send.disabled = true; say("Sending...");
      var body = new URLSearchParams(new FormData(f)).toString();
      fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body })
        .then(function (r) {
          if (!r.ok) throw new Error("status " + r.status);
          say("Thank you, " + name + "! Your message is on its way.", true);
          f.elements.message.value = "";
        })
        .catch(function () { whatsappFallback(name, email, msg); })
        .then(function () { send.disabled = false; });
    });
  })();
})();
