/**
 * app.js - PulseRemind Interval Task Reminder Engine
 * Built for Anil Dutta - Google Projects
 * Web Audio API synthesizer, Interval Task Scheduler, PIN Security & Profile Management
 */

// ==========================================
// 1. SOUND & AUDIO SYNTHESIS ENGINE
// ==========================================
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.volume = 0.85;
    this.isMuted = false;
    this.isUnlocked = false;
    this.activeAlarmInterval = null;
    this.activeTask = null;
    this.audioInitListeners = [];
  }

  initAudio() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (this.ctx && this.ctx.state === 'running') {
      this.isUnlocked = true;
      this.notifyInit();
    }
  }

  notifyInit() {
    this.audioInitListeners.forEach(fn => fn(this.isUnlocked));
  }

  onUnlocked(fn) {
    this.audioInitListeners.push(fn);
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, parseFloat(val)));
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  playTone(toneName = 'chime', customVol = null) {
    this.initAudio();
    if (this.isMuted || !this.ctx) return;

    const baseVol = (customVol !== null ? customVol : this.volume);
    if (baseVol <= 0) return;

    const now = this.ctx.currentTime;

    switch (toneName) {
      case 'digital':
        this._playDigitalBeep(now, baseVol);
        break;
      case 'bell':
        this._playZenBell(now, baseVol);
        break;
      case 'marimba':
        this._playMarimba(now, baseVol);
        break;
      case 'harpsichord':
        this._playHarpsichord(now, baseVol);
        break;
      case 'echo':
        this._playRadarEcho(now, baseVol);
        break;
      case 'urgent':
        this._playUrgentSiren(now, baseVol);
        break;
      case 'completion':
        this._playCompletionChime(now, baseVol);
        break;
      case 'chime':
      default:
        this._playCrystalChime(now, baseVol);
        break;
    }
  }

  // 1. Crystal Chime: 4-tone harmonic bell
  _playCrystalChime(t, vol) {
    const freqs = [587.33, 739.99, 880.00, 1174.66]; // D5, F#5, A5, D6
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.12);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, t);

      gain.gain.setValueAtTime(0, t + idx * 0.12);
      gain.gain.linearRampToValueAtTime(vol * 0.35, t + idx * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.12 + 1.6);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + idx * 0.12);
      osc.stop(t + idx * 0.12 + 1.7);
    });
  }

  // 2. Digital Beep: Classic electronic double-beep sequence
  _playDigitalBeep(t, vol) {
    const beeps = [0, 0.15, 0.45, 0.60, 0.90, 1.05];
    beeps.forEach(delay => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(1046.5, t + delay); // C6

      gain.gain.setValueAtTime(0, t + delay);
      gain.gain.linearRampToValueAtTime(vol * 0.22, t + delay + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + delay);
      osc.stop(t + delay + 0.09);
    });
  }

  // 3. Zen Bell: Singing bowl resonant ring
  _playZenBell(t, vol) {
    const freqs = [432.0, 864.0, 1296.0, 1728.0];
    const amplitudes = [0.4, 0.2, 0.08, 0.03];

    freqs.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol * amplitudes[i], t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 2.9);
    });
  }

  // 4. Marimba: Cheerful wooden mallet pluck
  _playMarimba(t, vol) {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.1);

      gain.gain.setValueAtTime(0, t + i * 0.1);
      gain.gain.linearRampToValueAtTime(vol * 0.45, t + i * 0.1 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.1 + 0.7);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + i * 0.1);
      osc.stop(t + i * 0.1 + 0.75);
    });
  }

  // 5. Harpsichord / Harp: Cascading arpeggio
  _playHarpsichord(t, vol) {
    const notes = [440, 554.37, 659.25, 880, 1108.73]; // A4, C#5, E5, A5, C#6
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + i * 0.09);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, t);

      gain.gain.setValueAtTime(0, t + i * 0.09);
      gain.gain.linearRampToValueAtTime(vol * 0.18, t + i * 0.09 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.09 + 0.9);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + i * 0.09);
      osc.stop(t + i * 0.09 + 0.95);
    });
  }

  // 6. Radar Echo: High tech ping with delay
  _playRadarEcho(t, vol) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1480, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.18);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol * 0.4, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 1.25);
  }

  // 7. Urgent Siren: Alternating two-tone alert
  _playUrgentSiren(t, vol) {
    const pulses = [
      { f: 880, start: 0, dur: 0.18 },
      { f: 660, start: 0.22, dur: 0.18 },
      { f: 880, start: 0.44, dur: 0.18 },
      { f: 660, start: 0.66, dur: 0.24 }
    ];
    pulses.forEach(p => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(p.f, t + p.start);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, t);

      gain.gain.setValueAtTime(0, t + p.start);
      gain.gain.linearRampToValueAtTime(vol * 0.25, t + p.start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + p.start + p.dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + p.start);
      osc.stop(t + p.start + p.dur + 0.05);
    });
  }

  // 8. Reward / Completion Chime
  _playCompletionChime(t, vol) {
    const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5, E5, G5, C6, E6
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0, t + idx * 0.08);
      gain.gain.linearRampToValueAtTime(vol * 0.35, t + idx * 0.08 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.08 + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 1.3);
    });
  }

  startAlarm(task) {
    this.stopAlarm();
    this.activeTask = task;
    const tone = task.soundTone || 'chime';

    // Play initial burst
    this.playTone(tone);

    // Loop alarm sound every 3.5 seconds
    this.activeAlarmInterval = setInterval(() => {
      this.playTone(tone);
    }, 3500);

    // Safety timeout: stop continuous ringing after 45 seconds if unacknowledged
    this.alarmTimeout = setTimeout(() => {
      this.stopAlarm();
    }, 45000);
  }

  stopAlarm() {
    if (this.activeAlarmInterval) {
      clearInterval(this.activeAlarmInterval);
      this.activeAlarmInterval = null;
    }
    if (this.alarmTimeout) {
      clearTimeout(this.alarmTimeout);
      this.alarmTimeout = null;
    }
    this.activeTask = null;
  }
}

// ==========================================
// 2. DATA STORE & API CLIENT
// ==========================================
class DataStore {
  constructor() {
    this.isApiAvailable = false;
    this.profiles = [];
    this.currentProfile = null;
    this.tasks = [];
  }

  async checkApiHealth() {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        this.isApiAvailable = true;
        console.log('[DataStore] Connected to PulseRemind FastAPI backend.');
        return true;
      }
    } catch (e) {
      this.isApiAvailable = false;
      console.log('[DataStore] Running in browser standalone mode (localStorage fallback).');
    }
    return false;
  }

  async loadProfiles() {
    if (this.isApiAvailable) {
      try {
        const res = await fetch('/api/profiles');
        if (res.ok) {
          const list = await res.json();
          if (list && list.length > 0) {
            this.profiles = list;
            return list;
          }
        }
      } catch (e) {
        console.warn('API loadProfiles failed, falling back to localStorage');
      }
    }

    // LocalStorage fallback
    const raw = localStorage.getItem('pulseremind_profiles');
    if (raw) {
      try {
        this.profiles = JSON.parse(raw);
        return this.profiles;
      } catch (e) {}
    }

    // Default Profile
    const defaultProfile = {
      id: 'default-profile',
      name: 'Anil Dutta',
      avatar: '👤',
      pin: '1234',
      pinEnabled: true,
      autoLockMinutes: 0,
      volume: 0.85,
      alarmSound: 'chime',
      soundRepeatCount: 3,
      soundEnabled: true,
      notificationsEnabled: true,
      theme: 'dark',
      createdAt: new Date().toISOString()
    };
    this.profiles = [defaultProfile];
    this.saveProfilesLocal();
    return this.profiles;
  }

  saveProfilesLocal() {
    localStorage.setItem('pulseremind_profiles', JSON.stringify(this.profiles));
  }

  async verifyPin(profileId, pin) {
    if (this.isApiAvailable) {
      try {
        const res = await fetch('/api/verify-pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileId, pin })
        });
        const data = await res.json();
        return data.success === true;
      } catch (e) {
        console.warn('API verify-pin failed, checking local');
      }
    }

    // Local check
    const p = this.profiles.find(x => x.id === profileId);
    if (!p) return false;
    if (p.pinEnabled === false) return true;
    return String(p.pin) === String(pin);
  }

  async changePin(profileId, oldPin, newPin) {
    if (this.isApiAvailable) {
      try {
        const res = await fetch('/api/change-pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileId, oldPin, newPin })
        });
        if (res.ok) return true;
        const err = await res.json();
        throw new Error(err.detail || 'Failed to update PIN');
      } catch (e) {
        throw e;
      }
    }

    // Local check
    const p = this.profiles.find(x => x.id === profileId);
    if (!p) throw new Error('Profile not found');
    if (p.pin && oldPin && String(p.pin) !== String(oldPin)) {
      throw new Error('Current PIN is incorrect');
    }
    p.pin = String(newPin);
    p.pinEnabled = true;
    this.saveProfilesLocal();
    return true;
  }

  async createProfile(data) {
    if (this.isApiAvailable) {
      try {
        const res = await fetch('/api/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (res.ok) {
          const newProf = await res.json();
          this.profiles.push(newProf);
          return newProf;
        }
      } catch (e) {
        console.warn('API createProfile failed');
      }
    }

    // Local create
    const newId = `profile-${Date.now()}`;
    const newProf = {
      id: newId,
      name: data.name,
      avatar: data.avatar || '👤',
      pin: data.pin,
      pinEnabled: data.pinEnabled !== false,
      autoLockMinutes: data.autoLockMinutes || 0,
      volume: data.volume || 0.85,
      alarmSound: data.alarmSound || 'chime',
      soundRepeatCount: 3,
      soundEnabled: true,
      notificationsEnabled: true,
      theme: 'dark',
      createdAt: new Date().toISOString()
    };
    this.profiles.push(newProf);
    this.saveProfilesLocal();

    // Also populate default tasks for this local profile
    const defTasks = this.getDefaultTasksForProfile(newId);
    this.tasks = [...this.tasks, ...defTasks];
    this.saveTasksLocal();

    return newProf;
  }

  async updateProfile(profileId, patch) {
    if (this.isApiAvailable) {
      try {
        const res = await fetch(`/api/profiles/${profileId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch)
        });
        if (res.ok) {
          const updated = await res.json();
          const idx = this.profiles.findIndex(p => p.id === profileId);
          if (idx !== -1) this.profiles[idx] = { ...this.profiles[idx], ...updated };
          return this.profiles[idx];
        }
      } catch (e) {
        console.warn('API updateProfile failed');
      }
    }

    // Local update
    const p = this.profiles.find(x => x.id === profileId);
    if (p) {
      Object.assign(p, patch);
      this.saveProfilesLocal();
      return p;
    }
  }

  getDefaultTasksForProfile(profileId) {
    return [
      {
        id: `${profileId}-task-water`,
        profileId: profileId,
        title: "Drink Water",
        category: "Hydration",
        icon: "💧",
        description: "Drink a 250ml glass of fresh water to keep your body and brain hydrated.",
        startTime: "08:30",
        endTime: "19:30",
        intervalMinutes: 45,
        soundTone: "marimba",
        enabled: true,
        color: "sky",
        completedCountToday: 0,
        lastCompletedAt: null,
        lastTriggeredAt: null,
        snoozedUntil: null
      },
      {
        id: `${profileId}-task-walk`,
        profileId: profileId,
        title: "Standup and walk",
        category: "Movement",
        icon: "🚶",
        description: "Break sedentary posture! Stand up, walk around for 2 minutes to boost circulation and relieve spine pressure.",
        startTime: "09:00",
        endTime: "18:00",
        intervalMinutes: 60,
        soundTone: "digital",
        enabled: true,
        color: "emerald",
        completedCountToday: 0,
        lastCompletedAt: null,
        lastTriggeredAt: null,
        snoozedUntil: null
      },
      {
        id: `${profileId}-task-stretch`,
        profileId: profileId,
        title: "Stretch your body",
        category: "Flexibility",
        icon: "🧘",
        description: "Release physical muscle tension! Roll shoulders back, gently stretch neck, wrists, lower back, and hamstrings.",
        startTime: "09:30",
        endTime: "18:30",
        intervalMinutes: 90,
        soundTone: "bell",
        enabled: true,
        color: "amber",
        completedCountToday: 0,
        lastCompletedAt: null,
        lastTriggeredAt: null,
        snoozedUntil: null
      }
    ];
  }

  async loadTasks(profileId) {
    if (this.isApiAvailable) {
      try {
        const res = await fetch(`/api/tasks?profileId=${encodeURIComponent(profileId)}`);
        if (res.ok) {
          const list = await res.json();
          if (list && list.length > 0) {
            this.tasks = list;
            return list;
          }
        }
      } catch (e) {
        console.warn('API loadTasks failed, falling back to localStorage');
      }
    }

    // Local fallback
    const raw = localStorage.getItem(`pulseremind_tasks_${profileId}`);
    if (raw) {
      try {
        this.tasks = JSON.parse(raw);
        return this.tasks;
      } catch (e) {}
    }

    // Default tasks
    this.tasks = this.getDefaultTasksForProfile(profileId);
    this.saveTasksLocal();
    return this.tasks;
  }

  saveTasksLocal() {
    if (this.currentProfile) {
      localStorage.setItem(`pulseremind_tasks_${this.currentProfile.id}`, JSON.stringify(this.tasks));
    }
  }

  async saveTask(task) {
    if (this.isApiAvailable) {
      try {
        if (task.id && this.tasks.some(t => t.id === task.id)) {
          const res = await fetch(`/api/tasks/${task.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
          });
          if (res.ok) {
            const saved = await res.json();
            const idx = this.tasks.findIndex(t => t.id === saved.id);
            if (idx !== -1) this.tasks[idx] = saved;
            return saved;
          }
        } else {
          const res = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
          });
          if (res.ok) {
            const saved = await res.json();
            this.tasks.push(saved);
            return saved;
          }
        }
      } catch (e) {
        console.warn('API saveTask failed');
      }
    }

    // Local save
    if (!task.id) {
      task.id = `task-${Date.now()}`;
      task.completedCountToday = 0;
      task.lastCompletedAt = null;
      task.lastTriggeredAt = null;
      task.snoozedUntil = null;
      this.tasks.push(task);
    } else {
      const idx = this.tasks.findIndex(t => t.id === task.id);
      if (idx !== -1) {
        this.tasks[idx] = { ...this.tasks[idx], ...task };
      } else {
        this.tasks.push(task);
      }
    }
    this.saveTasksLocal();
    return task;
  }

  async deleteTask(taskId) {
    if (this.isApiAvailable) {
      try {
        await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      } catch (e) {
        console.warn('API deleteTask failed');
      }
    }
    this.tasks = this.tasks.filter(t => t.id !== taskId);
    this.saveTasksLocal();
  }

  async markTaskCompleted(taskId) {
    if (this.isApiAvailable) {
      try {
        const res = await fetch(`/api/tasks/${taskId}/complete`, { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          const idx = this.tasks.findIndex(t => t.id === taskId);
          if (idx !== -1) this.tasks[idx] = data.task;
          return data.task;
        }
      } catch (e) {}
    }

    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.completedCountToday = (task.completedCountToday || 0) + 1;
      task.lastCompletedAt = new Date().toISOString();
      task.snoozedUntil = null;
      this.saveTasksLocal();
      return task;
    }
  }

  async snoozeTask(taskId, minutes = 5) {
    const snoozeTarget = Date.now() + minutes * 60 * 1000;
    if (this.isApiAvailable) {
      try {
        await fetch(`/api/tasks/${taskId}/snooze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ snoozeMinutes: minutes })
        });
      } catch (e) {}
    }
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.snoozedUntil = snoozeTarget;
      this.saveTasksLocal();
      return task;
    }
  }

  async resetDefaultTasks(profileId) {
    if (this.isApiAvailable) {
      try {
        await fetch(`/api/tasks/reset-defaults?profileId=${encodeURIComponent(profileId)}`, { method: 'POST' });
      } catch (e) {}
    }
    this.tasks = this.getDefaultTasksForProfile(profileId);
    this.saveTasksLocal();
    return this.tasks;
  }
}

// ==========================================
// 3. TASK SCHEDULER & INTERVAL ENGINE
// ==========================================
class TaskScheduler {
  constructor(soundEngine, dataStore, onAlarmTriggered, onTick) {
    this.soundEngine = soundEngine;
    this.dataStore = dataStore;
    this.onAlarmTriggered = onAlarmTriggered;
    this.onTick = onTick;
    this.intervalId = null;
    this.triggeredTasksInAlarm = new Set();
  }

  start() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.tick();
    this.intervalId = setInterval(() => this.tick(), 1000);
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = null;
  }

  tick() {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    const nowTimestamp = Date.now();

    const taskStates = this.dataStore.tasks.map(task => {
      return this.computeTaskState(task, now, currentMins, nowTimestamp);
    });

    // Check if any active task should ring
    taskStates.forEach(state => {
      if (state.shouldTrigger && !this.triggeredTasksInAlarm.has(state.task.id)) {
        this.triggeredTasksInAlarm.add(state.task.id);
        this.onAlarmTriggered(state.task);
      }
    });

    if (this.onTick) {
      this.onTick(taskStates);
    }
  }

  clearAlarmedState(taskId) {
    this.triggeredTasksInAlarm.delete(taskId);
  }

  computeTaskState(task, now, currentMins, nowTimestamp) {
    if (!task.enabled) {
      return {
        task,
        status: 'PAUSED',
        badgeText: 'Paused',
        badgeColor: 'gray',
        secondsRemaining: null,
        percentElapsed: 0,
        shouldTrigger: false
      };
    }

    const [startH, startM] = (task.startTime || '09:00').split(':').map(Number);
    const [endH, endM] = (task.endTime || '18:00').split(':').map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;
    const intervalMins = task.intervalMinutes || 45;

    // 1. Before Start Time
    if (currentMins < startMins) {
      const minsUntilStart = startMins - currentMins;
      return {
        task,
        status: 'UPCOMING',
        badgeText: `Starts at ${task.startTime}`,
        badgeColor: 'blue',
        secondsRemaining: Math.round(minsUntilStart * 60),
        percentElapsed: 0,
        shouldTrigger: false
      };
    }

    // 2. After End Time
    if (currentMins >= endMins) {
      return {
        task,
        status: 'ENDED',
        badgeText: `Ended for today (${task.endTime})`,
        badgeColor: 'purple',
        secondsRemaining: null,
        percentElapsed: 100,
        shouldTrigger: false
      };
    }

    // 3. Snooze Check
    if (task.snoozedUntil && task.snoozedUntil > nowTimestamp) {
      const remainingSecs = Math.max(0, Math.round((task.snoozedUntil - nowTimestamp) / 1000));
      return {
        task,
        status: 'SNOOZED',
        badgeText: `Snoozed (${this.formatDuration(remainingSecs)})`,
        badgeColor: 'amber',
        secondsRemaining: remainingSecs,
        percentElapsed: Math.min(100, Math.round(((300 - remainingSecs) / 300) * 100)),
        shouldTrigger: remainingSecs <= 0
      };
    }

    // 4. Active Window: Calculate next trigger based on lastCompletedAt or interval anchors
    let anchorMs = null;
    if (task.lastCompletedAt) {
      const lastCompletedDate = new Date(task.lastCompletedAt);
      // Check if completion was today
      if (lastCompletedDate.toDateString() === now.toDateString()) {
        anchorMs = lastCompletedDate.getTime();
      }
    }

    if (!anchorMs) {
      // Anchor is start of day's window
      const windowStartDate = new Date(now);
      windowStartDate.setHours(startH, startM, 0, 0);
      anchorMs = windowStartDate.getTime();
    }

    const intervalMs = intervalMins * 60 * 1000;
    const elapsedSinceAnchor = nowTimestamp - anchorMs;

    let nextTargetMs;
    if (elapsedSinceAnchor < 0) {
      nextTargetMs = anchorMs;
    } else {
      const periods = Math.floor(elapsedSinceAnchor / intervalMs);
      nextTargetMs = anchorMs + (periods + 1) * intervalMs;
    }

    // Check if nextTargetMs exceeds end time
    const windowEndDate = new Date(now);
    windowEndDate.setHours(endH, endM, 0, 0);
    if (nextTargetMs > windowEndDate.getTime()) {
      return {
        task,
        status: 'ENDED',
        badgeText: `Final interval completed`,
        badgeColor: 'purple',
        secondsRemaining: null,
        percentElapsed: 100,
        shouldTrigger: false
      };
    }

    const remainingMs = nextTargetMs - nowTimestamp;
    const remainingSecs = Math.max(0, Math.round(remainingMs / 1000));
    const elapsedSecs = (intervalMins * 60) - remainingSecs;
    const percentElapsed = Math.min(100, Math.max(0, Math.round((elapsedSecs / (intervalMins * 60)) * 100)));

    const shouldTrigger = remainingSecs <= 1;

    return {
      task,
      status: 'ACTIVE',
      badgeText: `Active (${intervalMins}m loop)`,
      badgeColor: 'emerald',
      secondsRemaining: remainingSecs,
      percentElapsed,
      shouldTrigger
    };
  }

  formatDuration(totalSeconds) {
    if (totalSeconds === null || isNaN(totalSeconds)) return '--:--';
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  }
}

// ==========================================
// 4. MAIN APP CONTROLLER & UI
// ==========================================
class PulseRemindApp {
  constructor() {
    this.sound = new SoundEngine();
    this.dataStore = new DataStore();
    this.scheduler = null;
    this.currentPinInput = '';
    this.isAppLocked = true;
    this.activeFilter = 'all';
    this.searchQuery = '';
    this.editingTaskId = null;
    this.activeAlarmTask = null;
    this.latestTaskStates = [];
    this.autoLockTimer = null;
    this.titleBlinkInterval = null;
    this.originalDocTitle = document.title;
  }

  async init() {
    console.log('[PulseRemindApp] Initializing app...');
    // 1. Audio setup listeners
    this.setupAudioUnlockTrigger();

    // 2. Check API health & load profiles
    await this.dataStore.checkApiHealth();
    await this.dataStore.loadProfiles();

    // 3. Determine current profile
    const storedProfId = localStorage.getItem('pulseremind_active_profile_id');
    let profile = this.dataStore.profiles.find(p => p.id === storedProfId);
    if (!profile) profile = this.dataStore.profiles[0];
    this.setCurrentProfile(profile);

    // 4. Setup Task Scheduler
    this.scheduler = new TaskScheduler(
      this.sound,
      this.dataStore,
      (task) => this.handleAlarmTriggered(task),
      (taskStates) => this.handleSchedulerTick(taskStates)
    );
    this.scheduler.start();

    // 5. Setup Live Time Clock
    this.startLiveClock();

    // 6. Bind UI event listeners
    this.bindEvents();

    // 7. Check PIN lock requirement
    if (this.dataStore.currentProfile && this.dataStore.currentProfile.pinEnabled) {
      this.showPinLockScreen();
    } else {
      this.unlockApp();
    }

    // 8. Ask notification permission politely if not asked
    this.setupNotifications();
  }

  setupAudioUnlockTrigger() {
    const unlockOnFirstClick = () => {
      this.sound.initAudio();
      this.updateAudioIndicator();
      window.removeEventListener('click', unlockOnFirstClick);
      window.removeEventListener('keydown', unlockOnFirstClick);
    };
    window.addEventListener('click', unlockOnFirstClick);
    window.addEventListener('keydown', unlockOnFirstClick);

    this.sound.onUnlocked(() => {
      this.updateAudioIndicator();
    });
  }

  updateAudioIndicator() {
    const btn = document.getElementById('audioStatusBtn');
    const label = document.getElementById('audioStatusLabel');
    const icon = document.getElementById('audioStatusIcon');
    if (!btn || !label || !icon) return;

    if (this.sound.isMuted) {
      btn.className = 'flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-900/40 text-red-300 border border-red-700/50 hover:bg-red-800/50 transition cursor-pointer';
      label.textContent = 'Muted';
      icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />`;
    } else if (this.sound.isUnlocked) {
      btn.className = 'flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-900/40 text-emerald-300 border border-emerald-700/50 hover:bg-emerald-800/50 transition cursor-pointer';
      label.textContent = 'Sound Ready';
      icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />`;
    } else {
      btn.className = 'flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-900/40 text-amber-300 border border-amber-700/50 hover:bg-amber-800/50 transition cursor-pointer animate-pulse';
      label.textContent = 'Click to Unmute Audio';
      icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />`;
    }
  }

  async setupNotifications() {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (e) {}
    }
  }

  setCurrentProfile(profile) {
    this.dataStore.currentProfile = profile;
    localStorage.setItem('pulseremind_active_profile_id', profile.id);
    if (profile.volume !== undefined) {
      this.sound.setVolume(profile.volume);
      const volSlider = document.getElementById('globalVolumeSlider');
      if (volSlider) volSlider.value = Math.round(profile.volume * 100);
    }
    this.updateProfileBadgeUI();
    this.dataStore.loadTasks(profile.id).then(() => {
      this.renderTasks();
    });
  }

  updateProfileBadgeUI() {
    const prof = this.dataStore.currentProfile;
    if (!prof) return;
    const nameEl = document.getElementById('navProfileName');
    const avatarEl = document.getElementById('navProfileAvatar');
    if (nameEl) nameEl.textContent = prof.name;
    if (avatarEl) avatarEl.textContent = prof.avatar || '👤';

    // PIN lock screen header info
    const lockName = document.getElementById('lockProfileName');
    const lockAvatar = document.getElementById('lockProfileAvatar');
    if (lockName) lockName.textContent = prof.name;
    if (lockAvatar) lockAvatar.textContent = prof.avatar || '👤';
  }

  startLiveClock() {
    const clockEl = document.getElementById('liveClockText');
    const dateEl = document.getElementById('liveDateText');
    const update = () => {
      const now = new Date();
      if (clockEl) {
        clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
      if (dateEl) {
        dateEl.textContent = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      }
    };
    update();
    setInterval(update, 1000);
  }

  // ==========================================
  // PIN LOCK & SECURITY LOGIC
  // ==========================================
  showPinLockScreen() {
    this.isAppLocked = true;
    this.currentPinInput = '';
    this.updatePinDots();
    const overlay = document.getElementById('pinLockOverlay');
    if (overlay) {
      overlay.classList.remove('hidden');
      overlay.classList.add('flex');
    }
    const errText = document.getElementById('pinErrorMessage');
    if (errText) errText.classList.add('hidden');
  }

  unlockApp() {
    this.isAppLocked = false;
    this.sound.initAudio();
    this.updateAudioIndicator();
    const overlay = document.getElementById('pinLockOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.classList.remove('flex');
    }
    this.renderTasks();
  }

  handlePinInput(char) {
    if (this.currentPinInput.length >= 6) return;
    this.currentPinInput += char;
    this.updatePinDots();

    // Auto submit if 4 digits entered
    if (this.currentPinInput.length === 4) {
      setTimeout(() => this.submitPin(), 120);
    }
  }

  handlePinBackspace() {
    if (this.currentPinInput.length > 0) {
      this.currentPinInput = this.currentPinInput.slice(0, -1);
      this.updatePinDots();
    }
  }

  handlePinClear() {
    this.currentPinInput = '';
    this.updatePinDots();
  }

  updatePinDots() {
    const dots = document.querySelectorAll('.pin-dot');
    dots.forEach((dot, idx) => {
      if (idx < this.currentPinInput.length) {
        dot.className = 'pin-dot w-4 h-4 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.8)] scale-110 transition-all';
      } else {
        dot.className = 'pin-dot w-4 h-4 rounded-full bg-slate-700 border border-slate-600 transition-all';
      }
    });
  }

  async submitPin() {
    const profile = this.dataStore.currentProfile;
    if (!profile) return;

    const isValid = await this.dataStore.verifyPin(profile.id, this.currentPinInput);
    if (isValid) {
      // Play soft unlock chime
      this.sound.playTone('marimba', 0.4);
      this.unlockApp();
    } else {
      // Shake animation & error message
      const keypad = document.getElementById('pinKeypadCard');
      const errText = document.getElementById('pinErrorMessage');
      if (keypad) {
        keypad.classList.add('shake-animation');
        setTimeout(() => keypad.classList.remove('shake-animation'), 450);
      }
      if (errText) {
        errText.textContent = 'Incorrect PIN. Default is 1234 or your customized PIN.';
        errText.classList.remove('hidden');
      }
      this.currentPinInput = '';
      this.updatePinDots();
      // Error buzz sound
      this.sound.playTone('urgent', 0.2);
    }
  }

  // ==========================================
  // ALARM TRIGGER & MODAL HANDLING
  // ==========================================
  handleAlarmTriggered(task) {
    console.log(`[PulseRemind] 🔔 ALARM TRIGGERED FOR TASK: ${task.title}`);
    this.activeAlarmTask = task;

    // 1. Play Sound in Loop
    this.sound.startAlarm(task);

    // 2. Browser Notification if tab not focused
    this.fireBrowserNotification(task);

    // 3. Blink document title
    this.startTitleBlink(task.title);

    // 4. Open Alarm Modal
    this.showAlarmModal(task);
  }

  fireBrowserNotification(task) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(`⏰ PulseRemind: ${task.title}`, {
          body: task.description || `It is time to ${task.title}! Every ${task.intervalMinutes} mins interval.`,
          icon: '/static/favicon.ico',
          tag: `pulse-alarm-${task.id}`,
          requireInteraction: true
        });
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } catch (e) {
        console.warn('Could not launch browser notification:', e);
      }
    }
  }

  startTitleBlink(taskTitle) {
    if (this.titleBlinkInterval) clearInterval(this.titleBlinkInterval);
    let toggle = false;
    this.titleBlinkInterval = setInterval(() => {
      document.title = toggle ? `🔔 [ALARM] ${taskTitle}!` : `⚠️ PulseRemind Alarm!`;
      toggle = !toggle;
    }, 800);
  }

  stopTitleBlink() {
    if (this.titleBlinkInterval) {
      clearInterval(this.titleBlinkInterval);
      this.titleBlinkInterval = null;
    }
    document.title = this.originalDocTitle;
  }

  showAlarmModal(task) {
    const modal = document.getElementById('activeAlarmModal');
    if (!modal) return;

    document.getElementById('alarmModalTitle').textContent = task.title;
    document.getElementById('alarmModalCategory').textContent = task.category || 'Routine Task';
    document.getElementById('alarmModalIcon').textContent = task.icon || '⏰';
    document.getElementById('alarmModalDescription').textContent = task.description || 'Time to complete your scheduled habit interval.';
    document.getElementById('alarmModalInterval').textContent = `Repeats every ${task.intervalMinutes} mins (${task.startTime} - ${task.endTime})`;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  dismissAlarmModal() {
    this.sound.stopAlarm();
    this.stopTitleBlink();
    if (this.activeAlarmTask && this.scheduler) {
      this.scheduler.clearAlarmedState(this.activeAlarmTask.id);
    }
    const modal = document.getElementById('activeAlarmModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
    this.activeAlarmTask = null;
    this.renderTasks();
  }

  async handleAlarmMarkDone() {
    if (!this.activeAlarmTask) return;
    const task = this.activeAlarmTask;

    // Stop alarm sound
    this.sound.stopAlarm();
    this.stopTitleBlink();

    // Reward sound & celebration confetti!
    this.sound.playTone('completion', 0.85);
    this.fireConfetti();

    // Mark completed in data store
    await this.dataStore.markTaskCompleted(task.id);
    if (this.scheduler) {
      this.scheduler.clearAlarmedState(task.id);
    }

    // Close modal
    this.dismissAlarmModal();
  }

  async handleAlarmSnooze(minutes = 5) {
    if (!this.activeAlarmTask) return;
    const task = this.activeAlarmTask;

    this.sound.stopAlarm();
    this.stopTitleBlink();

    await this.dataStore.snoozeTask(task.id, minutes);
    if (this.scheduler) {
      this.scheduler.clearAlarmedState(task.id);
    }

    this.dismissAlarmModal();
  }

  fireConfetti() {
    if (window.confetti) {
      window.confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    }
  }

  // ==========================================
  // SCHEDULER TICK & TASK RENDERING
  // ==========================================
  handleSchedulerTick(taskStates) {
    this.latestTaskStates = taskStates;
    this.updateSummaryWidgets(taskStates);
    this.updateTaskCardsTick(taskStates);
  }

  updateSummaryWidgets(taskStates) {
    const totalActive = taskStates.filter(s => s.status === 'ACTIVE').length;
    const totalCompleted = this.dataStore.tasks.reduce((sum, t) => sum + (t.completedCountToday || 0), 0);

    const activeCountEl = document.getElementById('summaryActiveCount');
    if (activeCountEl) activeCountEl.textContent = totalActive;

    const completedCountEl = document.getElementById('summaryCompletedCount');
    if (completedCountEl) completedCountEl.textContent = totalCompleted;

    // Find nearest upcoming task
    const activeWithTime = taskStates
      .filter(s => s.secondsRemaining !== null && (s.status === 'ACTIVE' || s.status === 'UPCOMING' || s.status === 'SNOOZED'))
      .sort((a, b) => a.secondsRemaining - b.secondsRemaining);

    const nextWidget = document.getElementById('summaryNextAlarmText');
    const nextTaskName = document.getElementById('summaryNextTaskName');
    if (activeWithTime.length > 0) {
      const nearest = activeWithTime[0];
      if (nextWidget) nextWidget.textContent = this.scheduler.formatDuration(nearest.secondsRemaining);
      if (nextTaskName) nextTaskName.textContent = `${nearest.task.icon || '⏰'} ${nearest.task.title}`;
    } else {
      if (nextWidget) nextWidget.textContent = 'None Today';
      if (nextTaskName) nextTaskName.textContent = 'All tasks outside active window';
    }
  }

  renderTasks() {
    const grid = document.getElementById('taskGridContainer');
    if (!grid) return;

    let tasks = this.dataStore.tasks;

    // Apply Filter
    if (this.activeFilter === 'active') {
      tasks = tasks.filter(t => {
        const state = this.latestTaskStates.find(s => s.task.id === t.id);
        return state && state.status === 'ACTIVE';
      });
    } else if (this.activeFilter === 'paused') {
      tasks = tasks.filter(t => !t.enabled);
    } else if (this.activeFilter === 'completed') {
      tasks = tasks.filter(t => (t.completedCountToday || 0) > 0);
    }

    // Apply Search
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      tasks = tasks.filter(t => t.title.toLowerCase().includes(q) || (t.category && t.category.toLowerCase().includes(q)));
    }

    if (tasks.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-16 text-center rounded-2xl border border-slate-700/60 bg-slate-800/40 p-8">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/50 flex items-center justify-center text-3xl">⏰</div>
          <h3 class="text-lg font-semibold text-slate-200 mb-1">No reminder tasks found</h3>
          <p class="text-slate-400 text-sm max-w-md mx-auto mb-6">
            ${this.searchQuery ? `No tasks matched "${this.searchQuery}". Try a different search term.` : 'Create a custom interval task or restore default health habits.'}
          </p>
          <div class="flex items-center justify-center gap-3">
            <button onclick="window.app.openAddTaskModal()" class="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm transition shadow-lg shadow-sky-600/30 cursor-pointer">
              + Add Custom Task
            </button>
            <button onclick="window.app.restoreDefaults()" class="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-sm transition cursor-pointer">
              Restore 3 Default Tasks
            </button>
          </div>
        </div>
      `;
      return;
    }

    grid.innerHTML = tasks.map(task => this.generateTaskCardHtml(task)).join('');
  }

  generateTaskCardHtml(task) {
    const state = this.latestTaskStates.find(s => s.task.id === task.id) || {
      status: task.enabled ? 'ACTIVE' : 'PAUSED',
      badgeText: task.enabled ? 'Active' : 'Paused',
      badgeColor: task.enabled ? 'emerald' : 'gray',
      secondsRemaining: null,
      percentElapsed: 0
    };

    const colorAccents = {
      sky: { border: 'border-sky-500/30', badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30', progress: 'bg-sky-500' },
      emerald: { border: 'border-emerald-500/30', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', progress: 'bg-emerald-500' },
      amber: { border: 'border-amber-500/30', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30', progress: 'bg-amber-500' },
      purple: { border: 'border-purple-500/30', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30', progress: 'bg-purple-500' },
      rose: { border: 'border-rose-500/30', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30', progress: 'bg-rose-500' }
    };
    const accent = colorAccents[task.color || 'sky'] || colorAccents.sky;

    const remainingStr = this.scheduler ? this.scheduler.formatDuration(state.secondsRemaining) : '--:--';

    return `
      <div id="task-card-${task.id}" class="glass-card rounded-2xl p-5 border ${accent.border} flex flex-col justify-between relative overflow-hidden group">
        <!-- Top bar: Category + Status Badge -->
        <div class="flex items-center justify-between gap-2 mb-3">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${accent.badge}">
            <span>${task.icon || '⏰'}</span>
            <span>${task.category || 'Habit'}</span>
          </span>

          <span id="badge-${task.id}" class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${this.getBadgeClass(state.badgeColor)}">
            ${state.badgeText}
          </span>
        </div>

        <!-- Task Title & Note -->
        <div class="mb-4">
          <h3 class="text-lg font-bold text-white group-hover:text-sky-300 transition flex items-center gap-2">
            ${task.title}
          </h3>
          <p class="text-xs text-slate-400 mt-1 line-clamp-2">
            ${task.description || 'Interval routine reminder'}
          </p>
        </div>

        <!-- Schedule Specs (Window & Interval) -->
        <div class="grid grid-cols-2 gap-2 text-xs bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 mb-4">
          <div>
            <span class="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Active Window</span>
            <span class="text-slate-200 font-mono font-medium">${task.startTime} — ${task.endTime}</span>
          </div>
          <div>
            <span class="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Interval</span>
            <span class="text-sky-400 font-semibold">Every ${task.intervalMinutes} mins</span>
          </div>
        </div>

        <!-- Live Countdown & Progress Indicator -->
        <div class="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 mb-4">
          <div class="flex items-center justify-between text-xs mb-1.5">
            <span class="text-slate-400 font-medium flex items-center gap-1">
              <svg class="w-3.5 h-3.5 text-sky-400 animate-spin" style="animation-duration: 4s;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"></circle>
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" class="opacity-75"></path>
              </svg>
              Next alarm in
            </span>
            <span id="countdown-${task.id}" class="font-mono font-bold text-sm text-sky-300">
              ${remainingStr}
            </span>
          </div>

          <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div id="progbar-${task.id}" class="h-2 rounded-full ${accent.progress} transition-all duration-700" style="width: ${state.percentElapsed || 0}%"></div>
          </div>

          <div class="flex items-center justify-between mt-2 pt-1 border-t border-slate-800/60 text-[11px] text-slate-400">
            <span>Completed today: <strong class="text-emerald-400">${task.completedCountToday || 0}x</strong></span>
            <span class="text-slate-500">Tone: ${this.formatToneName(task.soundTone)}</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-800/80">
          <div class="flex items-center gap-1">
            <button onclick="window.app.triggerTaskNow('${task.id}')" title="Trigger Alarm Sound Now" class="p-2 rounded-lg bg-sky-600/30 hover:bg-sky-600/50 text-sky-300 border border-sky-500/40 text-xs font-medium transition cursor-pointer flex items-center gap-1">
              🔔 Ring
            </button>
            <button onclick="window.app.quickLogCompletion('${task.id}')" title="Mark +1 Done" class="p-2 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs font-medium transition cursor-pointer flex items-center gap-1">
              ✅ Done
            </button>
            <button onclick="window.app.quickSnooze('${task.id}', 5)" title="Snooze 5 Mins" class="p-2 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 text-xs font-medium transition cursor-pointer">
              +5m
            </button>
          </div>

          <div class="flex items-center gap-1">
            <button onclick="window.app.toggleTaskPause('${task.id}')" title="${task.enabled ? 'Pause' : 'Resume'}" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer">
              ${task.enabled ? '⏸️' : '▶️'}
            </button>
            <button onclick="window.app.openEditTaskModal('${task.id}')" title="Edit Settings" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer">
              ✏️
            </button>
            <button onclick="window.app.deleteTaskConfirm('${task.id}')" title="Delete Task" class="p-2 rounded-lg bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 text-xs transition cursor-pointer">
              🗑️
            </button>
          </div>
        </div>
      </div>
    `;
  }

  updateTaskCardsTick(taskStates) {
    taskStates.forEach(state => {
      const cdEl = document.getElementById(`countdown-${state.task.id}`);
      const progEl = document.getElementById(`progbar-${state.task.id}`);
      const badgeEl = document.getElementById(`badge-${state.task.id}`);

      if (cdEl) {
        cdEl.textContent = this.scheduler.formatDuration(state.secondsRemaining);
      }
      if (progEl) {
        progEl.style.width = `${state.percentElapsed}%`;
      }
      if (badgeEl) {
        badgeEl.textContent = state.badgeText;
        badgeEl.className = `px-2.5 py-0.5 rounded-full text-xs font-semibold ${this.getBadgeClass(state.badgeColor)}`;
      }
    });
  }

  getBadgeClass(color) {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/60';
      case 'amber':
        return 'bg-amber-900/50 text-amber-300 border border-amber-700/60';
      case 'blue':
        return 'bg-blue-900/50 text-blue-300 border border-blue-700/60';
      case 'purple':
        return 'bg-purple-900/50 text-purple-300 border border-purple-700/60';
      case 'gray':
      default:
        return 'bg-slate-800 text-slate-400 border border-slate-700';
    }
  }

  formatToneName(tone) {
    const map = {
      chime: 'Crystal Chime',
      digital: 'Digital Beep',
      bell: 'Zen Bowl',
      marimba: 'Marimba',
      harpsichord: 'Harpsichord',
      echo: 'Radar Echo',
      urgent: 'Urgent Siren'
    };
    return map[tone] || 'Chime';
  }

  // ==========================================
  // QUICK ACTIONS ON TASKS
  // ==========================================
  triggerTaskNow(taskId) {
    const task = this.dataStore.tasks.find(t => t.id === taskId);
    if (task) {
      this.sound.initAudio();
      this.handleAlarmTriggered(task);
    }
  }

  async quickLogCompletion(taskId) {
    this.sound.playTone('completion', 0.85);
    this.fireConfetti();
    await this.dataStore.markTaskCompleted(taskId);
    if (this.scheduler) this.scheduler.clearAlarmedState(taskId);
    this.renderTasks();
  }

  async quickSnooze(taskId, minutes = 5) {
    await this.dataStore.snoozeTask(taskId, minutes);
    if (this.scheduler) this.scheduler.clearAlarmedState(taskId);
    this.renderTasks();
  }

  async toggleTaskPause(taskId) {
    const task = this.dataStore.tasks.find(t => t.id === taskId);
    if (task) {
      task.enabled = !task.enabled;
      await this.dataStore.saveTask(task);
      this.renderTasks();
    }
  }

  async deleteTaskConfirm(taskId) {
    const task = this.dataStore.tasks.find(t => t.id === taskId);
    if (!task) return;
    if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
      await this.dataStore.deleteTask(taskId);
      this.renderTasks();
    }
  }

  async restoreDefaults() {
    if (confirm('Restore the 3 default tasks (Drink Water, Standup & Walk, Stretch Body)?')) {
      const profId = this.dataStore.currentProfile ? this.dataStore.currentProfile.id : 'default-profile';
      await this.dataStore.resetDefaultTasks(profId);
      this.renderTasks();
    }
  }

  // ==========================================
  // TASK ADD / EDIT MODAL
  // ==========================================
  openAddTaskModal(templateName = null) {
    this.editingTaskId = null;
    document.getElementById('taskModalHeading').textContent = 'Add New Interval Task';
    document.getElementById('taskFormId').value = '';
    
    // Default form values
    let title = '';
    let category = 'Movement';
    let icon = '⏰';
    let description = '';
    let startTime = '09:00';
    let endTime = '18:00';
    let interval = 45;
    let soundTone = 'chime';
    let color = 'sky';

    if (templateName === 'water') {
      title = 'Drink Water';
      category = 'Hydration';
      icon = '💧';
      description = 'Drink a 250ml glass of fresh water to keep your body and brain hydrated.';
      startTime = '08:30';
      endTime = '19:30';
      interval = 45;
      soundTone = 'marimba';
      color = 'sky';
    } else if (templateName === 'walk') {
      title = 'Standup and walk';
      category = 'Movement';
      icon = '🚶';
      description = 'Break sedentary posture! Stand up, walk around for 2 minutes to boost circulation and relieve spine pressure.';
      startTime = '09:00';
      endTime = '18:00';
      interval = 60;
      soundTone = 'digital';
      color = 'emerald';
    } else if (templateName === 'stretch') {
      title = 'Stretch your body';
      category = 'Flexibility';
      icon = '🧘';
      description = 'Release physical muscle tension! Roll shoulders back, gently stretch neck, wrists, lower back, and hamstrings.';
      startTime = '09:30';
      endTime = '18:30';
      interval = 90;
      soundTone = 'bell';
      color = 'amber';
    } else if (templateName === 'eye') {
      title = '20-20-20 Eye Rest';
      category = 'Eye Health';
      icon = '👁️';
      description = 'Look at an object 20 feet away for 20 seconds to prevent digital eye strain.';
      startTime = '09:00';
      endTime = '18:00';
      interval = 20;
      soundTone = 'echo';
      color = 'purple';
    } else if (templateName === 'posture') {
      title = 'Posture Check & Deep Breath';
      category = 'Ergonomics';
      icon = '🪑';
      description = 'Sit upright, unclench jaw, lower shoulders, and take 3 deep diaphragmatic breaths.';
      startTime = '09:00';
      endTime = '18:00';
      interval = 30;
      soundTone = 'harpsichord';
      color = 'rose';
    }

    document.getElementById('taskFormTitle').value = title;
    document.getElementById('taskFormCategory').value = category;
    document.getElementById('taskFormIcon').value = icon;
    document.getElementById('taskFormDescription').value = description;
    document.getElementById('taskFormStartTime').value = startTime;
    document.getElementById('taskFormEndTime').value = endTime;
    document.getElementById('taskFormInterval').value = interval;
    document.getElementById('taskFormSoundTone').value = soundTone;
    document.getElementById('taskFormColor').value = color;

    const modal = document.getElementById('taskEditModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  openEditTaskModal(taskId) {
    const task = this.dataStore.tasks.find(t => t.id === taskId);
    if (!task) return;

    this.editingTaskId = taskId;
    document.getElementById('taskModalHeading').textContent = 'Edit Interval Task';
    document.getElementById('taskFormId').value = task.id;
    document.getElementById('taskFormTitle').value = task.title;
    document.getElementById('taskFormCategory').value = task.category || '';
    document.getElementById('taskFormIcon').value = task.icon || '⏰';
    document.getElementById('taskFormDescription').value = task.description || '';
    document.getElementById('taskFormStartTime').value = task.startTime || '09:00';
    document.getElementById('taskFormEndTime').value = task.endTime || '18:00';
    document.getElementById('taskFormInterval').value = task.intervalMinutes || 45;
    document.getElementById('taskFormSoundTone').value = task.soundTone || 'chime';
    document.getElementById('taskFormColor').value = task.color || 'sky';

    const modal = document.getElementById('taskEditModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  closeTaskModal() {
    const modal = document.getElementById('taskEditModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  async saveTaskFromForm(e) {
    e.preventDefault();
    const profId = this.dataStore.currentProfile ? this.dataStore.currentProfile.id : 'default-profile';

    const taskData = {
      id: document.getElementById('taskFormId').value || null,
      profileId: profId,
      title: document.getElementById('taskFormTitle').value.trim(),
      category: document.getElementById('taskFormCategory').value.trim() || 'General',
      icon: document.getElementById('taskFormIcon').value.trim() || '⏰',
      description: document.getElementById('taskFormDescription').value.trim(),
      startTime: document.getElementById('taskFormStartTime').value || '09:00',
      endTime: document.getElementById('taskFormEndTime').value || '18:00',
      intervalMinutes: parseInt(document.getElementById('taskFormInterval').value, 10) || 45,
      soundTone: document.getElementById('taskFormSoundTone').value || 'chime',
      color: document.getElementById('taskFormColor').value || 'sky',
      enabled: true
    };

    if (!taskData.title) {
      alert('Please provide a task title');
      return;
    }

    await this.dataStore.saveTask(taskData);
    this.closeTaskModal();
    this.renderTasks();
  }

  // ==========================================
  // PROFILE & SETTINGS MODAL
  // ==========================================
  openProfileModal() {
    const prof = this.dataStore.currentProfile;
    if (!prof) return;

    document.getElementById('settingsProfName').value = prof.name;
    document.getElementById('settingsProfAvatar').value = prof.avatar || '👤';
    document.getElementById('settingsPinEnabled').checked = prof.pinEnabled !== false;

    // Reset pin fields
    document.getElementById('settingsOldPin').value = '';
    document.getElementById('settingsNewPin').value = '';
    document.getElementById('settingsConfirmPin').value = '';
    const pinMsg = document.getElementById('settingsPinMsg');
    if (pinMsg) pinMsg.classList.add('hidden');

    this.renderProfileSwitchList();

    const modal = document.getElementById('profileSettingsModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  closeProfileModal() {
    const modal = document.getElementById('profileSettingsModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  renderProfileSwitchList() {
    const container = document.getElementById('profileSwitchContainer');
    if (!container) return;

    container.innerHTML = this.dataStore.profiles.map(p => {
      const isCurrent = this.dataStore.currentProfile && this.dataStore.currentProfile.id === p.id;
      return `
        <div class="flex items-center justify-between p-3 rounded-xl border ${isCurrent ? 'border-sky-500 bg-sky-950/30' : 'border-slate-700 bg-slate-800/40'}">
          <div class="flex items-center gap-3">
            <span class="text-2xl">${p.avatar || '👤'}</span>
            <div>
              <div class="font-semibold text-sm text-white">${p.name} ${isCurrent ? '<span class="text-xs text-sky-400 font-normal">(Active)</span>' : ''}</div>
              <div class="text-xs text-slate-400">PIN: ${p.pinEnabled !== false ? 'Protected' : 'Disabled'}</div>
            </div>
          </div>
          ${!isCurrent ? `
            <button onclick="window.app.switchProfileTo('${p.id}')" class="px-3 py-1.5 rounded-lg bg-sky-600/30 hover:bg-sky-600 text-sky-300 hover:text-white text-xs font-semibold transition cursor-pointer">
              Switch
            </button>
          ` : `
            <span class="text-xs text-emerald-400 font-medium">Current</span>
          `}
        </div>
      `;
    }).join('');
  }

  switchProfileTo(profId) {
    const prof = this.dataStore.profiles.find(p => p.id === profId);
    if (prof) {
      this.closeProfileModal();
      this.setCurrentProfile(prof);
      if (prof.pinEnabled) {
        this.showPinLockScreen();
      }
    }
  }

  async saveProfileBasicSettings() {
    const prof = this.dataStore.currentProfile;
    if (!prof) return;

    const name = document.getElementById('settingsProfName').value.trim();
    const avatar = document.getElementById('settingsProfAvatar').value.trim();
    const pinEnabled = document.getElementById('settingsPinEnabled').checked;

    if (!name) {
      alert('Profile name cannot be empty');
      return;
    }

    await this.dataStore.updateProfile(prof.id, { name, avatar, pinEnabled });
    prof.name = name;
    prof.avatar = avatar;
    prof.pinEnabled = pinEnabled;

    this.updateProfileBadgeUI();
    this.closeProfileModal();
    alert('Profile preferences updated!');
  }

  async saveNewPinFromSettings() {
    const prof = this.dataStore.currentProfile;
    if (!prof) return;

    const oldPin = document.getElementById('settingsOldPin').value.trim();
    const newPin = document.getElementById('settingsNewPin').value.trim();
    const confirmPin = document.getElementById('settingsConfirmPin').value.trim();
    const pinMsg = document.getElementById('settingsPinMsg');

    if (!newPin || newPin.length < 4) {
      pinMsg.textContent = 'New PIN must be at least 4 digits.';
      pinMsg.className = 'text-xs text-red-400 block mt-2';
      return;
    }

    if (newPin !== confirmPin) {
      pinMsg.textContent = 'New PIN and Confirm PIN do not match.';
      pinMsg.className = 'text-xs text-red-400 block mt-2';
      return;
    }

    try {
      await this.dataStore.changePin(prof.id, oldPin, newPin);
      pinMsg.textContent = '✅ PIN changed successfully!';
      pinMsg.className = 'text-xs text-emerald-400 block mt-2';
      document.getElementById('settingsOldPin').value = '';
      document.getElementById('settingsNewPin').value = '';
      document.getElementById('settingsConfirmPin').value = '';
    } catch (err) {
      pinMsg.textContent = `❌ ${err.message || 'Error updating PIN'}`;
      pinMsg.className = 'text-xs text-red-400 block mt-2';
    }
  }

  openCreateProfileModal() {
    this.closeProfileModal();
    document.getElementById('newProfName').value = '';
    document.getElementById('newProfPin').value = '';
    document.getElementById('newProfAvatar').value = '💼';

    const modal = document.getElementById('createProfileModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  closeCreateProfileModal() {
    const modal = document.getElementById('createProfileModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  async submitCreateProfile(e) {
    e.preventDefault();
    const name = document.getElementById('newProfName').value.trim();
    const pin = document.getElementById('newProfPin').value.trim();
    const avatar = document.getElementById('newProfAvatar').value.trim() || '👤';

    if (!name) {
      alert('Please enter a profile name');
      return;
    }
    if (!pin || pin.length < 4) {
      alert('Please enter a PIN with at least 4 digits');
      return;
    }

    const newProf = await this.dataStore.createProfile({
      name,
      avatar,
      pin,
      pinEnabled: true
    });

    this.closeCreateProfileModal();
    this.setCurrentProfile(newProf);
    alert(`Profile "${name}" created with default reminder tasks!`);
  }

  // ==========================================
  // EVENT BINDINGS
  // ==========================================
  bindEvents() {
    // Keyboard PIN entries
    window.addEventListener('keydown', (e) => {
      if (!this.isAppLocked) return;

      if (e.key >= '0' && e.key <= '9') {
        this.handlePinInput(e.key);
      } else if (e.key === 'Backspace') {
        this.handlePinBackspace();
      } else if (e.key === 'Enter') {
        this.submitPin();
      } else if (e.key === 'Escape') {
        this.handlePinClear();
      }
    });

    // Audio status toggle button
    const audioBtn = document.getElementById('audioStatusBtn');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        this.sound.initAudio();
        const muted = this.sound.toggleMute();
        this.updateAudioIndicator();
      });
    }

    // Volume Slider
    const volSlider = document.getElementById('globalVolumeSlider');
    if (volSlider) {
      volSlider.addEventListener('input', (e) => {
        const val = e.target.value / 100;
        this.sound.setVolume(val);
      });
    }

    // Lock Now Button in Navbar
    const lockBtn = document.getElementById('lockAppNavBtn');
    if (lockBtn) {
      lockBtn.addEventListener('click', () => {
        this.showPinLockScreen();
      });
    }

    // Filter Buttons
    document.querySelectorAll('.filter-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-tab-btn').forEach(b => {
          b.classList.remove('bg-sky-600', 'text-white');
          b.classList.add('bg-slate-800', 'text-slate-300');
        });
        btn.classList.add('bg-sky-600', 'text-white');
        btn.classList.remove('bg-slate-800', 'text-slate-300');
        this.activeFilter = btn.dataset.filter || 'all';
        this.renderTasks();
      });
    });

    // Search Input
    const searchInput = document.getElementById('taskSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.renderTasks();
      });
    }

    // Task Form submit
    const taskForm = document.getElementById('taskFormElement');
    if (taskForm) {
      taskForm.addEventListener('submit', (e) => this.saveTaskFromForm(e));
    }

    // New Profile Form submit
    const newProfForm = document.getElementById('newProfileFormElement');
    if (newProfForm) {
      newProfForm.addEventListener('submit', (e) => this.submitCreateProfile(e));
    }
  }
}

// Instantiate and expose globally
window.addEventListener('DOMContentLoaded', () => {
  window.app = new PulseRemindApp();
  window.app.init();
});
