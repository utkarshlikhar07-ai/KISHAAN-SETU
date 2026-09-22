"""
Kisan Setu - Live Queue Management & Officer Operations Router
==============================================================
Provides real-time queue tracking for farmers and operational triage controls for Mandi Officers.
Triggers instantaneous WebSocket broadcasts when an officer marks a farmer as 'Done'.
"""

from datetime import datetime, date
import random
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.database import get_db
from backend.schemas import (
    FarmerLiveQueueSchema,
    OfficerActionSchema,
    OfficerActionResponse,
)
from backend.services.shravan_sms import ShravanSMSService
from backend.services.websocket_hub import ws_manager
from schema import (
    SlotBooking,
    Farmer,
    ProcurementCenter,
    Payment,
    BookingStatusEnum,
    PaymentStatusEnum,
    PaymentModeEnum,
    TrafficStatusEnum,
)

router = APIRouter(prefix="/queue", tags=["Queue Management"])

# Standard Government Minimum Support Prices (MSP) per Quintal (2025-26)
MSP_RATES = {
    "Wheat": 2275.0,
    "Paddy": 2300.0,
    "Mustard": 5650.0,
    "Gram": 5440.0,
    "Soybean": 4892.0,
    "Maize": 2090.0,
}


@router.get("/farmer/{booking_id}", response_model=FarmerLiveQueueSchema)
def get_farmer_live_queue(booking_id: int, db: Session = Depends(get_db)):
    """Retrieves live queue position, count of farmers ahead, and estimated wait time."""
    booking = db.query(SlotBooking).filter(SlotBooking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    center = db.query(ProcurementCenter).filter(ProcurementCenter.id == booking.center_id).first()
    farmer = db.query(Farmer).filter(Farmer.id == booking.farmer_id).first()

    # Count how many active farmers are ahead in line for this center today
    active_ahead = db.query(SlotBooking).filter(
        SlotBooking.center_id == booking.center_id,
        SlotBooking.booking_date == booking.booking_date,
        SlotBooking.status.in_([BookingStatusEnum.CONFIRMED, BookingStatusEnum.IN_QUEUE, BookingStatusEnum.PROCESSING]),
        SlotBooking.token_number < booking.token_number
    ).count()

    # Current serving token
    current_serving = db.query(SlotBooking).filter(
        SlotBooking.center_id == booking.center_id,
        SlotBooking.booking_date == booking.booking_date,
        SlotBooking.status == BookingStatusEnum.PROCESSING
    ).first()

    now_serving_token = current_serving.token_number if current_serving else (
        max(1, booking.token_number - active_ahead)
    )

    avg_proc = center.avg_processing_time_mins if center else 12.0
    est_wait = max(5, int(active_ahead * avg_proc))

    return FarmerLiveQueueSchema(
        booking_id=booking.id,
        booking_reference=booking.booking_reference,
        token_number=booking.token_number,
        farmer_name=farmer.name if farmer else "Farmer",
        farmer_phone=farmer.phone_number if farmer else "N/A",
        crop_type=booking.crop_type,
        quantity_quintals=booking.quantity_quintals,
        center_id=booking.center_id,
        center_name=center.name if center else "Mandi",
        queue_position=active_ahead + 1,
        farmers_ahead_count=active_ahead,
        estimated_wait_mins=est_wait,
        status=booking.status.value if hasattr(booking.status, 'value') else str(booking.status),
        now_serving_token=now_serving_token,
        last_updated=datetime.utcnow()
    )


@router.get("/center/{center_id}")
def get_center_queue_list(center_id: int, db: Session = Depends(get_db)):
    """Returns all queued farmers for today at a center (used by Officer Dashboard)."""
    center = db.query(ProcurementCenter).filter(ProcurementCenter.id == center_id).first()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")

    today = date.today()
    bookings = db.query(SlotBooking).filter(
        SlotBooking.center_id == center_id,
        SlotBooking.booking_date >= today,
        SlotBooking.status != BookingStatusEnum.CANCELLED
    ).order_by(SlotBooking.token_number.asc()).all()

    queue_list = []
    for b in bookings:
        f = db.query(Farmer).filter(Farmer.id == b.farmer_id).first()
        queue_list.append({
            "booking_id": b.id,
            "booking_reference": b.booking_reference,
            "token_number": b.token_number,
            "farmer_name": f.name if f else "Unknown",
            "phone_number": f.phone_number if f else "N/A",
            "village": f.village if f else "N/A",
            "crop_type": b.crop_type,
            "quantity_quintals": b.quantity_quintals,
            "time_window": b.time_window,
            "status": b.status.value if hasattr(b.status, 'value') else str(b.status),
            "created_at": b.created_at.isoformat()
        })

    return {
        "center_id": center.id,
        "center_name": center.name,
        "traffic_status": center.traffic_status.value if hasattr(center.traffic_status, 'value') else str(center.traffic_status),
        "active_queue_count": center.current_queue_count,
        "daily_capacity_quintals": center.daily_capacity_quintals,
        "bookings": queue_list
    }


@router.post("/officer/mark-done", response_model=OfficerActionResponse)
async def officer_mark_done(action: OfficerActionSchema, db: Session = Depends(get_db)):
    """
    Procurement officer completes farmer processing.
    1. Sets booking status to COMPLETED
    2. Auto-generates Payment record (MSP * quantity)
    3. Decrements active queue count
    4. Triggers WebSocket broadcast to all connected farmers
    """
    booking = db.query(SlotBooking).filter(SlotBooking.id == action.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    center = db.query(ProcurementCenter).filter(ProcurementCenter.id == action.center_id).first()
    farmer = db.query(Farmer).filter(Farmer.id == booking.farmer_id).first()

    booking.status = BookingStatusEnum.COMPLETED
    booking.completed_time = datetime.utcnow()
    booking.remarks = f"Inspected by Officer {action.officer_badge_id}. Moisture: {action.moisture_percentage}%, Quality: {action.quality_grade}"

    actual_qty = action.actual_quantity_quintals or booking.quantity_quintals
    msp_rate = MSP_RATES.get(booking.crop_type, 2275.0)
    gross_amount = round(actual_qty * msp_rate, 2)
    deductions = 0.0
    if action.moisture_percentage and action.moisture_percentage > 12.0:
        deductions = round(gross_amount * 0.015, 2)  # 1.5% dockage for higher moisture
    net_payable = round(gross_amount - deductions, 2)

    # Check or create payment record
    payment = db.query(Payment).filter(Payment.booking_id == booking.id).first()
    if not payment:
        pay_ref = f"PAY-{date.today().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
        utr = f"RBI{datetime.utcnow().strftime('%Y%m%d%H%M')}{random.randint(10, 99)}"
        payment = Payment(
            payment_reference=pay_ref,
            booking_id=booking.id,
            farmer_id=booking.farmer_id,
            crop_type=booking.crop_type,
            quantity_quintals=actual_qty,
            msp_rate_per_quintal=msp_rate,
            gross_amount=gross_amount,
            deductions=deductions,
            net_payable=net_payable,
            status=PaymentStatusEnum.DISBURSED,  # Prototype demonstrates immediate DBT authorization
            payment_mode=PaymentModeEnum.DBT_AADHAAR,
            bank_account_last4="9412",
            ifsc_code="SBIN0001234",
            utr_number=utr,
            disbursed_at=datetime.utcnow()
        )
        db.add(payment)

    # Decrement active queue count at center
    if center and center.current_queue_count > 0:
        center.current_queue_count -= 1
        if center.current_queue_count < 10:
            center.traffic_status = TrafficStatusEnum.LOW
        elif center.current_queue_count <= 25:
            center.traffic_status = TrafficStatusEnum.MODERATE
        else:
            center.traffic_status = TrafficStatusEnum.HIGH

    # Identify the next farmer to call
    next_booking = db.query(SlotBooking).filter(
        SlotBooking.center_id == action.center_id,
        SlotBooking.status == BookingStatusEnum.CONFIRMED,
        SlotBooking.token_number > booking.token_number
    ).order_by(SlotBooking.token_number.asc()).first()

    next_token = None
    if next_booking:
        next_booking.status = BookingStatusEnum.PROCESSING
        next_token = next_booking.token_number
        next_farmer = db.query(Farmer).filter(Farmer.id == next_booking.farmer_id).first()
        if next_farmer and center:
            # Send Shravan Turn Alert SMS to next farmer
            ShravanSMSService.send_turn_alert(
                farmer_name=next_farmer.name,
                phone_number=next_farmer.phone_number,
                center_name=center.name,
                token_number=next_token
            )

    db.commit()

    # Instantaneous Real-time WebSocket Broadcast
    if center:
        await ws_manager.broadcast_queue_update(
            center_id=center.id,
            now_serving_token=next_token or booking.token_number + 1,
            total_waiting=center.current_queue_count,
            traffic_status=center.traffic_status.value if hasattr(center.traffic_status, 'value') else str(center.traffic_status),
            avg_wait_time_mins=max(5, center.current_queue_count * 12)
        )

    return OfficerActionResponse(
        status="SUCCESS",
        completed_booking_id=booking.id,
        next_token=next_token,
        active_queue_length=center.current_queue_count if center else 0,
        payment_generated=True,
        payment_reference=payment.payment_reference,
        websocket_broadcast_sent=True
    )


@router.post("/officer/call-next/{center_id}")
async def officer_call_next(center_id: int, db: Session = Depends(get_db)):
    """Procurement officer calls the next farmer in line without marking done."""
    center = db.query(ProcurementCenter).filter(ProcurementCenter.id == center_id).first()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")

    next_booking = db.query(SlotBooking).filter(
        SlotBooking.center_id == center_id,
        SlotBooking.status == BookingStatusEnum.CONFIRMED
    ).order_by(SlotBooking.token_number.asc()).first()

    if not next_booking:
        return {"message": "No waiting farmers in queue", "next_token": None}

    next_booking.status = BookingStatusEnum.PROCESSING
    db.commit()

    farmer = db.query(Farmer).filter(Farmer.id == next_booking.farmer_id).first()
    if farmer:
        ShravanSMSService.send_turn_alert(
            farmer_name=farmer.name,
            phone_number=farmer.phone_number,
            center_name=center.name,
            token_number=next_booking.token_number
        )

    await ws_manager.broadcast_queue_update(
        center_id=center.id,
        now_serving_token=next_booking.token_number,
        total_waiting=center.current_queue_count,
        traffic_status=center.traffic_status.value if hasattr(center.traffic_status, 'value') else str(center.traffic_status),
        avg_wait_time_mins=max(5, center.current_queue_count * 12)
    )

    return {
        "status": "CALLED_NEXT",
        "next_token": next_booking.token_number,
        "farmer_name": farmer.name if farmer else "N/A"
    }
