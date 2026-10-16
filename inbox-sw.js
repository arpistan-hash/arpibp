// Service worker for the table inbox app: shows a phone notification for each guest request,
// even when the inbox isn't open, and opens the inbox when the notification is tapped.
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener("push", function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { title: "New table request", body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || "New table request", {
    body: d.body || "",
    tag: d.tag || "table",
    renotify: true,
    requireInteraction: !!d.urgent,
    vibrate: d.urgent ? [400, 120, 400, 120, 400] : [200, 100, 200],
    icon: "/assets/app/inbox-192.png",
    badge: "/assets/app/inbox-192.png",
    data: { url: "/inbox.html" }
  }));
});

self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) if (list[i].url.indexOf("/inbox") !== -1 && "focus" in list[i]) return list[i].focus();
    return self.clients.openWindow("/inbox.html");
  }));
});
