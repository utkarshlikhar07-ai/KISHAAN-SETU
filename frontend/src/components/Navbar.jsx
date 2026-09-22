import React from 'react';
import { 
  Tractor, 
  ShieldCheck, 
  Globe, 
  MessageSquare, 
  Bot, 
  UserCheck,
  Wheat
} from 'lucide-react';

export default function Navbar({ 
  currentRole, 
  setCurrentRole, 
  language, 
  setLanguage, 
  farmer, 
  activeToken,
  smsCount, 
  onToggleSms,
  onOpenAssistant 
}) {
  const languages = [
    { code: 'hi', label: 'हिन्दी (Hindi)' },
    { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' },
    { code: 'te', label: 'తెలుగు (Telugu)' },
    { code: 'mr', label: 'मराठी (Marathi)' },
    { code: 'en', label: 'English' },
  ];

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, background: '#ffffff', borderBottom: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      {/* Tri-color national accent bar */}
      <div style={{ height: '4px', background: 'linear-gradient(90deg, #FF9933 0%, #FFFFFF 50%, #138808 100%)' }} />
      
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Brand Logo & Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 10px rgba(21, 128, 61, 0.3)' }}>
            <Tractor size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>
                KISAN SETU <span style={{ color: '#15803d', fontWeight: 600, fontSize: '1.05rem' }}>| किसान सेतु</span>
              </h1>
              <span style={{ fontSize: '0.68rem', padding: '2px 8px', background: '#fef3c7', color: '#92400e', fontWeight: 700, borderRadius: '6px', border: '1px solid #fde68a' }}>
                SIH PROTOTYPE
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>
              National Digital Procurement & Real-Time Queue Platform
            </p>
          </div>
        </div>

        {/* Action Controls & Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          
          {/* Active Farmer Pill (if in Farmer role) */}
          {currentRole === 'FARMER' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '20px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#166534' }}>
                {farmer?.name || 'Baldev Singh'}
              </span>
              {activeToken && (
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 6px', background: '#15803d', color: '#fff', borderRadius: '10px' }}>
                  Token #{activeToken}
                </span>
              )}
            </div>
          )}

          {/* Role Switcher Pill */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <button
              onClick={() => setCurrentRole('FARMER')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
                transition: 'all 0.2s',
                background: currentRole === 'FARMER' ? '#ffffff' : 'transparent',
                color: currentRole === 'FARMER' ? '#15803d' : '#64748b',
                boxShadow: currentRole === 'FARMER' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <Wheat size={16} />
              Farmer App (किसान)
            </button>
            <button
              onClick={() => setCurrentRole('OFFICER')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
                transition: 'all 0.2s',
                background: currentRole === 'OFFICER' ? '#ffffff' : 'transparent',
                color: currentRole === 'OFFICER' ? '#0f172a' : '#64748b',
                boxShadow: currentRole === 'OFFICER' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <ShieldCheck size={16} color={currentRole === 'OFFICER' ? '#2563eb' : '#64748b'} />
              Officer Desk (अधिकारी)
            </button>
          </div>

          {/* Language Selector Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '10px' }}>
            <Globe size={16} color="#64748b" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.82rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}
            >
              {languages.map(l => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>

          {/* SMS Simulation Drawer Toggle */}
          <button
            onClick={onToggleSms}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              cursor: 'pointer',
              color: '#334155'
            }}
            title="Simulated Shravan SMS Notifications"
          >
            <MessageSquare size={18} />
            {smsCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#ef4444',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 700,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {smsCount}
              </span>
            )}
          </button>

          {/* Saarthi AI Assistant Quick Button */}
          <button
            onClick={onOpenAssistant}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid #a7f3d0',
              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
              color: '#065f46',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.15)'
            }}
          >
            <Bot size={18} />
            Saarthi AI (सारथी)
          </button>

        </div>
      </div>
    </header>
  );
}
