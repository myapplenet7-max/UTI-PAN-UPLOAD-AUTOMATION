import { Image, PenLine, Layers, FileText, ClipboardList, FilePlus, FileStack, Wrench, Settings } from 'lucide-react'

const TOOLS = [
  { id: 'photo', icon: '🖼️', color: '#3b6ef5', label: 'UTI Photo Extraction', desc: 'Extract perfectly sized UTI photo, passport size and white background variants.' },
  { id: 'signature', icon: '✍️', color: '#8b5cf6', label: 'Signature Extraction', desc: 'Extract clean PNG signatures from scanned documents with transparent background.' },
  { id: 'photo-sig', icon: '🪪', color: '#ec4899', label: 'Photo + Signature', desc: 'Combine extracted photo and signature into a single ready-to-use image.' },
  { id: 'document', icon: '📋', color: '#f59e0b', label: 'Document Extractor', desc: 'Crop and straighten Aadhaar, PAN, Voter ID and other ID documents.' },
  { id: 'form', icon: '📝', color: '#22c55e', label: 'Auto Form Filler', desc: 'Upload a filled application — AI extracts all data and fills UTI PAN form.' },
  { id: 'correction', icon: '🗂️', color: '#06b6d4', label: 'Correction Packet', desc: 'Auto-create 5-page correction submission PDF with all supporting documents.' },
  { id: 'newpan', icon: '📦', color: '#f97316', label: 'New PAN Packet', desc: 'Compile new PAN application and supporting documents into submission PDF.' },
  { id: 'pdf', icon: '📄', color: '#6366f1', label: 'PDF Tools', desc: 'Merge, split, compress, convert and extract pages from PDF files.' },
  { id: 'image', icon: '🔧', color: '#14b8a6', label: 'Image Tools', desc: 'Resize, compress, convert, change DPI, generate photo sheets and more.' },
]

export default function Dashboard({ navigate }: { navigate: (p: any) => void }) {
  return (
    <div className="page">
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1a2340 0%, #0f1117 100%)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '32px 28px',
        marginBottom: 28,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,110,245,0.15) 0%, transparent 70%)'
        }} />
        <div style={{ fontSize: 12, color: 'var(--accent2)', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          UTI PAN Automation Platform
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 10, lineHeight: 1.2 }}>
          Upload Once.<br />Extract Everything.
        </h2>
        <p style={{ color: 'var(--text2)', fontSize: 14, maxWidth: 480, marginBottom: 20, lineHeight: 1.6 }}>
          AI-powered UTI PAN processing for agents and consultants. Extract photos, signatures, documents and generate ready-to-submit applications automatically.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('photo')}>
            🖼️ Start Photo Extraction
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('form')}>
            📝 Auto Form Filler
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        {[
          { label: 'Total Tools', value: '9', sub: 'AI-powered' },
          { label: 'Photo Formats', value: '5+', sub: 'UTI, Passport, Custom' },
          { label: 'Documents', value: '6', sub: 'Aadhaar, PAN, Voter...' },
          { label: 'PDF Outputs', value: '5pg', sub: 'Submission ready' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="label">{s.label}</div>
            <div className="value">{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Processing Tools</h3>
      <div className="tools-grid">
        {TOOLS.map(t => (
          <div className="tool-card" key={t.id} onClick={() => navigate(t.id)}>
            <div className="tool-icon" style={{ background: t.color + '22' }}>
              {t.icon}
            </div>
            <h3>{t.label}</h3>
            <p>{t.desc}</p>
          </div>
        ))}
      </div>

      <div className="alert alert-info" style={{ marginTop: 24 }}>
        💡 Enter your Claude API key in the top bar to enable AI-powered extraction features.
        Get your key at <a href="https://console.anthropic.com" target="_blank" style={{ color: 'var(--accent2)' }}>console.anthropic.com</a>
      </div>
    </div>
  )
}
