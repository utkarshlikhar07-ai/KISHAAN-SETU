import React, { useState } from 'react';
import { 
  UserCheck, 
  Phone, 
  ShieldCheck, 
  MapPin, 
  Wheat, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export default function FarmerRegister({ onRegistered }) {
  const [formData, setFormData] = useState({
    name: 'Sardar Baldev Singh',
    phone_number: '9876543210',
    aadhaar_number: '548912347612',
    state: 'Punjab',
    district: 'Ludhiana',
    village: 'Jagraon',
    crop_type: 'Wheat',
    default_quantity_quintals: 85.0,
    preferred_language: 'hi',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.registerFarmer(formData);
      setSuccess(true);
      setTimeout(() => {
        if (onRegistered) onRegistered(res);
      }, 1000);
    } catch (err) {
      alert(`Registration failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      
      {/* Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)', color: '#ffffff', padding: '28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={22} color="#a7f3d0" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Farmer Registration (किसान पंजीकरण)</h2>
            <p style={{ fontSize: '0.82rem', color: '#d1fae5' }}>One-time digital verification for direct procurement & MSP payments</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '32px' }}>
        {success ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <CheckCircle2 size={48} color="#16a34a" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Registration Successful!</h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b' }}>किसान प्रोफ़ाइल सफलतापूर्वक सत्यापित हो गई है।</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Name & Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Full Name (पूरा नाम)
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sardar Baldev Singh"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Mobile Number (मोबाइल नंबर)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0 12px' }}>
                  <span style={{ fontSize: '0.82rem', color: '#64748b', marginRight: '6px' }}>+91</span>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="9876543210"
                    style={{ border: 'none', outline: 'none', width: '100%', padding: '10px 0', fontSize: '0.88rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Aadhaar Number */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Aadhaar Number (आधार कार्ड संख्या - सुरक्षित व एन्क्रिप्टेड)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0 12px' }}>
                <ShieldCheck size={18} color="#16a34a" style={{ marginRight: '8px' }} />
                <input
                  type="text"
                  maxLength="12"
                  value={formData.aadhaar_number}
                  onChange={(e) => setFormData({ ...formData, aadhaar_number: e.target.value })}
                  placeholder="12-digit Aadhaar"
                  style={{ border: 'none', outline: 'none', width: '100%', padding: '10px 0', fontSize: '0.88rem' }}
                />
              </div>
            </div>

            {/* State, District, Village */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  State (राज्य)
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  District (जिला)
                </label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Village (गाँव)
                </label>
                <input
                  type="text"
                  value={formData.village}
                  onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>
            </div>

            {/* Crop & Quantity */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Primary Crop (मुख्य फसल)
                </label>
                <select
                  value={formData.crop_type}
                  onChange={(e) => setFormData({ ...formData, crop_type: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                >
                  <option value="Wheat">Wheat (गेहूं)</option>
                  <option value="Paddy">Paddy (धान)</option>
                  <option value="Mustard">Mustard (सरसों)</option>
                  <option value="Soybean">Soybean (सोयाबीन)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Estimated Quantity (अनुमानित क्विंटल)
                </label>
                <input
                  type="number"
                  min="5"
                  value={formData.default_quantity_quintals}
                  onChange={(e) => setFormData({ ...formData, default_quantity_quintals: parseFloat(e.target.value) })}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '12px', marginTop: '12px', fontSize: '0.95rem' }}
            >
              {loading ? 'Registering...' : 'Complete Farmer Verification (पंजीकरण पूर्ण करें)'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
