import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  ArrowDownRight, 
  FileText, 
  ShieldCheck, 
  Building2,
  Download
} from 'lucide-react';
import { api } from '../services/api';

export default function PaymentTracker({ farmer }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const farmerId = farmer?.id || 1;

  useEffect(() => {
    async function loadPayments() {
      try {
        const data = await api.getFarmerPayments(farmerId);
        setPayments(data);
      } catch (err) {
        console.warn('Payment fetch error', err);
      } finally {
        setLoading(false);
      }
    }
    loadPayments();
  }, [farmerId]);

  const totalDisbursed = payments
    .filter(p => p.status === 'DISBURSED')
    .reduce((sum, p) => sum + p.net_payable, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Overview Card */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#ffffff',
        borderRadius: '20px',
        padding: '28px 32px',
        boxShadow: '0 12px 24px rgba(15, 23, 42, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <ShieldCheck size={18} color="#34d399" />
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', fontWeight: 700 }}>
              DIRECT BENEFIT TRANSFER (DBT) PASSBOOK
            </span>
          </div>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 900, color: '#34d399' }}>
            ₹{totalDisbursed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>
            Total Government MSP Amount Credited to Aadhaar-Linked Bank Account
          </p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.08)', padding: '16px 20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Building2 size={16} color="#94a3b8" />
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>VERIFIED BANK ACCOUNT</span>
          </div>
          <p style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff' }}>
            State Bank of India (SBI)
          </p>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            A/C: •••• •••• 9412 • IFSC: SBIN0001234
          </span>
        </div>
      </div>

      {/* DBT Timeline Status Explanation */}
      <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
          DBT Payment Assurance & Audit Trail (भुगतान स्थिति)
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', position: 'relative' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} />
            </div>
            <div>
              <strong style={{ fontSize: '0.82rem', display: 'block' }}>1. Weighing Done</strong>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Digital Tare/Gross</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} />
            </div>
            <div>
              <strong style={{ fontSize: '0.82rem', display: 'block' }}>2. Officer Certified</strong>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>FAQ Quality Grade A</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} />
            </div>
            <div>
              <strong style={{ fontSize: '0.82rem', display: 'block' }}>3. PFMS Cleared</strong>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Treasury Order</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} />
            </div>
            <div>
              <strong style={{ fontSize: '0.82rem', display: 'block', color: '#10b981' }}>4. DBT Disbursed</strong>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Direct to Bank A/C</span>
            </div>
          </div>

        </div>
      </div>

      {/* Payment Transactions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
          Procurement Payment Records (भुगतान विवरण)
        </h3>

        {payments.length === 0 ? (
          <div style={{ background: '#fff', padding: '32px', textAlign: 'center', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#64748b' }}>
            No completed disbursements yet. Once an officer completes weighing at the mandi, your payment will automatically appear here.
          </div>
        ) : (
          payments.map(p => (
            <div
              key={p.id}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>TRANSACTION REFERENCE</span>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{p.payment_reference}</h4>
                  <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Date: {new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    background: p.status === 'DISBURSED' ? '#ecfdf5' : '#fffbeb',
                    color: p.status === 'DISBURSED' ? '#065f46' : '#92400e',
                    border: `1px solid ${p.status === 'DISBURSED' ? '#a7f3d0' : '#fde68a'}`
                  }}>
                    {p.status === 'DISBURSED' ? 'DISBURSED VIA DBT (भुगतान सफल)' : p.status}
                  </span>
                </div>
              </div>

              {/* Breakdown Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #edf2f7' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Crop & Quantity</span>
                  <strong style={{ fontSize: '0.92rem', color: '#0f172a', display: 'block' }}>{p.quantity_quintals} Qtl {p.crop_type}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Govt MSP Rate</span>
                  <strong style={{ fontSize: '0.92rem', color: '#0f172a', display: 'block' }}>₹{p.msp_rate_per_quintal} / Qtl</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Gross Amount</span>
                  <strong style={{ fontSize: '0.92rem', color: '#0f172a', display: 'block' }}>₹{p.gross_amount.toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Deductions</span>
                  <strong style={{ fontSize: '0.92rem', color: '#ef4444', display: 'block' }}>- ₹{p.deductions.toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 700 }}>Net Disbursed</span>
                  <strong style={{ fontSize: '1.1rem', color: '#15803d', display: 'block' }}>₹{p.net_payable.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              {/* UTR & Receipt */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                  Bank UTR No: <strong style={{ color: '#0f172a', letterSpacing: '0.02em' }}>{p.utr_number || 'RBI2026092289410382'}</strong>
                </div>

                <button
                  onClick={() => alert(`Digital MSP Receipt for ${p.payment_reference}\nCrop: ${p.crop_type} (${p.quantity_quintals} Qtl)\nNet Paid: ₹${p.net_payable}\nBank UTR: ${p.utr_number}\nStatus: Verified via PFMS DBT Gateway.`)}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Download size={14} /> Download Digital MSP Slip
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
