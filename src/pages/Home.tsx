// src/pages/Home.tsx
import { ArrowRight, UploadCloud, FileText, Zap } from 'lucide-react'

export default function Home({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div>
      {/* HERO SECTION */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(79,127,255,0.05) 0%, rgba(124,92,255,0.05) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 28,
        padding: '48px 48px 60px 48px',
        marginBottom: 40,
        position: 'relative',
        boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04)',
        backdropFilter: 'blur(18px)',
        background: 'rgba(18,24,38,0.55)',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ fontSize: 14, color: 'var(--accent2)', fontWeight: 600, marginBottom: 16, letterSpacing: '0.05em' }}>
            AI-POWERED DOCUMENT AUTOMATION
          </div>
          <h1 style={{ fontSize: 48, fontWeight: 700, marginBottom: 16, lineHeight: 1.1 }}>
            Upload Once.<br />Extract Everything.
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 18, marginBottom: 32, lineHeight: 1.6 }}>
            Instantly read, crop, and extract data from Aadhaar, PAN, Voter ID, Passports, and full-page certificates.
          </p>
          
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => navigate('id-extract')} style={{ padding: '14px 28px', fontSize: 16, borderRadius: 14 }}>
              <Zap size={18} /> Quick Extract
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('full-extract')} style={{ padding: '14px 28px', fontSize: 16, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <FileText size={18} /> Full Extract
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('templates')} style={{ padding: '14px 28px', fontSize: 16, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <FileText size={18} /> Templates
            </button>
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 16, justifyContent: 'center', fontSize: 13, color: 'var(--text3)', flexWrap: 'wrap' }}>
            <span>🪪 Aadhaar</span>•<span>💳 PAN</span>•<span>🗳️ Voter</span>•<span>📘 Passport</span>•<span>📄 Forms</span>
          </div>
        </div>
      </div>

      {/* STATS ROW (Premium Glass Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 40 }}>
        {[
          { label: 'Documents Today', value: '124', sub: '+12% vs yesterday', icon: '📈' },
          { label: 'AI Accuracy', value: '98.7%', sub: 'Gemini 2.5 Flash', icon: '🎯' },
          { label: 'Active Models', value: '4', sub: 'Groq, Gemini, OpenRouter, HF', icon: '🤖' },
          { label: 'Processing Queue', value: '0', sub: 'All systems nominal', icon: '⚡' },
        ].map((stat, i) => (
          <div key={i} style={{
            background: 'rgba(17,25,40,0.6)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 20, padding: '24px',
            backdropFilter: 'blur(8px)',
            position: 'relative'
          }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>{stat.icon}</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* TOOLS GRID */}
      <div className="tools-grid">
        <div className="tool-card" onClick={() => navigate('id-extract')} style={{ borderRadius: 20, padding: '28px', background: 'rgba(17,25,40,0.6)', border: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.25s ease' }}>
          <div className="tool-icon" style={{ background: 'rgba(79,127,255,0.15)', width: 52, height: 52, fontSize: 24, borderRadius: 14 }}>🪪</div>
          <h3 style={{ fontSize: 16, marginTop: 16 }}>Quick Extract (Tool A)</h3>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>Perfect for ID cards, passport photos, and signatures. AI-powered smart cropping.</p>
        </div>
        <div className="tool-card" onClick={() => navigate('full-extract')} style={{ borderRadius: 20, padding: '28px', background: 'rgba(17,25,40,0.6)', border: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.25s ease' }}>
          <div className="tool-icon" style={{ background: 'rgba(34,197,94,0.15)', width: 52, height: 52, fontSize: 24, borderRadius: 14 }}>📄</div>
          <h3 style={{ fontSize: 16, marginTop: 16 }}>Full Extract (Tool B)</h3>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>Upload A4-sized forms, certificates, or affidavits. Extracts text without cropping.</p>
        </div>
        <div className="tool-card" style={{ borderRadius: 20, padding: '28px', background: 'rgba(17,25,40,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderColor: 'rgba(79,127,255,0.4)', transition: 'all 0.25s ease' }}>
          <div className="tool-icon" style={{ background: 'rgba(245,158,11,0.15)', width: 52, height: 52, fontSize: 24, borderRadius: 14 }}>📊</div>
          <h3 style={{ fontSize: 16, marginTop: 16 }}>Excel Sales Templates</h3>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>Download pre-built sheets for tracking sales, leads, and submissions.</p>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 16, width: '100%', justifyContent: 'center', borderRadius: 12 }}>Download Pack <ArrowRight size={14} /></button>
        </div>
      </div>
    </div>
  )
}