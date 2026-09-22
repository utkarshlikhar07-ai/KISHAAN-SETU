import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Scale, 
  CheckCircle2, 
  PhoneCall, 
  Radio, 
  AlertTriangle, 
  Activity, 
  Flame, 
  BarChart2,
  RefreshCw,
  Clock
} from 'lucide-react';
import { api, createQueueSocket } from '../services/api';

export default function OfficerDashboard({ centers }) {
  const [selectedCenterId, setSelectedCenterId] = useState(1);
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeModalBooking, setActiveModalBooking] = useState(null);
  const [actualQty, setActualQty] = useState('');
  const [moisture, setMoisture] = useState('11.4');
  const [qualityGrade, setQualityGrade] = useState('FAQ_GRADE_A');
  const [submitting, setSubmitting] = useState(false);
  const [callingNext, setCallingNext] = useState(false);

  const fetchCenterData = async () => {
    try {
      const data = await api.getCenterQueue(selectedCenterId);
      setQueueData(data);
    } catch (err) {
      console.warn('Officer queue fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCenterData();

    // Real-time WebSocket connection
    const ws = createQueueSocket(selectedCenterId, (event) => {
      console.log('[Officer WS Event]', event);
      if (event.event === 'QUEUE_UPDATE') {
        fetchCenterData();
      }
    });

    const interval = setInterval(fetchCenterData, 8000);

    return () => {
      if (ws) ws.close();
      clearInterval(interval);
    };
  }, [selectedCenterId]);

  const handleCallNext = async () => {
    setCallingNext(true);
    try {
      const res = await api.officerCallNext(selectedCenterId);
      if (res.next_token) {
        alert(`Next farmer called: Token #${res.next_token} (${res.farmer_name}). Automated SMS alert dispatched!`);
      } else {
        alert("No waiting farmers currently in queue.");
      }
      fetchCenterData();
    } catch (err) {
      alert(`Error calling next farmer: ${err.message}`);
    } finally {
      setCallingNext(false);
    }
  };

  const handleOpenCertify = (booking) => {
    setActiveModalBooking(booking);
    setActualQty(booking.quantity_quintals.toString());
  };

  const handleMarkDoneSubmit = async (e) => {
    e.preventDefault();
    if (!activeModalBooking) return;
    setSubmitting(true);
    try {
      const payload = {
        center_id: selectedCenterId,
        booking_id: activeModalBooking.booking_id,
        officer_badge_id: 'OFF-HR-449',
        actual_quantity_quintals: parseFloat(actualQty),
        moisture_percentage: parseFloat(moisture),
        quality_grade: qualityGrade,
      };

      const res = await api.officerMarkDone(payload);
      alert(`Procurement Certified Successfully!\nPayment Generated: ${res.payment_reference}\nLive queue decremented and WebSocket broadcasted to waiting farmers.`);
      setActiveModalBooking(null);
      fetchCenterData();
    } catch (err) {
      alert(`Error marking done: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const currentCenter = centers.find(c => c.id === selectedCenterId) || centers[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Officer Header with Mandi Switcher */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        padding: '24px 28px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)' }}>
            <ShieldCheck size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                Mandi Officer Command Center (मंडी अधिकारी डैशबोर्ड)
              </h2>
              <span style={{ fontSize: '0.72rem', background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                BADGE: OFF-HR-449
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Weighbridge certification, moisture inspection, and live queue dispatch
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Active Mandi:</label>
          <select
            value={selectedCenterId}
            onChange={(e) => setSelectedCenterId(parseInt(e.target.value))}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.88rem',
              fontWeight: 600,
              color: '#0f172a',
              background: '#f8fafc',
              cursor: 'pointer'
            }}
          >
            {centers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.district})
              </option>
            ))}
          </select>

          <button
            onClick={fetchCenterData}
            style={{
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              padding: '10px',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
            title="Refresh Queue"
          >
            <RefreshCw size={16} color="#475569" />
          </button>
        </div>
      </div>

      {/* Center Traffic Monitoring Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>ACTIVE QUEUE LENGTH</span>
            <Users size={18} color="#2563eb" />
          </div>
          <strong style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a' }}>
            {queueData?.active_queue_count ?? currentCenter.current_queue_count} Vehicles
          </strong>
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
            Tractors & trolleys currently registered in yard
          </span>
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>TRAFFIC CONGESTION</span>
            <Activity size={18} color={currentCenter.traffic_status === 'HIGH' ? '#ef4444' : '#10b981'} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={currentCenter.traffic_status === 'HIGH' ? 'traffic-dot-high' : (currentCenter.traffic_status === 'MODERATE' ? 'traffic-dot-mod' : 'traffic-dot-low')} />
            <strong style={{ fontSize: '1.4rem', fontWeight: 800, color: currentCenter.traffic_status === 'HIGH' ? '#ef4444' : '#0f172a' }}>
              {currentCenter.traffic_status} CONGESTION
            </strong>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
            Average Turnaround: ~{currentCenter.estimated_wait_mins} mins
          </span>
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>DAILY CAPACITY HEADROOM</span>
            <BarChart2 size={18} color="#15803d" />
          </div>
          <strong style={{ fontSize: '1.8rem', fontWeight: 900, color: '#15803d' }}>
            {currentCenter.daily_capacity_quintals} Qtl
          </strong>
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
            Operating: {currentCenter.operating_hours}
          </span>
        </div>

      </div>

      {/* Regional Mandi Traffic Heatmap Panel */}
      <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              Regional Mandi Traffic Heatmap (क्षेत्रीय ट्रैफिक निगरानी)
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Live cross-mandi congestion comparison to prevent bottlenecking
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#15803d' }}><span className="traffic-dot-low" /> Low (&lt;10)</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#b45309' }}><span className="traffic-dot-mod" /> Moderate (10-25)</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#b91c1c' }}><span className="traffic-dot-high" /> Heavy (&gt;25)</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          {centers.map(c => {
            const isCurrent = c.id === selectedCenterId;
            const bg = c.traffic_status === 'LOW' ? '#f0fdf4' : (c.traffic_status === 'MODERATE' ? '#fffbeb' : '#fef2f2');
            const borderColor = c.traffic_status === 'LOW' ? '#bbf7d0' : (c.traffic_status === 'MODERATE' ? '#fde68a' : '#fecaca');
            const textColor = c.traffic_status === 'LOW' ? '#166534' : (c.traffic_status === 'MODERATE' ? '#92400e' : '#991b1b');

            return (
              <div
                key={c.id}
                onClick={() => setSelectedCenterId(c.id)}
                style={{
                  background: bg,
                  border: isCurrent ? `2px solid ${textColor}` : `1px solid ${borderColor}`,
                  borderRadius: '12px',
                  padding: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: textColor }}>{c.code}</span>
                  <span className={c.traffic_status === 'LOW' ? 'traffic-dot-low' : (c.traffic_status === 'MODERATE' ? 'traffic-dot-mod' : 'traffic-dot-high')} />
                </div>
                <strong style={{ fontSize: '0.85rem', color: '#0f172a', display: 'block', lineHeight: 1.2, marginBottom: '6px' }}>
                  {c.name}
                </strong>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Queue: <strong style={{ color: textColor }}>{c.current_queue_count}</strong> • ~{c.estimated_wait_mins}m
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Queue Management Table */}
      <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              Today's Arrival Queue (आज की कतार)
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Farmers queued for {currentCenter.name}
            </p>
          </div>

          {/* Call Next Button */}
          <button
            onClick={handleCallNext}
            disabled={callingNext}
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.88rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
            }}
          >
            <PhoneCall size={16} />
            {callingNext ? 'Calling...' : 'Call Next Farmer (अगले किसान को बुलाएं)'}
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '12px 14px' }}>Token</th>
                <th style={{ padding: '12px 14px' }}>Farmer Details</th>
                <th style={{ padding: '12px 14px' }}>Crop & Load</th>
                <th style={{ padding: '12px 14px' }}>Arrival Slot</th>
                <th style={{ padding: '12px 14px' }}>Status</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Officer Action</th>
              </tr>
            </thead>
            <tbody>
              {queueData?.bookings?.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                    No bookings recorded today at this center.
                  </td>
                </tr>
              ) : (
                queueData?.bookings?.map(b => (
                  <tr key={b.booking_id} style={{ borderBottom: '1px solid #f1f5f9', background: b.status === 'PROCESSING' ? '#fffbeb' : '#ffffff' }}>
                    <td style={{ padding: '14px', fontWeight: 800, fontSize: '1rem', color: '#15803d' }}>
                      #{b.token_number}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <strong style={{ color: '#0f172a', display: 'block' }}>{b.farmer_name}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>+91 {b.phone_number} • {b.village}</span>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span style={{ fontWeight: 600 }}>{b.quantity_quintals} Qtl</span> {b.crop_type}
                    </td>
                    <td style={{ padding: '14px', color: '#475569' }}>
                      {b.time_window}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: b.status === 'COMPLETED' ? '#ecfdf5' : (b.status === 'PROCESSING' ? '#fffbeb' : '#f1f5f9'),
                        color: b.status === 'COMPLETED' ? '#065f46' : (b.status === 'PROCESSING' ? '#92400e' : '#475569'),
                        border: `1px solid ${b.status === 'COMPLETED' ? '#a7f3d0' : (b.status === 'PROCESSING' ? '#fde68a' : '#cbd5e1')}`
                      }}>
                        {b.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      {b.status !== 'COMPLETED' ? (
                        <button
                          onClick={() => handleOpenCertify(b)}
                          style={{
                            background: '#15803d',
                            color: '#fff',
                            border: 'none',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <CheckCircle2 size={14} />
                          Certify & Weigh
                        </button>
                      ) : (
                        <span style={{ color: '#10b981', fontSize: '0.78rem', fontWeight: 600 }}>
                          ✓ Done & Disbursed
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Weighing & Moisture Certification Modal */}
      {activeModalBooking && (
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
          <div style={{ background: '#fff', borderRadius: '20px', maxWidth: '520px', width: '100%', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
              Weighbridge & Quality Certification
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '20px' }}>
              Farmer: <strong>{activeModalBooking.farmer_name}</strong> • Token: <strong>#{activeModalBooking.token_number}</strong>
            </p>

            <form onSubmit={handleMarkDoneSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Electronic Weighbridge Reading (Quintals)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0 12px' }}>
                  <Scale size={18} color="#15803d" style={{ marginRight: '8px' }} />
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={actualQty}
                    onChange={(e) => setActualQty(e.target.value)}
                    style={{ width: '100%', padding: '10px 0', border: 'none', outline: 'none', fontSize: '0.95rem', fontWeight: 700 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Moisture Reading (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={moisture}
                    onChange={(e) => setMoisture(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>FAQ limit &lt;= 12.0%</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Quality Grade
                  </label>
                  <select
                    value={qualityGrade}
                    onChange={(e) => setQualityGrade(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  >
                    <option value="FAQ_GRADE_A">FAQ Grade A (Standard)</option>
                    <option value="PREMIUM_EXPORT">Premium Grade</option>
                    <option value="GRADE_B">Grade B (Dockage)</option>
                  </select>
                </div>
              </div>

              <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '10px', border: '1px solid #bbf7d0', fontSize: '0.78rem', color: '#166534' }}>
                <strong>Automated Action:</strong> Clicking "Submit Certification" will auto-generate the PFMS DBT payment record and immediately decrement the queue position for all waiting farmers via WebSockets.
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setActiveModalBooking(null)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{ flex: 2 }}
                >
                  {submitting ? 'Certifying...' : 'Complete & Disburse Payment'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
