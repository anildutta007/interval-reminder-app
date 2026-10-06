# PulseRemind - Interval Task & Habit Reminder Alarm Hub

A modern, responsive web application designed to maintain healthy routines and productivity habits via scheduled periodic alarms. Features multi-tone sound synthesis (Web Audio API), custom time windows, repeating interval timers, user profiles, and PIN security.

---

## 🌟 Key Features

### 1. Repeating Interval Alarms & Active Time Windows
- **Start Time & End Time**: Configure daily working hours (e.g. 08:30 to 19:30). Alarms only trigger during the active window.
- **Repeat Interval (Minutes)**: Configurable repeat frequency (e.g., every 15, 30, 45, 60, 90 minutes).
- **Live Real-Time Countdown**: Precise digital countdown clock (`Next in: 14m 28s`) with animated progress rings for every task.
- **Nearest Alarm Dashboard**: Top status widget highlighting the earliest upcoming alarm.

### 2. Pre-Configured Default Habits
Pre-loaded upon first launch:
1. **💧 Drink Water** (Active: 08:30 - 19:30 | Every 45 min | Crystal Chime)
2. **🚶 Standup and walk** (Active: 09:00 - 18:00 | Every 60 min | Digital Beep)
3. **🧘 Stretch your body** (Active: 09:30 - 18:30 | Every 90 min | Zen Bowl)

Plus quick 1-click templates for **👁️ 20-20-20 Eye Rest** and **🪑 Posture Check & Deep Breathing**.

### 3. Spoken Voice-Over in Hindi & English (Web Speech API)
- **Natural Voice Announcements**: Instead of just beeping, the app speaks the required action aloud in **Hindi (हिंदी)**, **English**, or **Bilingual (both)**!
- **Zero Cloud Costs / Offline**: Powered by the browser's native `window.speechSynthesis` API with natural accents.
- **Configurable per Task**:
  - `Alert Mode`: Choose between **Chime + Spoken Voice** (chime plays first to grab attention, then the voice speaks), **Spoken Voice Only**, or **Sound Chime Only**.
  - `Language Options`: Bilingual (English + Hindi), Hindi Only (`hi-IN`), or English Only (`en-US` / `en-GB` / `en-IN`).
  - `Customizable Spoken Phrases`: Edit the exact words spoken for any routine or use the pre-configured natural phrases.
  - `One-Click Listen Preview`: Preview how both Hindi and English voices sound directly in the task editor or on the task cards.

### 4. Procedural Web Audio Synthesizer (Zero External Dependencies)
- **100% Offline & Reliable**: Sounds are synthesized directly in the browser using the Web Audio API (`AudioContext`, `OscillatorNode`, `BiquadFilterNode`, exponential gain envelopes).
- **7 Distinctive Alarm Tones**:
  - `Crystal Bell Chime`: Bright, multi-harmonic 4-tone bell.
  - `Digital Beep`: Classic 80s/90s digital watch alarm beeper.
  - `Zen Bowl`: Deep warm singing bowl resonance with 3-second natural ring.
  - `Marimba Melody`: Cheerful wooden percussion triad.
  - `Harpsichord Arpeggio`: Classical arpeggiated chime.
  - `Radar Echo`: Modern futuristic sonar ping.
  - `Urgent Siren`: Alternating dual-frequency alarm for critical tasks.
- **Audio Control**: Global volume slider, mute toggle, and tone preview buttons.
- **Desktop Notifications**: Standard browser Web Notifications when the browser tab is minimized.

### 4. User Profiles & PIN Security
- **Security Lock Screen**: 4-digit PIN lock screen with tactile glassmorphic keypad, physical keyboard input (0-9, Backspace, Enter), and shake feedback.
- **Default PIN**: `1234` (fully customizable in Profile Settings).
- **Multi-Profile Support**: Switch between multiple profiles (e.g. "Work Routine", "Fitness & Wellness", "Study Focus"). Each profile maintains its own custom tasks, schedules, and completion stats.
- **Quick Lock**: Lock the app anytime via the top navigation padlock icon.

### 5. Completion Tracker & Snooze
- **One-Click Done**: Mark tasks complete to increment your daily habit score, play a celebration chime, and trigger confetti!
- **Snooze Option**: Quick +5m snooze button when you need extra time before completing a routine.
- **Restore Defaults**: Easily reset tasks to the 3 standard health habits anytime.

---

## 🚀 How to Run

### Quick Start
Double-click `run_reminder.bat` in `c:\Anil Google Projects\`:
```cmd
c:\Anil Google Projects\run_reminder.bat
```
* Launches the local web server and automatically opens your browser to **`http://127.0.0.1:8050`**.
* **Browser-Based Execution:** Simply keep the browser tab open while working. PulseRemind runs all interval timers, procedural Web Audio chimes, and spoken voice announcements directly in your browser.
* You can pin the browser tab or keep it in the background while working in other apps — audio chimes and voice alerts will sound clearly when intervals are reached!

### Multi-User Profiles on PC
Multiple people in your home can share the web app on your PC:
1. Each person can switch or create their own profile directly from the top navigation bar or from the PIN lock screen via **`👥 Switch User`** or **`✨ + New Profile`**.
2. Each profile has its own 4-digit security PIN to protect personal tasks and settings.
3. Every profile maintains its own custom tasks, start/end windows, intervals, completion statistics, and Hindi/English voice announcements.

---

## 🛠️ Technology Stack
- **Backend**: Python 3, FastAPI, Uvicorn, Pydantic
- **Frontend**: HTML5, Modern ES6 JavaScript, Tailwind CSS (CDN), Web Audio API, Web Speech API (`hi-IN`, `en-US`)
- **Security & Multi-User**: Salted SHA-256 PIN hashing, Per-Profile task isolation
- **Animations**: CSS3 Glassmorphism, Keyframes, Canvas Confetti
- **Storage**: Persistent JSON (`data/profiles.json`, `data/tasks.json`) + Client-side `localStorage` sync
