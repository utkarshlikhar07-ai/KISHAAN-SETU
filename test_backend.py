"""
Kisan Setu - Automated Backend Test Suite (Modern Async HTTPX)
=============================================================
Tests REST endpoints, ML recommendations, Shravan SMS dispatches,
officer queue triage, and Saarthi AI conversational queries.
"""

import sys
import asyncio
from pathlib import Path
from datetime import date, timedelta
import httpx

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ROOT_DIR = Path(__file__).resolve().parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.main import app
from backend.database import init_db
from backend.seed_data import seed_database


async def run_tests():
    init_db()
    seed_database()

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test", follow_redirects=True) as client:
        print("=" * 60)
        print("Running Kisan Setu Backend Verification Suite")
        print("=" * 60)

        # 1. Root
        res = await client.get("/")
        assert res.status_code == 200, f"Root error: {res.text}"
        data = res.json()
        assert data["status"] == "ONLINE"
        print("PASS: Root endpoint verified.")

        # 2. Centers
        res = await client.get("/api/centers")
        assert res.status_code == 200, f"Centers error: {res.text}"
        centers = res.json()
        assert len(centers) >= 6
        print(f"PASS: Procurement centers listed ({len(centers)} mandis found).")

        # 3. AI Recommendation
        rec_res = await client.get("/api/centers/recommendations?farmer_id=1&lat=29.6857&lng=76.9905&crop_type=Wheat&quantity_quintals=50")
        assert rec_res.status_code == 200, f"Rec error: {rec_res.text}"
        rec_data = rec_res.json()
        assert rec_data["best_center_id"] is not None
        assert "ai_reasoning" in rec_data
        print(f"PASS: AI Recommendation verified -> Best Mandi ID: {rec_data['best_center_id']}")
        print(f"      AI Reasoning: {rec_data['ai_reasoning']}")

        # 4. Farmer Registration
        farmer_payload = {
            "name": "Gurmeet Singh Dhillon",
            "phone_number": "9871199887",
            "aadhaar_number": "781299881122",
            "state": "Haryana",
            "district": "Karnal",
            "village": "Nilokheri",
            "crop_type": "Wheat",
            "default_quantity_quintals": 65.0,
            "preferred_language": "hi"
        }
        reg_res = await client.post("/api/farmers/register", json=farmer_payload)
        assert reg_res.status_code in [200, 201], f"Register error: {reg_res.text}"
        farmer_data = reg_res.json()
        farmer_id = farmer_data["id"]
        print(f"PASS: Farmer registered: {farmer_data['name']} (ID: {farmer_id})")

        # 5. Slot Booking
        tomorrow = (date.today() + timedelta(days=1)).isoformat()
        book_payload = {
            "farmer_id": farmer_id,
            "center_id": 1,
            "booking_date": tomorrow,
            "time_window": "09:00 AM - 11:00 AM",
            "crop_type": "Wheat",
            "quantity_quintals": 65.0
        }
        book_res = await client.post("/api/slots/book", json=book_payload)
        assert book_res.status_code == 201, f"Book error: {book_res.text}"
        booking_data = book_res.json()
        booking_id = booking_data["id"]
        print(f"PASS: Slot booked -> Ref: {booking_data['booking_reference']}, Token: #{booking_data['token_number']}")
        print(f"      SMS Simulated Dispatch: {booking_data['sms_preview']}")

        # 6. Live Queue Check
        q_res = await client.get(f"/api/queue/farmer/{booking_id}")
        assert q_res.status_code == 200, f"Queue error: {q_res.text}"
        q_data = q_res.json()
        print(f"PASS: Live Queue Position: #{q_data['queue_position']}, Ahead: {q_data['farmers_ahead_count']}, Est Wait: {q_data['estimated_wait_mins']}m")

        # 7. Officer Mark Done
        officer_payload = {
            "center_id": 1,
            "booking_id": booking_id,
            "officer_badge_id": "OFF-HR-449",
            "actual_quantity_quintals": 64.5,
            "moisture_percentage": 11.2,
            "quality_grade": "FAQ_GRADE_A"
        }
        officer_res = await client.post("/api/queue/officer/mark-done", json=officer_payload)
        assert officer_res.status_code == 200, f"Officer error: {officer_res.text}"
        off_data = officer_res.json()
        assert off_data["status"] == "SUCCESS"
        assert off_data["payment_generated"] is True
        print(f"PASS: Officer marked Done. DBT Payment Generated: {off_data['payment_reference']}")

        # 8. Payment Verification
        pay_res = await client.get(f"/api/payments/farmer/{farmer_id}")
        assert pay_res.status_code == 200, f"Payment error: {pay_res.text}"
        payments = pay_res.json()
        assert len(payments) > 0
        p = payments[0]
        print(f"PASS: Payment Verified -> Net Payable: Rs {p['net_payable']} (UTR: {p['utr_number']})")

        # 9. Saarthi AI Assistant
        query_payload = {
            "farmer_id": 1,
            "language": "hi",
            "text_query": "Mera token kab aayega aur line me kitne kisan aage hain?"
        }
        ast_res = await client.post("/api/assistant/query", json=query_payload)
        assert ast_res.status_code == 200, f"Assistant error: {ast_res.text}"
        ast_data = ast_res.json()
        assert ast_data["intent"] == "CHECK_QUEUE_STATUS"
        print(f"PASS: Saarthi AI Response (Hindi): {ast_data['response_text'][:75]}...")

        # 10. Shravan SMS Feed
        feed_res = await client.get("/api/assistant/sms-feed")
        assert feed_res.status_code == 200, f"Feed error: {feed_res.text}"
        feed = feed_res.json()
        assert len(feed) > 0
        print(f"PASS: Shravan SMS Feed verified ({len(feed)} messages logged). Latest: {feed[0]['message'][:60]}...")

        print("=" * 60)
        print("ALL BACKEND TEST SUITES PASSED SUCCESSFULLY!")
        print("=" * 60)


if __name__ == "__main__":
    asyncio.run(run_tests())
