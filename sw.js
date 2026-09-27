self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const d = e.notification.data || {};
  const other = String(d.other || '');
  const nick = String(d.nick || '');
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list){
      if ('focus' in c){
        if (other) c.postMessage({ type: 'openChat', other, nick });
        return c.focus();
      }
    }
    if (self.clients.openWindow){
      const url = other ? './?chat=' + encodeURIComponent(other) + '&nick=' + encodeURIComponent(nick) : './';
      return self.clients.openWindow(url);
    }
    return null;
  }));
});
