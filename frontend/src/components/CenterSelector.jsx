import React, { useState } from 'react';
import { 
  Sparkles, 
  MapPin, 
  Clock, 
  TrendingUp, 
  Truck, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle,
  ChevronRight,
  Filter
} from 'lucide-react';

export default function CenterSelector({ 
  centers, 
  recommendations, 
  onSelectCenter 
}) {
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');

  const bestCenter = recommendations?.recommended_centers?.find(
    (c) => c.center_id === recommendations?.best_center_id
  );

  const districts = ['ALL', ...new Set(centers.map(c => c.district))];

  const filteredCenters = selectedDistrict === 'ALL'
    ? centers
    : centers.filter(c => c.district === selectedDistrict);

  const getTrafficBadge = (status) => {
    switch (status) {
      case 'LOW':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
            <span className="traffic-dot-low" />
            LOW TRAFFIC (कम भीड़)
          </span>
        );
      case 'MODERATE':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}>
            <span className="traffic-dot-mod" />
            MODERATE (मध्यम भीड़)
          </span>
        );
      case 'HIGH':
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
            <span className="traffic-dot-high" />
            HIGH CONGESTION (भारी भीड़)
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* 1. AI Recommendation Banner Card */}
      {recommendations && (
        <div style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '24px 28px',
          boxShadow: '0 12px 24px -6px rgba(6, 78, 59, 0.35)',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          {/* Subtle background graphic glow */}
          <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '220px', height: '220px', background: 'radial-gradient(circle, rgba(52, 211, 153, 0.3) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                <Sparkles size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a7f3d0', fontWeight: 700 }}>
                  Smart India AI Mandi Recommendation Engine
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
                  Optimal Procurement Center Identified
                </h3>
              </div>
            </div>

            {bestCenter && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.12)', padding: '6px 14px', borderRadius: '30px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                <span style={{ fontSize: '0.8rem', color: '#d1fae5' }}>AI Efficiency Score:</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#34d399' }}>{bestCenter.ai_score}/100</span>
              </div>
            )}
          </div>

          <p style={{ fontSize: '0.94rem', color: '#ecfdf5', lineHeight: 1.6, maxWidth: '850px', marginBottom: '20px' }}>
            {recommendations.ai_reasoning}
          </p>

          {bestCenter && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.15)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#a7f3d0', display: 'block' }}>RECOMMENDED MANDI</span>
                  <strong style={{ fontSize: '1rem', color: '#fff' }}>{bestCenter.name}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#a7f3d0', display: 'block' }}>DISTANCE</span>
                  <strong style={{ fontSize: '1rem', color: '#fff' }}>{bestCenter.distance_km} km</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#a7f3d0', display: 'block' }}>ESTIMATED WAIT</span>
                  <strong style={{ fontSize: '1rem', color: '#34d399' }}>~{bestCenter.estimated_wait_mins} mins</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#a7f3d0', display: 'block' }}>RECOMMENDED WINDOW</span>
                  <strong style={{ fontSize: '1rem', color: '#fef08a' }}>{bestCenter.recommended_time_window}</strong>
                </div>
              </div>

              <button
                onClick={() => {
                  const target = centers.find(c => c.id === bestCenter.center_id);
                  if (target) onSelectCenter(target);
                }}
                style={{
                  background: '#ffffff',
                  color: '#065f46',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  padding: '10px 22px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  transition: 'all 0.2s'
                }}
              >
                Book Optimal Slot (तुरंत बुक करें)
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. Header & District Filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
            Select Procurement Center (उपार्जन केंद्र का चयन)
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
            Live traffic, queue volume, and slot availability across regional Mandis
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="#64748b" />
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Filter District:</span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {districts.map(d => (
              <button
                key={d}
                onClick={() => setSelectedDistrict(d)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  border: selectedDistrict === d ? '1px solid #16a34a' : '1px solid #cbd5e1',
                  background: selectedDistrict === d ? '#f0fdf4' : '#ffffff',
                  color: selectedDistrict === d ? '#15803d' : '#475569',
                  cursor: 'pointer'
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Procurement Centers Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
        {filteredCenters.map((center) => {
          const isAiBest = center.id === recommendations?.best_center_id;

          return (
            <div
              key={center.id}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: isAiBest ? '2px solid #10b981' : '1px solid #e2e8f0',
                padding: '22px',
                boxShadow: isAiBest ? '0 8px 20px rgba(16, 185, 129, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '18px',
                position: 'relative',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Highlight Badge for Best Center */}
              {isAiBest && (
                <div style={{ position: 'absolute', top: '-11px', left: '20px' }}>
                  <span className="badge-ai">
                    <Sparkles size={12} /> AI TOP RECOMMENDATION
                  </span>
                </div>
              )}

              {/* Center Info */}
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px', marginTop: isAiBest ? '4px' : 0 }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em' }}>
                      {center.code}
                    </span>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                      {center.name}
                    </h3>
                  </div>
                  {getTrafficBadge(center.traffic_status)}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.82rem', marginBottom: '14px' }}>
                  <MapPin size={15} color="#94a3b8" />
                  <span>{center.address || `${center.district}, ${center.state}`}</span>
                </div>

                {/* Key Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #edf2f7' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Distance</span>
                    <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{center.distance_km} km</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Live Queue</span>
                    <strong style={{ fontSize: '0.95rem', color: center.current_queue_count > 25 ? '#ef4444' : '#0f172a' }}>
                      {center.current_queue_count} vehicles
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Est. Turnaround</span>
                    <strong style={{ fontSize: '0.95rem', color: '#15803d' }}>
                      ~{center.estimated_wait_mins}m
                    </strong>
                  </div>
                </div>

                {/* Capacity utilization indicator */}
                <div style={{ marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                    <span>Daily Capacity: {center.daily_capacity_quintals} Qtl</span>
                    <span>Operating: {center.operating_hours}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(100, Math.round((center.current_queue_count * 50 / center.daily_capacity_quintals) * 100))}%`,
                      height: '100%',
                      background: center.traffic_status === 'HIGH' ? '#ef4444' : (center.traffic_status === 'MODERATE' ? '#f59e0b' : '#10b981'),
                      borderRadius: '4px'
                    }} />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onSelectCenter(center)}
                className={isAiBest ? 'btn-primary' : 'btn-secondary'}
                style={{ width: '100%', padding: '10px' }}
              >
                <Calendar size={16} />
                Book Slot at this Mandi
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
