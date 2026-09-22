"""
Kisan Setu - Database Architecture (SQLAlchemy ORM Models)
==========================================================
Defines relational models for Farmers, Procurement Centers, Slot Bookings, and Payments.
Compatible with PostgreSQL (production) and SQLite (hackathon/local dev).
"""

from datetime import datetime
import enum
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    Date,
    Boolean,
    ForeignKey,
    Enum,
    Text,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class TrafficStatusEnum(str, enum.Enum):
    LOW = "LOW"            # Green (< 10 farmers in queue, < 30m wait)
    MODERATE = "MODERATE"  # Amber (10-25 farmers, 30m-60m wait)
    HIGH = "HIGH"          # Red (> 25 farmers, > 60m wait)


class BookingStatusEnum(str, enum.Enum):
    CONFIRMED = "CONFIRMED"
    IN_QUEUE = "IN_QUEUE"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class PaymentStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    DISBURSED = "DISBURSED"
    FAILED = "FAILED"


class PaymentModeEnum(str, enum.Enum):
    DBT_AADHAAR = "DBT_AADHAAR"
    NEFT_RTGS = "NEFT_RTGS"
    DIRECT_BANK = "DIRECT_BANK"


class Farmer(Base):
    __tablename__ = "farmers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(120), nullable=False)
    phone_number = Column(String(15), unique=True, index=True, nullable=False)
    aadhaar_hash = Column(String(64), nullable=True)  # Masked/Hashed identifier (e.g., "XXXX-XXXX-4819")
    state = Column(String(60), nullable=False, default="Haryana")
    district = Column(String(60), nullable=False, default="Karnal")
    village = Column(String(100), nullable=True)
    crop_type = Column(String(50), nullable=False, default="Wheat")
    default_quantity_quintals = Column(Float, nullable=False, default=50.0)
    preferred_language = Column(String(10), default="hi")  # hi, pa, te, mr, en
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    bookings = relationship("SlotBooking", back_populates="farmer", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="farmer", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Farmer(id={self.id}, name='{self.name}', phone='{self.phone_number}')>"


class ProcurementCenter(Base):
    __tablename__ = "procurement_centers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    code = Column(String(20), unique=True, index=True, nullable=False)  # e.g. "KRN-APMC-01"
    name = Column(String(150), nullable=False)
    district = Column(String(60), nullable=False)
    state = Column(String(60), nullable=False)
    address = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    distance_km_ref = Column(Float, default=12.5)  # Baseline reference distance for mock
    daily_capacity_quintals = Column(Float, nullable=False, default=1000.0)
    operating_hours = Column(String(50), default="08:00 AM - 06:00 PM")
    current_queue_count = Column(Integer, default=0)
    avg_processing_time_mins = Column(Float, default=15.0)  # minutes per farmer
    traffic_status = Column(Enum(TrafficStatusEnum), default=TrafficStatusEnum.LOW, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    bookings = relationship("SlotBooking", back_populates="center")

    def __repr__(self):
        return f"<ProcurementCenter(id={self.id}, code='{self.code}', name='{self.name}', traffic={self.traffic_status})>"


class SlotBooking(Base):
    __tablename__ = "slot_bookings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    booking_reference = Column(String(32), unique=True, index=True, nullable=False)  # e.g. "KS-2026-0922-8491"
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=False)
    center_id = Column(Integer, ForeignKey("procurement_centers.id"), nullable=False)
    booking_date = Column(Date, nullable=False)
    time_window = Column(String(30), nullable=False)  # e.g. "09:00 AM - 11:00 AM"
    crop_type = Column(String(50), nullable=False)
    quantity_quintals = Column(Float, nullable=False)
    token_number = Column(Integer, nullable=False)
    queue_position = Column(Integer, default=1)
    estimated_wait_mins = Column(Integer, default=15)
    status = Column(Enum(BookingStatusEnum), default=BookingStatusEnum.CONFIRMED, nullable=False)
    check_in_time = Column(DateTime, nullable=True)
    completed_time = Column(DateTime, nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    farmer = relationship("Farmer", back_populates="bookings")
    center = relationship("ProcurementCenter", back_populates="bookings")
    payment = relationship("Payment", back_populates="booking", uselist=False)

    def __repr__(self):
        return f"<SlotBooking(ref='{self.booking_reference}', farmer_id={self.farmer_id}, center_id={self.center_id}, status={self.status})>"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    payment_reference = Column(String(32), unique=True, index=True, nullable=False)  # e.g. "PAY-2026-9921"
    booking_id = Column(Integer, ForeignKey("slot_bookings.id"), nullable=False, unique=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=False)
    crop_type = Column(String(50), nullable=False)
    quantity_quintals = Column(Float, nullable=False)
    msp_rate_per_quintal = Column(Float, nullable=False)  # e.g. 2275.0 (Government MSP)
    gross_amount = Column(Float, nullable=False)
    deductions = Column(Float, default=0.0)  # Moisture / quality dockage if any
    net_payable = Column(Float, nullable=False)
    status = Column(Enum(PaymentStatusEnum), default=PaymentStatusEnum.PENDING, nullable=False)
    payment_mode = Column(Enum(PaymentModeEnum), default=PaymentModeEnum.DBT_AADHAAR, nullable=False)
    bank_account_last4 = Column(String(4), default="9412")
    ifsc_code = Column(String(15), default="SBIN0001234")
    utr_number = Column(String(30), nullable=True)  # Bank transaction reference
    disbursed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    farmer = relationship("Farmer", back_populates="payments")
    booking = relationship("SlotBooking", back_populates="payment")

    def __repr__(self):
        return f"<Payment(ref='{self.payment_reference}', net={self.net_payable}, status={self.status})>"
