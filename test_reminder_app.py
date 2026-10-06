"""
test_reminder_app.py - Verification tests for PulseRemind Interval Reminder App
"""

import sys
import os
import unittest
from fastapi.testclient import TestClient

# Add app directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from server import app, DEFAULT_TASKS, DEFAULT_PROFILE

class TestPulseRemind(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_endpoint(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("PulseRemind", data["app"])

    def test_get_profiles(self):
        res = self.client.get("/api/profiles")
        self.assertEqual(res.status_code, 200)
        profiles = res.json()
        self.assertIsInstance(profiles, list)
        self.assertGreaterEqual(len(profiles), 1)
        # Verify raw pin is not leaked
        self.assertNotIn("pin", profiles[0])
        self.assertTrue(profiles[0]["hasPin"])

    def test_verify_pin_success_and_failure(self):
        # 1. Correct PIN (default is 1234)
        res = self.client.post("/api/verify-pin", json={
            "profileId": "default-profile",
            "pin": "1234"
        })
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["success"])

        # 2. Incorrect PIN
        res_fail = self.client.post("/api/verify-pin", json={
            "profileId": "default-profile",
            "pin": "9999"
        })
        self.assertEqual(res_fail.status_code, 200)
        self.assertFalse(res_fail.json()["success"])

    def test_get_tasks_for_profile(self):
        res = self.client.get("/api/tasks?profileId=default-profile")
        self.assertEqual(res.status_code, 200)
        tasks = res.json()
        self.assertIsInstance(tasks, list)
        task_titles = [t["title"] for t in tasks]
        
        # Verify required 3 default tasks exist with Hindi & English voice prompts!
        self.assertIn("Drink Water", task_titles)
        self.assertIn("Standup and walk", task_titles)
        self.assertIn("Stretch your body", task_titles)
        water_task = next(t for t in tasks if t["title"] == "Drink Water")
        self.assertIn("speechTextHi", water_task)
        self.assertIn("पानी", water_task["speechTextHi"])

    def test_task_lifecycle(self):
        # 1. Create a task with Hindi and English voice configuration
        new_task_payload = {
            "profileId": "default-profile",
            "title": "Test 20-20-20 Eye Rest",
            "category": "Eye Health",
            "icon": "👁️",
            "description": "Look 20 feet away for 20 seconds",
            "startTime": "09:00",
            "endTime": "17:00",
            "intervalMinutes": 20,
            "soundTone": "marimba",
            "alertType": "both",
            "speechLang": "both",
            "speechTextEn": "Rest your eyes!",
            "speechTextHi": "आंखों को विश्राम दीजिए!",
            "enabled": True,
            "color": "purple"
        }
        res_create = self.client.post("/api/tasks", json=new_task_payload)
        self.assertEqual(res_create.status_code, 200)
        created = res_create.json()
        task_id = created["id"]
        self.assertEqual(created["title"], "Test 20-20-20 Eye Rest")
        self.assertEqual(created["speechTextHi"], "आंखों को विश्राम दीजिए!")

        # 2. Complete task
        res_comp = self.client.post(f"/api/tasks/{task_id}/complete")
        self.assertEqual(res_comp.status_code, 200)
        self.assertEqual(res_comp.json()["task"]["completedCountToday"], 1)

        # 3. Snooze task
        res_snooze = self.client.post(f"/api/tasks/{task_id}/snooze", json={"snoozeMinutes": 5})
        self.assertEqual(res_snooze.status_code, 200)
        self.assertIsNotNone(res_snooze.json()["snoozedUntil"])

        # 4. Delete task
        res_del = self.client.delete(f"/api/tasks/{task_id}")
        self.assertEqual(res_del.status_code, 200)

    def test_daemon_heartbeat_and_config(self):
        # 1. Heartbeat check
        res_hb = self.client.post("/api/heartbeat")
        self.assertEqual(res_hb.status_code, 200)
        data = res_hb.json()
        self.assertEqual(data["status"], "alive")
        self.assertTrue(data["isBackgroundDaemonActive"])

        # 2. Config update
        res_cfg = self.client.post("/api/daemon/config", json={"reopenBrowserOnAlarm": True})
        self.assertEqual(res_cfg.status_code, 200)
        self.assertTrue(res_cfg.json()["reopenBrowserOnAlarm"])

if __name__ == "__main__":
    unittest.main()
