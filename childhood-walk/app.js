(function () {
  'use strict';
  var KEY = 'childhoodWalk.userStories.v1';
  var NEAR_METERS = 40;

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function save(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); return true; }
    catch (e) { alert('Could not save (storage full?). Try a smaller photo, or export your stories first.'); return false; }
  }

  var stories = window.STORIES.concat(load());
  var selectedId = null, walking = false, watchId = null, pending = null;

  var map = L.map('map').setView([47.4979, 19.0402], 13);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  var markers = {}, me = null, pendingMarker = null;

  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; }

  function icon(n, sel) {
    return L.divIcon({ className: '', html: '<div class="num' + (sel ? ' sel' : '') + '">' + n + '</div>', iconSize: [26, 26], iconAnchor: [13, 13] });
  }

  function drawMarkers() {
    Object.keys(markers).forEach(function (k) { map.removeLayer(markers[k]); });
    markers = {};
    stories.forEach(function (s, i) {
      var m = L.marker([s.lat, s.lng], { icon: icon(i + 1, s.id === selectedId), title: s.title }).addTo(map);
      m.on('click', function () { select(s.id, false); });
      markers[s.id] = m;
    });
  }

  function drawList() {
    var ol = document.getElementById('list');
    ol.innerHTML = '';
    stories.forEach(function (s) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.textContent = s.title + (s.place ? ' (' + s.place + ')' : '');
      a.addEventListener('click', function () { select(s.id, true); });
      li.appendChild(a);
      ol.appendChild(li);
    });
  }

  function card(s) {
    var el = document.getElementById('card');
    if (!s) { el.innerHTML = '<p class="empty">Tap a numbered stop on the map, or turn on Walk mode and start walking.</p>'; return; }
    var photo = '';
    if (s.photo && s.photoNow) {
      photo = '<div class="compare"><img src="' + esc(s.photoNow) + '" alt="Today">' +
        '<img class="top-img" id="oldImg" src="' + esc(s.photo) + '" alt="Then">' +
        '<input id="slider" type="range" min="0" max="100" value="50" aria-label="Then and now"></div>';
    } else if (s.photo) {
      photo = '<img src="' + esc(s.photo) + '" alt="' + esc(s.title) + '">';
    }
    el.innerHTML = '<article class="story"><h2>' + esc(s.title) + '</h2>' +
      '<p class="meta">' + esc([s.place, s.era].filter(Boolean).join(' · ')) + '</p>' + photo +
      (s.credit ? '<p class="credit">Photo: ' + esc(s.credit) + '</p>' : '') +
      '<p class="body">' + esc(s.text) + '</p>' +
      '<button type="button" id="speak">Listen</button> ' +
      '<a href="https://www.google.com/maps/dir/?api=1&destination=' + s.lat + ',' + s.lng + '&travelmode=walking" target="_blank" rel="noopener">Walk here</a>' +
      (s.user ? ' <button type="button" id="del">Delete</button>' : '') +
      '</article>';
    var slider = document.getElementById('slider');
    if (slider) {
      var old = document.getElementById('oldImg');
      var upd = function () { old.style.clipPath = 'inset(0 ' + (100 - slider.value) + '% 0 0)'; };
      slider.addEventListener('input', upd); upd();
    }
    document.getElementById('speak').addEventListener('click', function () {
      if (!('speechSynthesis' in window)) { alert('Speech is not supported in this browser.'); return; }
      speechSynthesis.cancel();
      speechSynthesis.speak(new SpeechSynthesisUtterance(s.title + '. ' + s.text));
    });
    var del = document.getElementById('del');
    if (del) del.addEventListener('click', function () {
      if (!confirm('Delete this memory?')) return;
      var mine = load().filter(function (x) { return x.id !== s.id; });
      save(mine);
      stories = stories.filter(function (x) { return x.id !== s.id; });
      selectedId = null; refresh();
    });
  }

  function select(id, pan) {
    selectedId = id;
    var s = stories.filter(function (x) { return x.id === id; })[0];
    if (pan && s) map.setView([s.lat, s.lng], 17);
    drawMarkers(); card(s);
    if (window.speechSynthesis) speechSynthesis.cancel();
  }

  function refresh() { drawMarkers(); drawList(); card(stories.filter(function (x) { return x.id === selectedId; })[0]); }

  // ---- Walk mode (GPS) ----
  function meters(a, b) {
    var R = 6371000, r = Math.PI / 180;
    var dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(x));
  }

  function onPos(p) {
    var pos = { lat: p.coords.latitude, lng: p.coords.longitude };
    if (!me) me = L.circleMarker([pos.lat, pos.lng], { radius: 8, color: '#fff', weight: 2, fillColor: '#1a73e8', fillOpacity: 1 }).addTo(map);
    else me.setLatLng([pos.lat, pos.lng]);
    var best = null, bestD = Infinity;
    stories.forEach(function (s) { var d = meters(pos, s); if (d < bestD) { bestD = d; best = s; } });
    var box = document.getElementById('nearby');
    if (best && bestD <= NEAR_METERS) {
      box.hidden = false;
      box.innerHTML = 'You are at: <strong>' + esc(best.title) + '</strong>';
      var b = document.createElement('button'); b.type = 'button'; b.textContent = 'Open story';
      b.addEventListener('click', function () { select(best.id, false); });
      box.appendChild(b);
      if (selectedId !== best.id && !box.dataset[best.id]) { box.dataset[best.id] = '1'; select(best.id, false); }
    } else if (best) {
      box.hidden = false;
      box.textContent = 'Next nearest: ' + best.title + ' (' + Math.round(bestD) + ' m)';
    }
  }

  document.getElementById('walkBtn').addEventListener('click', function () {
    var btn = this;
    if (!navigator.geolocation) { alert('GPS is not available in this browser.'); return; }
    if (walking) {
      navigator.geolocation.clearWatch(watchId); walking = false;
      btn.textContent = 'Walk mode: off'; btn.classList.remove('on');
      document.getElementById('nearby').hidden = true;
      return;
    }
    walking = true; btn.textContent = 'Walk mode: on'; btn.classList.add('on');
    watchId = navigator.geolocation.watchPosition(onPos, function (e) {
      alert('Location error: ' + e.message); walking = false; btn.textContent = 'Walk mode: off'; btn.classList.remove('on');
    }, { enableHighAccuracy: true, maximumAge: 5000 });
  });

  // ---- Add memory ----
  var dlg = document.getElementById('dlg'), form = document.getElementById('form');

  function setPending(latlng) {
    pending = { lat: latlng.lat, lng: latlng.lng };
    if (pendingMarker) map.removeLayer(pendingMarker);
    pendingMarker = L.marker(latlng).addTo(map);
    document.getElementById('pickHint').textContent = 'Place set: ' + latlng.lat.toFixed(5) + ', ' + latlng.lng.toFixed(5);
  }

  var picking = false;
  map.on('click', function (e) { if (picking) setPending(e.latlng); });

  document.getElementById('addBtn').addEventListener('click', function () {
    picking = true; pending = null; form.reset();
    document.getElementById('pickHint').textContent = 'Tap the map to set the place, or use “My location”.';
    dlg.show();
  });
  document.getElementById('cancel').addEventListener('click', function () { closeDlg(); });
  function closeDlg() { picking = false; if (pendingMarker) { map.removeLayer(pendingMarker); pendingMarker = null; } dlg.close(); }

  document.getElementById('useGps').addEventListener('click', function () {
    navigator.geolocation.getCurrentPosition(function (p) {
      var ll = { lat: p.coords.latitude, lng: p.coords.longitude }; setPending(ll); map.setView(ll, 17);
    }, function (e) { alert('Location error: ' + e.message); });
  });

  function shrink(file, cb) {
    var r = new FileReader();
    r.onload = function () {
      var img = new Image();
      img.onload = function () {
        var max = 1000, k = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        cb(c.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = function () { cb(''); };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!pending) { alert('Please set the place first: tap the map or use “My location”.'); return; }
    var fd = new FormData(form);
    var finish = function (photo) {
      var s = {
        id: 'u' + Date.now(), user: true,
        title: fd.get('title'), place: fd.get('place'), era: fd.get('era'), text: fd.get('text'),
        credit: fd.get('credit'), photo: photo, lat: pending.lat, lng: pending.lng
      };
      var mine = load(); mine.push(s);
      if (!save(mine)) return;
      stories.push(s); selectedId = s.id; closeDlg(); refresh(); map.setView([s.lat, s.lng], 17);
    };
    var f = fd.get('photo');
    if (f && f.size) shrink(f, finish); else finish('');
  });

  // ---- Export / import ----
  document.getElementById('exportBtn').addEventListener('click', function () {
    var blob = new Blob([JSON.stringify(load(), null, 2)], { type: 'application/json' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'my-budapest-stories.json'; a.click();
  });
  document.getElementById('importFile').addEventListener('change', function () {
    var f = this.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var incoming = JSON.parse(r.result);
        if (!Array.isArray(incoming)) throw new Error('not a list');
        var mine = load();
        incoming.forEach(function (s) {
          if (s && typeof s.lat === 'number' && typeof s.lng === 'number' && s.title && !mine.some(function (m) { return m.id === s.id; })) {
            s.user = true; s.id = s.id || 'u' + Date.now() + Math.random(); mine.push(s);
          }
        });
        if (save(mine)) { stories = window.STORIES.concat(mine); refresh(); }
      } catch (err) { alert('That file is not a valid stories export.'); }
    };
    r.readAsText(f);
  });

  refresh();
})();
