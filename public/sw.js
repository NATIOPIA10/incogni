self.addEventListener('push', (event) => {
  const options = {
    body: 'New Signal Received!',
    icon: '/icon.png',
    badge: '/icon.png',
    vibrate: [200, 100, 200],
    priority: 'high',
    requireInteraction: true,
    data: { url: '/chat' }
  };
  event.waitUntil(
    self.registration.showNotification('Incogni Resonance', options)
  );
});

// Also handle messages from the main app when it's minimized
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const options = {
      body: event.data.body,
      icon: '/icon.png',
      badge: '/icon.png',
      vibrate: [200, 100, 200],
      tag: 'resonance-alert'
    };
    self.registration.showNotification(event.data.title, options);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
