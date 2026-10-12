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
        # Verify raw pin is not leaked and pinEnabled is disabled for always-active mode
        self.assertNotIn("pin", profiles[0])
        self.assertFalse(profiles[0].get("pinEnabled", True))
        self.assertIn("voiceLang", profiles[0])

    def test_verify_pin_always_allows_access(self):
        # PIN option removed so app stays active continuously without blocking
        res = self.client.post("/api/verify-pin", json={
            "profileId": "default-profile",
            "pin": "1234"
        })
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["success"])

        res_any = self.client.post("/api/verify-pin", json={
            "profileId": "default-profile",
            "pin": "anything"
        })
        self.assertEqual(res_any.status_code, 200)
        self.assertTrue(res_any.json()["success"])

    def test_get_tasks_for_profile(self):
        res = self.client.get("/api/tasks?profileId=default-profile")
        self.assertEqual(res.status_code, 200)
        tasks = res.json()
        self.assertIsInstance(tasks, list)
        task_titles = [t["title"] for t in tasks]
        
        # Verify required 3 default tasks exist with English, Hindi & Punjabi voice prompts!
        self.assertIn("Drink Water", task_titles)
        self.assertIn("Standup and walk", task_titles)
        self.assertIn("Stretch your body", task_titles)
        water_task = next(t for t in tasks if t["title"] == "Drink Water")
        self.assertIn("speechTextEn", water_task)
        self.assertIn("speechTextHi", water_task)
        self.assertIn("speechTextPa", water_task)
        self.assertIn("पानी", water_task["speechTextHi"])
        self.assertIn("ਪਾਣੀ", water_task["speechTextPa"])

    def test_task_lifecycle(self):
        # 1. Create a task with English, Hindi, and Punjabi voice configuration
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
            "speechLang": "all",
            "speechTextEn": "Rest your eyes!",
            "speechTextHi": "आंखों को विश्राम दीजिए!",
            "speechTextPa": "ਆਪਣੀਆਂ ਅੱਖਾਂ ਨੂੰ ਆਰਾਮ ਦਿਓ!",
            "enabled": True,
            "color": "purple"
        }
        res_create = self.client.post("/api/tasks", json=new_task_payload)
        self.assertEqual(res_create.status_code, 200)
        created = res_create.json()
        task_id = created["id"]
        self.assertEqual(created["title"], "Test 20-20-20 Eye Rest")
        self.assertEqual(created["speechTextHi"], "आंखों को विश्राम दीजिए!")
        self.assertEqual(created["speechTextPa"], "ਆਪਣੀਆਂ ਅੱਖਾਂ ਨੂੰ ਆਰਾਮ ਦਿਓ!")

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

    def test_multi_user_profile_lifecycle(self):
        # 1. Create a new user profile with Punjabi voice language preference
        new_prof_payload = {
            "name": "Priya",
            "avatar": "🌸",
            "voiceLang": "pa",
            "pin": "",
            "pinEnabled": False
        }
        res_create = self.client.post("/api/profiles", json=new_prof_payload)
        self.assertEqual(res_create.status_code, 200)
        created_prof = res_create.json()
        prof_id = created_prof["id"]
        self.assertEqual(created_prof["name"], "Priya")
        self.assertEqual(created_prof["voiceLang"], "pa")

        # 2. Verify new profile has its own initialized tasks with Punjabi voice
        res_tasks = self.client.get(f"/api/tasks?profileId={prof_id}")
        self.assertEqual(res_tasks.status_code, 200)
        tasks = res_tasks.json()
        self.assertGreaterEqual(len(tasks), 3)
        water = next(t for t in tasks if t["title"] == "Drink Water")
        self.assertIn("speechTextPa", water)
        self.assertIn("ਪਾਣੀ", water["speechTextPa"])

        # 3. Verify PIN verification always allows access
        res_pin = self.client.post("/api/verify-pin", json={
            "profileId": prof_id,
            "pin": ""
        })
        self.assertEqual(res_pin.status_code, 200)
        self.assertTrue(res_pin.json()["success"])

        # 4. Cleanup test profile
        self.client.delete(f"/api/profiles/{prof_id}")

    def test_csv_endpoints(self):
        # 1. AI Tools CSV
        res_ai = self.client.get("/ai_tools.csv")
        self.assertEqual(res_ai.status_code, 200)
        self.assertIn("text/csv", res_ai.headers.get("content-type", ""))
        self.assertIn("Whispr Flow", res_ai.text)

        # 2. Indian Market Indices CSV
        res_im = self.client.get("/indian_market_indices.csv")
        self.assertEqual(res_im.status_code, 200)
        self.assertIn("text/csv", res_im.headers.get("content-type", ""))
        self.assertIn("NIFTY 50", res_im.text)
        self.assertIn("BSE SENSEX", res_im.text)
        self.assertIn("NIFTY Bank", res_im.text)

if __name__ == "__main__":
    unittest.main()
