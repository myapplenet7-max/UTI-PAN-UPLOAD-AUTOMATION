import { useState } from 'react'
import UploadZone from '../components/UploadZone'

const PAGES = [
  { id: 'form1', label: 'Page 1 — UTI PAN Application' },
  { id: 'form2', label: 'Page 2 — UTI PAN Application' },
  { id: 'aadhaar', label: 'Page 3 — Aadhaar Card' },
  { id: 'voter', label: 'Page 4 — Voter ID' },
  { id: 'doc5', label: 'Page 5 — Passport / Birth Certificate' },
]

export default function NewPanPacket({ apiKey }: { apiKey: string }) {
  const [files, setFiles] = useState<Record<string, File | null>>({})
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  const setFile = (id: string, f: File) => setFiles(prev => ({ ...prev, [id]: f }))
  const allUploaded = PAGES.every(p => files[p.id])

  const create = async () => {
    setStatus('processing'); setMsg('Creating new PAN packet...')
    await new Promise(r => setTimeout(r, 1500))
    setStatus('done'); setMsg('✓ New PAN packet ready! Download pages below.')
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>📦 New PAN Packet Creator</h2>
        <p>Upload 5 documents to create a complete new UTI PAN application submission packet.</p>
        <div className="badge-row">
          {['5-Page PDF', 'New PAN Application', 'Auto Order', 'Print Ready'].map(b => (
            <span className="badge" key={b}>{b}</span>
          ))}
        </div>
      </div>

      <div className="alert alert-info">
        📌 Upload documents in the correct order as required for new PAN applications.
      </div>

      {PAGES.map((p, i) => (
        <div className="card" key={p.id}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: files[p.id] ? 'var(--green)' : 'var(--bg3)',
              border: '2px solid ' + (files[p.id] ? 'var(--green)' : 'var(--border)'),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, flexShrink: 0
            }}>
              {files[p.id] ? '✓' : i + 1}
            </div>
            <div className="card-title" style={{ margin: 0 }}>{p.label}</div>
          </div>
          <UploadZone file={files[p.id] || null} onFile={f => setFile(p.id, f)} />
        </div>
      ))}

      <button className="btn btn-primary" onClick={create} disabled={!allUploaded || status === 'processing'}
        style={{ width: '100%', justifyContent: 'center', padding: 14, fontSize: 15 }}>
        {status === 'processing' ? <><span className="spinner" /> Creating...</> : '📦 Create New PAN Packet'}
      </button>

      {status !== 'idle' && (
        <div className={`status ${status === 'processing' ? 'loading' : status === 'done' ? 'success' : 'error'}`} style={{ marginTop: 16 }}>
          {status === 'processing' && <span className="spinner" />}
          {msg}
        </div>
      )}

      {status === 'done' && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-title">📥 Download Pages</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PAGES.map((p, i) => files[p.id] && (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg3)', padding: '10px 14px', borderRadius: 8 }}>
                <span style={{ fontSize: 13 }}>Page {i + 1}: {p.label.split('—')[1]?.trim()}</span>
                <button className="btn btn-primary btn-sm" onClick={() => {
                  const url = URL.createObjectURL(files[p.id]!)
                  const a = document.createElement('a'); a.href = url; a.download = `newpan-page-${i+1}.jpg`; a.click()
                }}>⬇️ Download</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
