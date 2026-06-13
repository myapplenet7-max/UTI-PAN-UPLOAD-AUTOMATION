import { useState } from 'react'
import UploadZone from '../components/UploadZone'
import ResultCard from '../components/ResultCard'
import { processImage } from '../lib/utils'

interface Result {
  label: string; dataUrl: string; filename: string
  width: number; height: number; dpi: number; format: string
}

export default function PhotoExtract({ apiKey }: { apiKey: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')
  const [results, setResults] = useState<Result[]>([])

  const process = async () => {
    if (!file) return
    setStatus('processing'); setMsg('Processing image...'); setResults([])
    try {
      const out: Result[] = []

      // UTI Photo: 213x213 px @ 300 DPI, white bg, <30KB
      const uti = await processImage(file, { width: 213, height: 213, whiteBg: true, quality: 0.85 })
      out.push({ label: 'UTI Photo JPG (213×213)', dataUrl: uti.dataUrl, filename: 'uti-photo.jpg', width: 213, height: 213, dpi: 300, format: 'JPG' })

      // White Background version
      const wb = await processImage(file, { width: 213, height: 213, whiteBg: true, quality: 0.9 })
      out.push({ label: 'White Background JPG', dataUrl: wb.dataUrl, filename: 'white-bg-photo.jpg', width: 213, height: 213, dpi: 300, format: 'JPG' })

      // NSDL Photo size 197x276 px @ 200 DPI (alternate portal spec)
      const nsdl = await processImage(file, { width: 197, height: 276, whiteBg: true, quality: 0.9 })
      out.push({ label: 'NSDL Photo JPG (197×276)', dataUrl: nsdl.dataUrl, filename: 'nsdl-photo.jpg', width: 197, height: 276, dpi: 200, format: 'JPG' })

      setResults(out)
      setStatus('done')
      setMsg(`✓ ${out.length} photo formats generated successfully`)
    } catch (e: any) {
      setStatus('error')
      setMsg('Error: ' + (e.message || 'Processing failed'))
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>🖼️ UTI Photo Extraction</h2>
        <p>Upload a photo or scanned document to generate UTI/NSDL-compliant photo formats.</p>
        <div className="badge-row">
          {['UTI 213×213 @300DPI', 'NSDL 197×276 @200DPI', 'White Background', 'Under 30KB'].map(b => (
            <span className="badge" key={b}>{b}</span>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-title">Upload Photo</div>
        <UploadZone file={file} onFile={setFile} label="Upload face photo or scanned form" />
        {file && (
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-primary" onClick={process} disabled={status === 'processing'}>
              {status === 'processing' ? <><span className="spinner" /> Processing...</> : '⚡ Extract Photos'}
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

      {results.length > 0 && (
        <div className="card">
          <div className="card-title">Generated Photos</div>
          <div className="results-grid">
            {results.map((r, i) => <ResultCard key={i} item={r} />)}
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 8 }}>
        <div className="card-title">📐 UTI Photo Requirements</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, color: 'var(--text2)' }}>
          <div>• Size: 213 × 213 pixels (square)</div>
          <div>• DPI: 300</div>
          <div>• Background: White</div>
          <div>• Format: JPEG/JPG</div>
          <div>• Face: Front facing, centered</div>
          <div>• File size: Under 30KB</div>
        </div>
      </div>
    </div>
  )
}
