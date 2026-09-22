"""
Kisan Setu - Procurement Centers & AI Recommendations Router
============================================================
Handles Mandi discovery, live traffic metrics, and AI intelligent suggestions.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.database import get_db
from backend.schemas import CenterResponseSchema, CenterRecommendationResponse
from backend.services.ml_service import MLService
from schema import ProcurementCenter

router = APIRouter(prefix="/centers", tags=["Procurement Centers"])


@router.get("", response_model=List[CenterResponseSchema])
@router.get("/", response_model=List[CenterResponseSchema])
def list_centers(
    district: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Returns list of procurement centers with live traffic status and estimated wait."""
    query = db.query(ProcurementCenter).filter(ProcurementCenter.is_active == True)
    if district:
        query = query.filter(ProcurementCenter.district.ilike(f"%{district}%"))
    centers = query.all()

    results = []
    for c in centers:
        est_wait = MLService.predict_wait_mins(
            current_queue_length=c.current_queue_count,
            avg_processing_mins=c.avg_processing_time_mins,
            capacity_utilization=min(1.5, (c.current_queue_count * 50.0) / max(1.0, c.daily_capacity_quintals)),
            quantity_quintals=50.0
        )
        results.append(CenterResponseSchema(
            id=c.id,
            code=c.code,
            name=c.name,
            district=c.district,
            state=c.state,
            address=c.address,
            latitude=c.latitude,
            longitude=c.longitude,
            distance_km=c.distance_km_ref,
            daily_capacity_quintals=c.daily_capacity_quintals,
            operating_hours=c.operating_hours,
            current_queue_count=c.current_queue_count,
            avg_processing_time_mins=c.avg_processing_time_mins,
            estimated_wait_mins=est_wait,
            traffic_status=c.traffic_status.value if hasattr(c.traffic_status, 'value') else str(c.traffic_status),
            is_active=c.is_active
        ))
    return results


@router.get("/recommendations", response_model=CenterRecommendationResponse)
def get_recommendations(
    farmer_id: Optional[int] = 1,
    lat: Optional[float] = 29.6857,
    lng: Optional[float] = 76.9905,
    crop_type: Optional[str] = "Wheat",
    quantity_quintals: Optional[float] = 50.0,
    db: Session = Depends(get_db)
):
    """
    AI Suggestion Engine: Ranks procurement centers considering distance,
    predicted wait time, and capacity bottlenecks.
    """
    centers = db.query(ProcurementCenter).filter(ProcurementCenter.is_active == True).all()
    if not centers:
        raise HTTPException(status_code=404, detail="No active procurement centers found")

    centers_data = []
    for c in centers:
        centers_data.append({
            "id": c.id,
            "code": c.code,
            "name": c.name,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "distance_km_ref": c.distance_km_ref,
            "current_queue_count": c.current_queue_count,
            "avg_processing_time_mins": c.avg_processing_time_mins,
            "daily_capacity_quintals": c.daily_capacity_quintals,
            "operating_hours": c.operating_hours
        })

    farmer_coords = {"lat": lat, "lng": lng} if (lat and lng) else {}
    rec_result = MLService.get_center_recommendations(
        farmer_coords=farmer_coords,
        centers=centers_data,
        quantity_quintals=quantity_quintals or 50.0
    )

    # Decorate with recommended time windows & tags
    formatted_recommendations = []
    for i, item in enumerate(rec_result["recommended_centers"]):
        tag = "AI_RECOMMENDED" if i == 0 else ("FAST_TRACK" if item["traffic_status"] == "LOW" else "STANDARD")
        time_slot = "09:00 AM - 11:00 AM" if i == 0 else "11:30 AM - 01:30 PM"
        formatted_recommendations.append({
            **item,
            "recommended_time_window": time_slot,
            "tag": tag
        })

    return CenterRecommendationResponse(
        best_center_id=rec_result["best_center_id"],
        ai_reasoning=rec_result["ai_reasoning"],
        recommended_centers=formatted_recommendations
    )


@router.get("/{center_id}", response_model=CenterResponseSchema)
def get_center(center_id: int, db: Session = Depends(get_db)):
    center = db.query(ProcurementCenter).filter(ProcurementCenter.id == center_id).first()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")
    est_wait = MLService.predict_wait_mins(
        current_queue_length=center.current_queue_count,
        avg_processing_mins=center.avg_processing_time_mins
    )
    return CenterResponseSchema(
        id=center.id,
        code=center.code,
        name=center.name,
        district=center.district,
        state=center.state,
        address=center.address,
        latitude=center.latitude,
        longitude=center.longitude,
        distance_km=center.distance_km_ref,
        daily_capacity_quintals=center.daily_capacity_quintals,
        operating_hours=center.operating_hours,
        current_queue_count=center.current_queue_count,
        avg_processing_time_mins=center.avg_processing_time_mins,
        estimated_wait_mins=est_wait,
        traffic_status=center.traffic_status.value if hasattr(center.traffic_status, 'value') else str(center.traffic_status),
        is_active=center.is_active
    )
