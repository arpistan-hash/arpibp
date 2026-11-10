(function () {
  'use strict';
  var ASK_URL = '/.netlify/functions/ask';
  var topics = window.TOPICS;
  var synth = window.speechSynthesis;
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var langSel = document.getElementById('lang');
  var promptEl = document.getElementById('prompt');
  var playingBtn = null;

  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; }

  // ---- freshness ----
  function freshness(t) {
    if (!t.updated) return { cls: 'warn', label: 'Draft: not verified yet' };
    var days = Math.floor((Date.now() - new Date(t.updated).getTime()) / 864e5);
    if (days > t.reviewDays) return { cls: 'warn', label: 'May be out of date (checked ' + t.updated + ')' };
    return { cls: '', label: 'Checked ' + t.updated };
  }

  // ---- voice ----
  function speak(text, btn) {
    if (!synth) { alert('Speech is not supported in this browser.'); return; }
    var wasPlaying = btn && btn === playingBtn;
    synth.cancel();
    if (playingBtn) { playingBtn.classList.remove('playing'); playingBtn.textContent = '🔊 Hear it'; playingBtn = null; }
    if (wasPlaying) return;
    var u = new SpeechSynthesisUtterance(text);
    u.lang = langSel.value;
    var v = synth.getVoices().filter(function (x) { return x.lang && x.lang.indexOf(langSel.value.slice(0, 2)) === 0; })[0];
    if (v) u.voice = v;
    if (btn) {
      playingBtn = btn; btn.classList.add('playing'); btn.textContent = '⏹ Stop';
      u.onend = u.onerror = function () { if (playingBtn === btn) { btn.classList.remove('playing'); btn.textContent = '🔊 Hear it'; playingBtn = null; } };
    }
    synth.speak(u);
  }

  // ---- topic list ----
  function render(filter) {
    var box = document.getElementById('topics');
    box.innerHTML = '';
    var q = (filter || '').toLowerCase();
    topics.filter(function (t) { return !q || (t.title + ' ' + t.summary + ' ' + t.text).toLowerCase().indexOf(q) >= 0; })
      .forEach(function (t) {
        var f = freshness(t);
        var el = document.createElement('article');
        el.className = 'topic';
        el.innerHTML = '<h2>' + esc(t.icon) + ' ' + esc(t.title) + '</h2><p class="sum">' + esc(t.summary) + '</p>' +
          '<p class="body" hidden>' + esc(t.text) + '</p>' +
          '<span class="badge ' + f.cls + '">' + esc(f.label) + '</span>' +
          '<div class="row"><button type="button" class="more">Read</button><button type="button" class="hear">🔊 Hear it</button><button type="button" class="askbtn">Ask about this</button></div>';
        var body = el.querySelector('.body');
        el.querySelector('.more').addEventListener('click', function () { body.hidden = !body.hidden; this.textContent = body.hidden ? 'Read' : 'Hide'; });
        el.querySelector('.hear').addEventListener('click', function () { speak(t.title + '. ' + t.text, this); });
        el.querySelector('.askbtn').addEventListener('click', function () {
          document.getElementById('askTopic').value = t.id;
          document.getElementById('ask').scrollIntoView({ behavior: 'smooth' });
          document.querySelector('#askForm textarea').focus();
        });
        box.appendChild(el);
      });
    if (!box.children.length) box.innerHTML = '<p class="hint">No topic matches. Ask a question below, and the owner or community will answer.</p>';
  }
  document.getElementById('search').addEventListener('input', function () { render(this.value); });

  var sel = document.getElementById('askTopic');
  sel.innerHTML = '<option value="">General</option>' + topics.map(function (t) { return '<option value="' + esc(t.id) + '">' + esc(t.title) + '</option>'; }).join('');

  // ---- Q&A (reuses the existing "Ask Arpi" function) ----
  function topicTitle(id) { var t = topics.filter(function (x) { return x.id === id; })[0]; return t ? t.title : ''; }

  function loadAnswers() {
    var box = document.getElementById('answers');
    fetch(ASK_URL, { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) {
      var qs = d.questions || [];
      box.innerHTML = qs.length ? '' : '<p class="hint">No answered questions yet.</p>';
      qs.slice(0, 30).forEach(function (x) {
        var el = document.createElement('div'); el.className = 'qa';
        el.innerHTML = '<p class="q">' + esc(x.q) + '</p><p class="a">' + esc(x.a) + '</p><p class="hint">' + esc(x.name || 'Visitor') + '</p>';
        box.appendChild(el);
      });
    }).catch(function () { box.innerHTML = '<p class="hint">Answers load once the helper is deployed with the site.</p>'; });
  }

  document.getElementById('askForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, msg = document.getElementById('askMsg');
    var t = topicTitle(f.topic.value);
    var body = { name: f.name.value, q: (t ? '[' + t + '] ' : '') + f.q.value, 'bot-field': f['bot-field'].value };
    msg.textContent = 'Sending…';
    fetch(ASK_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (x) {
        if (x.ok) { msg.textContent = 'Thanks! Your question is in. Answers usually come within 24 hours.'; f.q.value = ''; }
        else msg.textContent = (x.d && x.d.error) || 'Could not send. Please try again in a minute.';
      }).catch(function () { msg.textContent = 'Could not reach the server. This works once the helper is deployed with the site.'; });
  });

  // ---- dictate a question ----
  var mic = document.getElementById('mic');
  if (!SR) mic.hidden = true;
  mic.addEventListener('click', function () {
    var r = new SR(); r.lang = langSel.value; r.interimResults = false;
    r.onresult = function (ev) { var ta = document.querySelector('#askForm textarea'); ta.value = (ta.value + ' ' + ev.results[0][0].transcript).trim(); };
    r.onerror = function () { promptEl.textContent = 'Could not hear you. Try again or type.'; };
    r.start();
  });


  // ---- Bud Bud board (fellow tourists) ----
  var BOARD_URL = '/.netlify/functions/board';
  var ERRORS = {
    too_fast: 'Slow down a little, try again in 30 seconds.',
    no_contact_details: 'Please leave out links, emails and phone numbers. Private messages are coming later.',
    missing_text: 'Please write something.'
  };
  document.getElementById('postTopic').innerHTML = '<option value="">Any topic</option>' +
    topics.map(function (t) { return '<option value="' + esc(t.id) + '">' + esc(t.title) + '</option>'; }).join('');
  var nickBox = document.querySelector('#postForm [name=nick]');
  try { nickBox.value = localStorage.getItem('budbud.nick') || ''; } catch (e) {}

  function osm(lat, lng) { return 'https://www.openstreetmap.org/?mlat=' + lat + '&mlon=' + lng + '#map=16/' + lat + '/' + lng; }
  var M = window.MEETUP;
  if (M) document.getElementById('meetup').innerHTML = '<h3>Daily meetup at ' + esc(M.time) + '</h3><p>' + esc(M.place) + '</p><p class="hint">' + esc(M.note) + '</p>' +
    '<a href="' + osm(M.lat, M.lng) + '" target="_blank" rel="noopener">Open on map</a>';

  function when(p) {
    var parts = [];
    if (p.topic) parts.push(topicTitle(p.topic));
    if (p.time) parts.push('meet ' + p.time);
    if (p.from || p.to) parts.push('in Budapest ' + (p.from || '?') + ' to ' + (p.to || '?'));
    return parts.join(' · ');
  }

  function post(body) {
    return fetch(BOARD_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); });
  }

  function loadBoard() {
    var box = document.getElementById('posts');
    fetch(BOARD_URL, { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) {
      var ps = d.posts || [];
      box.innerHTML = ps.length ? '' : '<p class="hint">No plans yet. Be the first to post one.</p>';
      ps.forEach(function (p) {
        var el = document.createElement('article'); el.className = 'post';
        el.innerHTML = '<p class="who">' + esc(p.nick || 'Visitor') + '</p><p class="meta">' + esc(when(p)) + '</p><p class="txt">' + esc(p.text) + '</p>' +
          (p.cell ? '<p class="meta"><a href="' + osm(p.cell[0], p.cell[1]) + '" target="_blank" rel="noopener">Rough area (about 500 m)</a></p>' : '') +
          p.replies.map(function (r) { return '<div class="reply"><strong>' + esc(r.nick || 'Visitor') + ':</strong> ' + esc(r.text) + '</div>'; }).join('') +
          '<form class="replyform"><input placeholder="Reply" maxlength="500" required><button class="primary">Send</button></form>' +
          '<button type="button" class="linkbtn">Report</button>';
        el.querySelector('form').addEventListener('submit', function (e) {
          e.preventDefault();
          var inp = e.target.querySelector('input'), nick = nickBox.value || prompt('Your nickname?') || '';
          post({ post: p.id, nick: nick, text: inp.value }).then(function (x) {
            if (x.ok) loadBoard(); else alert(ERRORS[x.d && x.d.error] || 'Could not send. Please try again.');
          }).catch(function () { alert('Could not reach the server.'); });
        });
        el.querySelector('.linkbtn').addEventListener('click', function () {
          if (!confirm('Report this post as inappropriate?')) return;
          post({ report: p.id }).then(function (x) { alert(x.ok ? 'Thanks, we will look at it.' : (ERRORS[x.d && x.d.error] || 'Could not send.')); });
        });
        box.appendChild(el);
      });
    }).catch(function () { box.innerHTML = '<p class="hint">The board loads once Bud Bud is deployed with the site.</p>'; });
  }

  document.getElementById('postForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, msg = document.getElementById('postMsg');
    try { localStorage.setItem('budbud.nick', f.nick.value); } catch (err) {}
    msg.textContent = 'Posting…';
    var base = { nick: f.nick.value, topic: f.topic.value, text: f.text.value, from: f.from.value, to: f.to.value, time: f.time.value, 'bot-field': f['bot-field'].value };
    var send = function (extra) {
      post(Object.assign(base, extra || {})).then(function (x) {
        if (x.ok) { msg.textContent = 'Posted!'; f.text.value = ''; loadBoard(); }
        else msg.textContent = ERRORS[x.d && x.d.error] || 'Could not post. Please try again.';
      }).catch(function () { msg.textContent = 'Could not reach the server. This works once Bud Bud is deployed with the site.'; });
    };
    if (f.share.checked) {
      if (!navigator.geolocation) { msg.textContent = 'Location is not available in this browser. Untick "Share my rough area".'; return; }
      msg.textContent = 'Getting your rough area…';
      navigator.geolocation.getCurrentPosition(function (p) {
        // Snap to the ~500 m grid here, so the exact position never leaves the phone (the server snaps again).
        var snapTo = function (v, step) { return Math.floor(v / step) * step + step / 2; };
        send({ lat: snapTo(p.coords.latitude, 0.005), lng: snapTo(p.coords.longitude, 0.007) });
      },
        function () { msg.textContent = 'Could not get your location. Untick "Share my rough area" to post without it.'; });
    } else send();
  });

  loadAnswers();
  loadBoard();
  render('');
  promptEl.textContent = 'Tap 🔊 Hear it on any topic, or search above.';
})();
