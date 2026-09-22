import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  Calendar, 
  Clock, 
  Wheat, 
  Scale, 
  CheckCircle2, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export default function SlotBookingModal({ 
  center, 
  farmer, 
  onClose, 
  onBookingSuccess 
}) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  const [bookingDate, setBookingDate] = useState(defaultDate);
  const [timeWindow, setTimeWindow] = useState('10:00 AM - 12:00 PM');
  const [cropType, setCropType] = useState(farmer?.crop_type || 'Wheat');
  const [quantity, setQuantity] = useState(farmer?.default_quantity_quintals || 65);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const timeSlots = [
    { slot: '08:00 AM - 10:00 AM', tag: 'Fast Track' },
    { slot: '10:00 AM - 12:00 PM', tag: 'AI Recommended', isOptimal: true },
    { slot: '12:00 PM - 02:00 PM', tag: 'Standard' },
    { slot: '02:00 PM - 04:00 PM', tag: 'Standard' },
    { slot: '04:00 PM - 06:00 PM', tag: 'Evening Slot' },
  ];

  const handleBook = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        farmer_id: farmer?.id || 1,
        center_id: center.id,
        booking_date: bookingDate,
        time_window: timeWindow,
        crop_type: cropType,
        quantity_quintals: parseFloat(quantity),
      };

      const result = await api.bookSlot(payload);
      setConfirmedBooking(result);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      if (onBookingSuccess) {
        onBookingSuccess(result);
      }
    } catch (err) {
      alert(`Booking error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '16px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        maxWidth: '560px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
          color: '#ffffff',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a7f3d0', fontWeight: 700 }}>
              SLOT RESERVATION (स्लॉट बुकिंग)
            </span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              {center.name}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#d1fae5' }}>
              {center.district}, {center.state} • Distance: {center.distance_km} km
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '24px' }}>
          {confirmedBooking ? (
            /* Confirmation Screen */
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle2 size={36} />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                Slot Confirmed Successfully!
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '20px' }}>
                आपका उपार्जन स्लॉट सुरक्षित कर लिया गया है।
              </p>

              {/* Token Ticket Card */}
              <div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '14px', padding: '18px', marginBottom: '20px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>BOOKING REFERENCE</span>
                    <strong style={{ display: 'block', fontSize: '0.95rem', color: '#0f172a' }}>{confirmedBooking.booking_reference}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>ISSUED TOKEN</span>
                    <span style={{ display: 'block', fontSize: '1.4rem', fontWeight: 900, color: '#15803d' }}>
                      #{confirmedBooking.token_number}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Date & Window:</span>
                    <p style={{ fontWeight: 600 }}>{confirmedBooking.booking_date} ({confirmedBooking.time_window})</p>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Crop & Quantity:</span>
                    <p style={{ fontWeight: 600 }}>{confirmedBooking.quantity_quintals} Qtl {confirmedBooking.crop_type}</p>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Queue Position:</span>
                    <p style={{ fontWeight: 600, color: '#0f172a' }}>#{confirmedBooking.queue_position} in line</p>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Est. Arrival Wait:</span>
                    <p style={{ fontWeight: 600, color: '#16a34a' }}>~{confirmedBooking.estimated_wait_mins} mins</p>
                  </div>
                </div>
              </div>

              {/* Shravan SMS Dispatch Notification Badge */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'flex-start', gap: '10px', textAlign: 'left', marginBottom: '20px' }}>
                <MessageSquare size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.78rem', color: '#166534' }}>
                  <strong>Automated Shravan SMS Dispatched:</strong>
                  <p style={{ marginTop: '2px', color: '#15803d' }}>{confirmedBooking.sms_preview}</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="btn-primary"
                style={{ width: '100%', padding: '12px' }}
              >
                Go to Live Queue Tracker (लाइव कतार देखें)
              </button>
            </div>
          ) : (
            /* Booking Form */
            <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Date selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Select Procurement Date (तारीख चुनें)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '8px 12px' }}>
                  <Calendar size={18} color="#64748b" />
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    required
                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem', color: '#0f172a' }}
                  />
                </div>
              </div>

              {/* Time window selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Select Arrival Time Window (समय स्लॉट)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {timeSlots.map((ts) => (
                    <button
                      key={ts.slot}
                      type="button"
                      onClick={() => setTimeWindow(ts.slot)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: timeWindow === ts.slot ? '2px solid #16a34a' : '1px solid #e2e8f0',
                        background: timeWindow === ts.slot ? '#f0fdf4' : '#ffffff',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: timeWindow === ts.slot ? '#15803d' : '#334155' }}>
                          {ts.slot}
                        </span>
                        {ts.isOptimal && (
                          <Sparkles size={13} color="#16a34a" />
                        )}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: ts.isOptimal ? '#16a34a' : '#64748b', fontWeight: 600 }}>
                        {ts.tag}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Crop & Quantity */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Crop Type (फसल)
                  </label>
                  <select
                    value={cropType}
                    onChange={(e) => setCropType(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', color: '#0f172a' }}
                  >
                    <option value="Wheat">Wheat (गेहूं - MSP ₹2,275)</option>
                    <option value="Paddy">Paddy (धान - MSP ₹2,300)</option>
                    <option value="Mustard">Mustard (सरसों - MSP ₹5,650)</option>
                    <option value="Soybean">Soybean (सोयाबीन - MSP ₹4,892)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Quantity (क्विंटल)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', color: '#0f172a' }}
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{ flex: 2 }}
                >
                  {isSubmitting ? 'Reserving...' : 'Confirm & Generate Token'}
                </button>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
}
