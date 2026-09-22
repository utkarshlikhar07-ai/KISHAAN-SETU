"""
Kisan Setu - Pydantic Request & Response Validation Schemas
===========================================================
Strict type-checking and serialization for REST API endpoints and WebSocket messages.
"""

from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


# ==========================================
# 1. FARMER SCHEMAS
# ==========================================
class FarmerCreateSchema(BaseModel):
    name: str = Field(..., min_length=2, max_length=120, examples=["Baldev Singh"])
    phone_number: str = Field(..., min_length=10, max_length=15, examples=["9876543210"])
    aadhaar_number: Optional[str] = Field(None, max_length=16, examples=["548912347612"])
    state: str = Field("Haryana", max_length=60)
    district: str = Field("Karnal", max_length=60)
    village: Optional[str] = Field(None, max_length=100)
    crop_type: str = Field("Wheat", max_length=50)
    default_quantity_quintals: float = Field(50.0, gt=0)
    preferred_language: str = Field("hi", max_length=10)


class FarmerResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    phone_number: str
    aadhaar_hash: Optional[str] = None
    state: str
    district: str
    village: Optional[str] = None
    crop_type: str
    default_quantity_quintals: float
    preferred_language: str
    created_at: datetime


# ==========================================
# 2. PROCUREMENT CENTER SCHEMAS
# ==========================================
class CenterResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    district: str
    state: str
    address: Optional[str] = None
    latitude: float
    longitude: float
    distance_km: float = 10.0
    daily_capacity_quintals: float
    operating_hours: str
    current_queue_count: int
    avg_processing_time_mins: float
    estimated_wait_mins: int
    traffic_status: str
    is_active: bool


class ScoredCenterItem(BaseModel):
    center_id: int
    name: str
    code: str
    distance_km: float
    current_queue_count: int
    estimated_wait_mins: int
    traffic_status: str
    ai_score: float
    daily_capacity_quintals: float
    operating_hours: str
    recommended_time_window: Optional[str] = "10:00 AM - 12:00 PM"
    tag: Optional[str] = "AI_RECOMMENDED"


class CenterRecommendationResponse(BaseModel):
    best_center_id: Optional[int]
    ai_reasoning: str
    recommended_centers: List[ScoredCenterItem]


# ==========================================
# 3. SLOT BOOKING SCHEMAS
# ==========================================
class SlotBookingCreateSchema(BaseModel):
    farmer_id: int
    center_id: int
    booking_date: date
    time_window: str = Field(..., examples=["09:00 AM - 11:00 AM"])
    crop_type: str = Field("Wheat", examples=["Wheat"])
    quantity_quintals: float = Field(..., gt=0, examples=[85.0])


class SlotBookingRebookSchema(BaseModel):
    booking_date: date
    time_window: str


class SlotBookingResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    booking_reference: str
    farmer_id: int
    center_id: int
    center_name: Optional[str] = None
    booking_date: date
    time_window: str
    crop_type: str
    quantity_quintals: float
    token_number: int
    queue_position: int
    estimated_wait_mins: int
    status: str
    sms_delivery_status: Optional[str] = "DISPATCHED_SHRAVAN_API"
    sms_preview: Optional[str] = None
    created_at: datetime


# ==========================================
# 4. QUEUE & OFFICER SCHEMAS
# ==========================================
class FarmerLiveQueueSchema(BaseModel):
    booking_id: int
    booking_reference: str
    token_number: int
    farmer_name: str
    farmer_phone: str
    crop_type: str
    quantity_quintals: float
    center_id: int
    center_name: str
    queue_position: int
    farmers_ahead_count: int
    estimated_wait_mins: int
    status: str
    now_serving_token: Optional[int] = None
    last_updated: datetime = Field(default_factory=datetime.utcnow)


class OfficerActionSchema(BaseModel):
    center_id: int
    booking_id: int
    officer_badge_id: str = "OFF-HR-449"
    actual_quantity_quintals: Optional[float] = None
    moisture_percentage: Optional[float] = 11.5
    quality_grade: str = "FAQ_GRADE_A"


class OfficerActionResponse(BaseModel):
    status: str
    completed_booking_id: int
    next_token: Optional[int]
    active_queue_length: int
    payment_generated: bool
    payment_reference: Optional[str] = None
    websocket_broadcast_sent: bool


# ==========================================
# 5. PAYMENT SCHEMAS
# ==========================================
class PaymentResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    payment_reference: str
    booking_id: int
    farmer_id: int
    crop_type: str
    quantity_quintals: float
    msp_rate_per_quintal: float
    gross_amount: float
    deductions: float
    net_payable: float
    status: str
    payment_mode: str
    bank_account_last4: str
    ifsc_code: str
    utr_number: Optional[str] = None
    disbursed_at: Optional[datetime] = None
    created_at: datetime


# ==========================================
# 6. ASSISTANT SCHEMAS (SAARTHI AI)
# ==========================================
class AssistantQuerySchema(BaseModel):
    farmer_id: Optional[int] = 1
    language: str = Field("hi", examples=["hi", "pa", "te", "en"])
    text_query: str = Field(..., min_length=1)
    audio_base64: Optional[str] = None


class QuickAction(BaseModel):
    label: str
    route: str


class AssistantResponseSchema(BaseModel):
    intent: str
    extracted_entities: Dict[str, Any] = {}
    original_language: str
    response_text: str
    response_audio_available: bool = False
    quick_actions: List[QuickAction] = []
