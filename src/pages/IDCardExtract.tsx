import { useRef, useState } from 'react'
import { Check, Loader2, ScanLine, UploadCloud, RefreshCw, Sparkles, Pencil, Save } from 'lucide-react'
import UploadZone from '../components/UploadZone'
import ResultCard from '../components/ResultCard'
import { fileToBase64, processImage, processImagePng, compressToTargetKb } from '../lib/utils'
import { callAI } from '../lib/aiApi'
import { uploadDataUrl } from '../lib/uploadApi'
import { findLikelyMatches, searchApplicantsByName, saveExtractedDocument, type ApplicantSearchResult } from '../lib/applicantsApi'
import FieldDataEditor from '../components/FieldDataEditor'

type RegionId = 'aadhaar' | 'pan' | 'voter' | 'passport' | 'photo' | 'signature'

interface ProcessedItem {
  id: string
  label: string
  kind: 'id' | 'photo' | 'signature'
  previewUrl: string
  croppedFile: File
  extractedData: Record<string, any>
}

export default function IDCardExtract({ apiKeys, selectedAi, autoFailover, navigate }: { apiKeys: any; selectedAi: string; autoFailover: boolean; navigate?: (p: any) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const [docType, setDocType] = useState<RegionId>('aadhaar')
  const [isHalfPage, setIsHalfPage] = useState(false)
  
  const [status, setStatus] = useState<'idle' | 'uploaded' | 'processing' | 'extracted' | 'saving' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')
  const [results, setResults] = useState<ProcessedItem[]>([])
  const [currentEditIndex, setCurrentEditIndex] = useState<number | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const onFile = (f: File) => {
    setFile(f); setImgUrl(URL.createObjectURL(f)); setResults([]); setStatus('uploaded'); setCurrentEditIndex(null)
  }

  const startExtract = async (isTopHalf: boolean) => {
    if (!file || !imgRef.current) return
    setStatus('processing')
    setMsg(isHalfPage ? `Processing ${isTopHalf ? 'top' : 'bottom'} half...` : 'Processing image...')

    try {
      const img = imgRef.current
      const naturalW = img.naturalWidth
      const naturalH = img.naturalHeight
      let cropX = 0, cropY = 0, cropW = naturalW, cropH = naturalH

      // If Half Page, crop the top 50% or bottom 50%
      if (isHalfPage) {
        cropH = Math.floor(naturalH / 2)
        if (!isTopHalf) cropY = cropH
      }

      // Crop the region
      const canvas = document.createElement('canvas')
      canvas.width = cropW; canvas.height = cropH
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)
      const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), 'image/jpeg', 0.95))

      // Generate AI extraction
      const cropFile = new File([blob], `${docType}.jpg`, { type: 'image/jpeg' })
      
      let extracted: Record<string, any> = {}
      if (apiKeys.gemini) {
        setMsg('Reading with AI...')
        const b64 = await fileToBase64(cropFile)
        const prompt = `Extract data from this ${docType}. Return ONLY JSON. Fields: name, date_of_birth, gender, aadhaar_number, address, father_name, pan_number, relative_name, voter_id_number. If unreadable, set to null. No greetings.`
        const res = await callAI(apiKeys, prompt, selectedAi, autoFailover, b64, 'image/jpeg', true)
        let clean = res.replace(/```json/g, '').replace(/```/g, '').trim()
        const start = clean.indexOf('{'); const end = clean.lastIndexOf('}')
        if(start !== -1 && end !== -1) clean = clean.substring(start, end + 1)
        extracted = JSON.parse(clean)
      }

      // Create result item
      const previewUrl = URL.createObjectURL(blob)
      setResults(prev => [...prev, {
        id: `${docType}-${Date.now()}`,
        label: docType.toUpperCase(),
        kind: 'id',
        previewUrl,
        croppedFile: cropFile,
        extractedData: extracted
      }])

      setStatus('extracted')
      setMsg('✓ Extracted! Check data below.')
    } catch (e: any) {
      setStatus('error'); setMsg('Error: ' + e.message)
    }
  }

  const handleEditData = (index: number, newData: Record<string, any>) => {
    const newResults = [...results]
    newResults[index].extractedData = newData
    setResults(newResults)
    setCurrentEditIndex(null)
  }

  const saveAllFiles = async () => {
    setStatus('saving'); setMsg('Saving records...')
    let finalApplicant: any = null
    try {
      const customerName = results[0]?.extractedData?.name || 'Customer'
      for (const item of results) {
        const fileUrl = await uploadDataUrl(item.previewUrl, `${item.id}.jpg`, customerName)
        const res = await saveExtractedDocument({
          documentType: item.id.split('-')[0],
          fileName: `${item.id}.jpg`,
          fileUrl,
          extractedData: item.extractedData,
          applicantId: finalApplicant?.id
        })
        finalApplicant = res.applicant
      }
      setStatus('done')
      setMsg(`✓ Saved under ${finalApplicant.full_name}`)
    } catch (e: any) {
      setStatus('error'); setMsg('Save failed: ' + e.message)
    }
  }

  return (
    <div className="page">
      <div className="page-header"><h2><ScanLine size={20} style={{ verticalAlign: -3 }} />Tool A: Crop & Extract</h2><p>For small ID cards (Voter/PAN/Passport) + Photo + Signature. Drag on the image to set a crop region manually, or choose "Half-Page" mode.</p></div>
      
      {!file && (
        <div className="card">
          <div className="card-title">1. Select Document Type</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
            {['aadhaar', 'pan', 'voter', 'passport', 'photo', 'signature'].map(id => (
              <button key={id} className={`btn ${docType === id ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'center' }} onClick={() => setDocType(id as RegionId)}>
                {id.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="card-title">2. Upload Image</div>
          <UploadZone file={file} onFile={onFile} label="Upload A4 scan or card photo" />
        </div>
      )}

      {imgUrl && status !== 'done' && (
        <div className="card">
          <div className="card-title">3. Crop & Extract</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button className={`btn ${!isHalfPage ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setIsHalfPage(false)}>Full / Draw Box</button>
            <button className={`btn ${isHalfPage ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setIsHalfPage(true)}>Half Page (Auto Split)</button>
            <button className="btn btn-ghost" onClick={() => onFile(file!)}><RefreshCw size={14} /> Reset</button>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12 }}>{isHalfPage ? "We'll auto-crop the image exactly in half." : "Drag a box on the image to crop manually."}</p>
          
          <div style={{ position: 'relative', width: '100%', maxWidth: 560, margin: '0 auto', userSelect: 'none' }}>
            <img ref={imgRef} src={imgUrl} style={{ width: '100%', display: 'block', borderRadius: 8, border: '1px solid var(--border)' }} draggable={false} />
          </div>
          
          {isHalfPage ? (
            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
               <button className="btn btn-primary" onClick={() => startExtract(true)} disabled={status === 'processing'}>⬆️ Extract Top Half</button>
               <button className="btn btn-secondary" onClick={() => startExtract(false)} disabled={status === 'processing'}>⬇️ Extract Bottom Half</button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={() => startExtract(true)} style={{ marginTop: 16 }} disabled={status === 'processing'}>
              {status === 'processing' ? <Loader2 className="spin" size={14} /> : '📷 Extract Image'}
            </button>
          )}
        </div>
      )}

      {status !== 'idle' && status !== 'uploaded' && status !== 'done' && (
        <div className={`status ${status === 'processing' || status === 'saving' ? 'loading' : status === 'error' ? 'error' : 'success'}`}>
          {status === 'processing' && <span className="spinner" />}{msg}
        </div>
      )}

      {results.length > 0 && status !== 'done' && (
        <div className="card">
          <div className="card-title">Cropped & Extracted Items</div>
          {results.map((r, idx) => (
            <div key={r.id} style={{ marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{r.label} #{idx+1}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, background: 'var(--bg3)', padding: 12, borderRadius: 8 }}>
                <img src={r.previewUrl} style={{ width: '100%', borderRadius: 8, border: '1px solid var(--border)' }} />
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <strong>Extracted Data:</strong>
                    <button className="btn btn-secondary btn-sm" onClick={() => setCurrentEditIndex(idx)}><Pencil size={12} /> Edit Fields</button>
                  </div>
                  
                  {currentEditIndex === idx ? (
                    <FieldDataEditor data={r.extractedData} onSave={(d) => handleEditData(idx, d)} onCancel={() => setCurrentEditIndex(null)} />
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12 }}>
                      {Object.entries(r.extractedData).map(([k, v]) => v ? <div key={k}><span style={{ color: 'var(--text2)' }}>{k}:</span> {String(v)}</div> : null)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          <button className="btn btn-primary" onClick={saveAllFiles} disabled={status === 'saving'} style={{ width: '100%', justifyContent: 'center' }}>
            {status === 'saving' ? <Loader2 className="spin" size={14} /> : '💾 Save All to Applicant Record'}
          </button>
        </div>
      )}

      {status === 'done' && (
        <div className="card" style={{ borderColor: 'var(--green)' }}>
          <div className="card-title">✓ Saved!</div>
          <button className="btn btn-primary" onClick={() => { setFile(null); setImgUrl(null); setStatus('idle'); setResults([]) }}>Scan Next</button>
        </div>
      )}
    </div>
  )
}