/**
 * TaskPulse - Core Application Logic
 * Mobile-First To-Do List with Audio Alarms & Reminders
 */

(function () {
  'use strict';

  // State Management
  const STORAGE_KEY = 'taskpulse_tasks_v1';
  const SETTINGS_KEY = 'taskpulse_settings_v1';

  let tasks = [];
  let currentFilter = 'all';
  let currentCategory = 'all';
  let searchQuery = '';
  let activeRingingTask = null;
  let isDeviceFullscreen = false;

  let settings = {
    volume: 0.85,
    defaultRingtone: 'melody',
    audioUnlocked: false
  };

  // DOM Elements
  const appLayout = document.getElementById('appLayout');
  const statusClock = document.getElementById('statusClock');
  const currentDateBadge = document.getElementById('currentDateBadge');
  const pendingCountEl = document.getElementById('pendingCount');
  const progressRingVal = document.getElementById('progressRingVal');
  const progressPercentageEl = document.getElementById('progressPercentage');
  const nextAlarmText = document.getElementById('nextAlarmText');
  const nextAlarmBadge = document.getElementById('nextAlarmBadge');
  const tasksListEl = document.getElementById('tasksList');
  const emptyStateEl = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const filterTabsEl = document.getElementById('filterTabs');
  const categoryScrollEl = document.getElementById('categoryScroll');
  const audioNotice = document.getElementById('audioNotice');
  const enableAudioBtn = document.getElementById('enableAudioBtn');
  const muteToggleBtn = document.getElementById('muteToggleBtn');
  const muteIcon = document.getElementById('muteIcon');
  const toggleDeviceModeBtn = document.getElementById('toggleDeviceModeBtn');
  const viewModeText = document.getElementById('viewModeText');
  const testAlarmTriggerBtn = document.getElementById('testAlarmTriggerBtn');

  // Task Modal Elements
  const taskModal = document.getElementById('taskModal');
  const taskForm = document.getElementById('taskForm');
  const modalTitle = document.getElementById('modalTitle');
  const taskIdInput = document.getElementById('taskId');
  const taskTitleInput = document.getElementById('taskTitleInput');
  const taskDescInput = document.getElementById('taskDescInput');
  const taskCategorySelect = document.getElementById('taskCategorySelect');
  const taskPrioritySelect = document.getElementById('taskPrioritySelect');
  const alarmEnabledToggle = document.getElementById('alarmEnabledToggle');
  const alarmDetailsPanel = document.getElementById('alarmDetailsPanel');
  const alarmDateInput = document.getElementById('alarmDateInput');
  const alarmTimeInput = document.getElementById('alarmTimeInput');
  const alarmRingtoneSelect = document.getElementById('alarmRingtoneSelect');
  const previewSoundBtn = document.getElementById('previewSoundBtn');
  const closeTaskModalBtn = document.getElementById('closeTaskModalBtn');
  const cancelTaskBtn = document.getElementById('cancelTaskBtn');
  const openAddModalBtn = document.getElementById('openAddModalBtn');
  const emptyAddBtn = document.getElementById('emptyAddBtn');

  // Ringing Alarm Elements
  const ringingOverlay = document.getElementById('ringingOverlay');
  const ringingClock = document.getElementById('ringingClock');
  const ringingTaskTitle = document.getElementById('ringingTaskTitle');
  const ringingTaskDesc = document.getElementById('ringingTaskDesc');
  const ringingTaskCat = document.getElementById('ringingTaskCat');
  const ringingTaskPriority = document.getElementById('ringingTaskPriority');
  const dismissAlarmBtn = document.getElementById('dismissAlarmBtn');

  // Settings Modal Elements
  const settingsModal = document.getElementById('settingsModal');
  const headerSettingsBtn = document.getElementById('headerSettingsBtn');
  const bottomNavSettings = document.getElementById('bottomNavSettings');
  const closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumePercentText = document.getElementById('volumePercentText');
  const defaultRingtoneSelect = document.getElementById('defaultRingtoneSelect');
  const testSettingsSoundBtn = document.getElementById('testSettingsSoundBtn');
  const reqNotifBtn = document.getElementById('reqNotifBtn');
  const notifStatusText = document.getElementById('notifStatusText');
  const clearAllTasksBtn = document.getElementById('clearAllTasksBtn');
  const restoreSamplesBtn = document.getElementById('restoreSamplesBtn');

  // AI Copilot Elements
  const aiPromptInput = document.getElementById('aiPromptInput');
  const aiGenerateBtn = document.getElementById('aiGenerateBtn');
  const aiOptimizeBtn = document.getElementById('aiOptimizeBtn');
  const bottomNavAi = document.getElementById('bottomNavAi');
  const aiModal = document.getElementById('aiModal');
  const closeAiModalBtn = document.getElementById('closeAiModalBtn');
  const cancelAiModalBtn = document.getElementById('cancelAiModalBtn');
  const confirmAiModalBtn = document.getElementById('confirmAiModalBtn');
  const aiModalPromptInput = document.getElementById('aiModalPromptInput');
  const aiThinkingState = document.getElementById('aiThinkingState');
  const aiThinkingStep = document.getElementById('aiThinkingStep');
  const aiThinkingSubtext = document.getElementById('aiThinkingSubtext');
  const aiPreviewCard = document.getElementById('aiPreviewCard');
  const aiPreviewTitle = document.getElementById('aiPreviewTitle');
  const aiPreviewCategory = document.getElementById('aiPreviewCategory');
  const aiPreviewPriority = document.getElementById('aiPreviewPriority');
  const aiPreviewAlarm = document.getElementById('aiPreviewAlarm');

  // Canvas Confetti
  const confettiCanvas = document.getElementById('confettiCanvas');
  const ctxConfetti = confettiCanvas.getContext('2d');
  let confettiParticles = [];

  // ==================== INITIALIZATION ====================

  function init() {
    loadSettings();
    loadTasks();
    setupClockAndTimers();
    setupEventListeners();
    setupConfettiResize();
    registerServiceWorker();
    setupNetworkStatus();
    render();
  }

  // Load tasks: ensures new users ALWAYS start with a 100% fresh, empty private page
  function loadTasks() {
    try {
      // Check if URL has ?fresh, ?reset, or ?new to force a fresh page
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('fresh') || urlParams.has('reset') || urlParams.has('new') || urlParams.has('clean')) {
        tasks = [];
        saveTasks();
        if (window.history && window.history.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        return;
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        tasks = JSON.parse(stored);
      } else {
        // Brand new user: pristine fresh board (0 tasks, no other person's details!)
        tasks = [];
        saveTasks();
      }
    } catch (e) {
      console.error('Error loading tasks:', e);
      tasks = [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Error saving tasks:', e);
    }
  }

  function loadSettings() {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        settings = Object.assign(settings, JSON.parse(saved));
      }
      if (window.soundEngine) {
        window.soundEngine.setVolume(settings.volume);
      }
    } catch (e) {
      console.warn('Error loading settings:', e);
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  }

  function createSampleTasks() {
    const now = new Date();
    
    // Sample 1: Alarm in 2 minutes
    const twoMinLater = new Date(now.getTime() + 2 * 60 * 1000);
    const dateStr1 = formatLocalDate(twoMinLater);
    const timeStr1 = formatLocalTime(twoMinLater);

    // Sample 2: Alarm in 30 minutes
    const thirtyMinLater = new Date(now.getTime() + 30 * 60 * 1000);
    const dateStr2 = formatLocalDate(thirtyMinLater);
    const timeStr2 = formatLocalTime(thirtyMinLater);

    // Sample 3: Evening task
    const eveningTime = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    const dateStr3 = formatLocalDate(eveningTime);
    const timeStr3 = formatLocalTime(eveningTime);

    tasks = [
      {
        id: 'sample-1',
        title: 'Drink 500ml Water & Hydrate 💧',
        desc: 'Quick health break. Scheduled with Melody alarm chime.',
        category: 'health',
        priority: 'high',
        completed: false,
        completedAt: null,
        alarmEnabled: true,
        alarmDate: dateStr1,
        alarmTime: timeStr1,
        alarmTimestamp: twoMinLater.getTime(),
        alarmRingtone: 'melody',
        alarmFired: false
      },
      {
        id: 'sample-2',
        title: 'Review Project Milestones 💼',
        desc: 'Review deliverables and prepare sprint notes with team.',
        category: 'work',
        priority: 'medium',
        completed: false,
        completedAt: null,
        alarmEnabled: true,
        alarmDate: dateStr2,
        alarmTime: timeStr2,
        alarmTimestamp: thirtyMinLater.getTime(),
        alarmRingtone: 'chime',
        alarmFired: false
      },
      {
        id: 'sample-3',
        title: 'Read 15 Pages of Book 📚',
        desc: 'Deep focus reading session before evening wind-down.',
        category: 'study',
        priority: 'low',
        completed: false,
        completedAt: null,
        alarmEnabled: true,
        alarmDate: dateStr3,
        alarmTime: timeStr3,
        alarmTimestamp: eveningTime.getTime(),
        alarmRingtone: 'arcade',
        alarmFired: false
      },
      {
        id: 'sample-4',
        title: 'Morning Yoga Stretch 🧘',
        desc: 'Completed early morning routine.',
        category: 'health',
        priority: 'medium',
        completed: true,
        completedAt: new Date().toISOString(),
        alarmEnabled: false,
        alarmDate: '',
        alarmTime: '',
        alarmTimestamp: 0,
        alarmRingtone: 'chime',
        alarmFired: false
      }
    ];

    saveTasks();
  }

  // ==================== DATE & TIME HELPERS ====================

  function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatLocalTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  function formatTimeDisplay(date) {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  }

  // Convert 24-hour HH:mm string (or Date object) into strictly 12-hour AM/PM format (e.g. "2:30 PM")
  function formatTimeTo12Hour(timeVal) {
    if (!timeVal) return '';
    if (timeVal instanceof Date) {
      return formatTimeDisplay(timeVal);
    }
    const str = String(timeVal).trim();
    if (/am|pm/i.test(str)) return str;
    const parts = str.split(':');
    if (parts.length < 2) return str;
    let h = parseInt(parts[0], 10);
    const m = String(parts[1]).padStart(2, '0').slice(0, 2);
    if (isNaN(h)) return str;
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  }

  function formatDateHuman(dateStr) {
    if (!dateStr) return '';
    const todayStr = formatLocalDate(new Date());
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = formatLocalDate(tomorrow);

    if (dateStr === todayStr) return 'Today';
    if (dateStr === tomorrowStr) return 'Tomorrow';

    const parts = dateStr.split('-');
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // ==================== CLOCK & ALARM ENGINE ====================

  function setupClockAndTimers() {
    function updateClock() {
      const now = new Date();
      
      // Update status bar clock and ringing overlay clock (strictly 12-hour AM/PM format)
      const time12Str = formatTimeDisplay(now);
      if (statusClock) statusClock.textContent = time12Str;
      if (ringingClock) ringingClock.textContent = time12Str;

      // Update date badge
      const options = { weekday: 'short', month: 'short', day: 'numeric' };
      if (currentDateBadge) {
        currentDateBadge.textContent = now.toLocaleDateString('en-US', options);
      }

      // Check Alarms every tick
      checkAlarms(now);
      updateHeroAlarmBanner(now);
    }

    updateClock();
    setInterval(updateClock, 1000);
  }

  // Real-time alarm detection
  function checkAlarms(now) {
    const nowMs = now.getTime();

    tasks.forEach(task => {
      if (task.alarmEnabled && !task.completed && !task.alarmFired && task.alarmTimestamp) {
        // Trigger if due (within current or past minute)
        if (nowMs >= task.alarmTimestamp) {
          triggerAlarm(task);
        }
      }
    });
  }

  function triggerAlarm(task) {
    // Prevent duplicate triggers if already ringing this task
    if (activeRingingTask && activeRingingTask.id === task.id) return;

    activeRingingTask = task;
    task.alarmFired = true;
    saveTasks();
    render();

    // Start Synthesized Audio Ringtone Loop
    if (window.soundEngine) {
      window.soundEngine.startAlarm(task.alarmRingtone || 'melody');
    }

    // Trigger Device Vibration API if supported
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([400, 200, 400, 200, 800, 300, 800]);
      } catch (e) {
        console.warn('Vibrate error:', e);
      }
    }

    // Trigger Browser Notification
    triggerNotification(task);

    // Show Ringing Overlay
    showRingingOverlay(task);
  }

  function triggerNotification(task) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`⏰ TaskPulse Alarm: ${task.title}`, {
          body: task.desc || 'Your scheduled task reminder is due!',
          icon: 'icon-192.png',
          tag: `task-${task.id}`,
          requireInteraction: true
        });
      } catch (e) {
        console.warn('Notification error:', e);
      }
    }
  }

  function showRingingOverlay(task) {
    if (!ringingOverlay) return;
    ringingTaskTitle.textContent = task.title;
    ringingTaskDesc.textContent = task.desc || 'No extra notes provided.';

    const catLabels = {
      work: '💼 Work',
      personal: '🏡 Personal',
      health: '💧 Health',
      study: '📚 Study',
      urgent: '⚡ Urgent'
    };
    ringingTaskCat.textContent = catLabels[task.category] || 'General';

    const prioLabels = {
      high: '🔴 High Priority',
      medium: '🟡 Medium Priority',
      low: '🟢 Low Priority'
    };
    ringingTaskPriority.textContent = prioLabels[task.priority] || 'Normal';

    ringingOverlay.style.display = 'flex';
  }

  function dismissActiveAlarm(markComplete = true) {
    if (window.soundEngine) {
      window.soundEngine.stopAlarm();
    }
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }

    if (ringingOverlay) {
      ringingOverlay.style.display = 'none';
    }

    if (activeRingingTask) {
      if (markComplete) {
        activeRingingTask.completed = true;
        activeRingingTask.completedAt = new Date().toISOString();
        if (window.soundEngine) {
          window.soundEngine.playSuccessSound();
        }
        triggerConfetti();
      }
      activeRingingTask.alarmFired = true;
      saveTasks();
      render();
    }

    activeRingingTask = null;
  }

  function snoozeActiveAlarm(minutes = 5) {
    if (!activeRingingTask) return;

    if (window.soundEngine) {
      window.soundEngine.stopAlarm();
    }
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
    if (ringingOverlay) {
      ringingOverlay.style.display = 'none';
    }

    const newTime = new Date(Date.now() + minutes * 60 * 1000);
    activeRingingTask.alarmDate = formatLocalDate(newTime);
    activeRingingTask.alarmTime = formatLocalTime(newTime);
    activeRingingTask.alarmTimestamp = newTime.getTime();
    activeRingingTask.alarmFired = false;
    activeRingingTask.alarmEnabled = true;

    saveTasks();
    render();

    // Feedback
    showToast(`💤 Snoozed for ${minutes} minutes (rings at ${formatTimeDisplay(newTime)})`);
    activeRingingTask = null;
  }

  // Update Hero Stats and Countdown
  function updateHeroAlarmBanner(now) {
    const upcomingAlarms = tasks
      .filter(t => t.alarmEnabled && !t.completed && t.alarmTimestamp && t.alarmTimestamp > now.getTime())
      .sort((a, b) => a.alarmTimestamp - b.alarmTimestamp);

    if (upcomingAlarms.length > 0) {
      const next = upcomingAlarms[0];
      const diffMs = next.alarmTimestamp - now.getTime();
      const diffMin = Math.ceil(diffMs / (60 * 1000));
      const alarm12 = formatTimeTo12Hour(next.alarmTime);

      nextAlarmBadge.classList.add('active-alarm');
      
      let countdownStr = '';
      if (diffMin <= 1) {
        countdownStr = 'In <1 min';
      } else if (diffMin < 60) {
        countdownStr = `In ${diffMin}m`;
      } else {
        const diffHrs = Math.floor(diffMin / 60);
        const remMin = diffMin % 60;
        countdownStr = `In ${diffHrs}h ${remMin > 0 ? remMin + 'm' : ''}`;
      }

      nextAlarmText.innerHTML = `
        <span class="alarm-time-headline">
          <strong>${countdownStr}</strong> · ${alarm12}
        </span>
        <span class="alarm-title-subline">${escapeHTML(next.title)}</span>
      `;
    } else {
      nextAlarmBadge.classList.remove('active-alarm');
      nextAlarmText.innerHTML = '<span class="no-alarm-label">No upcoming alarms scheduled</span>';
    }
  }

  // ==================== RENDERING ====================

  function render() {
    renderStats();
    renderFilterCounts();
    renderTasksList();
  }

  function renderStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;

    if (pendingCountEl) pendingCountEl.textContent = pending;

    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    if (progressPercentageEl) progressPercentageEl.textContent = `${percentage}%`;

    // Progress SVG ring stroke
    // Circumference = 2 * PI * 28 = 175.92
    if (progressRingVal) {
      const circumference = 175.92;
      const offset = circumference - (percentage / 100) * circumference;
      progressRingVal.style.strokeDashoffset = offset;
    }

    // Alarm navigation dot indicator
    const hasPendingAlarms = tasks.some(t => t.alarmEnabled && !t.completed && !t.alarmFired);
    const alarmNavDot = document.getElementById('alarmNavDot');
    if (alarmNavDot) {
      alarmNavDot.style.display = hasPendingAlarms ? 'block' : 'none';
    }
  }

  function renderFilterCounts() {
    const todayStr = formatLocalDate(new Date());

    const cAll = tasks.length;
    const cAlarm = tasks.filter(t => t.alarmEnabled && !t.completed).length;
    const cToday = tasks.filter(t => t.alarmDate === todayStr || (!t.completed && !t.alarmDate)).length;
    const cPriority = tasks.filter(t => t.priority === 'high' && !t.completed).length;
    const cDone = tasks.filter(t => t.completed).length;

    const elAll = document.getElementById('countAll');
    const elAlarm = document.getElementById('countAlarm');
    const elToday = document.getElementById('countToday');
    const elPriority = document.getElementById('countPriority');
    const elDone = document.getElementById('countDone');

    if (elAll) elAll.textContent = cAll;
    if (elAlarm) elAlarm.textContent = cAlarm;
    if (elToday) elToday.textContent = cToday;
    if (elPriority) elPriority.textContent = cPriority;
    if (elDone) elDone.textContent = cDone;
  }

  function renderTasksList() {
    if (!tasksListEl) return;

    const todayStr = formatLocalDate(new Date());

    // Filter Logic
    let filtered = tasks.filter(task => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchDesc = task.desc && task.desc.toLowerCase().includes(q);
        const matchCat = task.category.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCat) return false;
      }

      // Category Pill
      if (currentCategory !== 'all' && task.category !== currentCategory) {
        return false;
      }

      // Filter Tabs
      if (currentFilter === 'alarm') {
        return task.alarmEnabled && !task.completed;
      }
      if (currentFilter === 'today') {
        return task.alarmDate === todayStr || (!task.completed && !task.alarmDate);
      }
      if (currentFilter === 'priority') {
        return task.priority === 'high' && !task.completed;
      }
      if (currentFilter === 'done') {
        return task.completed;
      }

      return true;
    });

    // Sort: Uncompleted first, then by alarm timestamp or priority
    filtered.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      // If both have alarms, order by alarm timestamp
      if (a.alarmEnabled && b.alarmEnabled && a.alarmTimestamp && b.alarmTimestamp) {
        return a.alarmTimestamp - b.alarmTimestamp;
      }
      // High priority first
      const pMap = { high: 1, medium: 2, low: 3 };
      return (pMap[a.priority] || 2) - (pMap[b.priority] || 2);
    });

    if (filtered.length === 0) {
      tasksListEl.innerHTML = '';
      if (emptyStateEl) emptyStateEl.style.display = 'flex';
      return;
    }

    if (emptyStateEl) emptyStateEl.style.display = 'none';

    const catEmoji = {
      work: '💼 Work',
      personal: '🏡 Personal',
      health: '💧 Health',
      study: '📚 Study',
      urgent: '⚡ Urgent'
    };

    const prioLabel = {
      high: 'High',
      medium: 'Medium',
      low: 'Low'
    };

    tasksListEl.innerHTML = filtered.map(task => {
      const isDone = task.completed;
      const isAlarmOn = task.alarmEnabled;
      const isRinging = task.alarmFired && !isDone;

      // Alarm formatted text (12-hour AM/PM)
      let alarmDisplay = '';
      if (isAlarmOn) {
        const dateHuman = formatDateHuman(task.alarmDate);
        const timeFormatted = formatTimeTo12Hour(task.alarmTime);
        alarmDisplay = `${dateHuman ? dateHuman + ', ' : ''}${timeFormatted || 'Set'}`;
      }

      return `
        <article class="task-card ${isDone ? 'is-completed' : ''} ${isRinging ? 'has-active-alarm' : ''}" data-id="${task.id}">
          <div class="task-main-row">
            <button class="task-check-circle" data-action="toggle-complete" aria-label="Mark task done">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </button>

            <div class="task-info">
              <h3 class="task-title">${escapeHTML(task.title)}</h3>
              ${task.desc ? `<p class="task-desc">${escapeHTML(task.desc)}</p>` : ''}
            </div>

            <div class="task-actions">
              <button class="card-action-btn edit-btn" data-action="edit" title="Edit Task" aria-label="Edit">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
              <button class="card-action-btn delete-btn" data-action="delete" title="Delete Task" aria-label="Delete">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>

          <div class="task-meta-row">
            <div class="meta-badges">
              <span class="badge-tag">${catEmoji[task.category] || 'General'}</span>
              <span class="badge-tag priority-badge priority-${task.priority}">${prioLabel[task.priority] || 'Medium'}</span>
              ${task.isAiGenerated ? `<span class="ai-badge">✨ AI Scheduled</span>` : ''}
            </div>

            ${isAlarmOn ? `
              <div class="task-alarm-pill ${isRinging ? 'ringing-now' : ''}" data-action="trigger-alarm-test" title="Tap to test alarm sound">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                <span>${isRinging ? 'RINGING NOW' : alarmDisplay}</span>
              </div>
            ` : ''}
          </div>
        </article>
      `;
    }).join('');
  }

  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ==================== HORIZONTAL DRAG & WHEEL SCROLLING ====================

  function enableHorizontalScroll(container) {
    if (!container) return;

    // 1. Mouse wheel translation: convert vertical wheel movement into smooth horizontal scroll
    container.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && container.scrollWidth > container.clientWidth) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    }, { passive: false });

    // 2. Drag-to-scroll for desktop mouse / pointer
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let hasDragged = false;

    container.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return; // Only main left mouse button
      isDown = true;
      hasDragged = false;
      container.classList.add('is-dragging');
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
    });

    window.addEventListener('mouseup', () => {
      if (isDown) {
        isDown = false;
        container.classList.remove('is-dragging');
        setTimeout(() => {
          hasDragged = false;
        }, 70);
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 1.35;
      if (Math.abs(walk) > 4) {
        hasDragged = true;
      }
      container.scrollLeft = scrollLeft - walk;
    });

    // Suppress child button clicks if user dragged left/right
    container.addEventListener('click', (e) => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  }

  function updateAlarmTime12Badge() {
    const badge = document.getElementById('alarmTime12Badge');
    if (badge && alarmTimeInput) {
      badge.textContent = alarmTimeInput.value ? formatTimeTo12Hour(alarmTimeInput.value) : '12:00 PM';
    }
  }

  // ==================== EVENT LISTENERS ====================

  function setupEventListeners() {
    // Audio unlock on user interaction
    document.addEventListener('click', unlockAudioOnFirstClick, { once: true });
    document.addEventListener('touchstart', unlockAudioOnFirstClick, { once: true });

    if (enableAudioBtn) {
      enableAudioBtn.addEventListener('click', () => {
        unlockAudioOnFirstClick();
        requestNotificationPermission();
        if (audioNotice) audioNotice.style.display = 'none';
        showToast('🔔 Audio & Alarms Ready!');
      });
    }

    // Toggle Mute
    if (muteToggleBtn) {
      muteToggleBtn.addEventListener('click', () => {
        if (window.soundEngine) {
          const isMuted = window.soundEngine.toggleMute();
          updateMuteIcon(isMuted);
          showToast(isMuted ? '🔇 Audio Muted' : '🔊 Audio Unmuted');
        }
      });
    }

    // Toggle Desktop Viewport Mode (Mobile Bezel Frame vs Full Screen View)
    if (toggleDeviceModeBtn) {
      toggleDeviceModeBtn.addEventListener('click', () => {
        isDeviceFullscreen = !isDeviceFullscreen;
        if (isDeviceFullscreen) {
          appLayout.classList.add('fullscreen-view');
          viewModeText.textContent = 'Phone Mockup View';
        } else {
          appLayout.classList.remove('fullscreen-view');
          viewModeText.textContent = 'Full Screen View';
        }
      });
    }

    // Quick Alarm Test Button
    if (testAlarmTriggerBtn) {
      testAlarmTriggerBtn.addEventListener('click', () => {
        unlockAudioOnFirstClick();
        const demoTask = {
          id: 'quick-test-' + Date.now(),
          title: 'Immediate Alarm Test 🚨',
          desc: 'Your scheduled mobile alarm is ringing successfully!',
          category: 'urgent',
          priority: 'high',
          alarmRingtone: settings.defaultRingtone || 'melody'
        };
        triggerAlarm(demoTask);
      });
    }

    // Search Input
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        if (clearSearchBtn) {
          clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
        }
        renderTasksList();
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        renderTasksList();
      });
    }

    // Filter Chips
    if (filterTabsEl) {
      enableHorizontalScroll(filterTabsEl);
      filterTabsEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-chip');
        if (!btn) return;
        filterTabsEl.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter || 'all';
        if (window.soundEngine) window.soundEngine.playTapSound();
        render();
      });
    }

    // Category Chips
    if (categoryScrollEl) {
      enableHorizontalScroll(categoryScrollEl);
      categoryScrollEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.cat-pill');
        if (!btn) return;
        categoryScrollEl.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.cat || 'all';
        if (window.soundEngine) window.soundEngine.playTapSound();
        render();
      });
    }

    // AI Quick Tags Horizontal Scroll
    const aiQuickTagsEl = document.querySelector('.ai-quick-tags');
    if (aiQuickTagsEl) {
      enableHorizontalScroll(aiQuickTagsEl);
    }

    // Task Card delegation (toggle complete, edit, delete, alarm test)
    if (tasksListEl) {
      tasksListEl.addEventListener('click', (e) => {
        const card = e.target.closest('.task-card');
        if (!card) return;
        const taskId = card.dataset.id;
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        // Toggle complete
        const checkBtn = e.target.closest('[data-action="toggle-complete"]');
        if (checkBtn) {
          e.stopPropagation();
          task.completed = !task.completed;
          if (task.completed) {
            task.completedAt = new Date().toISOString();
            if (window.soundEngine) window.soundEngine.playSuccessSound();
            triggerConfetti();
          } else {
            task.completedAt = null;
            if (window.soundEngine) window.soundEngine.playTapSound();
          }
          saveTasks();
          render();
          return;
        }

        // Delete
        const deleteBtn = e.target.closest('[data-action="delete"]');
        if (deleteBtn) {
          e.stopPropagation();
          deleteTask(taskId);
          return;
        }

        // Edit
        const editBtn = e.target.closest('[data-action="edit"]');
        if (editBtn) {
          e.stopPropagation();
          openEditModal(task);
          return;
        }

        // Test Alarm Pill Click
        const alarmPill = e.target.closest('[data-action="trigger-alarm-test"]');
        if (alarmPill) {
          e.stopPropagation();
          unlockAudioOnFirstClick();
          triggerAlarm(task);
          return;
        }
      });
    }

    // Open Add Modal
    if (openAddModalBtn) {
      openAddModalBtn.addEventListener('click', () => {
        unlockAudioOnFirstClick();
        openCreateModal();
      });
    }
    if (emptyAddBtn) {
      emptyAddBtn.addEventListener('click', () => {
        unlockAudioOnFirstClick();
        openCreateModal();
      });
    }

    // Quick Starter Suggestion Chips in Empty State
    document.addEventListener('click', (e) => {
      const chip = e.target.closest('.suggestion-chip');
      if (!chip) return;
      unlockAudioOnFirstClick();
      const title = chip.dataset.title;
      const cat = chip.dataset.cat || 'health';
      const min = parseInt(chip.dataset.min, 10) || 5;
      openCreateModal({ title, cat, min });
    });

    // Close Modal
    if (closeTaskModalBtn) closeTaskModalBtn.addEventListener('click', closeTaskModal);
    if (cancelTaskBtn) cancelTaskBtn.addEventListener('click', closeTaskModal);
    if (taskModal) {
      taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) closeTaskModal();
      });
    }

    // Toggle Alarm switch in form
    if (alarmEnabledToggle) {
      alarmEnabledToggle.addEventListener('change', () => {
        if (alarmDetailsPanel) {
          alarmDetailsPanel.style.display = alarmEnabledToggle.checked ? 'flex' : 'none';
        }
      });
    }

    // Live 12-hour preview badge for alarm time
    if (alarmTimeInput) {
      alarmTimeInput.addEventListener('input', updateAlarmTime12Badge);
      alarmTimeInput.addEventListener('change', updateAlarmTime12Badge);
    }

    // Quick preset buttons (+1m, +5m, +15m, +1h)
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const addMinutes = parseInt(btn.dataset.addMin, 10);
        const target = new Date(Date.now() + addMinutes * 60 * 1000);
        alarmDateInput.value = formatLocalDate(target);
        alarmTimeInput.value = formatLocalTime(target);
        updateAlarmTime12Badge();
        if (window.soundEngine) window.soundEngine.playTapSound();
      });
    });

    // Preview Sound Button in Task Form
    if (previewSoundBtn) {
      previewSoundBtn.addEventListener('click', () => {
        unlockAudioOnFirstClick();
        const soundType = alarmRingtoneSelect.value;
        if (window.soundEngine) {
          window.soundEngine.previewTone(soundType);
        }
      });
    }

    // Task Form Submit
    if (taskForm) {
      taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveTaskFromForm();
      });
    }

    // Ringing Overlay Actions
    if (dismissAlarmBtn) {
      dismissAlarmBtn.addEventListener('click', () => {
        dismissActiveAlarm(true);
      });
    }

    document.querySelectorAll('.snooze-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const min = parseInt(btn.dataset.snoozeMin, 10) || 5;
        snoozeActiveAlarm(min);
      });
    });

    // Settings Modal
    if (headerSettingsBtn) {
      headerSettingsBtn.addEventListener('click', openSettingsModal);
    }
    if (bottomNavSettings) {
      bottomNavSettings.addEventListener('click', openSettingsModal);
    }
    if (closeSettingsModalBtn) {
      closeSettingsModalBtn.addEventListener('click', closeSettingsModal);
    }
    if (settingsModal) {
      settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) closeSettingsModal();
      });
    }

    // Volume Slider
    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10) / 100;
        settings.volume = val;
        if (volumePercentText) volumePercentText.textContent = `${e.target.value}%`;
        if (window.soundEngine) window.soundEngine.setVolume(val);
        saveSettings();
      });
    }

    // Default Ringtone Select
    if (defaultRingtoneSelect) {
      defaultRingtoneSelect.addEventListener('change', (e) => {
        settings.defaultRingtone = e.target.value;
        saveSettings();
      });
    }

    if (testSettingsSoundBtn) {
      testSettingsSoundBtn.addEventListener('click', () => {
        unlockAudioOnFirstClick();
        const tone = defaultRingtoneSelect.value;
        if (window.soundEngine) window.soundEngine.previewTone(tone);
      });
    }

    // Request Notification Permission
    if (reqNotifBtn) {
      reqNotifBtn.addEventListener('click', requestNotificationPermission);
    }

    // Start Fresh / Clear Board
    if (clearAllTasksBtn) {
      clearAllTasksBtn.addEventListener('click', () => {
        if (tasks.length > 0) {
          const confirmReset = confirm('Clear all tasks and start completely fresh? This cannot be undone.');
          if (!confirmReset) return;
        }
        tasks = [];
        saveTasks();
        render();
        closeSettingsModal();
        if (window.soundEngine) window.soundEngine.playDeleteSound();
        showToast('✨ All cleared! Fresh blank schedule ready.');
      });
    }

    // Optional Demo Alarms Reloader
    if (restoreSamplesBtn) {
      restoreSamplesBtn.addEventListener('click', () => {
        createSampleTasks();
        render();
        closeSettingsModal();
        showToast('Sample tasks & alarms loaded!');
      });
    }

    // Bottom Navigation Bar tabs
    document.querySelectorAll('.bottom-nav .nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        if (tab === 'settings') return; // Handled separately
        if (tab === 'ai') {
          openAiModal();
          return;
        }

        document.querySelectorAll('.bottom-nav .nav-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (tab === 'tasks') {
          currentFilter = 'all';
          syncFilterChips('all');
        } else if (tab === 'alarms') {
          currentFilter = 'alarm';
          syncFilterChips('alarm');
        } else if (tab === 'completed') {
          currentFilter = 'done';
          syncFilterChips('done');
        }

        if (window.soundEngine) window.soundEngine.playTapSound();
        render();
      });
    });

    // ==================== AI COPILOT EVENT LISTENERS ====================
    if (aiGenerateBtn && aiPromptInput) {
      aiGenerateBtn.addEventListener('click', () => {
        generateWithAi(aiPromptInput.value);
      });
      aiPromptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          generateWithAi(aiPromptInput.value);
        }
      });
    }

    if (aiOptimizeBtn) {
      aiOptimizeBtn.addEventListener('click', optimizeScheduleWithAi);
    }

    // AI Card Quick Chips
    document.querySelectorAll('.ai-tag-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.dataset.ai;
        if (aiPromptInput) aiPromptInput.value = prompt;
        generateWithAi(prompt);
      });
    });

    // AI Modal Guide Chips
    document.querySelectorAll('.ai-guide-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.dataset.ai;
        if (aiModalPromptInput) aiModalPromptInput.value = prompt;
        generateWithAi(prompt);
      });
    });

    // AI Modal Open & Close
    if (bottomNavAi) {
      bottomNavAi.addEventListener('click', (e) => {
        e.preventDefault();
        unlockAudioOnFirstClick();
        openAiModal();
      });
    }
    if (closeAiModalBtn) {
      closeAiModalBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closeAiModal();
      });
    }
    if (cancelAiModalBtn) cancelAiModalBtn.addEventListener('click', closeAiModal);
    if (confirmAiModalBtn && aiModalPromptInput) {
      confirmAiModalBtn.addEventListener('click', () => {
        generateWithAi(aiModalPromptInput.value);
      });
    }
    if (aiModal) {
      aiModal.addEventListener('click', (e) => {
        if (e.target === aiModal) closeAiModal();
      });
    }

    // Global keyboard shortcuts (Esc to close open modals)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeTaskModal();
        closeSettingsModal();
        closeAiModal();
      }
    });
  }

  function syncFilterChips(filterName) {
    if (!filterTabsEl) return;
    filterTabsEl.querySelectorAll('.filter-chip').forEach(b => {
      if (b.dataset.filter === filterName) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
  }

  function updateMuteIcon(isMuted) {
    if (!muteIcon) return;
    if (isMuted) {
      muteIcon.innerHTML = `<line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>`;
    } else {
      muteIcon.innerHTML = `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>`;
    }
  }

  // ==================== MODAL OPERATIONS ====================

  function openCreateModal(prefill = null) {
    modalTitle.textContent = 'New Task & Alarm';
    taskIdInput.value = '';
    taskTitleInput.value = (prefill && prefill.title) ? prefill.title : '';
    taskDescInput.value = (prefill && prefill.desc) ? prefill.desc : '';
    taskCategorySelect.value = (prefill && prefill.cat) ? prefill.cat : 'health';
    taskPrioritySelect.value = (prefill && prefill.priority) ? prefill.priority : 'medium';

    alarmEnabledToggle.checked = true;
    if (alarmDetailsPanel) alarmDetailsPanel.style.display = 'flex';

    // Preset alarm time (defaults to 5 minutes or prefilled minutes)
    const minutesToAdd = (prefill && prefill.min) ? parseInt(prefill.min, 10) : 5;
    const targetDate = new Date(Date.now() + minutesToAdd * 60 * 1000);
    alarmDateInput.value = formatLocalDate(targetDate);
    alarmTimeInput.value = formatLocalTime(targetDate);
    alarmRingtoneSelect.value = settings.defaultRingtone || 'melody';
    updateAlarmTime12Badge();

    taskModal.classList.add('open');
    setTimeout(() => taskTitleInput.focus(), 150);
  }

  function openEditModal(task) {
    modalTitle.textContent = 'Edit Task';
    taskIdInput.value = task.id;
    taskTitleInput.value = task.title;
    taskDescInput.value = task.desc || '';
    taskCategorySelect.value = task.category || 'work';
    taskPrioritySelect.value = task.priority || 'medium';

    alarmEnabledToggle.checked = !!task.alarmEnabled;
    if (alarmDetailsPanel) {
      alarmDetailsPanel.style.display = task.alarmEnabled ? 'flex' : 'none';
    }

    alarmDateInput.value = task.alarmDate || formatLocalDate(new Date());
    alarmTimeInput.value = task.alarmTime || formatLocalTime(new Date());
    alarmRingtoneSelect.value = task.alarmRingtone || settings.defaultRingtone || 'melody';
    updateAlarmTime12Badge();

    taskModal.classList.add('open');
    setTimeout(() => taskTitleInput.focus(), 150);
  }

  function closeTaskModal() {
    taskModal.classList.remove('open');
  }

  function saveTaskFromForm() {
    const id = taskIdInput.value;
    const title = taskTitleInput.value.trim();
    if (!title) return;

    const desc = taskDescInput.value.trim();
    const category = taskCategorySelect.value;
    const priority = taskPrioritySelect.value;
    const alarmEnabled = alarmEnabledToggle.checked;
    const alarmDate = alarmDateInput.value;
    const alarmTime = alarmTimeInput.value;
    const alarmRingtone = alarmRingtoneSelect.value;

    let alarmTimestamp = 0;
    if (alarmEnabled && alarmDate && alarmTime) {
      const [year, month, day] = alarmDate.split('-').map(Number);
      const [hour, min] = alarmTime.split(':').map(Number);
      const d = new Date(year, month - 1, day, hour, min, 0);
      alarmTimestamp = d.getTime();
    }

    if (id) {
      // Update existing
      const task = tasks.find(t => t.id === id);
      if (task) {
        task.title = title;
        task.desc = desc;
        task.category = category;
        task.priority = priority;
        task.alarmEnabled = alarmEnabled;
        task.alarmDate = alarmDate;
        task.alarmTime = alarmTime;
        task.alarmTimestamp = alarmTimestamp;
        task.alarmRingtone = alarmRingtone;
        task.alarmFired = false; // Reset if time changed
      }
      showToast('✓ Task updated');
    } else {
      // Add new
      const newTask = {
        id: 'task-' + Date.now(),
        title,
        desc,
        category,
        priority,
        completed: false,
        completedAt: null,
        alarmEnabled,
        alarmDate,
        alarmTime,
        alarmTimestamp,
        alarmRingtone,
        alarmFired: false
      };
      tasks.unshift(newTask);
      showToast('✓ Task & alarm created');
    }

    saveTasks();
    closeTaskModal();
    render();

    if (window.soundEngine) window.soundEngine.playTapSound();
  }

  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    render();
    if (window.soundEngine) window.soundEngine.playDeleteSound();
    showToast('Task removed');
  }

  function openSettingsModal() {
    if (volumeSlider) volumeSlider.value = Math.round(settings.volume * 100);
    if (volumePercentText) volumePercentText.textContent = `${Math.round(settings.volume * 100)}%`;
    if (defaultRingtoneSelect) defaultRingtoneSelect.value = settings.defaultRingtone || 'melody';

    if (notifStatusText) {
      const perm = ('Notification' in window) ? Notification.permission : 'unsupported';
      notifStatusText.textContent = `Permission: ${perm}`;
    }

    settingsModal.classList.add('open');
  }

  function closeSettingsModal() {
    settingsModal.classList.remove('open');
  }

  // ==================== AI COPILOT & SCHEDULING ENGINE ====================
  const aiEngine = {
    parse(prompt) {
      if (!prompt || !prompt.trim()) return null;
      const lower = prompt.toLowerCase().trim();

      // Detect Priority
      let priority = 'medium';
      if (/urgent|asap|critical|emergency|high priority|important|immediately|rush/i.test(lower)) {
        priority = 'high';
      } else if (/quick|casual|maybe|low priority|someday|optional/i.test(lower)) {
        priority = 'low';
      }

      // Detect Category
      let category = 'personal';
      if (/work|meeting|client|sync|review|code|standup|project|email|report|presentation|deadline|boss|colleague|office|task/i.test(lower)) {
        category = 'work';
      } else if (/water|health|gym|workout|stretch|medicine|pill|doctor|dentist|sleep|walk|run|hydrate|cardio|yoga|lunch|dinner|breakfast/i.test(lower)) {
        category = 'health';
      } else if (/study|exam|homework|chapter|book|read|quiz|revision|math|course|lecture|learn|class/i.test(lower)) {
        category = 'study';
      } else if (/urgent|emergency|asap|critical/i.test(lower)) {
        category = 'urgent';
      }

      // Detect Ringtone Tone
      let ringtone = 'melody';
      if (priority === 'high' || category === 'urgent' || /siren|radar|loud/i.test(lower)) {
        ringtone = 'radar';
      } else if (category === 'health' || category === 'study' || /chime|gentle|bell|soft/i.test(lower)) {
        ringtone = 'chime';
      } else if (/game|arcade|retro|8-bit/i.test(lower)) {
        ringtone = 'arcade';
      }

      // Detect Alarm Time & Date
      let minutesOffset = 15;
      let targetDate = new Date();

      const minMatch = lower.match(/(?:in\s+)?(\d+)\s*(?:mins?|minutes?|m\b)/i);
      const hrMatch = lower.match(/(?:in\s+)?(\d+)\s*(?:hours?|hrs?|h\b)/i);
      const timeMatch = lower.match(/(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);

      if (minMatch) {
        minutesOffset = parseInt(minMatch[1], 10);
        targetDate = new Date(Date.now() + minutesOffset * 60 * 1000);
      } else if (hrMatch) {
        const hrs = parseInt(hrMatch[1], 10);
        minutesOffset = hrs * 60;
        targetDate = new Date(Date.now() + minutesOffset * 60 * 1000);
      } else if (timeMatch) {
        let hrs = parseInt(timeMatch[1], 10);
        const mins = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
        const ampm = timeMatch[3].toLowerCase();
        if (ampm === 'pm' && hrs < 12) hrs += 12;
        if (ampm === 'am' && hrs === 12) hrs = 0;

        targetDate.setHours(hrs, mins, 0, 0);
        if (targetDate.getTime() <= Date.now()) {
          targetDate.setDate(targetDate.getDate() + 1);
        }
      } else {
        targetDate = new Date(Date.now() + minutesOffset * 60 * 1000);
      }

      if (/tomorrow/i.test(lower)) {
        targetDate.setDate(targetDate.getDate() + 1);
      }

      // Clean Title
      let cleanTitle = prompt
        .replace(/(?:in\s+\d+\s*(?:mins?|minutes?|hours?|hrs?|h|m)\b)/gi, '')
        .replace(/(?:at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/gi, '')
        .replace(/(?:with\s+(?:radar|melody|chime|arcade|loud|gentle)?\s*(?:alarm|siren|chime)?)/gi, '')
        .replace(/tomorrow/gi, '')
        .replace(/remind me to/gi, '')
        .replace(/please/gi, '')
        .replace(/schedule/gi, '')
        .trim();

      if (!cleanTitle || cleanTitle.length < 2) {
        cleanTitle = prompt.trim();
      }
      cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

      const notesTemplates = [
        `✨ AI Generated: Focus on this ${category} goal. Scheduled with ${ringtone} alarm chime.`,
        `✨ AI Smart Schedule: Prioritized as ${priority.toUpperCase()} urgency.`,
        `✨ AI Planned: Actionable milestone scheduled with audio reminder.`
      ];
      const desc = notesTemplates[Math.floor(Math.random() * notesTemplates.length)];

      return {
        title: cleanTitle,
        desc: desc,
        category: category,
        priority: priority,
        alarmEnabled: true,
        alarmDate: formatLocalDate(targetDate),
        alarmTime: formatLocalTime(targetDate),
        alarmTimestamp: targetDate.getTime(),
        alarmRingtone: ringtone,
        isAiGenerated: true
      };
    }
  };

  function openAiModal(initialPrompt = '') {
    if (aiModal) {
      aiModal.classList.add('open');
      if (aiPromptInput) {
        aiPromptInput.value = initialPrompt;
        setTimeout(() => aiPromptInput.focus(), 180);
      }
      if (aiThinkingState) aiThinkingState.style.display = 'none';
    }
  }

  function closeAiModal() {
    if (aiModal) {
      aiModal.classList.remove('open');
      // Restore active tab indicator in bottom navigation
      document.querySelectorAll('.bottom-nav .nav-item').forEach(b => {
        const tab = b.dataset.tab;
        if ((tab === 'tasks' && currentFilter === 'all') ||
            (tab === 'alarms' && currentFilter === 'alarm') ||
            (tab === 'completed' && currentFilter === 'done')) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });
    }
  }

  function generateWithAi(promptText) {
    if (!promptText || !promptText.trim()) {
      showToast('⚠️ Please enter a prompt for AI');
      return;
    }

    unlockAudioOnFirstClick();
    const parsed = aiEngine.parse(promptText);
    if (!parsed) return;

    // Show simulated AI thinking sequence
    if (aiThinkingState) {
      aiThinkingState.style.display = 'flex';
      if (aiThinkingStep) aiThinkingStep.textContent = '🧠 Analyzing natural language intent...';
      if (aiThinkingSubtext) aiThinkingSubtext.textContent = 'Extracting context, category & priority...';
    }

    // Dynamic step updates
    setTimeout(() => {
      if (aiThinkingStep) aiThinkingStep.textContent = '⏰ Calculating optimal alarm timing...';
      if (aiThinkingSubtext) aiThinkingSubtext.textContent = `Auto-setting: ${formatTimeTo12Hour(parsed.alarmTime)} with ${parsed.alarmRingtone} tone`;
    }, 280);

    setTimeout(() => {
      if (aiThinkingStep) aiThinkingStep.textContent = '✨ Structuring schedule & finalizing alarm...';
    }, 550);

    setTimeout(() => {
      const newTask = {
        id: 'task-' + Date.now(),
        ...parsed,
        completed: false,
        completedAt: null,
        alarmFired: false
      };

      tasks.unshift(newTask);
      saveTasks();
      render();

      if (aiThinkingState) aiThinkingState.style.display = 'none';
      if (aiPromptInput) aiPromptInput.value = '';
      if (aiModalPromptInput) aiModalPromptInput.value = '';
      closeAiModal();

      if (window.soundEngine) window.soundEngine.playSuccessSound();
      triggerConfetti();
      showToast(`✨ AI Scheduled: "${newTask.title}" (Alarm: ${formatTimeTo12Hour(newTask.alarmTime)})`);
    }, 800);
  }

  function optimizeScheduleWithAi() {
    if (tasks.length === 0) {
      showToast('No tasks to optimize. Add a task with AI first!');
      return;
    }

    unlockAudioOnFirstClick();

    // Reorder: Pending with impending alarms first, High priority, Med, Low, Done at end
    tasks.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (a.alarmEnabled && b.alarmEnabled && a.alarmTimestamp && b.alarmTimestamp) {
        return a.alarmTimestamp - b.alarmTimestamp;
      }
      const pOrder = { high: 1, medium: 2, low: 3 };
      return (pOrder[a.priority] || 2) - (pOrder[b.priority] || 2);
    });

    saveTasks();
    render();

    if (window.soundEngine) window.soundEngine.playSuccessSound();
    triggerConfetti();

    const efficiency = Math.floor(Math.random() * 8) + 92;
    showToast(`✨ AI Optimized: Schedule ordered at ${efficiency}% efficiency!`);
  }

  // ==================== NOTIFICATIONS & AUDIO UNLOCK ====================

  function unlockAudioOnFirstClick() {
    if (window.soundEngine) {
      window.soundEngine.init();
      settings.audioUnlocked = true;
    }
    if (audioNotice) {
      audioNotice.style.display = 'none';
    }
  }

  function requestNotificationPermission() {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop or mobile notifications. Sound alarms will still play.');
      return;
    }
    Notification.requestPermission().then(permission => {
      if (notifStatusText) notifStatusText.textContent = `Permission: ${permission}`;
      if (permission === 'granted') {
        showToast('🔔 Notifications enabled!');
      } else {
        showToast('Notifications declined. Alarms will play sound only.');
      }
    });
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(err => {
        console.warn('SW registration failed (expected in local file:// URLs):', err);
      });
    }
  }

  function setupNetworkStatus() {
    const offlineBadge = document.getElementById('offlineIndicator');
    function updateStatus() {
      const isOffline = !navigator.onLine;
      if (offlineBadge) {
        offlineBadge.style.display = isOffline ? 'inline-flex' : 'none';
      }
    }
    window.addEventListener('online', () => {
      updateStatus();
      showToast('🌐 Connection online');
    });
    window.addEventListener('offline', () => {
      updateStatus();
      showToast('⚡ Offline Mode: Tasks & alarms work 100% locally');
    });
    updateStatus();
  }

  // ==================== TOAST FEEDBACK ====================

  function showToast(message) {
    const existing = document.querySelector('.app-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'app-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: rgba(8, 18, 42, 0.96);
      border: 1px solid rgba(56, 189, 248, 0.45);
      color: #ffffff;
      padding: 10px 18px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.7), 0 0 15px rgba(37, 99, 235, 0.35);
      z-index: 1000;
      opacity: 0;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: none;
    `;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(10px)';
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }

  // ==================== CANVAS CONFETTI ====================

  function setupConfettiResize() {
    function resize() {
      if (!confettiCanvas) return;
      confettiCanvas.width = window.innerWidth;
      confettiCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();
  }

  function triggerConfetti() {
    const colors = ['#ffffff', '#38bdf8', '#2563eb', '#60a5fa', '#93c5fd', '#10b981', '#f59e0b', '#f43f5e'];
    confettiParticles = [];

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight * 0.4;

    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 4;
      confettiParticles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: Math.random() * 10 - 5,
        alpha: 1,
        life: 0
      });
    }

    animateConfetti();
  }

  function animateConfetti() {
    ctxConfetti.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    confettiParticles.forEach((p, index) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.25; // gravity
      p.rotation += p.rotSpeed;
      p.life++;
      if (p.life > 40) {
        p.alpha -= 0.025;
      }

      ctxConfetti.save();
      ctxConfetti.globalAlpha = Math.max(0, p.alpha);
      ctxConfetti.translate(p.x, p.y);
      ctxConfetti.rotate((p.rotation * Math.PI) / 180);
      ctxConfetti.fillStyle = p.color;
      ctxConfetti.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
      ctxConfetti.restore();

      if (p.alpha <= 0) {
        confettiParticles.splice(index, 1);
      }
    });

    if (confettiParticles.length > 0) {
      requestAnimationFrame(animateConfetti);
    } else {
      ctxConfetti.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  }

  // Initialize on load
  document.addEventListener('DOMContentLoaded', init);

})();
