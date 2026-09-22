"""
Kisan Setu - Farmer Router
==========================
Handles farmer registration, profile fetch, and identity verification.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.database import get_db
from backend.schemas import FarmerCreateSchema, FarmerResponseSchema
from schema import Farmer

router = APIRouter(prefix="/farmers", tags=["Farmers"])


@router.post("/register", response_model=FarmerResponseSchema, status_code=status.HTTP_201_CREATED)
def register_farmer(farmer_in: FarmerCreateSchema, db: Session = Depends(get_db)):
    """Registers a new farmer or returns the existing profile if phone exists."""
    existing = db.query(Farmer).filter(Farmer.phone_number == farmer_in.phone_number).first()
    if existing:
        # Return existing profile to allow seamless demonstration
        return existing

    # Mask Aadhaar for privacy if provided
    masked_aadhaar = None
    if farmer_in.aadhaar_number and len(farmer_in.aadhaar_number) >= 4:
        masked_aadhaar = f"XXXX-XXXX-{farmer_in.aadhaar_number[-4:]}"

    new_farmer = Farmer(
        name=farmer_in.name,
        phone_number=farmer_in.phone_number,
        aadhaar_hash=masked_aadhaar,
        state=farmer_in.state,
        district=farmer_in.district,
        village=farmer_in.village,
        crop_type=farmer_in.crop_type,
        default_quantity_quintals=farmer_in.default_quantity_quintals,
        preferred_language=farmer_in.preferred_language,
    )
    db.add(new_farmer)
    db.commit()
    db.refresh(new_farmer)
    return new_farmer


@router.get("", response_model=List[FarmerResponseSchema])
@router.get("/", response_model=List[FarmerResponseSchema])
def list_farmers(db: Session = Depends(get_db)):
    """Lists all registered farmers."""
    return db.query(Farmer).all()


@router.get("/{farmer_id}", response_model=FarmerResponseSchema)
def get_farmer(farmer_id: int, db: Session = Depends(get_db)):
    """Retrieves a single farmer by ID."""
    farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    return farmer
