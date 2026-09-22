import React, { useState, useEffect } from 'react';
import { 
  X, 
  MessageSquare, 
  Smartphone, 
  Clock, 
  CheckCheck, 
  RefreshCw,
  Bell
} from 'lucide-react';
import { api } from '../services/api';

export default function SmsFeedDrawer({ isOpen, onClose }) {
  const [smsList, setSmsList] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const data = await api.getSmsFeed();
      setSmsList(data);
    } catch (err) {
      console.warn('SMS feed fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFeed();
      const interval = setInterval(fetchFeed, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      justifyContent: 'flex-end',
      zIndex: 140,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        width: '440px',
        maxWidth: '100%',
        height: '100%',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-10px 0 25px rgba(0,0,0,0.15)',
        animation: 'slideLeft 0.25s ease-out'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Smartphone size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                Farmer SMS Inbox (फोन संदेश)
              </h3>
              <p style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Automated Shravan API SMS Simulation Feed
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={fetchFeed}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
            </button>
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* SMS List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', background: '#f1f5f9' }}>
          
          <div style={{ background: '#fef3c7', padding: '10px 14px', borderRadius: '10px', border: '1px solid #fde68a', fontSize: '0.75rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={16} style={{ flexShrink: 0 }} />
            <span>Demonstrates automated Indian Gov SMS dispatch when you book or cancel slots, or when your turn arrives!</span>
          </div>

          {smsList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              <MessageSquare size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ fontSize: '0.88rem' }}>No SMS messages yet.</p>
              <p style={{ fontSize: '0.78rem' }}>Book a slot or call a farmer in the dashboard to trigger live alerts!</p>
            </div>
          ) : (
            smsList.map((sms) => (
              <div
                key={sms.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0369a1', background: '#e0f2fe', padding: '2px 8px', borderRadius: '6px' }}>
                      VK-KSETU
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      To: +91 {sms.recipient_phone}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                    {new Date(sms.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#1e293b', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
                  {sms.message}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '6px', marginTop: '2px' }}>
                  <span style={{ fontSize: '0.68rem', color: '#15803d', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <CheckCheck size={14} /> {sms.gateway}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                    {sms.type}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
