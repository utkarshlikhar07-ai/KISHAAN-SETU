"""
Kisan Setu - Shravan API SMS Service Wrapper & Sandbox Simulator
================================================================
Handles programmatic SMS notifications to farmers for slot booking confirmation,
queue alerts (when turn is arriving), and cancellations.
Maintains an in-memory dispatch history so the UI can demonstrate incoming SMS alerts.
"""

import os
from datetime import datetime
from typing import List, Dict, Optional

SHRAVAN_API_KEY = os.getenv("SHRAVAN_API_KEY", "")
SHRAVAN_API_URL = os.getenv("SHRAVAN_API_URL", "https://api.shravan.gov.in/v1/sms/send")

# In-memory log of recent SMS dispatches for UI simulation drawer
SMS_DISPATCH_LOG: List[Dict] = []


class ShravanSMSService:
    @staticmethod
    def send_sms(phone_number: str, message: str, message_type: str = "SLOT_CONFIRMATION") -> Dict:
        """
        Sends SMS via Shravan API (or mocks response in hackathon prototype mode).
        """
        timestamp = datetime.utcnow().isoformat() + "Z"
        sms_record = {
            "id": f"SMS-{len(SMS_DISPATCH_LOG) + 1:04d}",
            "recipient_phone": phone_number,
            "message": message,
            "type": message_type,
            "timestamp": timestamp,
            "status": "DELIVERED",
            "gateway": "SHRAVAN_GOV_GATEWAY" if SHRAVAN_API_KEY else "SHRAVAN_SANDBOX_MOCK"
        }

        # If live API key is provided, perform actual HTTP POST
        if SHRAVAN_API_KEY:
            try:
                import httpx
                response = httpx.post(
                    SHRAVAN_API_URL,
                    headers={"Authorization": f"Bearer {SHRAVAN_API_KEY}"},
                    json={"to": phone_number, "body": message, "sender_id": "KS-MANDI"},
                    timeout=5.0
                )
                if response.status_code == 200:
                    sms_record["status"] = "DELIVERED_LIVE"
            except Exception as e:
                print(f"[Shravan SMS] Live API fallback to mock: {e}")

        # Store in recent logs (keep last 50)
        SMS_DISPATCH_LOG.insert(0, sms_record)
        if len(SMS_DISPATCH_LOG) > 50:
            SMS_DISPATCH_LOG.pop()

        try:
            print(f"[Shravan SMS Dispatch] To: {phone_number} | Message: {message}")
        except UnicodeEncodeError:
            print(f"[Shravan SMS Dispatch] To: {phone_number} | Message: [Regional Text - {len(message)} chars]")
        return sms_record

    @classmethod
    def send_slot_confirmation(
        cls,
        farmer_name: str,
        phone_number: str,
        center_name: str,
        booking_date: str,
        time_window: str,
        token_number: int,
        ref_id: str
    ) -> Dict:
        text = (
            f"किसान सेतु: {farmer_name} जी, आपका उपार्जन स्लॉट {center_name} में "
            f"{booking_date} ({time_window}) हेतु स्वीकृत है। टोकन सं: #{token_number}। "
            f"लाइव कतार देखें: ksetu.in/q/{ref_id[-4:]}"
        )
        return cls.send_sms(phone_number, text, "SLOT_CONFIRMATION")

    @classmethod
    def send_turn_alert(cls, farmer_name: str, phone_number: str, center_name: str, token_number: int) -> Dict:
        text = (
            f"किसान सेतु अलर्ट: {farmer_name} जी, आपकी बारी आ गई है! "
            f"कृपया टोकन #{token_number} के साथ {center_name} के तुलाई कांटा #2 पर पहुंचें।"
        )
        return cls.send_sms(phone_number, text, "TURN_ALERT")

    @classmethod
    def send_cancellation(cls, farmer_name: str, phone_number: str, center_name: str, ref_id: str) -> Dict:
        text = (
            f"किसान सेतु: {farmer_name} जी, आपकी बुकिंग {ref_id} ({center_name}) "
            f"सफलतापूर्वक रद्द कर दी गई है। नया स्लॉट बुक करने के लिए पोर्टल पर जाएं।"
        )
        return cls.send_sms(phone_number, text, "SLOT_CANCELLATION")

    @classmethod
    def get_recent_dispatches(cls) -> List[Dict]:
        return SMS_DISPATCH_LOG
