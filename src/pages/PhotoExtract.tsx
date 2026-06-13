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

      // UTI Photo 413x531 at 200 DPI
      const uti = await processImage(file, { width: 413, height: 531, whiteBg: true, quality: 0.92 })
      out.push({ label: 'UTI Photo JPG', dataUrl: uti.dataUrl, filename: 'uti-photo.jpg', width: 413, height: 531, dpi: 200, format: 'JPG' })

      // Passport Photo 413x531 at 300 DPI
      const pp = await processImage(file, { width: 413, height: 531, quality: 0.92 })
      out.push({ label: 'Passport Photo JPG', dataUrl: pp.dataUrl, filename: 'passport-photo.jpg', width: 413, height: 531, dpi: 300, format: 'JPG' })

      // White Background
      const wb = await processImage(file, { width: 413, height: 531, whiteBg: true, quality: 0.95 })
      out.push({ label: 'White Background JPG', dataUrl: wb.dataUrl, filename: 'white-bg-photo.jpg', width: 413, height: 531, dpi: 200, format: 'JPG' })

      // Custom 35x45mm (≈413x531 ratio, standard passport)
      const custom = await processImage(file, { width: 354, height: 472, whiteBg: true, quality: 0.92 })
      out.push({ label: 'Passport Size JPG', dataUrl: custom.dataUrl, filename: 'passport-size.jpg', width: 354, height: 472, dpi: 300, format: 'JPG' })

      setResults(out)
      setStatus('done')
      setMsg('✓ 4 photos generated successfully')
    } catch (e: any) {
      setStatus('error')
      setMsg('Error: ' + (e.message || 'Processing failed'))
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>🖼️ UTI Photo Extraction</h2>
        <p>Upload a photo or scanned document to generate UTI-compliant photo formats.</p>
        <div className="badge-row">
          {['UTI Dimensions (413×531px)', 'White Background', 'Passport Size', 'DPI Correction'].map(b => (
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
          <div>• Size: 413 × 531 pixels</div>
          <div>• DPI: 200 (minimum)</div>
          <div>• Background: White</div>
          <div>• Format: JPEG/JPG</div>
          <div>• Face: Front facing</div>
          <div>• File size: Under 100KB</div>
        </div>
      </div>
    </div>
  )
}
