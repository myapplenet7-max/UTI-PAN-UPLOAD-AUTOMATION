// src/pages/Home.tsx
import { Zap, FileText, Layout } from 'lucide-react'

export default function Home({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div>
      {/* HERO SECTION - 320px height, 65/35 Grid */}
      <div style={{
        height: '320px',
        display: 'grid',
        gridTemplateColumns: '65% 35%',
        background: 'linear-gradient(135deg, rgba(79,127,255,0.04) 0%, rgba(124,92,255,0.04) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '24px',
        padding: '0 48px',
        marginBottom: '32px',
        alignItems: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(12px)'
      }}>
        {/* Left Column - 65% */}
        <div>
          <div style={{ fontSize: '12px', color: 'var(--accent2)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '12px' }}>
            AI DOCUMENT AUTOMATION
          </div>
          <h1 style={{ 
            fontSize: '72px', 
            fontWeight: 800, 
            lineHeight: 1.05, 
            marginBottom: '16px', 
            letterSpacing: '-0.03em'
          }}>
            Upload Once.<br />Extract Everything.
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '16px', maxWidth: '480px', marginBottom: '24px', lineHeight: 1.6 }}>
            AI-powered extraction for PAN agents, consultants and document processing teams.
          </p>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => navigate('id-extract')} style={{ padding: '12px 24px', fontSize: '15px', borderRadius: '12px' }}>
              <Zap size={18} /> Quick Extract
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('full-extract')} style={{ padding: '12px 24px', fontSize: '15px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <FileText size={18} /> Full Extract
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('templates')} style={{ padding: '12px 24px', fontSize: '15px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Layout size={18} /> Templates
            </button>
          </div>
        </div>

        {/* Right Column - 35% (Supports/Badges) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '13px', background: 'rgba(255,255,255,0.04)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>🪪 Aadhaar</span>
            <span style={{ fontSize: '13px', background: 'rgba(255,255,255,0.04)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>💳 PAN</span>
            <span style={{ fontSize: '13px', background: 'rgba(255,255,255,0.04)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>🗳️ Voter ID</span>
            <span style={{ fontSize: '13px', background: 'rgba(255,255,255,0.04)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>📘 Passport</span>
            <span style={{ fontSize: '13px', background: 'rgba(255,255,255,0.04)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>📄 Forms</span>
          </div>
        </div>
      </div>

      {/* STATS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'AI Accuracy', value: '98.7%', sub: 'Gemini 2.5 Flash', icon: '🎯' },
          { label: 'Active Models', value: '4', sub: 'Groq, Gemini, OpenRouter, HF', icon: '🤖' },
          { label: 'Processing Queue', value: '0', sub: 'All systems nominal', icon: '⚡' },
          { label: 'Total Extracted', value: '1.2K', sub: 'Last 30 days', icon: '📈' },
        ].map((stat, i) => (
          <div key={i} style={{
            background: 'rgba(13,18,34,0.6)',
            border: '1px solid rgba(255,255,255,0.04)',
            borderRadius: '16px', padding: '20px',
            backdropFilter: 'blur(8px)'
          }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>{stat.icon}</div>
            <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '4px' }}>{stat.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 700 }}>{stat.value}</div>
            <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* TOOLS GRID */}
      <div className="tools-grid">
        <div className="tool-card" onClick={() => navigate('id-extract')} style={{ borderRadius: '16px', padding: '24px', background: 'rgba(13,18,34,0.6)', border: '1px solid rgba(255,255,255,0.04)', transition: 'all 0.25s ease' }}>
          <div className="tool-icon" style={{ background: 'rgba(79,127,255,0.15)', width: '48px', height: '48px', fontSize: '22px', borderRadius: '12px' }}>🪪</div>
          <h3 style={{ fontSize: '16px', marginTop: '16px' }}>Quick Extract (Tool A)</h3>
          <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.5 }}>Perfect for ID cards, passport photos, and signatures. AI-powered smart cropping.</p>
        </div>
        <div className="tool-card" onClick={() => navigate('full-extract')} style={{ borderRadius: '16px', padding: '24px', background: 'rgba(13,18,34,0.6)', border: '1px solid rgba(255,255,255,0.04)', transition: 'all 0.25s ease' }}>
          <div className="tool-icon" style={{ background: 'rgba(34,197,94,0.15)', width: '48px', height: '48px', fontSize: '22px', borderRadius: '12px' }}>📄</div>
          <h3 style={{ fontSize: '16px', marginTop: '16px' }}>Full Extract (Tool B)</h3>
          <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.5 }}>Upload A4-sized forms, certificates, or affidavits. Extracts text without cropping.</p>
        </div>
        <div className="tool-card" style={{ borderRadius: '16px', padding: '24px', background: 'rgba(13,18,34,0.6)', border: '1px solid rgba(255,255,255,0.04)', borderColor: 'rgba(79,127,255,0.4)', transition: 'all 0.25s ease' }}>
          <div className="tool-icon" style={{ background: 'rgba(245,158,11,0.15)', width: '48px', height: '48px', fontSize: '22px', borderRadius: '12px' }}>📊</div>
          <h3 style={{ fontSize: '16px', marginTop: '16px' }}>Excel Sales Templates</h3>
          <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.5 }}>Download pre-built sheets for tracking sales, leads, and submissions.</p>
          <button className="btn btn-primary btn-sm" style={{ marginTop: '16px', width: '100%', justifyContent: 'center', borderRadius: '10px' }}>Download Pack</button>
        </div>
      </div>
    </div>
  )
}