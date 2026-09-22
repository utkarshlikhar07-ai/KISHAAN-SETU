import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Clock, 
  Users, 
  Truck, 
  AlertCircle, 
  CheckCircle2, 
  MapPin, 
  RotateCcw, 
  XCircle,
  Volume2
} from 'lucide-react';
import { api, createQueueSocket } from '../services/api';

export default function LiveQueueTracker({ 
  booking, 
  farmer, 
  onSlotCancelled, 
  onOpenBooking 
}) {
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [turnAlert, setTurnAlert] = useState(null);

  const bookingId = booking?.id || 4; // Default to demo booking #4 if none selected

  const fetchStatus = async () => {
    try {
      const data = await api.getFarmerLiveQueue(bookingId);
      setQueueData(data);
      if (data.queue_position === 1 || data.status === 'PROCESSING') {
        setTurnAlert("आपकी बारी आ गई है! कृपया गेट #2 पर ट्रैक्टर ले आएं।");
      }
    } catch (err) {
      console.warn('Queue fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Setup Real-Time WebSocket
    const centerId = booking?.center_id || 1;
    const ws = createQueueSocket(
      centerId,
      (event) => {
        console.log('[LiveQueue WS Event]', event);
        if (event.event === 'QUEUE_UPDATE') {
          // Re-fetch queue position instantaneously when officer marks done
          fetchStatus();
        }
      },
      () => setWsConnected(false)
    );

    if (ws) setWsConnected(true);

    // Fallback polling every 6 seconds to ensure fresh data
    const interval = setInterval(fetchStatus, 6000);

    return () => {
      if (ws) ws.close();
      clearInterval(interval);
    };
  }, [bookingId]);

  const handleCancel = async () => {
    if (!window.confirm("क्या आप वाकई इस स्लॉट को रद्द करना चाहते हैं? (Confirm cancellation?)")) return;
    try {
      await api.cancelSlot(bookingId);
      alert("स्लॉट रद्द कर दिया गया है। (Slot cancelled successfully)");
      if (onSlotCancelled) onSlotCancelled();
    } catch (err) {
      alert(`Error cancelling slot: ${err.message}`);
    }
  };

  if (loading && !queueData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #16a34a', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '12px', color: '#64748b' }}>Connecting to live Mandi queue stream...</p>
      </div>
    );
  }

  const isCompleted = queueData?.status === 'COMPLETED';
  const isProcessing = queueData?.status === 'PROCESSING' || queueData?.queue_position === 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Real-Time WebSocket Connection Badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: wsConnected ? '#f0fdf4' : '#fef2f2',
        border: `1px solid ${wsConnected ? '#bbf7d0' : '#fecaca'}`,
        padding: '10px 18px',
        borderRadius: '12px',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={wsConnected ? 'traffic-dot-low' : 'traffic-dot-high'} />
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: wsConnected ? '#166534' : '#991b1b' }}>
            {wsConnected 
              ? 'Real-Time WebSocket Stream Active (लाइव तुलाई कांटा कनेक्टेड)' 
              : 'Polling Mandi Server (5s interval)'}
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
          Center: <strong>{queueData?.center_name || 'Karnal New Grain Mandi'}</strong>
        </span>
      </div>

      {/* Turn Alert Banner */}
      {turnAlert && !isCompleted && (
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          border: '2px solid #f59e0b',
          borderRadius: '14px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'bounce 1s infinite alternate'
        }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#d97706', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Volume2 size={22} />
          </div>
          <div>
            <strong style={{ fontSize: '1rem', color: '#92400e', display: 'block' }}>
              PROCEED TO WEIGHBRIDGE (तुलाई कांटे पर पहुंचें)!
            </strong>
            <p style={{ fontSize: '0.88rem', color: '#78350f' }}>{turnAlert}</p>
          </div>
        </div>
      )}

      {/* Live Hero Token Card */}
      <div style={{
        background: isCompleted 
          ? 'linear-gradient(135deg, #065f46 0%, #047857 100%)'
          : (isProcessing 
              ? 'linear-gradient(135deg, #b45309 0%, #d97706 100%)' 
              : 'linear-gradient(135deg, #15803d 0%, #166534 100%)'),
        color: '#ffffff',
        borderRadius: '24px',
        padding: '32px 28px',
        boxShadow: '0 15px 30px -8px rgba(21, 128, 61, 0.35)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Decorative Rings */}
        <div style={{ position: 'absolute', right: '-60px', bottom: '-60px', width: '260px', height: '260px', border: '25px solid rgba(255,255,255,0.06)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a7f3d0', fontWeight: 700 }}>
              OFFICIAL DIGITAL ENTRY TOKEN
            </span>
            <h2 style={{ fontSize: '2.6rem', fontWeight: 900, lineHeight: 1.1, color: '#ffffff' }}>
              TOKEN #{queueData?.token_number}
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#d1fae5', marginTop: '4px' }}>
              Ref: {queueData?.booking_reference} • {queueData?.crop_type} ({queueData?.quantity_quintals} Quintals)
            </p>
          </div>

          {/* Status Badge */}
          <div style={{
            background: 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(8px)',
            padding: '8px 18px',
            borderRadius: '30px',
            border: '1px solid rgba(255,255,255,0.25)',
            fontSize: '0.88rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {isCompleted ? (
              <><CheckCircle2 size={18} color="#a7f3d0" /> COMPLETED (संपन्न)</>
            ) : isProcessing ? (
              <><span className="traffic-dot-mod" /> NOW WEIGHING (तुलाई जारी)</>
            ) : (
              <><span className="traffic-dot-low" /> IN LIVE QUEUE (कतार में)</>
            )}
          </div>
        </div>

        {/* Dynamic Metric Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
          background: 'rgba(0, 0, 0, 0.2)',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.12)'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Users size={14} /> YOUR POSITION
            </span>
            <strong style={{ fontSize: '1.7rem', fontWeight: 800, color: '#fff' }}>
              {isCompleted ? 'Done' : `#${queueData?.queue_position}`}
            </strong>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Truck size={14} /> TRACTORS AHEAD
            </span>
            <strong style={{ fontSize: '1.7rem', fontWeight: 800, color: '#fff' }}>
              {isCompleted ? '0' : queueData?.farmers_ahead_count}
            </strong>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={14} /> EST. WAIT TIME
            </span>
            <strong style={{ fontSize: '1.7rem', fontWeight: 800, color: isProcessing ? '#fef08a' : '#fff' }}>
              {isCompleted ? '0m' : `~${queueData?.estimated_wait_mins} mins`}
            </strong>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Radio size={14} /> NOW SERVING
            </span>
            <strong style={{ fontSize: '1.7rem', fontWeight: 800, color: '#fef08a' }}>
              #{queueData?.now_serving_token || '1'}
            </strong>
          </div>
        </div>
      </div>

      {/* Procurement Process Steps Checklist */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
          Digital Mandi Gate Flow (उपार्जन प्रक्रिया)
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '14px', borderRadius: '12px', background: queueData?.queue_position > 1 ? '#f8fafc' : '#f0fdf4', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#16a34a', color: '#fff', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</div>
              <strong style={{ fontSize: '0.88rem' }}>Mandi Gate Entry</strong>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Show digital token #{queueData?.token_number} at Gate #2 scanner.</p>
          </div>

          <div style={{ padding: '14px', borderRadius: '12px', background: isProcessing ? '#fffbeb' : '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: isProcessing ? '#f59e0b' : '#94a3b8', color: '#fff', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</div>
              <strong style={{ fontSize: '0.88rem' }}>Moisture & Quality</strong>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Automatic digital moisture probe check (Max 12% standard).</p>
          </div>

          <div style={{ padding: '14px', borderRadius: '12px', background: isCompleted ? '#f0fdf4' : '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: isCompleted ? '#16a34a' : '#94a3b8', color: '#fff', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</div>
              <strong style={{ fontSize: '0.88rem' }}>Weighbridge & Unloading</strong>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Gross vs Tare automatic weight capture without middlemen.</p>
          </div>

          <div style={{ padding: '14px', borderRadius: '12px', background: isCompleted ? '#ecfdf5' : '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: isCompleted ? '#10b981' : '#94a3b8', color: '#fff', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>4</div>
              <strong style={{ fontSize: '0.88rem' }}>DBT Payment Transfer</strong>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Instant MSP payment direct to Aadhaar bank account.</p>
          </div>
        </div>

        {/* Slot Management Actions */}
        {!isCompleted && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
            <button
              onClick={handleCancel}
              style={{
                background: '#fff',
                color: '#ef4444',
                border: '1px solid #fca5a5',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <XCircle size={16} />
              Cancel Booking (स्लॉट रद्द करें)
            </button>
            <button
              onClick={fetchStatus}
              style={{
                background: '#f8fafc',
                color: '#334155',
                border: '1px solid #cbd5e1',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RotateCcw size={16} />
              Refresh Status
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
