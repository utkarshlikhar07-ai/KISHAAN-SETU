"""
Kisan Setu - Database Seeder Script
===================================
Populates realistic procurement centers (Mandis) across Indian agricultural belts,
traffic metrics, sample farmers, initial queue tokens, and MSP payment history.
"""

import sys
from pathlib import Path
from datetime import datetime, date, timedelta

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.database import SessionLocal, init_db
from schema import (
    Farmer,
    ProcurementCenter,
    SlotBooking,
    Payment,
    TrafficStatusEnum,
    BookingStatusEnum,
    PaymentStatusEnum,
    PaymentModeEnum,
)


def seed_database():
    init_db()
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(ProcurementCenter).count() > 0:
            print("[Seed] Database already has procurement centers. Skipping center seed.")
            return

        print("[Seed] Populating realistic Indian Mandi procurement centers...")
        centers = [
            ProcurementCenter(
                code="KRN-MND-01",
                name="Karnal New Grain Mandi",
                district="Karnal",
                state="Haryana",
                address="Sector 4, GT Karnal Road, Karnal",
                latitude=29.6857,
                longitude=76.9905,
                distance_km_ref=6.2,
                daily_capacity_quintals=1500.0,
                operating_hours="08:00 AM - 06:00 PM",
                current_queue_count=4,
                avg_processing_time_mins=12.0,
                traffic_status=TrafficStatusEnum.LOW,
                is_active=True
            ),
            ProcurementCenter(
                code="TAR-SUB-02",
                name="Taraori Sub-Procurement Yard",
                district="Karnal",
                state="Haryana",
                address="Near Railway Station, Taraori",
                latitude=29.8012,
                longitude=76.9241,
                distance_km_ref=14.8,
                daily_capacity_quintals=900.0,
                operating_hours="08:30 AM - 05:30 PM",
                current_queue_count=16,
                avg_processing_time_mins=14.0,
                traffic_status=TrafficStatusEnum.MODERATE,
                is_active=True
            ),
            ProcurementCenter(
                code="IND-APMC-03",
                name="Indore Choithram APMC Mandi",
                district="Indore",
                state="Madhya Pradesh",
                address="Choithram Mandi Complex, Ring Road, Indore",
                latitude=22.6821,
                longitude=75.8452,
                distance_km_ref=24.5,
                daily_capacity_quintals=2800.0,
                operating_hours="07:30 AM - 07:00 PM",
                current_queue_count=32,
                avg_processing_time_mins=16.0,
                traffic_status=TrafficStatusEnum.HIGH,
                is_active=True
            ),
            ProcurementCenter(
                code="KHN-MND-04",
                name="Khanna Grain Market (Asia's Largest)",
                district="Ludhiana",
                state="Punjab",
                address="GT Road Mandi Enclave, Khanna",
                latitude=30.7071,
                longitude=76.2167,
                distance_km_ref=18.0,
                daily_capacity_quintals=3500.0,
                operating_hours="07:00 AM - 06:30 PM",
                current_queue_count=6,
                avg_processing_time_mins=11.0,
                traffic_status=TrafficStatusEnum.LOW,
                is_active=True
            ),
            ProcurementCenter(
                code="GNT-APMC-05",
                name="Guntur Agricultural Market Yard",
                district="Guntur",
                state="Andhra Pradesh",
                address="Kottapet, Main Market Road, Guntur",
                latitude=16.3067,
                longitude=80.4365,
                distance_km_ref=22.0,
                daily_capacity_quintals=2100.0,
                operating_hours="08:00 AM - 06:00 PM",
                current_queue_count=19,
                avg_processing_time_mins=15.0,
                traffic_status=TrafficStatusEnum.MODERATE,
                is_active=True
            ),
            ProcurementCenter(
                code="NSK-APMC-06",
                name="Nashik Lasalgaon APMC",
                district="Nashik",
                state="Maharashtra",
                address="Lasalgaon Sub-Division, Niphad, Nashik",
                latitude=20.1472,
                longitude=74.2256,
                distance_km_ref=12.0,
                daily_capacity_quintals=1800.0,
                operating_hours="08:00 AM - 06:00 PM",
                current_queue_count=8,
                avg_processing_time_mins=13.0,
                traffic_status=TrafficStatusEnum.LOW,
                is_active=True
            )
        ]
        db.add_all(centers)
        db.commit()

        # Seed Primary Demonstration Farmer
        farmer = Farmer(
            name="Sardar Baldev Singh",
            phone_number="9876543210",
            aadhaar_hash="XXXX-XXXX-7612",
            state="Punjab",
            district="Ludhiana",
            village="Jagraon",
            crop_type="Wheat",
            default_quantity_quintals=85.0,
            preferred_language="hi"
        )
        db.add(farmer)
        db.commit()
        db.refresh(farmer)

        # Seed queued farmers ahead of our demo farmer at Karnal Mandi
        center1 = db.query(ProcurementCenter).filter(ProcurementCenter.code == "KRN-MND-01").first()
        today = date.today()

        ahead_farmers = [
            Farmer(name="Rameshwar Kumar", phone_number="9811122233", district="Karnal", crop_type="Wheat", default_quantity_quintals=60.0),
            Farmer(name="Smt. Shakuntala Devi", phone_number="9822233344", district="Karnal", crop_type="Wheat", default_quantity_quintals=45.0),
            Farmer(name="Mohammad Altaf", phone_number="9833344455", district="Karnal", crop_type="Wheat", default_quantity_quintals=70.0),
        ]
        db.add_all(ahead_farmers)
        db.commit()
        for f in ahead_farmers:
            db.refresh(f)

        # Bookings ahead
        b1 = SlotBooking(
            booking_reference="KS-2026-TODAY-0011",
            farmer_id=ahead_farmers[0].id,
            center_id=center1.id,
            booking_date=today,
            time_window="09:00 AM - 11:00 AM",
            crop_type="Wheat",
            quantity_quintals=60.0,
            token_number=11,
            queue_position=1,
            estimated_wait_mins=10,
            status=BookingStatusEnum.PROCESSING
        )
        b2 = SlotBooking(
            booking_reference="KS-2026-TODAY-0012",
            farmer_id=ahead_farmers[1].id,
            center_id=center1.id,
            booking_date=today,
            time_window="09:00 AM - 11:00 AM",
            crop_type="Wheat",
            quantity_quintals=45.0,
            token_number=12,
            queue_position=2,
            estimated_wait_mins=22,
            status=BookingStatusEnum.CONFIRMED
        )
        b3 = SlotBooking(
            booking_reference="KS-2026-TODAY-0013",
            farmer_id=ahead_farmers[2].id,
            center_id=center1.id,
            booking_date=today,
            time_window="09:00 AM - 11:00 AM",
            crop_type="Wheat",
            quantity_quintals=70.0,
            token_number=13,
            queue_position=3,
            estimated_wait_mins=34,
            status=BookingStatusEnum.CONFIRMED
        )

        # Demo Farmer's Active Booking (Token #14, position 4)
        demo_booking = SlotBooking(
            booking_reference="KS-2026-TODAY-0014",
            farmer_id=farmer.id,
            center_id=center1.id,
            booking_date=today,
            time_window="10:00 AM - 12:00 PM",
            crop_type="Wheat",
            quantity_quintals=85.0,
            token_number=14,
            queue_position=4,
            estimated_wait_mins=46,
            status=BookingStatusEnum.CONFIRMED
        )

        db.add_all([b1, b2, b3, demo_booking])
        db.commit()

        # Seed Completed Historical Payment for Demo Farmer
        prev_booking = SlotBooking(
            booking_reference="KS-2026-PREV-9921",
            farmer_id=farmer.id,
            center_id=center1.id,
            booking_date=today - timedelta(days=7),
            time_window="11:00 AM - 01:00 PM",
            crop_type="Wheat",
            quantity_quintals=84.8,
            token_number=42,
            queue_position=0,
            estimated_wait_mins=0,
            status=BookingStatusEnum.COMPLETED,
            completed_time=datetime.utcnow() - timedelta(days=7)
        )
        db.add(prev_booking)
        db.commit()
        db.refresh(prev_booking)

        payment = Payment(
            payment_reference="PAY-2026-0915-9921",
            booking_id=prev_booking.id,
            farmer_id=farmer.id,
            crop_type="Wheat",
            quantity_quintals=84.8,
            msp_rate_per_quintal=2275.0,
            gross_amount=192920.0,
            deductions=0.0,
            net_payable=192920.0,
            status=PaymentStatusEnum.DISBURSED,
            payment_mode=PaymentModeEnum.DBT_AADHAAR,
            bank_account_last4="9412",
            ifsc_code="SBIN0001234",
            utr_number="RBI2026091589410382",
            disbursed_at=datetime.utcnow() - timedelta(days=6)
        )
        db.add(payment)
        db.commit()

        print("[Seed] Successfully initialized database with 6 mandis, 4 farmers, active queue, and DBT payment!")

    except Exception as e:
        db.rollback()
        print(f"[Seed Error] {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
