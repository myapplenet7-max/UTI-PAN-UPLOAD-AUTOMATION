import { useState } from 'react'
import UploadZone from '../components/UploadZone'
import { fileToBase64 } from '../lib/utils'
import { callAI } from '../lib/aiApi'
import ApplicantMatchPicker from '../components/ApplicantMatchPicker'

export default function FormFiller({ apiKeys, selectedAi, autoFailover, navigate }: { apiKeys: any; selectedAi: string; autoFailover: boolean; navigate?: (p: any) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [savedApplicant, setSavedApplicant] = useState<any>(null)

  const extract = async () => {
    if (!file) return
    
    // Check if ANY AI key is available
    const hasKey = apiKeys.gemini || apiKeys.openrouter || apiKeys.groq || apiKeys.huggingface;
    if (!hasKey) {
      setStatus('error'); setMsg('Please enter an API key in the top bar.'); return;
    }

    setStatus('processing'); setMsg('AI is reading the UTI PAN form...'); setFormData({})
    try {
      const b64 = await fileToBase64(file)
      const prompt = `This is a filled UTI PAN application form. Extract ALL visible form fields and their values. Return as JSON with field names as keys. Include: applicant_name, father_name, mother_name, date_of_birth, gender, aadhaar_number, pan_number, mobile, email, address, pincode, city, state, income_source, and any other visible fields. Return ONLY valid JSON.`
      
      // Use the selected AI
      const response = await callAI(apiKeys, prompt, selectedAi, autoFailover, b64, file.type as any)
      const clean = response.replace(/```json|```/g, '').trim()
      const data = JSON.parse(clean)
      setFormData(data)
      setSavedApplicant(null)
      setStatus('done')
      setMsg('✓ Form data extracted successfully')
    } catch (e: any) {
      setStatus('error')
      setMsg('Error: ' + (e.message || 'Extraction failed. Check API key.'))
    }
  }

  // Check if any key exists for the UI warning
  const hasAnyKey = apiKeys.gemini || apiKeys.openrouter || apiKeys.groq || apiKeys.huggingface;

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

      {!hasAnyKey && (
        <div className="alert alert-warning">
          ⚠️ This feature requires an API key. Please enter your key in the top bar.
        </div>
      )}

      <div className="card">
        <div className="card-title">Upload Filled UTI PAN Form</div>
        <UploadZone file={file} onFile={setFile} label="Upload scanned UTI PAN form" />
        {file && (
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-primary" onClick={extract} disabled={!hasAnyKey || status === 'processing'}>
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

      {Object.keys(formData).length > 0 && !(formData as any).AI_ERROR && !savedApplicant && (
        <ApplicantMatchPicker
          extractedData={formData}
          documentType="uti_pan_form"
          fileName={file?.name}
          onSaved={(applicant) => setSavedApplicant(applicant)}
          onCancel={() => setFormData({})}
        />
      )}

      {savedApplicant && (
        <div className="card" style={{ borderColor: 'var(--green)' }}>
          <div className="card-title">✓ Saved to Applicant Record</div>
          <p style={{ fontSize: 13 }}>
            Data saved for <strong>{savedApplicant.full_name}</strong>.
            {' '}View full record in the{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); navigate?.('applicants') }}>
              Applicants
            </a>{' '}page.
          </p>
        </div>
      )}
    </div>
  )
}