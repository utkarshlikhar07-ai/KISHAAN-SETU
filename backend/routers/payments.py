"""
Kisan Setu - Payments & MSP Tracking Router
===========================================
Tracks government MSP payments, Direct Benefit Transfer (DBT) verification,
and bank disbursement UTR references for farmers.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend.database import get_db
from backend.schemas import PaymentResponseSchema
from schema import Payment

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("/farmer/{farmer_id}", response_model=List[PaymentResponseSchema])
def get_farmer_payments(farmer_id: int, db: Session = Depends(get_db)):
    """Returns all MSP disbursement records for a farmer."""
    payments = db.query(Payment).filter(Payment.farmer_id == farmer_id).order_by(Payment.id.desc()).all()
    results = []
    for p in payments:
        results.append(PaymentResponseSchema(
            id=p.id,
            payment_reference=p.payment_reference,
            booking_id=p.booking_id,
            farmer_id=p.farmer_id,
            crop_type=p.crop_type,
            quantity_quintals=p.quantity_quintals,
            msp_rate_per_quintal=p.msp_rate_per_quintal,
            gross_amount=p.gross_amount,
            deductions=p.deductions,
            net_payable=p.net_payable,
            status=p.status.value if hasattr(p.status, 'value') else str(p.status),
            payment_mode=p.payment_mode.value if hasattr(p.payment_mode, 'value') else str(p.payment_mode),
            bank_account_last4=p.bank_account_last4,
            ifsc_code=p.ifsc_code,
            utr_number=p.utr_number,
            disbursed_at=p.disbursed_at,
            created_at=p.created_at
        ))
    return results


@router.get("/{payment_id}", response_model=PaymentResponseSchema)
def get_payment_detail(payment_id: int, db: Session = Depends(get_db)):
    """Retrieves a single payment record by ID."""
    p = db.query(Payment).filter(Payment.id == payment_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Payment record not found")
    return PaymentResponseSchema(
        id=p.id,
        payment_reference=p.payment_reference,
        booking_id=p.booking_id,
        farmer_id=p.farmer_id,
        crop_type=p.crop_type,
        quantity_quintals=p.quantity_quintals,
        msp_rate_per_quintal=p.msp_rate_per_quintal,
        gross_amount=p.gross_amount,
        deductions=p.deductions,
        net_payable=p.net_payable,
        status=p.status.value if hasattr(p.status, 'value') else str(p.status),
        payment_mode=p.payment_mode.value if hasattr(p.payment_mode, 'value') else str(p.payment_mode),
        bank_account_last4=p.bank_account_last4,
        ifsc_code=p.ifsc_code,
        utr_number=p.utr_number,
        disbursed_at=p.disbursed_at,
        created_at=p.created_at
    )
