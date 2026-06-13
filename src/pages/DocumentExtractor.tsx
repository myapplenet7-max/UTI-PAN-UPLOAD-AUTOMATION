import { useState } from 'react'
import UploadZone from '../components/UploadZone'
import ResultCard from '../components/ResultCard'
import { callClaude, fileToBase64, processImage } from '../lib/utils'

const DOC_TYPES = [
  { id: 'aadhaar', label: 'Aadhaar Card', emoji: '🪪' },
  { id: 'pan', label: 'PAN Card', emoji: '💳' },
  { id: 'voter', label: 'Voter ID', emoji: '🗳️' },
  { id: 'passport', label: 'Passport', emoji: '📘' },
  { id: 'ssc', label: 'SSC Memo', emoji: '📜' },
  { id: 'birth', label: 'Birth Certificate', emoji: '📋' },
]

export default function DocumentExtractor({ apiKey }: { apiKey: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [docType, setDocType] = useState('aadhaar')
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [extractedInfo, setExtractedInfo] = useState<Record<string, string>>({})

  const process = async () => {
    if (!file) return
    setStatus('processing'); setMsg('Processing document...'); setResults([]); setExtractedInfo({})

    try {
      const out: any[] = []

      // Process image at document size
      const processed = await processImage(file, { width: 1240, height: 877, whiteBg: true, quality: 0.92 })
      const docLabel = DOC_TYPES.find(d => d.id === docType)?.label || docType
      out.push({
        label: `${docLabel} JPG`,
        dataUrl: processed.dataUrl,
        filename: `${docType}.jpg`,
        width: 1240, height: 877, dpi: 150, format: 'JPG'
      })

      // AI extraction if API key provided
      if (apiKey) {
        setMsg('Extracting document information with AI...')
        const b64 = await fileToBase64(file)
        const prompt = `This is a ${docLabel}. Extract all visible text information from this document and return it as JSON with relevant fields like name, date_of_birth, id_number, address, etc. Return ONLY valid JSON, no other text.`
        try {
          const response = await callClaude(apiKey, prompt, b64, file.type as any)
          const clean = response.replace(/```json|```/g, '').trim()
          const info = JSON.parse(clean)
          setExtractedInfo(info)
        } catch {
          // AI extraction failed, continue without it
        }
      }

      setResults(out)
      setStatus('done')
      setMsg('✓ Document extracted successfully')
    } catch (e: any) {
      setStatus('error')
      setMsg('Error: ' + (e.message || 'Processing failed'))
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>📋 Document Extractor</h2>
        <p>Crop and process ID documents for UTI PAN submissions. AI extracts text data automatically.</p>
        <div className="badge-row">
          {['Aadhaar', 'PAN Card', 'Voter ID', 'Passport', 'AI Text Extraction'].map(b => (
            <span className="badge" key={b}>{b}</span>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-title">Select Document Type</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
          {DOC_TYPES.map(d => (
            <button
              key={d.id}
              className={`btn ${docType === d.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'center', flexDirection: 'column', padding: '12px 8px', gap: 4 }}
              onClick={() => setDocType(d.id)}
            >
              <span style={{ fontSize: 20 }}>{d.emoji}</span>
              <span style={{ fontSize: 11 }}>{d.label}</span>
            </button>
          ))}
        </div>

        <UploadZone file={file} onFile={setFile} label={`Upload ${DOC_TYPES.find(d => d.id === docType)?.label}`} />

        {file && (
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-primary" onClick={process} disabled={status === 'processing'}>
              {status === 'processing' ? <><span className="spinner" /> Processing...</> : '📋 Extract Document'}
            </button>
            {!apiKey && <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 12 }}>Add API key for AI text extraction</span>}
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
          <div className="card-title">Extracted Document</div>
          <div className="results-grid">
            {results.map((r, i) => <ResultCard key={i} item={r} />)}
          </div>
        </div>
      )}

      {Object.keys(extractedInfo).length > 0 && (
        <div className="card">
          <div className="card-title">🤖 AI Extracted Information</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {Object.entries(extractedInfo).map(([k, v]) => (
              <div key={k} style={{ background: 'var(--bg3)', padding: '10px 14px', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'capitalize', marginBottom: 4 }}>
                  {k.replace(/_/g, ' ')}
                </div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{String(v)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
