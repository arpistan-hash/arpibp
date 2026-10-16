// "Call Arpi to your table": guests pick their table, tap things from the menu (assets/menu.js)
// or write what they'd like, and it pops up on Arpi's inbox page.
// The form is drawn into every <div class="tbl-mount"> (the section on the main page and table.html).
(function () {
  var WA = "36202239524";
  var MENU = window.ARPI_MENU || { food: [], drinks: [] };
  var SPIRIT = window.ARPI_SPIRIT_OPTIONS || [];
  var qs = new URLSearchParams(location.search);
  var fromUrl = (qs.get("t") || qs.get("table") || "").replace(/[^0-9A-Za-z -]/g, "").slice(0, 12);
  var saved = ""; try { saved = sessionStorage.getItem("arpi-table") || ""; } catch (e) {}

  var FORM =
    '<form class="tbl-form" novalidate>' +
      '<p hidden><label>Do not fill this in: <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>' +
      '<label class="tbl-num"><span><b>1</b> Your table number</span><input name="table" inputmode="numeric" maxlength="12" autocomplete="off" placeholder="#" required></label>' +
      '<div class="tbl-step"><span><b>2</b> What can I get you?</span></div>' +
      '<div class="tbl-quick" role="group" aria-label="Quick requests">' +
        '<button type="button" data-say="Please come over 🙋">🙋 Please come over</button>' +
        '<button type="button" data-say="Another round, please 🍻">🍻 Another round</button>' +
        '<button type="button" data-say="Some water, please 💧">💧 Water</button>' +
        '<button type="button" data-say="The bill, please 🧾">🧾 The bill</button>' +
      '</div>' +
      '<div class="tbl-menu" hidden></div>' +
      '<label class="tbl-note"><span>Anything else? Just write it</span><textarea name="msg" maxlength="600" rows="2" placeholder="Two more glasses of the Tokaji, please!"></textarea></label>' +
      '<button type="button" class="tbl-allergy-btn" aria-expanded="false">⚠️ I have an allergy</button>' +
      '<div class="tbl-allergy" hidden>' +
        '<p>Tap everything that applies. I\'ll come over to check with you before anything reaches your table.</p>' +
        '<div class="chs">' + ["Gluten", "Peanuts", "Tree nuts", "Milk", "Eggs", "Fish", "Shellfish", "Soy", "Sesame", "Celery", "Mustard", "Sulphites"].map(function (a) { return '<button type="button" aria-pressed="false">' + a + '</button>'; }).join("") + '</div>' +
        '<label><span>Something else?</span><input name="allergy-note" maxlength="120" placeholder="e.g. vegan, no pork, kiwi"></label>' +
      '</div>' +
      '<div class="tbl-actions">' +
        '<button type="submit" class="tbl-send">Send to Arpi 🚀</button>' +
        '<a class="tbl-wa" href="https://wa.me/36202239524">or send on WhatsApp</a>' +
      '</div>' +
      '<p class="tbl-status" role="status" aria-live="polite"></p>' +
    '</form>';
  document.querySelectorAll(".tbl-mount").forEach(function (m) { m.innerHTML = FORM; });

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function hasItems(groups) { return (groups || []).some(function (g) { return g.items && g.items.length; }); }
  function optsOf(item) { return item.options === "spirit" ? SPIRIT : (item.options || []); }

  document.querySelectorAll("form.tbl-form").forEach(function (form) {
    var table = form.querySelector("[name=table]"), msg = form.querySelector("[name=msg]");
    var status = form.querySelector(".tbl-status"), send = form.querySelector(".tbl-send"), wa = form.querySelector(".tbl-wa");
    var menuBox = form.querySelector(".tbl-menu"), basket = [];
    var algBtn = form.querySelector(".tbl-allergy-btn"), algBox = form.querySelector(".tbl-allergy"), algNote = form.querySelector("[name=allergy-note]");
    function allergies() {
      if (!algBox || algBox.hidden) return "";
      var picked = Array.prototype.map.call(algBox.querySelectorAll(".chs button[aria-pressed=true]"), function (b) { return b.textContent.trim(); });
      var note = algNote ? algNote.value.trim() : "";
      return picked.concat(note ? [note] : []).join(", ");
    }
    if (algBtn && algBox) {
      algBtn.addEventListener("click", function () {
        algBox.hidden = !algBox.hidden;
        algBtn.setAttribute("aria-expanded", algBox.hidden ? "false" : "true");
        if (!algBox.hidden) { var f = algBox.querySelector("button"); if (f) f.focus(); }
      });
      algBox.querySelectorAll(".chs button").forEach(function (b) {
        b.addEventListener("click", function () { var on = b.getAttribute("aria-pressed") === "true"; b.setAttribute("aria-pressed", on ? "false" : "true"); });
      });
    }
    if (fromUrl || saved) table.value = fromUrl || saved;

    form.querySelectorAll(".tbl-quick button").forEach(function (b) {
      b.addEventListener("click", function () {
        var t = b.getAttribute("data-say") || b.textContent.trim();
        msg.value = msg.value.trim() ? msg.value.trim() + "\n" + t : t;
        msg.focus();
      });
    });

    // ---- Menu: Food / Drinks tabs, categories, option picker, basket ----
    var basketBox = null;
    function renderBasket() {
      if (!basketBox) return;
      basketBox.textContent = "";
      basketBox.hidden = !basket.length;
      if (!basket.length) return;
      basketBox.appendChild(el("p", "tbl-basket-h", "Your order"));
      var ul = el("ul");
      basket.forEach(function (b, i) {
        var li = el("li");
        var minus = el("button", "q", "−"); minus.type = "button"; minus.setAttribute("aria-label", "One less " + b.name);
        var plus = el("button", "q", "+"); plus.type = "button"; plus.setAttribute("aria-label", "One more " + b.name);
        minus.onclick = function () { b.qty--; if (b.qty < 1) basket.splice(i, 1); renderBasket(); };
        plus.onclick = function () { b.qty++; renderBasket(); };
        var txt = el("span", "nm"); txt.appendChild(el("b", null, b.qty + "× ")); txt.appendChild(document.createTextNode(b.name));
        if (b.extra) txt.appendChild(el("small", null, " " + b.extra));
        li.appendChild(minus); li.appendChild(plus); li.appendChild(txt); ul.appendChild(li);
      });
      basketBox.appendChild(ul);
    }
    function addToBasket(name, extra) {
      var hit = basket.filter(function (b) { return b.name === name && b.extra === extra; })[0];
      if (hit) hit.qty++; else basket.push({ name: name, extra: extra, qty: 1 });
      renderBasket();
      status.textContent = "Added: " + name + (extra ? " " + extra : "");
    }
    function picker(item, row) {
      var old = row.parentNode.querySelector(".tbl-pick"); if (old) { old.remove(); if (old.__item === item) return; }
      var opts = optsOf(item), chosen = {};
      if (!opts.length) { addToBasket(item.name, ""); return; }
      var box = el("div", "tbl-pick"); box.__item = item;
      function draw() {
        box.textContent = "";
        opts.forEach(function (o) {
          if (o.when && !Object.keys(chosen).some(function (k) { return chosen[k] === o.when; })) { delete chosen[o.label]; return; }
          var g = el("div", "grp"); g.appendChild(el("p", null, o.label));
          var cs = el("div", "chs");
          o.choices.forEach(function (c) {
            var b = el("button", chosen[o.label] === c ? "on" : "", c); b.type = "button"; b.setAttribute("aria-pressed", chosen[o.label] === c ? "true" : "false");
            b.onclick = function () { chosen[o.label] = c; draw(); };
            cs.appendChild(b);
          });
          g.appendChild(cs); box.appendChild(g);
        });
        var add = el("button", "tbl-add", "Add to my order"); add.type = "button";
        add.onclick = function () {
          var parts = [];
          opts.forEach(function (o) {
            var v = chosen[o.label]; if (!v) return;
            if (o.when && parts[parts.length - 1] === o.when) parts[parts.length - 1] = "with " + v; else parts.push(v);
          });
          addToBasket(item.name, parts.length ? "(" + parts.join(", ") + ")" : "");
          box.remove();
        };
        box.appendChild(add);
      }
      draw();
      row.insertAdjacentElement("afterend", box);
    }
    function buildMenu() {
      if (!menuBox || !(hasItems(MENU.food) || hasItems(MENU.drinks))) { if (menuBox) menuBox.hidden = true; return; }
      menuBox.hidden = false;
      var tabs = el("div", "tbl-tabs"), panel = el("div", "tbl-panel");
      tabs.setAttribute("role", "tablist");
      [["food", "🍽️ I'd like food"], ["drinks", "🍸 I'd like a drink"]].forEach(function (t) {
        if (!hasItems(MENU[t[0]])) return;
        var b = el("button", "tab", t[1]); b.type = "button"; b.setAttribute("role", "tab"); b.setAttribute("aria-selected", "false");
        b.onclick = function () {
          var on = b.getAttribute("aria-selected") === "true";
          tabs.querySelectorAll(".tab").forEach(function (x) { x.setAttribute("aria-selected", "false"); });
          panel.textContent = "";
          if (on) return;
          b.setAttribute("aria-selected", "true");
          MENU[t[0]].forEach(function (g) {
            if (!g.items || !g.items.length) return;
            var d = el("details", "cat"); var s = el("summary", null, g.category); d.appendChild(s);
            g.items.forEach(function (it) {
              var row = el("div", "item");
              var info = el("div", "info"); info.appendChild(el("b", null, it.name));
              if (it.desc) info.appendChild(el("small", null, it.desc));
              row.appendChild(info);
              if (it.price) row.appendChild(el("span", "price", it.price));
              var plus = el("button", "plus", "+"); plus.type = "button"; plus.setAttribute("aria-label", "Add " + it.name);
              plus.onclick = function () { picker(it, row); };
              row.appendChild(plus); d.appendChild(row);
            });
            panel.appendChild(d);
          });
          var first = panel.querySelector("details"); if (first) first.open = true;
        };
        tabs.appendChild(b);
      });
      basketBox = el("div", "tbl-basket"); basketBox.hidden = true;
      menuBox.appendChild(tabs); menuBox.appendChild(panel); menuBox.appendChild(basketBox);
    }
    buildMenu();

    function compose() {
      var lines = basket.map(function (b) { return b.qty + "× " + b.name + (b.extra ? " " + b.extra : ""); });
      var note = msg.value.trim();
      if (lines.length && note) return lines.join("\n") + "\n✏️ " + note;
      return lines.length ? lines.join("\n") : note;
    }
    function text() { var a = allergies(); return "Table " + table.value.trim() + ":\n" + (a ? "\u26A0\uFE0F ALLERGY: " + a + "\n" : "") + compose(); }
    if (wa) wa.addEventListener("click", function (e) {
      e.preventDefault();
      if (!table.value.trim() || !(compose() || allergies())) { status.textContent = "Please add your table number and what you'd like first."; return; }
      window.open("https://wa.me/" + WA + "?text=" + encodeURIComponent(text()), "_blank", "noopener");
    });

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var t = table.value.trim(), m = compose(), a = allergies();
      if (!t) { status.textContent = "Which table are you at? The number is on your table."; table.focus(); return; }
      if (!m && !a) { status.textContent = "Tell me what you'd like, or just tap “Please come over”."; msg.focus(); return; }
      var hp = form.querySelector("[name=bot-field]");
      send.disabled = true; status.textContent = "Sending…";
      fetch("/.netlify/functions/table", {
        method: "POST",
        headers: { "Content-Type": "application/json", accept: "application/json" },
        body: JSON.stringify({ table: t, msg: m, allergy: a, "bot-field": hp ? hp.value : "" })
      })
        .then(function (r) {
          if (r.status === 429) return "wait";
          if (!r.ok) throw new Error("bad");
          return r.json();
        })
        .then(function (d) {
          if (d === "wait") { status.textContent = "Got your last one! Give it a few seconds before sending another."; return; }
          if (!d || !d.ok) throw new Error("bad");
          try { sessionStorage.setItem("arpi-table", t); } catch (e) {}
          msg.value = ""; basket = []; renderBasket();
          if (a && algBox) { algBox.hidden = true; if (algBtn) algBtn.setAttribute("aria-expanded", "false"); algBox.querySelectorAll(".chs button").forEach(function (b) { b.setAttribute("aria-pressed", "false"); }); if (algNote) algNote.value = ""; }
          status.textContent = "Got it! Arpi will be with table " + t + " soon. 🙌";
          form.classList.remove("sent"); void form.offsetWidth; form.classList.add("sent");
        })
        .catch(function () {
          status.textContent = "That didn't go through. Tap “Send on WhatsApp” instead, or just wave. 👋";
        })
        .then(function () { send.disabled = false; });
    });
  });

  if (fromUrl) {
    var sec = document.getElementById("table");
    if (sec && sec.scrollIntoView) setTimeout(function () { sec.scrollIntoView({ block: "start" }); }, 300);
  }
})();
