/**
 * Kisan Setu - Frontend Route Map & Architecture Definition
 * =========================================================
 * Defines the structural layout, navigation topology, role-based flows,
 * and view hierarchy for the Kisan Setu React web application.
 * 
 * Target Roles:
 * 1. Farmer (Mobile-first responsive flow for slot booking, live tracking, payments)
 * 2. Mandi Procurement Officer (Desktop/Tablet dashboard for queue clearing, triage, traffic analytics)
 * 3. Saarthi AI Assistant (Ubiquitous voice/text assistant layer with Bhashini translation)
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

// ==========================================
// 1. ROUTE DEFINITIONS & ACCESS MATRIX
// ==========================================
export const APP_ROUTES = {
  // Farmer Routes
  FARMER_REGISTER: {
    path: '/register',
    title: 'Farmer Registration | किसान पंजीकरण',
    role: 'FARMER',
    description: 'One-time onboarding capturing Name, Phone, Crop Type, and expected Quintals'
  },
  CENTER_EXPLORER: {
    path: '/centers',
    title: 'Smart Procurement Centers | उपार्जन केंद्र चयन',
    role: 'FARMER',
    description: 'Procurement centers list with color-coded live traffic (Green/Amber/Red) and AI recommendation badge'
  },
  SLOT_BOOKING: {
    path: '/centers/:centerId/book',
    title: 'Book Procurement Slot | स्लॉट बुकिंग',
    role: 'FARMER',
    description: 'Interactive date picker, capacity-aware time windows, automated Shravan SMS confirmation'
  },
  LIVE_QUEUE: {
    path: '/queue/:bookingId?',
    title: 'Live Queue Tracking | लाइव कतार स्थिति',
    role: 'FARMER',
    description: 'WebSocket-powered real-time token tracking, countdown timer, and turn alert'
  },
  PAYMENT_TRACKER: {
    path: '/payments',
    title: 'MSP Payment Tracking | भुगतान स्थिति',
    role: 'FARMER',
    description: 'Direct Benefit Transfer (DBT) status, MSP calculations, deductions, and UTR timeline'
  },

  // Mandi Officer Routes
  OFFICER_DASHBOARD: {
    path: '/officer',
    title: 'Procurement Officer Portal | मंडी अधिकारी डैशबोर्ड',
    role: 'OFFICER',
    description: 'Today’s arrival queue, farmer identity verification, weighing input, and Mark Done action'
  },
  OFFICER_TRAFFIC_MONITOR: {
    path: '/officer/traffic',
    title: 'Regional Traffic & Heatmap | ट्रैफिक मॉनिटरिंग',
    role: 'OFFICER',
    description: 'Live queue metrics across cluster mandis, average wait times, bottleneck alerts'
  }
};

// ==========================================
// 2. CONTEXT STATE DEFINITIONS
// ==========================================
export const FarmerContext = createContext(null);
export const QueueRealtimeContext = createContext(null);
export const AssistantContext = createContext(null);

export const useFarmer = () => useContext(FarmerContext);
export const useQueue = () => useContext(QueueRealtimeContext);
export const useAssistant = () => useContext(AssistantContext);

// ==========================================
// 3. CORE COMPONENT STUBS & STRUCTURAL MAP
// ==========================================

/**
 * Structural Component Tree:
 * 
 * <AppRoot>
 *   <LanguageProvider default="hi"> (Bhashini NMT wrapper)
 *     <FarmerProvider>              (Active farmer profile & current booking)
 *       <QueueWebSocketProvider>    (Live WS /ws/queue/:centerId)
 *         <Layout>
 *           <TopNavigationHeader />  (Role Switcher, Language Dropdown, SMS Feed Toggle)
 *           
 *           <MainContainer>
 *             <Switch>
 *               <Route path="/register" component={FarmerRegistrationView} />
 *               <Route path="/centers" component={CenterSelectionView} />
 *               <Route path="/centers/:centerId/book" component={SlotBookingModal} />
 *               <Route path="/queue/:bookingId?" component={LiveQueueTrackerView} />
 *               <Route path="/payments" component={PaymentTrackerView} />
 *               <Route path="/officer" component={OfficerDashboardView} />
 *               <Route path="/officer/traffic" component={TrafficHeatmapView} />
 *             </Switch>
 *           </MainContainer>
 *           
 *           <SaarthiVoiceAssistantModal /> (Sarvam AI Speech-to-Text & Bhashini Text-to-Speech)
 *           <SmsNotificationToastDrawer /> (Simulates Shravan API SMS incoming messages)
 *         </Layout>
 *       </QueueWebSocketProvider>
 *     </FarmerProvider>
 *   </LanguageProvider>
 * </AppRoot>
 */

export const RouteRegistry = [
  {
    id: 'farmer-register',
    route: APP_ROUTES.FARMER_REGISTER.path,
    badge: 'Step 1',
    label: 'Farmer Registration',
    icon: 'UserCheck',
    componentName: 'FarmerRegistration'
  },
  {
    id: 'center-selection',
    route: APP_ROUTES.CENTER_EXPLORER.path,
    badge: 'Step 2 (AI Recommender)',
    label: 'Select Mandi',
    icon: 'MapPin',
    componentName: 'CenterSelection'
  },
  {
    id: 'live-queue',
    route: APP_ROUTES.LIVE_QUEUE.path,
    badge: 'Step 3 (Real-time)',
    label: 'Live Queue Tracker',
    icon: 'Radio',
    componentName: 'LiveQueueTracker'
  },
  {
    id: 'payments',
    route: APP_ROUTES.PAYMENT_TRACKER.path,
    badge: 'Step 4 (DBT)',
    label: 'Payment Status',
    icon: 'CreditCard',
    componentName: 'PaymentTracker'
  },
  {
    id: 'officer-desk',
    route: APP_ROUTES.OFFICER_DASHBOARD.path,
    badge: 'Mandi Admin',
    label: 'Officer Dashboard',
    icon: 'ShieldCheck',
    componentName: 'OfficerDashboard'
  }
];

export default APP_ROUTES;
