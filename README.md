# TaskPulse - Mobile To-Do List with Audio Alarms & Reminders ⏰📱

A mobile-first, Progressive Web App (PWA) to-do list built with HTML5, Vanilla CSS, and modern JavaScript. Designed to look, feel, and function like a native mobile smartphone application with high-fidelity real-time audio alarms, vibration feedback, and full-screen ringing notifications.

---

## 🌟 Key Features

### 1. 🔔 Smart Alarm & Reminder System
- **Real-Time Alarm Engine:** Continuously tracks scheduled tasks every second in the background.
- **Web Audio API Synthesizer:** 100% self-contained audio generator — plays crisp alarms and chimes without depending on external MP3 downloads or slow network connections.
- **4 Selectable Ringtone Tones:**
  - 🎵 **Digital Melody:** Bright ascending harmonic chords
  - 🔔 **Gentle Chime:** Relaxing meditative crystal bells
  - 🚨 **Radar Siren:** Urgent pulsating attention grabber
  - 👾 **Retro Arcade:** Upbeat 8-bit chip sequence
- **Full-Screen Ringing Screen:**
  - Pulsating neon glow waves & shaking bell animation
  - Live animated equalizer audio visualizer bars
  - Displays due task title, description, and priority
  - **Dismiss & Complete** button (with celebration confetti)
  - **Snooze** options (+5 mins, +10 mins, +15 mins)
- **Haptic Vibration API:** Vibrates mobile devices with a distinctive alert pattern (`navigator.vibrate`).
- **Browser Notifications:** Sends system notifications when alarms fire.

### 2. ✨ AI Copilot & Smart Natural Language Generator
- **Instant AI Task Generation:** Type any natural language prompt (e.g., *"Workout in 15 mins with radar alarm"*, *"Study session 45 mins with gentle chime"*, *"Urgent client meeting tomorrow 10am"*).
- **Auto-Parsed Attributes:**
  - Extracts clean title & contextual actionable notes.
  - Automatically identifies category (*Health*, *Work*, *Study*, *Urgent*, *Personal*).
  - Infers priority (*High*, *Medium*, *Low*).
  - **Calculates exact due date & alarm time** automatically.
  - Recommends the ideal ringtone chime.
- **✨ AI Schedule Optimizer:** 1-tap re-ordering that organizes your tasks by priority urgency and alarm timeline with an AI productivity score.
- **AI Glowing Orb Animation:** Real-time multi-step parsing feedback (*Analyzing intent*, *Computing alarm*, *Generating schedule*).
- **AI Badges:** Tasks generated via AI display an iridescent `✨ AI Scheduled` badge.

### 2. 📱 Mobile Phone Application UI
- **Mobile-First Responsive Layout:** Designed specifically for smartphone viewports with touch targets, safe area insets, and gesture cues.
- **Interactive Device Simulator:** On desktop screens, it displays inside a sleek smartphone bezel frame with speaker notch and status bar. Includes a button to toggle between **Phone Mockup View** and **Full Screen View**.
- **Live Dynamic Status Bar:** Shows actual real-time clock, Wi-Fi, signal, and battery indicators.
- **Bottom Navigation Bar:** Quick navigation between Tasks, Alarms, Done, and Audio Settings.
- **Circular Progress Ring:** Live visual completion percentage indicator and pending task counter.

### 3. ⚡ 100% Offline Support & Instant Local PWA
- **No Internet Required:** Works completely offline without Wi-Fi or cellular data.
- **Local Cache Storage (Service Worker v2):** `sw.js` caches all code, styles, sound synthesizers, and icons locally.
- **Zero External Audio Dependencies:** Uses the browser's native Web Audio API synthesizer — no MP3 audio streaming or downloads needed.
- **Offline Storage:** All tasks, alarms, and settings are saved locally in `localStorage` on the device.
- **Offline Alarm Execution:** Background alarm checks and audio ringing continue to execute without internet.
- **Automatic Offline Indicator:** Displays an active `⚡ Offline Ready` badge when network connection is absent.

### 4. 🎯 Task Management & UI Navigation
- **12-Hour AM/PM Time Format:** All clocks, status bars, alarm pills, and countdown banners display strictly in 12-hour format (e.g. `2:30 PM`, `9:15 AM`) with a live 12h badge preview in the modal.
- **Horizontal Scroll & Drag Navigation:** Filter tabs and category chips support fluid left/right scrolling via mouse-wheel, click-and-drag, and touch swipes with grab cursor feedback.
- **Task Fields:** Title, notes/description, category tag, priority (Low, Medium, High), due date, and alarm time.
- **Quick Alarm Presets:** 1-tap presets to schedule alarms for **+1 min**, **+5 min**, **+15 min**, or **+1 hr**.
- **Categories & Filters:** Filter tasks by *All*, *With Alarm*, *Today*, *High Priority*, and *Done*, plus tag filtering for *Work*, *Personal*, *Health*, *Study*, and *Urgent*.
- **Search Bar:** Instant real-time task search.
- **Confetti Burst:** Rewarding confetti celebration animation upon task completion.
- **Persistent Storage:** Auto-saves tasks to `localStorage` so data is never lost.
- **100% Private & Fresh for Every User:** When a new user opens the link on their device, it opens a clean, fresh page with 0 tasks. Each user's tasks are stored strictly on their own device and never leaked or shared with another person.
- **Quick Fresh Reset:** Users can click **"Start Fresh"** in Settings or visit with `?fresh=true` at any time to clear their board.

---

## 🚀 How to Run the Application

### Option A: Direct Open in Any Browser
Simply double-click [`index.html`](file:///c:/Users/SUGHAN%20RITHVIK%20K/Documents/To-Do%20list/index.html) or right-click and choose **Open with > Google Chrome / Microsoft Edge / Safari / Firefox**.

### Option B: Install on Mobile Phones (PWA)
1. Open [`index.html`](file:///c:/Users/SUGHAN%20RITHVIK%20K/Documents/To-Do%20list/index.html) on your phone's browser (or host it using any static host like GitHub Pages, Netlify, or Vercel).
2. **On iPhone (Safari):** Tap the **Share** button (box with upward arrow) > tap **"Add to Home Screen"**.
3. **On Android (Chrome):** Tap the three-dot menu > tap **"Install App"** or **"Add to Home Screen"**.
4. The app will launch in full-screen standalone mode with its custom app icon!

---

## 📁 File Structure

- [`index.html`](file:///c:/Users/SUGHAN%20RITHVIK%20K/Documents/To-Do%20list/index.html) - Application structure, mobile container, modals, and templates.
- [`style.css`](file:///c:/Users/SUGHAN%20RITHVIK%20K/Documents/To-Do%20list/style.css) - Mobile glassmorphic styling, animations, and responsive breakpoints.
- [`audio.js`](file:///c:/Users/SUGHAN%20RITHVIK%20K/Documents/To-Do%20list/audio.js) - Web Audio API synthesis engine (ringtones, taps, volume, and alarms).
- [`app.js`](file:///c:/Users/SUGHAN%20RITHVIK%20K/Documents/To-Do%20list/app.js) - Main application logic, timer tickers, storage, and alarm triggers.
- [`manifest.json`](file:///c:/Users/SUGHAN%20RITHVIK%20K/Documents/To-Do%20list/manifest.json) - PWA manifest metadata.
- [`sw.js`](file:///c:/Users/SUGHAN%20RITHVIK%20K/Documents/To-Do%20list/sw.js) - Service worker for offline caching and notification handling.
- `icon-192.png`, `icon-512.png`, `favicon.png` - App icons.
