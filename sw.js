// TaskPulse Service Worker with Persistent Background Alarm & Notification Engine
const CACHE_NAME = 'taskpulse-v4';
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

// ==================== INDEXEDDB PERSISTENT ALARM STORE ====================
const DB_NAME = 'TaskPulseAlarmDB';
const DB_VERSION = 1;
const STORE_NAME = 'alarms';

function openAlarmDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveAlarmsToDB(alarms) {
  try {
    const db = await openAlarmDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    alarms.forEach((alarm) => {
      store.put(alarm);
    });
    return new Promise((resolve) => {
      tx.oncomplete = resolve;
      tx.onerror = resolve;
    });
  } catch (e) {
    console.warn('IDB save error in SW:', e);
  }
}

async function getAlarmsFromDB() {
  try {
    const db = await openAlarmDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch (e) {
    return [];
  }
}

async function updateAlarmFiredInDB(alarmId) {
  try {
    const db = await openAlarmDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(alarmId);
    req.onsuccess = () => {
      const alarm = req.result;
      if (alarm) {
        alarm.alarmFired = true;
        store.put(alarm);
      }
    };
  } catch (e) {}
}

// ==================== LIFECYCLE & CACHING ====================

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
    }).then(() => {
      return checkAndFirePendingAlarms();
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
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

// ==================== ALARM SCHEDULING & TRIGGERS ====================

// Pre-schedule OS-level notifications via TimestampTrigger (Chrome / Android)
async function scheduleNotificationTriggers(alarms) {
  if (!('showTrigger' in Notification.prototype) || typeof TimestampTrigger === 'undefined') {
    return;
  }

  for (const alarm of alarms) {
    if (!alarm.alarmFired && alarm.alarmTimestamp && alarm.alarmTimestamp > Date.now()) {
      try {
        await self.registration.showNotification(`⏰ ALARM: ${alarm.title}`, {
          body: alarm.desc || 'Your scheduled alarm is due now!',
          icon: './icon-192.png',
          badge: './icon-192.png',
          tag: `alarm-${alarm.id}`,
          showTrigger: new TimestampTrigger(alarm.alarmTimestamp),
          renotify: true,
          requireInteraction: true,
          silent: false,
          vibrate: [800, 300, 800, 300, 1200, 400, 1200],
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
      } catch (err) {
        console.warn('TimestampTrigger schedule error:', err);
      }
    }
  }
}

// Check and trigger any alarms due right now
async function checkAndFirePendingAlarms() {
  const alarms = await getAlarmsFromDB();
  const now = Date.now();

  for (const alarm of alarms) {
    if (!alarm.alarmFired && alarm.alarmTimestamp && now >= alarm.alarmTimestamp) {
      await fireAlarmNotification(alarm);
    }
  }
}

async function fireAlarmNotification(alarm) {
  alarm.alarmFired = true;
  await updateAlarmFiredInDB(alarm.id);

  try {
    await self.registration.showNotification(`⏰ ALARM: ${alarm.title}`, {
      body: alarm.desc || 'Your scheduled reminder is due right now!',
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: `alarm-${alarm.id}`,
      renotify: true,
      requireInteraction: true,
      silent: false,
      vibrate: [800, 300, 800, 300, 1200, 400, 1200],
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
  } catch (err) {
    console.warn('SW showNotification error:', err);
  }

  // Notify any open client windows
  try {
    const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    clientList.forEach((c) => {
      c.postMessage({ type: 'SW_ALARM_FIRED', taskId: alarm.id });
    });
  } catch (e) {}
}

// Active polling loop extended with waitUntil to keep SW alive for upcoming alarms
function monitorAlarmsUntilDue(alarms) {
  return new Promise((resolve) => {
    if (!alarms || alarms.length === 0) {
      resolve();
      return;
    }

    const nextAlarm = alarms
      .filter((a) => !a.alarmFired && a.alarmTimestamp && a.alarmTimestamp > Date.now())
      .sort((a, b) => a.alarmTimestamp - b.alarmTimestamp)[0];

    // If no upcoming alarm or alarm is farther than 5 minutes out, resolve so SW can idle
    const maxWaitMs = 5 * 60 * 1000;
    if (!nextAlarm || (nextAlarm.alarmTimestamp - Date.now()) > maxWaitMs) {
      // Check immediate dues first
      checkAndFirePendingAlarms().then(resolve);
      return;
    }

    const interval = setInterval(async () => {
      const now = Date.now();
      let hasPending = false;

      for (const alarm of alarms) {
        if (!alarm.alarmFired && alarm.alarmTimestamp) {
          if (now >= alarm.alarmTimestamp) {
            await fireAlarmNotification(alarm);
          } else {
            hasPending = true;
          }
        }
      }

      if (!hasPending) {
        clearInterval(interval);
        resolve();
      }
    }, 1000);

    // Safety timeout to resolve before browser kills the worker
    setTimeout(() => {
      clearInterval(interval);
      resolve();
    }, maxWaitMs);
  });
}

// ==================== BACKGROUND SYNC & MESSAGING ====================

// Periodic Background Sync (runs in background on Android/Chrome)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-alarms') {
    event.waitUntil(checkAndFirePendingAlarms());
  }
});

// Standard Background Sync (when connection restored or wake event)
self.addEventListener('sync', (event) => {
  if (event.tag === 'check-alarms' || event.tag === 'alarm-sync') {
    event.waitUntil(checkAndFirePendingAlarms());
  }
});

// Messages from app.js
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SYNC_ALARMS') {
    const alarms = event.data.alarms || [];
    event.waitUntil(
      saveAlarmsToDB(alarms).then(() => {
        scheduleNotificationTriggers(alarms);
        return monitorAlarmsUntilDue(alarms);
      })
    );
  } else if (event.data.type === 'DISMISS_ALARM') {
    const id = event.data.taskId;
    event.waitUntil(
      updateAlarmFiredInDB(id)
    );
  } else if (event.data.type === 'CHECK_NOW') {
    event.waitUntil(checkAndFirePendingAlarms());
  }
});

// Handle Notification Clicks (Dismiss / Snooze / Open Window)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;
  const taskId = event.notification.data ? event.notification.data.taskId : null;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        const client = clientList[0];
        client.postMessage({
          type: 'NOTIFICATION_ACTION',
          action: action || 'open',
          taskId: taskId
        });
        return client.focus();
      }

      // If app is closed, launch window directly to ringing state
      const targetUrl = './index.html' + (taskId ? `?alarmId=${encodeURIComponent(taskId)}&action=${encodeURIComponent(action || 'open')}` : '');
      return self.clients.openWindow(targetUrl);
    })
  );
});
