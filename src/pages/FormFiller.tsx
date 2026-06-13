import { useState } from 'react'
import UploadZone from '../components/UploadZone'
import { callClaude, fileToBase64 } from '../lib/utils'

export default function FormFiller({ apiKey }: { apiKey: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')
  const [formData, setFormData] = useState<Record<string, string>>({})

  const extract = async () => {
    if (!file || !apiKey) return
    setStatus('processing'); setMsg('AI is reading the UTI PAN form...'); setFormData({})
    try {
      const b64 = await fileToBase64(file)
      const prompt = `This is a filled UTI PAN application form. Extract ALL visible form fields and their values. Return as JSON with field names as keys. Include: applicant_name, father_name, mother_name, date_of_birth, gender, aadhaar_number, pan_number, mobile, email, address, pincode, city, state, income_source, and any other visible fields. Return ONLY valid JSON.`
      const response = await callClaude(apiKey, prompt, b64, file.type as any)
      const clean = response.replace(/```json|```/g, '').trim()
      const data = JSON.parse(clean)
      setFormData(data)
      setStatus('done')
      setMsg('✓ Form data extracted successfully')
    } catch (e: any) {
      setStatus('error')
      setMsg('Error: ' + (e.message || 'Extraction failed. Check API key.'))
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>📝 Auto Form Filler</h2>
        <p>Upload a filled UTI PAN application form — AI extracts all data automatically.</p>
        <div className="badge-row">
          {['AI OCR', 'Auto Extract', 'All Fields', 'Requires API Key'].map(b => (
            <span className="badge" key={b}>{b}</span>
          ))}
        </div>
      </div>

      {!apiKey && (
        <div className="alert alert-warning">
          ⚠️ This feature requires a Claude API key. Please enter your key in the top bar.
        </div>
      )}

      <div className="card">
        <div className="card-title">Upload Filled UTI PAN Form</div>
        <UploadZone file={file} onFile={setFile} label="Upload scanned UTI PAN form" />
        {file && (
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-primary" onClick={extract} disabled={!apiKey || status === 'processing'}>
              {status === 'processing' ? <><span className="spinner" /> Extracting...</> : '🤖 Extract Form Data'}
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

      {Object.keys(formData).length > 0 && (
        <div className="card">
          <div className="card-title">📋 Extracted Form Data</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {Object.entries(formData).map(([k, v]) => v ? (
              <div key={k} style={{ background: 'var(--bg3)', padding: '10px 14px', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'capitalize', marginBottom: 4 }}>
                  {k.replace(/_/g, ' ')}
                </div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{String(v)}</div>
              </div>
            ) : null)}
          </div>
        </div>
      )}
    </div>
  )
}
