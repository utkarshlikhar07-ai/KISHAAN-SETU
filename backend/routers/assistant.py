"""
Kisan Setu - Saarthi AI Assistant & SMS Simulation Feed Router
==============================================================
Handles multilingual natural language voice/text intent extraction and SMS notification logs.
"""

from fastapi import APIRouter
from typing import List, Dict

from backend.schemas import AssistantQuerySchema, AssistantResponseSchema
from backend.services.sarvam_voice import SarvamVoiceIntentService
from backend.services.shravan_sms import ShravanSMSService

router = APIRouter(prefix="/assistant", tags=["Saarthi AI Assistant"])


@router.post("/query", response_model=AssistantResponseSchema)
def handle_assistant_query(query: AssistantQuerySchema):
    """Processes farmer voice transcription or text input via Sarvam AI and returns contextual response."""
    result = SarvamVoiceIntentService.parse_intent(
        query_text=query.text_query,
        language=query.language
    )
    return AssistantResponseSchema(
        intent=result["intent"],
        extracted_entities=result["extracted_entities"],
        original_language=result["original_language"],
        response_text=result["response_text"],
        response_audio_available=result["response_audio_available"],
        quick_actions=result["quick_actions"]
    )


@router.get("/sms-feed")
def get_sms_feed() -> List[Dict]:
    """Returns recent SMS dispatches generated via Shravan API for UI simulation."""
    return ShravanSMSService.get_recent_dispatches()
