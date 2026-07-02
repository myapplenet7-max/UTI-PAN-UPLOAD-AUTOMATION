import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import UploadZone from '../components/UploadZone'
import { fileToBase64 } from '../lib/utils'
import { callAI } from '../lib/aiApi'
import ApplicantMatchPicker from '../components/ApplicantMatchPicker'
import FieldDataEditor from '../components/FieldDataEditor'

export default function FullDocExtract({ apiKeys, selectedAi, autoFailover, navigate }: { apiKeys: any; selectedAi: string; autoFailover: boolean; navigate?: (p: any) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'editing'>('idle')
  const [msg, setMsg] = useState('')
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [savedApplicant, setSavedApplicant] = useState<any>(null)

  const extract = async () => {
    if (!file) return
    setStatus('processing'); setMsg('AI is reading the full page document...')
    try {
      const b64 = await fileToBase64(file)
      const prompt = `You are a data extraction AI. Read this document. Return ONLY JSON. No greetings. Extract fields: applicant_name, father_name, date_of_birth, aadhaar_number, pan_number, address. If blank, null.`
      const response = await callAI(apiKeys, prompt, selectedAi, autoFailover, b64, file.type as any, true)
      let clean = response.replace(/```json/g, '').replace(/```/g, '').trim()
      const start = clean.indexOf('{'); const end = clean.lastIndexOf('}')
      if(start !== -1 && end !== -1) clean = clean.substring(start, end + 1)
      const data = JSON.parse(clean)
      setFormData(data)
      setStatus('done'); setMsg('✓ Data extracted!')
    } catch (e: any) {
      setStatus('error'); setMsg('Error: ' + e.message)
    }
  }

  const handleEditData = (newData: Record<string, any>) => {
    setFormData(newData)
    setStatus('editing')
  }

  return (
    <div className="page">
      <div className="page-header"><h2>📄 Tool B: Full Document Extract</h2><p>For full-page documents (Aadhaar, certificates, filled forms). No cropping, just plain text extraction.</p></div>

      <div className="card">
        <div className="card-title">Upload Document</div>
        <UploadZone file={file} onFile={setFile} accept="image/*,application/pdf" label="Upload A4 form or certificate" />
        {file && (
          <div style={{ marginTop: 16 }}><button className="btn btn-primary" onClick={extract} disabled={status === 'processing'}>
            {status === 'processing' ? <Loader2 className="spin" size={14} /> : '🤖 Extract Text'}
          </button></div>
        )}
      </div>

      {status !== 'idle' && (<div className={`status ${status === 'processing' ? 'loading' : status === 'error' ? 'error' : 'success'}`}>{status === 'processing' && <span className="spinner" />}{msg}</div>)}

      {Object.keys(formData).length > 0 && status === 'done' && (
        <>
          <div className="card">
            <div className="card-title">Edit Extracted Data</div>
            <FieldDataEditor data={formData} onSave={(d) => handleEditData(d)} onCancel={() => setStatus('done')} />
          </div>
          <button className="btn btn-primary" onClick={() => setStatus('editing')} style={{ width: '100%' }}>Proceed to Save</button>
        </>
      )}
      
      {status === 'editing' && !savedApplicant && (
        <ApplicantMatchPicker extractedData={formData} documentType="full_doc" fileName={file?.name} onSaved={(a) => { setSavedApplicant(a); setStatus('done') }} onCancel={() => setStatus('done')} />
      )}
    </div>
  )
}