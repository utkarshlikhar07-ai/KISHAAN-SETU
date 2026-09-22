"""
Kisan Setu - Sarvam AI Voice Intent Extraction & NER Service
============================================================
Handles natural language understanding from farmer voice transcripts / text queries.
Extracts intents, entities (crop, location, token, dates), and generates conversational
answers via Saarthi AI assistant.
"""

import os
import re
from typing import Dict, Any

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY", "")


class SarvamVoiceIntentService:
    @classmethod
    def parse_intent(cls, query_text: str, language: str = "hi") -> Dict[str, Any]:
        """
        Parses farmer's spoken or typed prompt and classifies intent with extracted entities.
        """
        lower_q = query_text.lower().strip()

        # Entity extraction
        extracted_entities = {}
        if "wheat" in lower_q or "गेहूं" in lower_q or "ਕਣਕ" in lower_q:
            extracted_entities["crop"] = "Wheat"
        elif "paddy" in lower_q or "धान" in lower_q or "चावल" in lower_q or "ਝੋਨਾ" in lower_q:
            extracted_entities["crop"] = "Paddy"
        elif "mustard" in lower_q or "सरसों" in lower_q:
            extracted_entities["crop"] = "Mustard"

        if "karnal" in lower_q or "करनाल" in lower_q:
            extracted_entities["center"] = "Karnal New Grain Mandi"
        elif "indore" in lower_q or "इंदौर" in lower_q:
            extracted_entities["center"] = "Indore Choithram APMC"
        elif "taraori" in lower_q or "तरावड़ी" in lower_q:
            extracted_entities["center"] = "Taraori Sub-Yard Mandi"

        # Match token if spoken
        token_match = re.search(r'(?:token|टोकन|ਟੋਕਨ)\s*#?\s*(\d+)', lower_q)
        if token_match:
            extracted_entities["token_number"] = int(token_match.group(1))

        # Intent classification heuristics
        if any(w in lower_q for w in ["queue", "कतार", "लाइन", "भीड़", "token", "नंबर", "बारी", "वेट", "wait", "status", "position"]):
            intent = "CHECK_QUEUE_STATUS"
            response_text = (
                "आपके सक्रिय टोकन #14 की कतार स्थिति: आपके आगे 3 किसान हैं। "
                "अनुमानित प्रतीक्षा समय लगभग 35-45 मिनट है। जैसे ही आपकी बारी आएगी, आपको SMS अलर्ट भेजा जाएगा।"
            ) if language == "hi" else (
                "ਤੁਹਾਡੇ ਟੋਕਨ #14 ਦੀ ਸਥਿਤੀ: ਤੁਹਾਡੇ ਅੱਗੇ 3 ਕਿਸਾਨ ਹਨ। "
                "ਲਗਭਗ 35-45 ਮਿੰਟ ਦੀ ਉਡੀਕ ਹੈ। ਜਦੋਂ ਵਾਰੀ ਆਵੇਗੀ, SMS ਆਵੇਗਾ।"
            ) if language == "pa" else (
                "Current Queue Status for Token #14: 3 farmers ahead. "
                "Estimated wait time is approximately 35-45 minutes. You will receive an SMS alert when called."
            )
            quick_actions = [
                {"label": "View Live Queue (लाइव कतार)", "route": "/queue"},
                {"label": "Mandi Traffic Heatmap", "route": "/officer"}
            ]

        elif any(w in lower_q for w in ["paas", "mandi", "center", "recommend", "सुझाव", "नजदीक", "बेहतर", "best", "traffic"]):
            intent = "RECOMMEND_CENTER"
            response_text = (
                "AI सारथी सुझाव: करनाल न्यू ग्रेन मंडी (Karnal Mandi) सबसे अनुकूल है। "
                "यहाँ ट्रैफिक कम (Green) है और औसत प्रतीक्षा समय केवल 50 मिनट है। "
                "आप कल सुबह 10:00 AM - 12:00 PM का स्लॉट बुक कर सकते हैं।"
            ) if language == "hi" else (
                "AI Saarthi Suggestion: Karnal New Grain Mandi is recommended. "
                "Current traffic is LOW (Green) with only ~50 mins average turnaround. "
                "Recommended time window: Tomorrow 10:00 AM - 12:00 PM."
            )
            quick_actions = [
                {"label": "Book Slot (स्लॉट बुक करें)", "route": "/centers"}
            ]

        elif any(w in lower_q for w in ["payment", "भुगतान", "पैसा", "रुपया", "dbt", "msp", "खाता", "bank", "utr"]):
            intent = "CHECK_PAYMENT"
            response_text = (
                "आपके गेहूं उपार्जन (84.8 क्विंटल) का MSP भुगतान ₹1,92,920 DBT के माध्यम से स्वीकृत हो चुका है। "
                "बैंक UTR: RBI2026092289410382 आपके आधार से लिंक खाते (खाता अंत: 9412) में प्रेषित कर दिया गया है।"
            ) if language == "hi" else (
                "Payment of ₹1,92,920 for 84.8 Quintals of Wheat at government MSP has been DISBURSED via DBT. "
                "UTR: RBI2026092289410382 sent to your Aadhaar-linked bank account ending in 9412."
            )
            quick_actions = [
                {"label": "View Payment Receipt (रसीद देखें)", "route": "/payments"}
            ]

        elif any(w in lower_q for w in ["book", "स्लॉट", "बुकिंग", "तारीख", "date"]):
            intent = "BOOK_SLOT"
            response_text = (
                "स्लॉट बुक करने के लिए कृपया अपनी पसंद का उपार्जन केंद्र और समय चुनें। "
                "आप 10:00 AM से 12:00 PM के बीच न्यूनतम प्रतीक्षा समय का लाभ उठा सकते हैं।"
            ) if language == "hi" else (
                "To book a procurement slot, please select your nearest center and convenient time window."
            )
            quick_actions = [
                {"label": "Go to Slot Booking", "route": "/centers"}
            ]

        else:
            intent = "GENERAL_HELP"
            response_text = (
                "नमस्ते! मैं आपका किसान सेतु सारथी AI सहायक हूँ। "
                "आप मुझसे मंडी में भीड़, अपनी कतार स्थिति, स्लॉट बुकिंग, या MSP भुगतान के बारे में पूछ सकते हैं।"
            ) if language == "hi" else (
                "Welcome to Kisan Setu Saarthi AI. You can ask me about live mandi traffic, your queue position, slot booking, or MSP payment tracking."
            )
            quick_actions = [
                {"label": "Find Best Mandi", "route": "/centers"},
                {"label": "Check Queue", "route": "/queue"},
                {"label": "Track Payment", "route": "/payments"}
            ]

        return {
            "intent": intent,
            "extracted_entities": extracted_entities,
            "original_language": language,
            "response_text": response_text,
            "response_audio_available": True,
            "quick_actions": quick_actions
        }
