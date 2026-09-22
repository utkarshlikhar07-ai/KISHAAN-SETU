/**
 * Kisan Setu - Frontend API & WebSocket Client
 * ============================================
 * Interfaces with FastAPI gateway for REST requests and live queue WebSocket sync.
 */

const API_BASE = 'http://localhost:8000/api';
const WS_BASE = 'ws://localhost:8000/ws';

export const api = {
  // 1. Centers & AI Recommendations
  async getCenters(district = '') {
    const url = district ? `${API_BASE}/centers?district=${encodeURIComponent(district)}` : `${API_BASE}/centers`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load centers');
    return res.json();
  },

  async getRecommendations({ farmerId = 1, lat = 29.6857, lng = 76.9905, crop = 'Wheat', quantity = 50 } = {}) {
    const params = new URLSearchParams({
      farmer_id: farmerId,
      lat,
      lng,
      crop_type: crop,
      quantity_quintals: quantity,
    });
    const res = await fetch(`${API_BASE}/centers/recommendations?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch AI recommendations');
    return res.json();
  },

  // 2. Farmers
  async registerFarmer(farmerData) {
    const res = await fetch(`${API_BASE}/farmers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(farmerData),
    });
    if (!res.ok) throw new Error('Failed to register farmer');
    return res.json();
  },

  async getFarmer(farmerId) {
    const res = await fetch(`${API_BASE}/farmers/${farmerId}`);
    if (!res.ok) throw new Error('Failed to load farmer profile');
    return res.json();
  },

  // 3. Slot Bookings
  async bookSlot(bookingData) {
    const res = await fetch(`${API_BASE}/slots/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData),
    });
    if (!res.ok) throw new Error('Failed to book slot');
    return res.json();
  },

  async cancelSlot(bookingId) {
    const res = await fetch(`${API_BASE}/slots/${bookingId}/cancel`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to cancel slot');
    return res.json();
  },

  async rebookSlot(bookingId, { bookingDate, timeWindow }) {
    const res = await fetch(`${API_BASE}/slots/${bookingId}/rebook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_date: bookingDate, time_window: timeWindow }),
    });
    if (!res.ok) throw new Error('Failed to rebook slot');
    return res.json();
  },

  async getFarmerBookings(farmerId) {
    const res = await fetch(`${API_BASE}/slots/farmer/${farmerId}`);
    if (!res.ok) return [];
    return res.json();
  },

  // 4. Live Queue & Officer Operations
  async getFarmerLiveQueue(bookingId) {
    const res = await fetch(`${API_BASE}/queue/farmer/${bookingId}`);
    if (!res.ok) throw new Error('Failed to fetch live queue');
    return res.json();
  },

  async getCenterQueue(centerId) {
    const res = await fetch(`${API_BASE}/queue/center/${centerId}`);
    if (!res.ok) throw new Error('Failed to fetch center queue');
    return res.json();
  },

  async officerMarkDone(actionData) {
    const res = await fetch(`${API_BASE}/queue/officer/mark-done`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actionData),
    });
    if (!res.ok) throw new Error('Failed to execute officer mark-done');
    return res.json();
  },

  async officerCallNext(centerId) {
    const res = await fetch(`${API_BASE}/queue/officer/call-next/${centerId}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to call next farmer');
    return res.json();
  },

  // 5. Payments
  async getFarmerPayments(farmerId) {
    const res = await fetch(`${API_BASE}/payments/farmer/${farmerId}`);
    if (!res.ok) return [];
    return res.json();
  },

  // 6. Saarthi AI & Shravan SMS Feed
  async querySaarthi({ textQuery, language = 'hi', farmerId = 1 }) {
    const res = await fetch(`${API_BASE}/assistant/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farmer_id: farmerId,
        language,
        text_query: textQuery,
      }),
    });
    if (!res.ok) throw new Error('Failed to communicate with Saarthi AI');
    return res.json();
  },

  async getSmsFeed() {
    const res = await fetch(`${API_BASE}/assistant/sms-feed`);
    if (!res.ok) return [];
    return res.json();
  },
};

/**
 * Creates a real-time WebSocket connection to a procurement center.
 */
export function createQueueSocket(centerId, onMessage, onError) {
  try {
    const ws = new WebSocket(`${WS_BASE}/queue/${centerId}`);
    ws.onopen = () => {
      console.log(`[WS Connected] Listening to center #${centerId}`);
    };
    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        onMessage(parsed);
      } catch (e) {
        console.error('WS Parse Error', e);
      }
    };
    ws.onerror = (err) => {
      console.warn('WS error', err);
      if (onError) onError(err);
    };
    return ws;
  } catch (err) {
    console.warn('Could not establish WebSocket, falling back to polling', err);
    return null;
  }
}
