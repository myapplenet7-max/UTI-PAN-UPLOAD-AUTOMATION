// src/pages/Home.tsx
import { FileText, Image as ImageIcon, FileSpreadsheet, Settings } from 'lucide-react'

export default function Home({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div className="page">
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1a2340 0%, #0f1117 100%)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '32px 28px',
        marginBottom: 28,
      }}>
        <div style={{ fontSize: 12, color: 'var(--accent2)', fontWeight: 600, marginBottom: 10 }}>
          UTI PAN AUTOMATION PLATFORM
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 10, lineHeight: 1.2 }}>
          Upload Once. Extract Everything.
        </h2>
        <p style={{ color: 'var(--text2)', fontSize: 14, maxWidth: 480, marginBottom: 20, lineHeight: 1.6 }}>
          AI-powered processing for agents and consultants. 
        </p>
      </div>

      {/* Stats / Info */}
      <div className="stats-row">
        {[
          { label: 'ID Cards', value: '6+', sub: 'Aadhaar, PAN, Voter...' },
          { label: 'Full Docs', value: 'Any', sub: 'Forms, Certificates' },
          { label: 'Smart Crop', value: 'AI', sub: 'Auto-detect & Straighten' },
          { label: 'Data Edit', value: 'Live', sub: 'Add/remove fields' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="label">{s.label}</div>
            <div className="value">{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
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