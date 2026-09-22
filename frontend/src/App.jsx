import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CenterSelector from './components/CenterSelector';
import SlotBookingModal from './components/SlotBookingModal';
import LiveQueueTracker from './components/LiveQueueTracker';
import FarmerRegister from './components/FarmerRegister';
import PaymentTracker from './components/PaymentTracker';
import OfficerDashboard from './components/OfficerDashboard';
import SaarthiAssistant from './components/SaarthiAssistant';
import SmsFeedDrawer from './components/SmsFeedDrawer';
import { api } from './services/api';
import { 
  Building2, 
  Radio, 
  CreditCard, 
  UserPlus, 
  Sparkles,
  Bot
} from 'lucide-react';

export default function App() {
  const [currentRole, setCurrentRole] = useState('FARMER'); // 'FARMER' | 'OFFICER'
  const [activeTab, setActiveTab] = useState('CENTERS'); // 'CENTERS' | 'QUEUE' | 'PAYMENTS' | 'REGISTER'
  const [language, setLanguage] = useState('hi');
  
  const [centers, setCenters] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [farmer, setFarmer] = useState({
    id: 1,
    name: 'Sardar Baldev Singh',
    phone_number: '9876543210',
    aadhaar_hash: 'XXXX-XXXX-7612',
    crop_type: 'Wheat',
    default_quantity_quintals: 85.0
  });
  
  const [activeBooking, setActiveBooking] = useState({
    id: 4,
    token_number: 14,
    center_id: 1,
    booking_reference: 'KS-2026-TODAY-0014'
  });

  const [bookingModalCenter, setBookingModalCenter] = useState(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isSmsDrawerOpen, setIsSmsDrawerOpen] = useState(false);
  const [smsCount, setSmsCount] = useState(2);

  // Initial load
  useEffect(() => {
    async function loadInitialData() {
      try {
        const centersData = await api.getCenters();
        setCenters(centersData);

        const recs = await api.getRecommendations({
          farmerId: farmer.id,
          lat: 29.6857,
          lng: 76.9905,
          crop: farmer.crop_type,
          quantity: farmer.default_quantity_quintals
        });
        setRecommendations(recs);

        const smsData = await api.getSmsFeed();
        setSmsCount(smsData.length);
      } catch (err) {
        console.warn('Initial data load error:', err);
      }
    }
    loadInitialData();
  }, []);

  const handleBookingSuccess = (newBooking) => {
    setActiveBooking(newBooking);
    setSmsCount(prev => prev + 1);
    setActiveTab('QUEUE');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      
      {/* Top Header */}
      <Navbar
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        language={language}
        setLanguage={setLanguage}
        farmer={farmer}
        activeToken={activeBooking?.token_number}
        smsCount={smsCount}
        onToggleSms={() => setIsSmsDrawerOpen(!isSmsDrawerOpen)}
        onOpenAssistant={() => setIsAssistantOpen(true)}
      />

      {/* Main App Body */}
      <main style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '24px' }}>
        
        {/* Farmer Navigation Tabs (Visible in Farmer Role) */}
        {currentRole === 'FARMER' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '24px',
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: '12px',
            overflowX: 'auto'
          }}>
            <button
              onClick={() => setActiveTab('CENTERS')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.88rem',
                background: activeTab === 'CENTERS' ? '#15803d' : '#ffffff',
                color: activeTab === 'CENTERS' ? '#ffffff' : '#475569',
                boxShadow: activeTab === 'CENTERS' ? '0 4px 12px rgba(21, 128, 61, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.2s'
              }}
            >
              <Building2 size={16} />
              1. Select Mandi (उपार्जन केंद्र)
            </button>

            <button
              onClick={() => setActiveTab('QUEUE')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.88rem',
                background: activeTab === 'QUEUE' ? '#15803d' : '#ffffff',
                color: activeTab === 'QUEUE' ? '#ffffff' : '#475569',
                boxShadow: activeTab === 'QUEUE' ? '0 4px 12px rgba(21, 128, 61, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.2s'
              }}
            >
              <Radio size={16} />
              2. Live Queue Tracker (लाइव कतार)
              {activeBooking && (
                <span style={{
                  fontSize: '0.7rem',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: activeTab === 'QUEUE' ? '#a7f3d0' : '#dcfce7',
                  color: '#065f46'
                }}>
                  Token #{activeBooking.token_number}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('PAYMENTS')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.88rem',
                background: activeTab === 'PAYMENTS' ? '#15803d' : '#ffffff',
                color: activeTab === 'PAYMENTS' ? '#ffffff' : '#475569',
                boxShadow: activeTab === 'PAYMENTS' ? '0 4px 12px rgba(21, 128, 61, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.2s'
              }}
            >
              <CreditCard size={16} />
              3. MSP Payments (भुगतान स्थिति)
            </button>

            <button
              onClick={() => setActiveTab('REGISTER')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.88rem',
                background: activeTab === 'REGISTER' ? '#15803d' : '#ffffff',
                color: activeTab === 'REGISTER' ? '#ffffff' : '#475569',
                boxShadow: activeTab === 'REGISTER' ? '0 4px 12px rgba(21, 128, 61, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.2s'
              }}
            >
              <UserPlus size={16} />
              Registration (पंजीकरण)
            </button>
          </div>
        )}

        {/* View Switcher based on Role and Tab */}
        {currentRole === 'OFFICER' ? (
          <OfficerDashboard centers={centers} />
        ) : (
          <div>
            {activeTab === 'CENTERS' && (
              <CenterSelector
                centers={centers}
                recommendations={recommendations}
                onSelectCenter={(center) => setBookingModalCenter(center)}
              />
            )}

            {activeTab === 'QUEUE' && (
              <LiveQueueTracker
                booking={activeBooking}
                farmer={farmer}
                onSlotCancelled={() => setActiveBooking(null)}
                onOpenBooking={() => setActiveTab('CENTERS')}
              />
            )}

            {activeTab === 'PAYMENTS' && (
              <PaymentTracker farmer={farmer} />
            )}

            {activeTab === 'REGISTER' && (
              <FarmerRegister
                onRegistered={(newFarmer) => {
                  setFarmer(newFarmer);
                  setActiveTab('CENTERS');
                }}
              />
            )}
          </div>
        )}
      </main>

      {/* Floating Saarthi Assistant Trigger (Mobile / Bottom Right) */}
      {!isAssistantOpen && (
        <button
          onClick={() => setIsAssistantOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
            color: '#ffffff',
            borderRadius: '50px',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: 'none',
            boxShadow: '0 10px 25px rgba(21, 128, 61, 0.4)',
            cursor: 'pointer',
            zIndex: 100,
            fontSize: '0.9rem',
            fontWeight: 700,
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Bot size={22} />
          <span>Ask Saarthi (सारथी से पूछें)</span>
        </button>
      )}

      {/* Slot Booking Modal */}
      {bookingModalCenter && (
        <SlotBookingModal
          center={bookingModalCenter}
          farmer={farmer}
          onClose={() => setBookingModalCenter(null)}
          onBookingSuccess={handleBookingSuccess}
        />
      )}

      {/* Saarthi AI Multilingual Voice Assistant Modal */}
      <SaarthiAssistant
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        language={language}
        farmer={farmer}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setIsAssistantOpen(false);
        }}
      />

      {/* Shravan SMS Notification Simulation Drawer */}
      <SmsFeedDrawer
        isOpen={isSmsDrawerOpen}
        onClose={() => setIsSmsDrawerOpen(false)}
      />

    </div>
  );
}
