/**
 * TaskPulse Background Alarm Worker
 * Runs independently of the DOM window to prevent background timer throttling
 */

let timerId = null;

self.onmessage = function (e) {
  const data = e.data;
  if (!data) return;

  if (data.command === 'START') {
    if (timerId) clearInterval(timerId);
    timerId = setInterval(() => {
      self.postMessage({ type: 'TICK', timestamp: Date.now() });
    }, 1000);
  } else if (data.command === 'STOP') {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }
};
