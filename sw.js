// TaskPulse Service Worker with Background Alarm & Notification Engine
const CACHE_NAME = 'taskpulse-v3';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './audio.js',
  './app.js',
  './alarm-worker.js',
  './manifest.json',
  './favicon.png',
  './icon-192.png',
  './icon-512.png'
];

let scheduledAlarms = [];
let swAlarmTimer = null;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
  startSwAlarmMonitor();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});

// ==================== BACKGROUND ALARM MONITORING IN SW ====================

function startSwAlarmMonitor() {
  if (swAlarmTimer) clearInterval(swAlarmTimer);
  swAlarmTimer = setInterval(checkSwAlarms, 1000);
}

function checkSwAlarms() {
  const now = Date.now();
  if (!scheduledAlarms || scheduledAlarms.length === 0) return;

  scheduledAlarms.forEach((alarm) => {
    if (!alarm.alarmFired && alarm.alarmTimestamp && now >= alarm.alarmTimestamp) {
      alarm.alarmFired = true;

      // Trigger high-priority OS notification with vibration pattern
      self.registration.showNotification(`⏰ ALARM: ${alarm.title}`, {
        body: alarm.desc || 'Your scheduled reminder is due right now!',
        icon: './icon-192.png',
        badge: './icon-192.png',
        tag: `alarm-${alarm.id}`,
        renotify: true,
        requireInteraction: true,
        silent: false,
        vibrate: [500, 200, 500, 200, 800, 300, 800],
        data: {
          taskId: alarm.id,
          ringtone: alarm.alarmRingtone || 'melody',
          url: './index.html'
        },
        actions: [
          { action: 'open', title: 'Open & Dismiss' },
          { action: 'snooze', title: 'Snooze 5m' }
        ]
      });

      // Broadcast to any active client tabs
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((c) => {
          c.postMessage({ type: 'SW_ALARM_FIRED', taskId: alarm.id });
        });
      });
    }
  });
}

// Receive updated alarms list from app.js
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SYNC_ALARMS') {
    scheduledAlarms = event.data.alarms || [];
    startSwAlarmMonitor();
  } else if (event.data.type === 'DISMISS_ALARM') {
    const id = event.data.taskId;
    scheduledAlarms = scheduledAlarms.filter((a) => a.id !== id);
  }
});

// Handle Background Notification Interaction (Clicks & Action Buttons)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;
  const taskId = event.notification.data ? event.notification.data.taskId : null;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and dispatch action
      if (clientList.length > 0) {
        let client = clientList[0];
        client.postMessage({
          type: 'NOTIFICATION_ACTION',
          action: action || 'open',
          taskId: taskId
        });
        return client.focus();
      }

      // If closed, open app window and route to task
      const targetUrl = './index.html' + (taskId ? `?alarmId=${encodeURIComponent(taskId)}&action=${encodeURIComponent(action || 'open')}` : '');
      return clients.openWindow(targetUrl);
    })
  );
});
