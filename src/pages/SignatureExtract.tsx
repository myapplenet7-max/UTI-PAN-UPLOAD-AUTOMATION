import { useState } from 'react'
import UploadZone from '../components/UploadZone'
import ResultCard from '../components/ResultCard'
import { processImage, processImagePng } from '../lib/utils'

export default function SignatureExtract({ apiKey }: { apiKey: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')
  const [results, setResults] = useState<any[]>([])

  const process = async () => {
    if (!file) return
    setStatus('processing'); setMsg('Processing signature...'); setResults([])
    try {
      const out: any[] = []

      // Standard signature PNG with transparent background
      const png = await processImagePng(file, { width: 400, height: 150, threshold: 200 })
      out.push({ label: 'Signature PNG (Transparent)', dataUrl: png.dataUrl, filename: 'signature.png', width: 400, height: 150, dpi: 96, format: 'PNG' })

      // White background JPG
      const jpg = await processImage(file, { width: 400, height: 150, whiteBg: true, quality: 0.95 })
      out.push({ label: 'Signature JPG (White BG)', dataUrl: jpg.dataUrl, filename: 'signature.jpg', width: 400, height: 150, dpi: 96, format: 'JPG' })

      // UTI Signature size 281x106
      const uti = await processImage(file, { width: 281, height: 106, whiteBg: true, quality: 0.95 })
      out.push({ label: 'UTI Signature JPG', dataUrl: uti.dataUrl, filename: 'uti-signature.jpg', width: 281, height: 106, dpi: 200, format: 'JPG' })

      setResults(out)
      setStatus('done')
      setMsg('✓ 3 signature formats generated')
    } catch (e: any) {
      setStatus('error')
      setMsg('Error: ' + (e.message || 'Processing failed'))
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>✍️ Signature Extraction</h2>
        <p>Upload a document or signature image to extract clean signature formats for UTI PAN processing.</p>
        <div className="badge-row">
          {['Auto Crop', 'Transparent PNG', 'White Background JPG', 'UTI Resize (281×106)'].map(b => (
            <span className="badge" key={b}>{b}</span>
          ))}
        </div>
      </div>

      <div className="alert alert-info">
        💡 For best results, upload a photo of only the signature on white paper, or a scanned document where the signature is clearly visible.
      </div>

      <div className="card">
        <div className="card-title">Upload Signature / Document</div>
        <UploadZone file={file} onFile={setFile} label="Upload signature image or scanned document" />
        {file && (
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-primary" onClick={process} disabled={status === 'processing'}>
              {status === 'processing' ? <><span className="spinner" /> Processing...</> : '✍️ Extract Signature'}
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
          <div className="card-title">Extracted Signatures</div>
          <div className="results-grid">
            {results.map((r, i) => <ResultCard key={i} item={r} />)}
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 8 }}>
        <div className="card-title">📐 UTI Signature Requirements</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, color: 'var(--text2)' }}>
          <div>• Size: 281 × 106 pixels</div>
          <div>• DPI: 200 (minimum)</div>
          <div>• Background: White</div>
          <div>• Format: JPEG/JPG</div>
          <div>• Ink: Black/Blue</div>
          <div>• File size: Under 30KB</div>
        </div>
      </div>
    </div>
  )
}
