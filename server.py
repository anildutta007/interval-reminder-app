"""
server.py - FastAPI backend for PulseRemind Interval Task Reminder Web App
Runs on port 8050
"""

import os
import json
import socket
import webbrowser
import threading
import time
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Request, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
PROFILES_FILE = os.path.join(DATA_DIR, "profiles.json")
TASKS_FILE = os.path.join(DATA_DIR, "tasks.json")

os.makedirs(DATA_DIR, exist_ok=True)

app = FastAPI(
    title="PulseRemind - Interval Task & Habit Reminder Alarm Hub",
    description="Customizable interval alarm reminder app with user profiles and PIN protection",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Default Data Setup ---
DEFAULT_PROFILE = {
    "id": "default-profile",
    "name": "Anil Dutta",
    "avatar": "👤",
    "pin": "1234",
    "pinEnabled": True,
    "autoLockMinutes": 0,
    "volume": 0.85,
    "alarmSound": "chime",
    "soundRepeatCount": 3,
    "soundEnabled": True,
    "notificationsEnabled": True,
    "theme": "dark",
    "createdAt": datetime.now(timezone.utc).isoformat()
}

DEFAULT_TASKS = [
    {
        "id": "task-water",
        "profileId": "default-profile",
        "title": "Drink Water",
        "category": "Hydration",
        "icon": "💧",
        "description": "Drink a 250ml glass of fresh water to keep your body and brain hydrated.",
        "startTime": "08:30",
        "endTime": "19:30",
        "intervalMinutes": 45,
        "soundTone": "marimba",
        "alertType": "both",
        "speechLang": "both",
        "speechTextEn": "Time to drink water! Please take a glass of fresh water to stay hydrated.",
        "speechTextHi": "पानी पीने का समय हो गया है! कृपया एक गिलास ताज़ा पानी पिएं और स्वस्थ रहें।",
        "enabled": True,
        "color": "sky",
        "completedCountToday": 0,
        "lastCompletedAt": None,
        "lastTriggeredAt": None,
        "snoozedUntil": None
    },
    {
        "id": "task-walk",
        "profileId": "default-profile",
        "title": "Standup and walk",
        "category": "Movement",
        "icon": "🚶",
        "description": "Break sedentary posture! Stand up, walk around for 2 minutes to boost circulation and relieve spine pressure.",
        "startTime": "09:00",
        "endTime": "18:00",
        "intervalMinutes": 60,
        "soundTone": "digital",
        "alertType": "both",
        "speechLang": "both",
        "speechTextEn": "Time to stand up and walk! Take a 2-minute walking break to improve blood circulation.",
        "speechTextHi": "उठने और टहलने का समय हो गया है! दो मिनट के लिए टहलिए और सक्रिय रहिए।",
        "enabled": True,
        "color": "emerald",
        "completedCountToday": 0,
        "lastCompletedAt": None,
        "lastTriggeredAt": None,
        "snoozedUntil": None
    },
    {
        "id": "task-stretch",
        "profileId": "default-profile",
        "title": "Stretch your body",
        "category": "Flexibility",
        "icon": "🧘",
        "description": "Release physical muscle tension! Roll shoulders back, gently stretch neck, wrists, lower back, and hamstrings.",
        "startTime": "09:30",
        "endTime": "18:30",
        "intervalMinutes": 90,
        "soundTone": "bell",
        "alertType": "both",
        "speechLang": "both",
        "speechTextEn": "Time to stretch your body! Roll your shoulders back and relax your muscles.",
        "speechTextHi": "शरीर को स्ट्रेच करने का समय हो गया है! अपने कंधों और मांसपेशियों को आराम दीजिए।",
        "enabled": True,
        "color": "amber",
        "completedCountToday": 0,
        "lastCompletedAt": None,
        "lastTriggeredAt": None,
        "snoozedUntil": None
    }
]

def load_profiles() -> List[Dict[str, Any]]:
    if not os.path.exists(PROFILES_FILE):
        save_profiles([DEFAULT_PROFILE])
        return [DEFAULT_PROFILE]
    try:
        with open(PROFILES_FILE, "r", encoding="utf-8") as f:
            profiles = json.load(f)
            if not profiles:
                profiles = [DEFAULT_PROFILE]
                save_profiles(profiles)
            return profiles
    except Exception as e:
        print(f"[WARN] Error reading {PROFILES_FILE}: {e}")
        return [DEFAULT_PROFILE]

def save_profiles(profiles: List[Dict[str, Any]]):
    try:
        with open(PROFILES_FILE, "w", encoding="utf-8") as f:
            json.dump(profiles, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"[ERROR] Error saving {PROFILES_FILE}: {e}")

def load_tasks() -> List[Dict[str, Any]]:
    if not os.path.exists(TASKS_FILE):
        save_tasks(DEFAULT_TASKS)
        return DEFAULT_TASKS
    try:
        with open(TASKS_FILE, "r", encoding="utf-8") as f:
            tasks = json.load(f)
            if not tasks:
                tasks = DEFAULT_TASKS
                save_tasks(tasks)
            return tasks
    except Exception as e:
        print(f"[WARN] Error reading {TASKS_FILE}: {e}")
        return DEFAULT_TASKS

def save_tasks(tasks: List[Dict[str, Any]]):
    try:
        with open(TASKS_FILE, "w", encoding="utf-8") as f:
            json.dump(tasks, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"[ERROR] Error saving {TASKS_FILE}: {e}")

# Initialize files on startup
load_profiles()
load_tasks()

# --- Schemas ---
class VerifyPinRequest(BaseModel):
    profileId: str
    pin: str

class ChangePinRequest(BaseModel):
    profileId: str
    oldPin: Optional[str] = None
    newPin: str = Field(..., min_length=4, max_length=8)

class ProfileCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    avatar: str = Field("👤", max_length=10)
    pin: str = Field(..., min_length=4, max_length=8)
    pinEnabled: bool = True
    autoLockMinutes: int = 0
    volume: float = 0.85
    alarmSound: str = "chime"
    soundRepeatCount: int = 3
    theme: str = "dark"

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None
    pinEnabled: Optional[bool] = None
    autoLockMinutes: Optional[int] = None
    volume: Optional[float] = None
    alarmSound: Optional[str] = None
    soundRepeatCount: Optional[int] = None
    soundEnabled: Optional[bool] = None
    notificationsEnabled: Optional[bool] = None
    theme: Optional[str] = None

class TaskModel(BaseModel):
    id: Optional[str] = None
    profileId: str
    title: str = Field(..., min_length=1, max_length=100)
    category: str = Field("General", max_length=50)
    icon: str = Field("⏰", max_length=10)
    description: Optional[str] = ""
    startTime: str = Field("09:00", description="HH:MM in 24hr format")
    endTime: str = Field("18:00", description="HH:MM in 24hr format")
    intervalMinutes: int = Field(..., gt=0, le=1440)
    soundTone: str = Field("chime")
    alertType: str = Field("both", description="'both', 'voice', or 'sound'")
    speechLang: str = Field("both", description="'hi', 'en', or 'both'")
    speechTextEn: Optional[str] = ""
    speechTextHi: Optional[str] = ""
    enabled: bool = True
    color: str = Field("sky")
    completedCountToday: Optional[int] = 0
    lastCompletedAt: Optional[str] = None
    lastTriggeredAt: Optional[str] = None
    snoozedUntil: Optional[str] = None

class SnoozeRequest(BaseModel):
    snoozeMinutes: int = Field(5, ge=1, le=120)

# --- Routes ---

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "app": "PulseRemind Interval Task Reminder",
        "version": "1.0.0",
        "time": datetime.now(timezone.utc).isoformat()
    }

@app.get("/api/profiles")
async def get_profiles():
    """List profiles without exposing the plaintext PIN directly."""
    profiles = load_profiles()
    sanitized = []
    for p in profiles:
        item = dict(p)
        item["hasPin"] = bool(p.get("pin"))
        # don't return raw pin to public listing
        if "pin" in item:
            del item["pin"]
        sanitized.append(item)
    return sanitized

@app.post("/api/verify-pin")
async def verify_pin(req: VerifyPinRequest):
    profiles = load_profiles()
    profile = next((p for p in profiles if p["id"] == req.profileId), None)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # If pin is disabled on profile, always pass
    if not profile.get("pinEnabled", True):
        return {"success": True, "profileId": req.profileId}
    
    saved_pin = str(profile.get("pin", ""))
    if req.pin == saved_pin:
        return {"success": True, "profileId": req.profileId}
    else:
        return {"success": False, "message": "Incorrect PIN"}

@app.post("/api/change-pin")
async def change_pin(req: ChangePinRequest):
    profiles = load_profiles()
    profile = next((p for p in profiles if p["id"] == req.profileId), None)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    current_pin = str(profile.get("pin", ""))
    if current_pin and req.oldPin is not None and req.oldPin != current_pin:
        raise HTTPException(status_code=400, detail="Current PIN is incorrect")
    
    profile["pin"] = str(req.newPin)
    profile["pinEnabled"] = True
    save_profiles(profiles)
    return {"success": True, "message": "PIN updated successfully"}

@app.post("/api/profiles")
async def create_profile(req: ProfileCreate):
    profiles = load_profiles()
    new_id = f"profile-{int(time.time())}"
    new_profile = {
        "id": new_id,
        "name": req.name,
        "avatar": req.avatar,
        "pin": req.pin,
        "pinEnabled": req.pinEnabled,
        "autoLockMinutes": req.autoLockMinutes,
        "volume": req.volume,
        "alarmSound": req.alarmSound,
        "soundRepeatCount": req.soundRepeatCount,
        "soundEnabled": True,
        "notificationsEnabled": True,
        "theme": req.theme,
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    profiles.append(new_profile)
    save_profiles(profiles)
    
    # Also add default 3 tasks for the new profile
    tasks = load_tasks()
    for dt in DEFAULT_TASKS:
        task_copy = dict(dt)
        task_copy["id"] = f"{new_id}-{dt['id']}"
        task_copy["profileId"] = new_id
        tasks.append(task_copy)
    save_tasks(tasks)

    # Return sanitized profile
    res = dict(new_profile)
    del res["pin"]
    res["hasPin"] = True
    return res

@app.put("/api/profiles/{profile_id}")
async def update_profile(profile_id: str, req: ProfileUpdate):
    profiles = load_profiles()
    profile = next((p for p in profiles if p["id"] == profile_id), None)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    update_data = req.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        if v is not None:
            profile[k] = v
    save_profiles(profiles)
    
    res = dict(profile)
    if "pin" in res:
        del res["pin"]
    res["hasPin"] = True
    return res

@app.delete("/api/profiles/{profile_id}")
async def delete_profile(profile_id: str):
    profiles = load_profiles()
    if len(profiles) <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete the only existing profile")
    
    profiles = [p for p in profiles if p["id"] != profile_id]
    save_profiles(profiles)
    
    # Also remove tasks associated with this profile
    tasks = load_tasks()
    tasks = [t for t in tasks if t.get("profileId") != profile_id]
    save_tasks(tasks)
    
    return {"success": True, "message": "Profile and associated tasks deleted"}

# --- Task Routes ---

@app.get("/api/tasks")
async def get_tasks(profileId: Optional[str] = Query(None)):
    tasks = load_tasks()
    if profileId:
        return [t for t in tasks if t.get("profileId") == profileId]
    return tasks

@app.post("/api/tasks")
async def create_task(req: TaskModel):
    tasks = load_tasks()
    new_task = req.model_dump()
    if not new_task.get("id"):
        new_task["id"] = f"task-{int(time.time() * 1000)}"
    new_task["completedCountToday"] = 0
    new_task["lastCompletedAt"] = None
    new_task["lastTriggeredAt"] = None
    new_task["snoozedUntil"] = None
    tasks.append(new_task)
    save_tasks(tasks)
    return new_task

@app.put("/api/tasks/{task_id}")
async def update_task(task_id: str, req: TaskModel):
    tasks = load_tasks()
    idx = next((i for i, t in enumerate(tasks) if t["id"] == task_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    updated = req.model_dump()
    updated["id"] = task_id
    # Preserve tracking state if not provided
    for field in ["completedCountToday", "lastCompletedAt", "lastTriggeredAt", "snoozedUntil"]:
        if updated.get(field) is None and field in tasks[idx]:
            updated[field] = tasks[idx][field]
    
    tasks[idx] = updated
    save_tasks(tasks)
    return updated

@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: str):
    tasks = load_tasks()
    before_count = len(tasks)
    tasks = [t for t in tasks if t["id"] != task_id]
    if len(tasks) == before_count:
        raise HTTPException(status_code=404, detail="Task not found")
    save_tasks(tasks)
    return {"success": True, "message": "Task deleted"}

@app.post("/api/tasks/{task_id}/complete")
async def mark_task_complete(task_id: str):
    tasks = load_tasks()
    task = next((t for t in tasks if t["id"] == task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task["completedCountToday"] = (task.get("completedCountToday") or 0) + 1
    task["lastCompletedAt"] = datetime.now(timezone.utc).isoformat()
    task["snoozedUntil"] = None
    save_tasks(tasks)
    return {"success": True, "task": task}

@app.post("/api/tasks/{task_id}/snooze")
async def snooze_task(task_id: str, req: SnoozeRequest):
    tasks = load_tasks()
    task = next((t for t in tasks if t["id"] == task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    snooze_target = time.time() + (req.snoozeMinutes * 60)
    task["snoozedUntil"] = snooze_target
    save_tasks(tasks)
    return {"success": True, "snoozedUntil": snooze_target, "task": task}

@app.post("/api/tasks/reset-defaults")
async def reset_defaults(profileId: str = Query("default-profile")):
    """Reset tasks for the specified profile back to the 3 standard defaults."""
    tasks = load_tasks()
    # Remove existing tasks for this profile
    tasks = [t for t in tasks if t.get("profileId") != profileId]
    for dt in DEFAULT_TASKS:
        task_copy = dict(dt)
        task_copy["id"] = f"{profileId}-{dt['id']}"
        task_copy["profileId"] = profileId
        tasks.append(task_copy)
    save_tasks(tasks)
    return {"success": True, "message": "Default tasks restored"}

# Serve frontend static assets
@app.get("/")
async def serve_index():
    index_file = os.path.join(BASE_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return JSONResponse({"status": "Frontend not yet generated"})

# Mount static folder
app.mount("/static", StaticFiles(directory=BASE_DIR), name="static")

def open_browser(port: int):
    time.sleep(1.2)
    url = f"http://127.0.0.1:{port}"
    print(f"[PulseRemind] Opening browser to {url} ...")
    try:
        webbrowser.open(url)
    except Exception as e:
        print(f"[WARN] Could not auto-launch browser: {e}")

if __name__ == "__main__":
    PORT = 8050
    print("=" * 60)
    print("   PulseRemind - Interval Task & Habit Reminder Alarm Hub")
    print(f"   Server running on http://127.0.0.1:{PORT}")
    print("=" * 60)
    
    threading.Thread(target=open_browser, args=(PORT,), daemon=True).start()
    uvicorn.run("server:app", host="127.0.0.1", port=PORT, reload=False)
