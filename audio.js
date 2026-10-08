/**
 * TaskPulse Audio Synthesizer Engine
 * Generates custom alarm ringtones & UI sound effects using Web Audio API.
 * 100% self-contained with no external audio file dependencies.
 */

class SoundEngine {
  constructor() {
    this.audioCtx = null;
    this.isPlayingAlarm = false;
    this.currentLoopTimer = null;
    this.activeRingtone = 'melody'; // 'melody', 'chime', 'radar', 'arcade'
    this.volume = 0.85;
    this.masterGain = null;
    this.isMuted = false;
  }

  // Ensure AudioContext is initialized and resumed (handles browser autoplay restriction)
  init() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
      this.masterGain.connect(this.audioCtx.destination);
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.audioCtx.currentTime);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.audioCtx.currentTime);
    }
    return this.isMuted;
  }

  // UI Click / Tap Sound
  playTapSound() {
    try {
      this.init();
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(850, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08 * (this.isMuted ? 0 : this.volume), ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      console.warn("Audio tap error:", e);
    }
  }

  // Task Completed Celebratory Chime
  playSuccessSound() {
    try {
      this.init();
      const ctx = this.audioCtx;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const now = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        const startTime = now + idx * 0.07;
        const dur = 0.25;

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.18 * (this.isMuted ? 0 : this.volume), startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + dur + 0.05);
      });
    } catch (e) {
      console.warn("Success sound error:", e);
    }
  }

  // Delete sound (subtle swoosh)
  playDeleteSound() {
    try {
      this.init();
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.1 * (this.isMuted ? 0 : this.volume), ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch (e) {
      console.warn("Delete sound error:", e);
    }
  }

  // Ringtone synthesizer implementation
  _playMelodyCycle() {
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    // Energetic melodic sequence with harmonic bass and chime
    const notes = [
      { f: 587.33, t: 0.0, d: 0.14 }, // D5
      { f: 739.99, t: 0.15, d: 0.14 }, // F#5
      { f: 880.00, t: 0.30, d: 0.14 }, // A5
      { f: 1174.66, t: 0.45, d: 0.28 }, // D6
      { f: 987.77, t: 0.78, d: 0.14 }, // B5
      { f: 1174.66, t: 0.93, d: 0.35 }  // D6 sustain
    ];

    notes.forEach(n => {
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = 'sine';
      osc2.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, now + n.t);
      osc2.frequency.setValueAtTime(n.f * 0.5, now + n.t); // warm octave below

      const start = now + n.t;
      noteGain.gain.setValueAtTime(0.001, start);
      noteGain.gain.linearRampToValueAtTime(0.35 * (this.isMuted ? 0 : this.volume), start + 0.02);
      noteGain.gain.exponentialRampToValueAtTime(0.001, start + n.d);

      osc.connect(noteGain);
      osc2.connect(noteGain);
      noteGain.connect(this.masterGain);

      osc.start(start);
      osc2.start(start);
      osc.stop(start + n.d + 0.05);
      osc2.stop(start + n.d + 0.05);
    });
  }

  _playChimeCycle() {
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    // Soothing crystal bells
    const bells = [
      { f: 880.00, t: 0.0, d: 0.6 },  // A5
      { f: 1108.73, t: 0.25, d: 0.6 }, // C#6
      { f: 1318.51, t: 0.50, d: 0.8 }, // E6
      { f: 1760.00, t: 0.80, d: 1.1 }  // A6
    ];

    bells.forEach(b => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(b.f, now + b.t);

      const start = now + b.t;
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.3 * (this.isMuted ? 0 : this.volume), start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + b.d);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(start);
      osc.stop(start + b.d);
    });
  }

  _playRadarCycle() {
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    // Urgent pulsing dual-tone radar beep
    const pulses = [0, 0.22, 0.44, 0.75, 0.97];

    pulses.forEach(t => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(950, now + t);
      osc.frequency.exponentialRampToValueAtTime(1400, now + t + 0.12);

      const start = now + t;
      gain.gain.setValueAtTime(0.28 * (this.isMuted ? 0 : this.volume), start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.13);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(start);
      osc.stop(start + 0.15);
    });
  }

  _playArcadeCycle() {
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    // Retro energetic 8-bit arpeggios
    const notes = [
      440, 554.37, 659.25, 880,
      554.37, 659.25, 880, 1108.73,
      659.25, 880, 1108.73, 1318.51,
      880, 1108.73, 1318.51, 1760
    ];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      const start = now + i * 0.07;
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.14 * (this.isMuted ? 0 : this.volume), start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.06);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(start);
      osc.stop(start + 0.07);
    });
  }

  // Play a single ringtone cycle based on sound name
  playToneCycle(soundType = this.activeRingtone) {
    this.init();
    switch (soundType) {
      case 'chime':
        this._playChimeCycle();
        break;
      case 'radar':
        this._playRadarCycle();
        break;
      case 'arcade':
        this._playArcadeCycle();
        break;
      case 'melody':
      default:
        this._playMelodyCycle();
        break;
    }
  }

  // Test / preview a ringtone once
  previewTone(soundType) {
    this.stopAlarm();
    this.playToneCycle(soundType);
  }

  // Start continuous alarm ringing loop
  startAlarm(soundType = 'melody') {
    this.init();
    if (this.isPlayingAlarm) return;
    this.isPlayingAlarm = true;
    this.activeRingtone = soundType;

    // Play first cycle immediately
    this.playToneCycle(soundType);

    // Loop interval depends on tone duration
    const intervalMap = {
      melody: 1600,
      chime: 2000,
      radar: 1500,
      arcade: 1500
    };

    const interval = intervalMap[soundType] || 1600;

    this.currentLoopTimer = setInterval(() => {
      if (!this.isPlayingAlarm) {
        clearInterval(this.currentLoopTimer);
        return;
      }
      this.playToneCycle(this.activeRingtone);
    }, interval);
  }

  // Stop the alarm
  stopAlarm() {
    this.isPlayingAlarm = false;
    if (this.currentLoopTimer) {
      clearInterval(this.currentLoopTimer);
      this.currentLoopTimer = null;
    }
  }
}

// Global instance
window.soundEngine = new SoundEngine();
