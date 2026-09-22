"""
Kisan Setu - Slot Booking Router
================================
Handles procurement slot reservations, reschedule, cancellation, and automated Shravan SMS dispatch.
"""

from datetime import datetime, date
import random
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.database import get_db
from backend.schemas import (
    SlotBookingCreateSchema,
    SlotBookingResponseSchema,
    SlotBookingRebookSchema,
)
from backend.services.shravan_sms import ShravanSMSService
from backend.services.ml_service import MLService
from backend.services.websocket_hub import ws_manager
from schema import SlotBooking, Farmer, ProcurementCenter, BookingStatusEnum, TrafficStatusEnum

router = APIRouter(prefix="/slots", tags=["Slot Booking"])


@router.post("/book", response_model=SlotBookingResponseSchema, status_code=status.HTTP_201_CREATED)
async def book_slot(booking_in: SlotBookingCreateSchema, db: Session = Depends(get_db)):
    """Reserves a slot at a procurement center and issues token with automated SMS notification."""
    farmer = db.query(Farmer).filter(Farmer.id == booking_in.farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    center = db.query(ProcurementCenter).filter(ProcurementCenter.id == booking_in.center_id).first()
    if not center:
        raise HTTPException(status_code=404, detail="Procurement center not found")

    # Generate sequential or unique token
    existing_today = db.query(SlotBooking).filter(
        SlotBooking.center_id == center.id,
        SlotBooking.booking_date == booking_in.booking_date
    ).count()

    token_number = existing_today + 1
    queue_pos = center.current_queue_count + 1

    est_wait = MLService.predict_wait_mins(
        current_queue_length=queue_pos,
        avg_processing_mins=center.avg_processing_time_mins,
        quantity_quintals=booking_in.quantity_quintals
    )

    ref_id = f"KS-{date.today().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"

    new_booking = SlotBooking(
        booking_reference=ref_id,
        farmer_id=farmer.id,
        center_id=center.id,
        booking_date=booking_in.booking_date,
        time_window=booking_in.time_window,
        crop_type=booking_in.crop_type,
        quantity_quintals=booking_in.quantity_quintals,
        token_number=token_number,
        queue_position=queue_pos,
        estimated_wait_mins=est_wait,
        status=BookingStatusEnum.CONFIRMED
    )

    # Increment center active queue count and adjust traffic status badge
    center.current_queue_count += 1
    if center.current_queue_count < 10:
        center.traffic_status = TrafficStatusEnum.LOW
    elif center.current_queue_count <= 25:
        center.traffic_status = TrafficStatusEnum.MODERATE
    else:
        center.traffic_status = TrafficStatusEnum.HIGH

    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)

    # Dispatch Automated SMS via Shravan API
    sms_res = ShravanSMSService.send_slot_confirmation(
        farmer_name=farmer.name,
        phone_number=farmer.phone_number,
        center_name=center.name,
        booking_date=str(booking_in.booking_date),
        time_window=booking_in.time_window,
        token_number=token_number,
        ref_id=ref_id
    )

    # Broadcast real-time update via WebSocket
    await ws_manager.broadcast_queue_update(
        center_id=center.id,
        now_serving_token=max(1, token_number - queue_pos + 1),
        total_waiting=center.current_queue_count,
        traffic_status=center.traffic_status.value,
        avg_wait_time_mins=est_wait
    )

    return SlotBookingResponseSchema(
        id=new_booking.id,
        booking_reference=new_booking.booking_reference,
        farmer_id=new_booking.farmer_id,
        center_id=new_booking.center_id,
        center_name=center.name,
        booking_date=new_booking.booking_date,
        time_window=new_booking.time_window,
        crop_type=new_booking.crop_type,
        quantity_quintals=new_booking.quantity_quintals,
        token_number=new_booking.token_number,
        queue_position=new_booking.queue_position,
        estimated_wait_mins=new_booking.estimated_wait_mins,
        status=new_booking.status.value,
        sms_delivery_status=sms_res["status"],
        sms_preview=sms_res["message"],
        created_at=new_booking.created_at
    )


@router.post("/{booking_id}/cancel")
async def cancel_slot(booking_id: int, db: Session = Depends(get_db)):
    """Cancels an existing slot reservation and alerts farmer via SMS."""
    booking = db.query(SlotBooking).filter(SlotBooking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status == BookingStatusEnum.CANCELLED:
        return {"message": "Booking is already cancelled", "status": "CANCELLED"}

    booking.status = BookingStatusEnum.CANCELLED
    center = db.query(ProcurementCenter).filter(ProcurementCenter.id == booking.center_id).first()
    if center and center.current_queue_count > 0:
        center.current_queue_count -= 1

    farmer = db.query(Farmer).filter(Farmer.id == booking.farmer_id).first()
    if farmer and center:
        ShravanSMSService.send_cancellation(
            farmer_name=farmer.name,
            phone_number=farmer.phone_number,
            center_name=center.name,
            ref_id=booking.booking_reference
        )

    db.commit()

    if center:
        await ws_manager.broadcast_queue_update(
            center_id=center.id,
            now_serving_token=1,
            total_waiting=center.current_queue_count,
            traffic_status=center.traffic_status.value,
            avg_wait_time_mins=max(5, center.current_queue_count * 12)
        )

    return {"message": "Booking cancelled successfully", "status": "CANCELLED"}


@router.post("/{booking_id}/rebook", response_model=SlotBookingResponseSchema)
async def rebook_slot(booking_id: int, rebook_in: SlotBookingRebookSchema, db: Session = Depends(get_db)):
    """Reschedules date or time window for an existing booking."""
    booking = db.query(SlotBooking).filter(SlotBooking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking.booking_date = rebook_in.booking_date
    booking.time_window = rebook_in.time_window
    booking.status = BookingStatusEnum.CONFIRMED
    booking.updated_at = datetime.utcnow()

    center = db.query(ProcurementCenter).filter(ProcurementCenter.id == booking.center_id).first()
    farmer = db.query(Farmer).filter(Farmer.id == booking.farmer_id).first()

    db.commit()
    db.refresh(booking)

    if farmer and center:
        ShravanSMSService.send_slot_confirmation(
            farmer_name=farmer.name,
            phone_number=farmer.phone_number,
            center_name=center.name,
            booking_date=str(booking.booking_date),
            time_window=booking.time_window,
            token_number=booking.token_number,
            ref_id=booking.booking_reference
        )

    return SlotBookingResponseSchema(
        id=booking.id,
        booking_reference=booking.booking_reference,
        farmer_id=booking.farmer_id,
        center_id=booking.center_id,
        center_name=center.name if center else "Procurement Center",
        booking_date=booking.booking_date,
        time_window=booking.time_window,
        crop_type=booking.crop_type,
        quantity_quintals=booking.quantity_quintals,
        token_number=booking.token_number,
        queue_position=booking.queue_position,
        estimated_wait_mins=booking.estimated_wait_mins,
        status=booking.status.value,
        sms_delivery_status="RESCHEDULED_NOTIFIED",
        sms_preview=f"Slot rescheduled to {booking.booking_date} ({booking.time_window})",
        created_at=booking.created_at
    )


@router.get("/farmer/{farmer_id}", response_model=List[SlotBookingResponseSchema])
def list_farmer_bookings(farmer_id: int, db: Session = Depends(get_db)):
    """Returns all slot bookings for a farmer."""
    bookings = db.query(SlotBooking).filter(SlotBooking.farmer_id == farmer_id).order_by(SlotBooking.id.desc()).all()
    results = []
    for b in bookings:
        center = db.query(ProcurementCenter).filter(ProcurementCenter.id == b.center_id).first()
        results.append(SlotBookingResponseSchema(
            id=b.id,
            booking_reference=b.booking_reference,
            farmer_id=b.farmer_id,
            center_id=b.center_id,
            center_name=center.name if center else "Center",
            booking_date=b.booking_date,
            time_window=b.time_window,
            crop_type=b.crop_type,
            quantity_quintals=b.quantity_quintals,
            token_number=b.token_number,
            queue_position=b.queue_position,
            estimated_wait_mins=b.estimated_wait_mins,
            status=b.status.value if hasattr(b.status, 'value') else str(b.status),
            sms_delivery_status="DELIVERED",
            created_at=b.created_at
        ))
    return results
