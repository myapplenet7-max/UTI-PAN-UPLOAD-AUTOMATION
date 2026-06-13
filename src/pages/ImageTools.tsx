import { useState } from 'react'
import UploadZone from '../components/UploadZone'
import ResultCard from '../components/ResultCard'
import { processImage, processImagePng, compressToTargetKb, downloadDataUrl } from '../lib/utils'

const TOOLS = [
  { id: 'resize', label: 'Custom Resize', emoji: '📐' },
  { id: 'compress', label: 'Compress (KB)', emoji: '🗜️' },
  { id: 'whitebg', label: 'White Background', emoji: '⬜' },
  { id: 'png2jpg', label: 'PNG → JPG', emoji: '🔄' },
  { id: 'jpg2png', label: 'JPG → PNG', emoji: '🔄' },
  { id: 'dpi', label: 'DPI Changer', emoji: '🖨️' },
  { id: 'sheet', label: 'A4 Photo Sheet', emoji: '🗂️' },
]

export default function ImageTools() {
  const [active, setActive] = useState('resize')
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<any | null>(null)
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')
  const [w, setW] = useState(413)
  const [h, setH] = useState(531)
  const [targetKb, setTargetKb] = useState(100)
  const [dpi, setDpi] = useState(200)
  const [layout, setLayout] = useState(4)

  const process = async () => {
    if (!file) return
    setStatus('processing'); setMsg('Processing...'); setResult(null)
    try {
      let out: any

      if (active === 'resize') {
        const r = await processImage(file, { width: w, height: h, whiteBg: true })
        out = { label: `Resized ${w}×${h}`, dataUrl: r.dataUrl, filename: `resized-${w}x${h}.jpg`, width: w, height: h, dpi: 96, format: 'JPG' }
      } else if (active === 'compress') {
        const r = await compressToTargetKb(file, targetKb)
        const img = new Image(); img.src = r.dataUrl
        out = { label: `Compressed ~${targetKb}KB`, dataUrl: r.dataUrl, filename: 'compressed.jpg', width: img.width || 0, height: img.height || 0, dpi: 96, format: 'JPG' }
      } else if (active === 'whitebg') {
        const r = await processImage(file, { whiteBg: true })
        out = { label: 'White Background', dataUrl: r.dataUrl, filename: 'white-bg.jpg', width: r.width, height: r.height, dpi: 96, format: 'JPG' }
      } else if (active === 'png2jpg') {
        const r = await processImage(file, { whiteBg: true })
        out = { label: 'Converted JPG', dataUrl: r.dataUrl, filename: 'converted.jpg', width: r.width, height: r.height, dpi: 96, format: 'JPG' }
      } else if (active === 'jpg2png') {
        const r = await processImagePng(file, {})
        out = { label: 'Converted PNG', dataUrl: r.dataUrl, filename: 'converted.png', width: 0, height: 0, dpi: 96, format: 'PNG' }
      } else if (active === 'dpi') {
        const r = await processImage(file, {})
        out = { label: `${dpi} DPI Image`, dataUrl: r.dataUrl, filename: `dpi-${dpi}.jpg`, width: r.width, height: r.height, dpi, format: 'JPG' }
      } else if (active === 'sheet') {
        // Generate A4 photo sheet
        const photoImg = await new Promise<HTMLImageElement>((res, rej) => {
          const img = new Image(); img.onload = () => res(img); img.onerror = rej
          img.src = URL.createObjectURL(file)
        })
        const canvas = document.createElement('canvas')
        const a4W = 2480, a4H = 3508
        canvas.width = a4W; canvas.height = a4H
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, a4W, a4H)

        const photoW = 413, photoH = 531
        const cols = layout <= 2 ? 1 : 2
        const rows = Math.ceil(layout / cols)
        const gap = 40, margin = 80

        for (let i = 0; i < layout; i++) {
          const col = i % cols, row = Math.floor(i / cols)
          const x = margin + col * (photoW + gap)
          const y = margin + row * (photoH + gap)
          ctx.drawImage(photoImg, x, y, photoW, photoH)
        }

        const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
        out = { label: `A4 Sheet (${layout} photos)`, dataUrl, filename: `photo-sheet-${layout}.jpg`, width: a4W, height: a4H, dpi: 300, format: 'JPG' }
      }

      setResult(out)
      setStatus('done')
      setMsg('✓ Done!')
    } catch (e: any) {
      setStatus('error'); setMsg('Error: ' + e.message)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>🔧 Image Tools</h2>
        <p>Resize, compress, convert format, change DPI and generate photo sheets.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, marginBottom: 20 }}>
        {TOOLS.map(t => (
          <button key={t.id}
            className={`btn ${active === t.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flexDirection: 'column', padding: '12px 8px', gap: 4, justifyContent: 'center' }}
            onClick={() => { setActive(t.id); setFile(null); setResult(null); setStatus('idle') }}
          >
            <span style={{ fontSize: 18 }}>{t.emoji}</span>
            <span style={{ fontSize: 11 }}>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-title">{TOOLS.find(t => t.id === active)?.label}</div>

        {active === 'resize' && (
          <div className="form-row" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Width (px)</label>
              <input className="form-input" type="number" value={w} onChange={e => setW(+e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Height (px)</label>
              <input className="form-input" type="number" value={h} onChange={e => setH(+e.target.value)} />
            </div>
          </div>
        )}
        {active === 'compress' && (
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Target size (KB): {targetKb} KB</label>
            <input type="range" min="10" max="500" value={targetKb}
              onChange={e => setTargetKb(+e.target.value)}
              style={{ width: '100%', accentColor: 'var(--accent)' }} />
          </div>
        )}
        {active === 'dpi' && (
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">DPI</label>
            <select className="form-select" value={dpi} onChange={e => setDpi(+e.target.value)}>
              {[72, 96, 150, 200, 300, 600].map(d => <option key={d} value={d}>{d} DPI</option>)}
            </select>
          </div>
        )}
        {active === 'sheet' && (
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Number of photos on A4</label>
            <select className="form-select" value={layout} onChange={e => setLayout(+e.target.value)}>
              {[1, 2, 4, 6, 8, 12].map(n => <option key={n} value={n}>{n} Photos</option>)}
            </select>
          </div>
        )}

        <UploadZone file={file} onFile={setFile} label="Upload image" />

        {file && (
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-primary" onClick={process} disabled={status === 'processing'}>
              {status === 'processing' ? <><span className="spinner" /> Processing...</> : '⚡ Process Image'}
            </button>
          </div>
        )}
      </div>

      {status !== 'idle' && (
        <div className={`status ${status === 'processing' ? 'loading' : status === 'done' ? 'success' : 'error'}`}>
          {status === 'processing' && <span className="spinner" />}
          {msg}
        </div>
      )}

      {result && (
        <div className="card">
          <div className="card-title">Result</div>
          <div className="results-grid">
            <ResultCard item={result} />
          </div>
        </div>
      )}
    </div>
  )
}
