# Kisan Setu - API Contracts & WebSocket Specifications

This document outlines the FastAPI REST endpoints, Pydantic schemas, validation rules, and WebSocket protocols for the **Kisan Setu** digital procurement platform.

---

## Base URL & Protocols
- **REST API Base URL:** `http://localhost:8000/api`
- **Real-Time WebSocket URL:** `ws://localhost:8000/ws/queue/{center_id}`
- **Interactive Swagger Docs:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

---

## 1. Farmer Registration & Profile Service

### `POST /api/farmers/register`
Creates or updates a farmer profile. One-time onboarding capturing Name, Phone, Crop Type, and expected harvest quantity.

#### Request Headers
```http
Content-Type: application/json
```

#### Request Body (Pydantic: `FarmerCreateSchema`)
```json
{
  "name": "Sardar Baldev Singh",
  "phone_number": "9876543210",
  "aadhaar_number": "548912347612",
  "state": "Punjab",
  "district": "Ludhiana",
  "village": "Jagraon",
  "crop_type": "Wheat",
  "default_quantity_quintals": 85.5,
  "preferred_language": "pa"
}
```

#### Response (201 Created - `FarmerResponseSchema`)
```json
{
  "id": 1,
  "name": "Sardar Baldev Singh",
  "phone_number": "9876543210",
  "aadhaar_masked": "XXXX-XXXX-7612",
  "state": "Punjab",
  "district": "Ludhiana",
  "village": "Jagraon",
  "crop_type": "Wheat",
  "default_quantity_quintals": 85.5,
  "preferred_language": "pa",
  "created_at": "2026-09-22T08:30:00Z"
}
```

#### Error Response (400 Bad Request)
```json
{
  "detail": "Farmer with this phone number is already registered. Use existing ID."
}
```

---

### `GET /api/farmers/{farmer_id}`
Retrieve profile and active bookings for a farmer.

---

## 2. Procurement Centers & AI Recommendations Service

### `GET /api/centers`
Lists all procurement centers (mandis) with live traffic status, current queue counts, capacity, and baseline distance.

#### Query Parameters
- `district` *(optional, string)*: Filter by district name.
- `crop_type` *(optional, string)*: Filter by crop acceptance.

#### Response (200 OK - `List[CenterResponseSchema]`)
```json
[
  {
    "id": 1,
    "code": "KRN-MND-01",
    "name": "Karnal New Grain Mandi",
    "district": "Karnal",
    "state": "Haryana",
    "address": "Sector 4, GT Road, Karnal",
    "latitude": 29.6857,
    "longitude": 76.9905,
    "distance_km": 8.4,
    "daily_capacity_quintals": 1200.0,
    "operating_hours": "08:00 AM - 06:00 PM",
    "current_queue_count": 6,
    "avg_processing_time_mins": 12.0,
    "estimated_wait_mins": 72,
    "traffic_status": "LOW",
    "is_active": true
  },
  {
    "id": 2,
    "code": "IND-APMC-02",
    "name": "Indore Choithram APMC",
    "district": "Indore",
    "state": "Madhya Pradesh",
    "address": "Choithram Mandi Complex",
    "latitude": 22.6821,
    "longitude": 75.8452,
    "distance_km": 19.2,
    "daily_capacity_quintals": 2500.0,
    "operating_hours": "07:30 AM - 07:00 PM",
    "current_queue_count": 34,
    "avg_processing_time_mins": 15.0,
    "estimated_wait_mins": 510,
    "traffic_status": "HIGH",
    "is_active": true
  }
]
```

---

### `GET /api/centers/recommendations`
AI Engine recommendation ranking centers based on ML wait-time prediction, distance penalty, and capacity load.

#### Query Parameters
- `farmer_id` *(required, int)*: Farmer ID
- `farmer_lat` *(optional, float)*: Farmer current coordinates
- `farmer_lng` *(optional, float)*: Farmer current coordinates
- `crop_type` *(optional, string)*: e.g. "Wheat"
- `quantity_quintals` *(optional, float)*: e.g. 50.0

#### Response (200 OK - `CenterRecommendationResponse`)
```json
{
  "best_center_id": 1,
  "ai_reasoning": "Karnal New Grain Mandi is 8.4 km away with only 6 vehicles in queue. Estimated arrival-to-unloading turnaround is 72 mins vs 210 mins at nearby alternatives.",
  "recommended_centers": [
    {
      "center": {
        "id": 1,
        "name": "Karnal New Grain Mandi",
        "distance_km": 8.4,
        "traffic_status": "LOW",
        "current_queue_count": 6,
        "estimated_wait_mins": 72
      },
      "ai_score": 92.4,
      "recommended_time_window": "10:00 AM - 12:00 PM",
      "tag": "FASTEST_TURNAROUND"
    },
    {
      "center": {
        "id": 3,
        "name": "Taraori Sub-Procurement Yard",
        "distance_km": 14.1,
        "traffic_status": "MODERATE",
        "current_queue_count": 14,
        "estimated_wait_mins": 140
      },
      "ai_score": 78.1,
      "recommended_time_window": "01:00 PM - 03:00 PM",
      "tag": "BACKUP_OPTION"
    }
  ]
}
```

---

## 3. Slot Booking & Notification Service

### `POST /api/slots/book`
Books a slot at a designated center and triggers an automated SMS notification via Shravan API.

#### Request Body (Pydantic: `SlotBookingCreateSchema`)
```json
{
  "farmer_id": 1,
  "center_id": 1,
  "booking_date": "2026-09-23",
  "time_window": "10:00 AM - 12:00 PM",
  "crop_type": "Wheat",
  "quantity_quintals": 85.5
}
```

#### Response (201 Created - `SlotBookingResponseSchema`)
```json
{
  "id": 101,
  "booking_reference": "KS-2026-0923-8491",
  "farmer_id": 1,
  "center_id": 1,
  "center_name": "Karnal New Grain Mandi",
  "booking_date": "2026-09-23",
  "time_window": "10:00 AM - 12:00 PM",
  "crop_type": "Wheat",
  "quantity_quintals": 85.5,
  "token_number": 14,
  "queue_position": 7,
  "estimated_wait_mins": 84,
  "status": "CONFIRMED",
  "sms_delivery_status": "DISPATCHED_SHRAVAN_API",
  "sms_preview": "Kisan Setu: Sardar Baldev Singh ji, aapka slot Karnal Mandi me 23-Sep 10:00-12:00 PM confirm ho gaya hai. Token: #14. Queue Link: ksetu.in/q/8491",
  "created_at": "2026-09-22T08:35:12Z"
}
```

---

### `POST /api/slots/{booking_id}/cancel`
Cancel an existing slot booking and notify the farmer via Shravan SMS.

---

### `POST /api/slots/{booking_id}/rebook`
Reschedules the booking date/time slot with updated queue recalculation.

---

## 4. Live Queue Management & Real-Time Sync

### `GET /api/queue/farmer/{booking_id}`
Returns live status for a specific booking.

#### Response (200 OK - `FarmerLiveQueueSchema`)
```json
{
  "booking_id": 101,
  "booking_reference": "KS-2026-0923-8491",
  "token_number": 14,
  "farmer_name": "Sardar Baldev Singh",
  "crop_type": "Wheat",
  "quantity_quintals": 85.5,
  "center_id": 1,
  "center_name": "Karnal New Grain Mandi",
  "queue_position": 4,
  "farmers_ahead_count": 3,
  "estimated_wait_mins": 45,
  "status": "IN_QUEUE",
  "now_serving_token": 10,
  "last_updated": "2026-09-22T09:12:00Z"
}
```

---

### `POST /api/queue/officer/mark-done`
Procurement officer marks the current farmer's procurement as completed, weighing & moisture check done. Automatically triggers WebSocket broadcast decrementing queue positions for all waiting farmers.

#### Request Body (Pydantic: `OfficerActionSchema`)
```json
{
  "center_id": 1,
  "booking_id": 98,
  "officer_badge_id": "OFF-HR-449",
  "actual_quantity_quintals": 84.8,
  "moisture_percentage": 11.8,
  "quality_grade": "FAQ_GRADE_A"
}
```

#### Response (200 OK)
```json
{
  "status": "SUCCESS",
  "completed_booking_id": 98,
  "next_token": 11,
  "active_queue_length": 6,
  "payment_generated": true,
  "payment_reference": "PAY-2026-9921",
  "websocket_broadcast_sent": true
}
```

---

### WebSocket Protocol: `/ws/queue/{center_id}`

Allows the Farmer App and Officer Dashboard to maintain real-time bi-directional status without polling.

#### Connection Handshake
```
Client -> ws://localhost:8000/ws/queue/1?client_type=farmer&booking_id=101
Server -> Connection Established
```

#### Broadcast Events (Server -> Client)

##### 1. `QUEUE_UPDATE` (Emitted whenever an officer calls next or marks done)
```json
{
  "event": "QUEUE_UPDATE",
  "center_id": 1,
  "timestamp": "2026-09-22T09:15:00Z",
  "now_serving_token": 11,
  "total_waiting": 5,
  "avg_wait_time_mins": 55,
  "traffic_status": "LOW",
  "queue_snapshot": [
    { "token_number": 11, "status": "PROCESSING", "farmer_name": "R. Kumar" },
    { "token_number": 12, "status": "IN_QUEUE", "farmer_name": "S. Devi" },
    { "token_number": 13, "status": "IN_QUEUE", "farmer_name": "M. Ali" },
    { "token_number": 14, "status": "IN_QUEUE", "farmer_name": "B. Singh" }
  ]
}
```

##### 2. `YOUR_TURN_ALERT` (Targeted notification when farmer is next)
```json
{
  "event": "YOUR_TURN_ALERT",
  "booking_id": 101,
  "token_number": 14,
  "message": "Aapki bari aane wali hai. Kripya Gate #2 par tractor le aayein."
}
```

---

## 5. Payment Tracking Service

### `GET /api/payments/farmer/{farmer_id}`
Returns all government MSP disbursement records for the farmer.

#### Response (200 OK - `List[PaymentResponseSchema]`)
```json
[
  {
    "id": 501,
    "payment_reference": "PAY-2026-9921",
    "booking_id": 98,
    "crop_type": "Wheat",
    "quantity_quintals": 84.8,
    "msp_rate_per_quintal": 2275.0,
    "gross_amount": 192920.0,
    "deductions": 0.0,
    "net_payable": 192920.0,
    "status": "DISBURSED",
    "payment_mode": "DBT_AADHAAR",
    "bank_account_last4": "9412",
    "ifsc_code": "SBIN0001234",
    "utr_number": "RBI2026092289410382",
    "disbursed_at": "2026-09-22T10:45:00Z"
  }
]
```

---

## 6. Saarthi AI Assistant Service

### `POST /api/assistant/query`
Conversational natural language interface supporting voice transcription and multi-lingual query handling (powered by Bhashini NMT & Sarvam AI NER wrapper).

#### Request Body (Pydantic: `AssistantQuerySchema`)
```json
{
  "farmer_id": 1,
  "language": "hi",
  "text_query": "Karnal mandi me aaj kitni bheed hai aur mera token number kya hai?",
  "audio_base64": null
}
```

#### Response (200 OK - `AssistantResponseSchema`)
```json
{
  "intent": "CHECK_QUEUE_STATUS",
  "extracted_entities": {
    "center_name": "Karnal New Grain Mandi",
    "query_type": "queue_traffic"
  },
  "original_language": "hi",
  "response_text": "Karnal New Grain Mandi me aaj bheed bahut kam (Green) hai, lagbhag 5 gaadiyan line me hain. Aapka token number #14 hai aur aapke aage sirf 3 kisan hain.",
  "response_audio_available": true,
  "quick_actions": [
    { "label": "View Live Queue", "route": "/queue/101" },
    { "label": "Book New Slot", "route": "/centers" }
  ]
}
```
