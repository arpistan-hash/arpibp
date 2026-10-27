/* Lounge on its own website: stands in for the Claude page runtime so the same app runs with
   no sign-in. Guests get a random id for this phone; staff unlock the board with the staff PIN
   (open the site with #staff). Data lives behind /api (Netlify Functions + Blobs). */
(function () {
  if (window.claude) return; // running inside Claude: use the real runtime

  var API = '/api';
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function rand(n) {
    var a = new Uint8Array(n), c = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789', out = '';
    crypto.getRandomValues(a);
    for (var i = 0; i < n; i++) out += c[a[i] % c.length];
    return out;
  }
  var uid = lsGet('lounge.uid');
  if (!uid || !/^g_[A-Za-z0-9]{20,40}$/.test(uid)) { uid = 'g_' + rand(24); lsSet('lounge.uid', uid); }
  var token = lsGet('lounge.staffToken') || '';

  function call(method, path, body) {
    var h = { 'content-type': 'application/json' };
    if (token) h['x-staff-token'] = token;
    return fetch(API + path, { method: method, headers: h, body: body == null ? undefined : JSON.stringify(body), cache: 'no-store' }).then(function (r) {
      if (r.ok) return r.json();
      var e = new Error('HTTP ' + r.status);
      e.code = r.status === 401 ? 'permission_denied' : r.status === 400 || r.status === 413 ? 'invalid_argument' : 'unavailable';
      throw e;
    }, function () { var e = new Error('offline'); e.code = 'unavailable'; throw e; });
  }

  /* ---------- polling, shaped like live snapshots ---------- */
  function docSnap(id, data) { return { id: id, exists: data != null, data: function () { return data; } }; }
  function colSnap(list) {
    var d = list.map(function (x) { return docSnap(x.id, x.data); });
    return { docs: d, size: d.length, empty: !d.length, forEach: function (f) { d.forEach(f); } };
  }
  // one poller per endpoint, many listeners; it only calls back when the data changed
  function Poller(path, every) {
    this.path = path; this.every = every; this.subs = []; this.last = null; this.data = null; this.timer = 0; this.running = false;
  }
  Poller.prototype.on = function (fn, err) {
    var s = { fn: fn, err: err }, self = this;
    this.subs.push(s);
    if (this.data) setTimeout(function () { fn(self.data); }, 0);
    if (!this.running) { this.running = true; this.tick(); }
    return function () { self.subs = self.subs.filter(function (x) { return x !== s; }); };
  };
  Poller.prototype.tick = function () {
    var self = this;
    clearTimeout(this.timer);
    if (document.hidden && this.data) { this.timer = setTimeout(function () { self.tick(); }, 3000); return; }
    call('GET', this.path).then(function (j) {
      var str = JSON.stringify(j);
      if (str !== self.last) { self.last = str; self.data = j; self.subs.forEach(function (s) { try { s.fn(j); } catch (e) { console.error(e); } }); }
    }, function (e) {
      if (!self.data) self.subs.forEach(function (s) { if (s.err) try { s.err(e); } catch (_) {} });
    }).then(function () {
      var ms = typeof self.every === 'function' ? self.every(self.data) : self.every;
      self.timer = setTimeout(function () { self.tick(); }, ms);
    });
  };
  Poller.prototype.now = function () { if (this.running) this.tick(); };

  // a guest polls fast only while something they asked for is still open
  function guestEvery(d) {
    if (!d || !d.mine || !Array.isArray(d.mine.reqs)) return 45000;
    var since = Date.now() - 4 * 3600 * 1000;
    var open = d.mine.reqs.some(function (r) {
      if (!r || r.cancelled || (r.createdAt || 0) < since) return false;
      var st = d.status && d.status[r.id];
      return !st || st.state === 'seen';
    });
    return open ? 6000 : 45000;
  }
  var P = {
    menu: new Poller('/menu', 60000),
    sounds: new Poller('/sounds', 300000),
    guest: new Poller('/guest?uid=' + uid, guestEvery),
    staff: new Poller('/staff', 5000)
  };
  document.addEventListener('visibilitychange', function () { if (!document.hidden) Object.keys(P).forEach(function (k) { P[k].now(); }); });

  /* ---------- the db surface the app uses ---------- */
  function collection(name) {
    var q = {
      orderBy: function () { return q; }, limit: function () { return q; }, where: function () { return q; },
      onSnapshot: function (cb, err) {
        if (name === 'menu') return P.menu.on(function (j) { cb(colSnap(j.docs || [])); }, err);
        if (name === 'sounds') return P.sounds.on(function (j) { cb(colSnap(j.docs || [])); }, err);
        if (name === 'requests') return P.staff.on(function (j) { cb(colSnap(j.requests || [])); }, err);
        if (name === 'status') {
          var p = token ? P.staff : P.guest;
          return p.on(function (j) { var st = j.status || {}; cb(colSnap(Object.keys(st).map(function (k) { return { id: k, data: st[k] }; }))); }, err);
        }
        return function () {};
      },
      get: function () { return call('GET', '/' + name).then(function (j) { return colSnap(j.docs || []); }); },
      add: function (data) { return call('POST', '/' + name, data).then(function (j) { P.menu.now(); return { id: j.id }; }); },
      doc: function (id) { return doc(name + '/' + id); }
    };
    return q;
  }
  function doc(path) {
    var i = path.indexOf('/'), col = path.slice(0, i), id = path.slice(i + 1);
    if (col === 'requests') {
      return {
        id: id,
        onSnapshot: function (cb, err) { return P.guest.on(function (j) { cb(docSnap(id, j.mine || null)); }, err); },
        get: function () { return call('GET', '/guest?uid=' + uid).then(function (j) { return docSnap(id, j.mine || null); }); },
        set: function (d) { return call('PUT', '/mine?uid=' + uid, d).then(function () { P.guest.now(); }); }
      };
    }
    var base = '/' + col + '/' + encodeURIComponent(id);
    function after() { if (col === 'menu') P.menu.now(); else if (col === 'sounds') P.sounds.now(); else P.staff.now(); }
    return {
      id: id,
      onSnapshot: function () { return function () {}; },
      get: function () { return Promise.resolve(docSnap(id, null)); },
      set: function (d) { return call('PUT', base, d).then(after); },
      update: function (d) { return call(col === 'menu' ? 'PATCH' : 'PUT', base, d).then(after); },
      delete: function () { return call('DELETE', base).then(after); }
    };
  }
  var db = Object.freeze({ collection: collection, doc: doc });

  /* ---------- who is looking: a guest, or staff with a valid token ---------- */
  var staffCheck = token ? call('GET', '/pin').then(function (j) { if (!j.staff) { token = ''; lsSet('lounge.staffToken', null); } return !!j.staff; }, function () { return !!token; }) : Promise.resolve(false);
  var user = Object.freeze({
    canEdit: function () { return staffCheck; },
    isOwner: function () { return staffCheck; },
    id: function () { return Promise.resolve(uid); },
    me: function () { return Promise.resolve({ id: uid }); }
  });

  window.claude = Object.freeze({
    use: function (name) {
      if (name === 'db') return Promise.resolve(db);
      if (name === 'user') return Promise.resolve(user);
      return Promise.resolve(null);
    }
  });

  /* ---------- staff sign-in: open the site with #staff ---------- */
  function pinScreen() {
    if (document.getElementById('lounge-pin')) return;
    var wrap = document.createElement('div');
    wrap.id = 'lounge-pin';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-label', 'Staff sign-in');
    wrap.innerHTML =
      '<style>#lounge-pin{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:16px;background:rgba(8,20,17,.72);font-family:Inter,system-ui,sans-serif}' +
      '#lounge-pin form{width:min(360px,100%);background:#fff;color:#14211d;border-radius:22px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.35)}' +
      '#lounge-pin h2{margin:0 0 6px;font:700 26px/1.1 Georgia,serif}#lounge-pin p{margin:0 0 16px;color:#5b6b66;font-size:14px;line-height:1.4}' +
      '#lounge-pin input{width:100%;box-sizing:border-box;font:700 28px/1 ui-monospace,Menlo,monospace;letter-spacing:.3em;text-align:center;padding:14px;border:1.5px solid #cfd9d5;border-radius:14px;outline:none}' +
      '#lounge-pin input:focus{border-color:#1f4d42;box-shadow:0 0 0 3px #e2ece8}' +
      '#lounge-pin .row{display:flex;gap:10px;margin-top:16px}#lounge-pin button{flex:1;min-height:50px;border-radius:14px;font:700 16px system-ui,sans-serif;border:1px solid #cfd9d5;background:#f4f7f6;color:#14211d}' +
      '#lounge-pin button[type=submit]{background:#1f4d42;border-color:#1f4d42;color:#fff}#lounge-pin .err{min-height:20px;margin:10px 0 0;color:#b3261e;font-size:14px;font-weight:600}</style>' +
      '<form><h2>Staff sign-in</h2><p>' + (token ? 'This phone is signed in as staff.' : 'Enter the staff PIN to open the staff board on this phone.') + '</p>' +
      (token ? '' : '<input id="lounge-pin-in" type="password" inputmode="numeric" autocomplete="off" maxlength="12" aria-label="Staff PIN">') +
      '<p class="err" id="lounge-pin-err" role="alert"></p><div class="row"><button type="button" id="lounge-pin-x">' + (token ? 'Sign out' : 'Cancel') + '</button>' +
      '<button type="submit">' + (token ? 'Done' : 'Sign in') + '</button></div></form>';
    document.body.appendChild(wrap);
    var form = wrap.querySelector('form'), input = document.getElementById('lounge-pin-in'), err = document.getElementById('lounge-pin-err');
    // the crew app keeps its address so the phone lands back in it after signing in
    function leave(reload) { wrap.remove(); var keep = location.hash === '#crew' && reload; try { history.replaceState(null, '', location.pathname + location.search + (keep ? '#crew' : '')); } catch (e) {} if (reload) location.reload(); }
    document.getElementById('lounge-pin-x').onclick = function () { if (token) { lsSet('lounge.staffToken', null); leave(true); } else leave(false); };
    form.onsubmit = function (e) {
      e.preventDefault();
      if (token) { leave(false); return; }
      var pin = (input.value || '').trim();
      if (!pin) { err.textContent = 'Type the PIN first.'; return; }
      err.textContent = 'Checking…';
      fetch(API + '/pin', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pin: pin }) })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j, status: r.status }; }); })
        .then(function (x) {
          if (x.ok && x.j.token) { lsSet('lounge.staffToken', x.j.token); leave(true); }
          else { err.textContent = x.status === 429 ? 'Too many tries. Wait a minute.' : 'That PIN is not right.'; input.select(); }
        }, function () { err.textContent = 'No connection. Try again.'; });
    };
    if (input) setTimeout(function () { input.focus(); }, 50);
  }
  function checkHash() { if (location.hash === '#staff' || (location.hash === '#crew' && !token)) pinScreen(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', checkHash); else checkHash();
  window.addEventListener('hashchange', checkHash);
})();
