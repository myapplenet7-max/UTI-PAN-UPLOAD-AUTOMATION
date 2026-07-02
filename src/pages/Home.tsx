// src/pages/Home.tsx
import { useState } from 'react'
import { FileText, Image, FileSpreadsheet, Settings, Monitor, Cpu, X } from 'lucide-react'

export default function Home({ navigate }: { navigate: (p: string) => void }) {
  const [popupType, setPopupType] = useState<string | null>(null)

  const closePopup = () => setPopupType(null)

  return (
    <div className="page">
      {/* Popup Overlay */}
      {popupType && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }} onClick={closePopup}>
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 16, padding: 32, maxWidth: 600, width: '90%',
            position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
          }} onClick={e => e.stopPropagation()}>
            <button onClick={closePopup} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            
            {popupType === 'id-cards' && (
              <>
                <h3 style={{ marginBottom: 16 }}>Supported ID Cards</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {['Aadhaar', 'PAN', 'Voter ID', 'Passport', 'SSC Memo', 'Birth Cert'].map((item, i) => (
                    <div key={i} style={{ background: 'var(--bg3)', padding: 20, borderRadius: 8, textAlign: 'center', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🪪</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{item}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <button className="btn btn-primary" onClick={() => { closePopup(); navigate('id-extract') }}>Go to Tool A</button>
                </div>
              </>
            )}

            {popupType === 'full-docs' && (
              <>
                <h3 style={{ marginBottom: 16 }}>Supported Full Documents</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  {['Aadhaar', 'Certificates', 'UTI PAN Form', 'Affidavits', 'Gift Deeds', 'SSC/Birth'].map((item, i) => (
                    <div key={i} style={{ background: 'var(--bg3)', padding: 20, borderRadius: 8, textAlign: 'center', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{item}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <button className="btn btn-primary" onClick={() => { closePopup(); navigate('full-extract') }}>Go to Tool B</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1a2340 0%, #0f1117 100%)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '32px 28px',
        marginBottom: 28,
      }}>
        <div style={{ fontSize: 12, color: 'var(--accent2)', fontWeight: 600, marginBottom: 10 }}>
          DOCUMENT AUTOMATION PLATFORM
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 10, lineHeight: 1.2 }}>
          Upload Once. Extract Everything.
        </h2>
        <p style={{ color: 'var(--text2)', fontSize: 14, maxWidth: 480, marginBottom: 20, lineHeight: 1.6 }}>
          AI-powered processing for agents and consultants. 
        </p>
      </div>

      {/* Interactive Stats */}
      <div className="stats-row">
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setPopupType('id-cards')}>
          <div className="label">ID Cards</div>
          <div className="value">6+</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Tap to see supported types</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setPopupType('full-docs')}>
          <div className="label">Full Docs</div>
          <div className="value">Any</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Tap to see supported types</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }}>
          <div className="label">AI Models</div>
          <div className="value">4</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Gemini, Groq, OpenRouter, HF</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }}>
          <div className="label">Outputs</div>
          <div className="value">Live</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>DOCX, PDF, CSV, Images</div>
        </div>
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Core Extraction Tools</h3>
      <div className="tools-grid">
        <div className="tool-card" onClick={() => navigate('id-extract')}>
          <div className="tool-icon" style={{ background: '#3b6ef522' }}>🪪</div>
          <h3>Tool A: Crop & Extract</h3>
          <p>Upload small ID cards (Voter/PAN/Passport) + Photo + Sig. AI auto-crops to exact card proportions.</p>
        </div>
        <div className="tool-card" onClick={() => navigate('full-extract')}>
          <div className="tool-icon" style={{ background: '#22c55e22' }}>📄</div>
          <h3>Tool B: Full Document Extract</h3>
          <p>Upload full A4 pages, forms, or certificates. No cropping, just plain text extraction.</p>
        </div>
        <div className="tool-card" style={{ cursor: 'default', borderColor: 'var(--accent)' }}>
          <div className="tool-icon" style={{ background: '#f59e0b22' }}>📊</div>
          <h3>Excel Sales Templates</h3>
          <p>Download pre-built Excel sheets for tracking sales, leads, and UTI PAN submissions.</p>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>Download Pack</button>
        </div>
      </div>
    </div>
  )
}