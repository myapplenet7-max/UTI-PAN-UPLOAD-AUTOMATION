import { useRef, useState } from 'react'
import { Check, Loader2, ScanLine, UploadCloud, RefreshCw, Sparkles } from 'lucide-react'
import UploadZone from '../components/UploadZone'
import ResultCard from '../components/ResultCard'
import { fileToBase64, processImage, processImagePng } from '../lib/utils'
import { callAI } from '../lib/aiApi'
import { uploadDataUrl } from '../lib/uploadApi'
import { findLikelyMatches, searchApplicantsByName, saveExtractedDocument, type ApplicantSearchResult } from '../lib/applicantsApi'

type RegionId = 'aadhaar' | 'pan' | 'voter' | 'photo' | 'signature'
interface Region {
  id: RegionId; label: string; color: string; kind: 'id' | 'photo' | 'signature'; rect: { x: number; y: number; w: number; h: number } | null
}
const INITIAL_REGIONS: Region[] = [
  { id: 'aadhaar', label: 'Aadhaar Card', color: '#3b82f6', kind: 'id', rect: null },
  { id: 'pan', label: 'PAN Card', color: '#a855f7', kind: 'id', rect: null },
  { id: 'voter', label: 'Voter ID', color: '#06b6d4', kind: 'id', rect: null },
  { id: 'photo', label: 'Photo', color: '#22c55e', kind: 'photo', rect: null },
  { id: 'signature', label: 'Signature', color: '#f59e0b', kind: 'signature', rect: null },
]
const DOC_FIELDS: Record<string, string[]> = {
  aadhaar: ['name', 'date_of_birth', 'gender', 'aadhaar_number', 'address', 'father_name'],
  pan: ['name', 'father_name', 'date_of_birth', 'pan_number'],
  voter: ['name', 'relative_name', 'voter_id_number', 'date_of_birth', 'gender', 'address'],
}
interface RegionResult {
  regionId: RegionId; label: string; kind: Region['kind']; files: { label: string; dataUrl: string; filename: string; width: number; height: number; dpi: number; format: string }[]; extractedData?: Record<string, any>
}

export default function CombinedScan({ apiKeys, selectedAi, autoFailover, navigate }: { apiKeys: any; selectedAi: string; autoFailover: boolean; navigate?: (p: any) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const [regions, setRegions] = useState<Region[]>(INITIAL_REGIONS)
  const [activeRegion, setActiveRegion] = useState<RegionId>('aadhaar')
  const [drawing, setDrawing] = useState<{ x: number; y: number } | null>(null)
  const [status, setStatus] = useState<'idle' | 'processing' | 'extracted' | 'saving' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')
  const [results, setResults] = useState<RegionResult[]>([])
  const [combinedData, setCombinedData] = useState<Record<string, any>>({})
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [matches, setMatches] = useState<ApplicantSearchResult[]>([])
  const [matching, setMatching] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [manualQuery, setManualQuery] = useState('')
  const [manualResults, setManualResults] = useState<ApplicantSearchResult[]>([])
  const [savedApplicant, setSavedApplicant] = useState<any>(null)

  const onFile = (f: File) => {
    setFile(f); setImgUrl(URL.createObjectURL(f)); setRegions(INITIAL_REGIONS); setResults([]); setCombinedData({}); setSavedApplicant(null); setStatus('idle')
  }

  const getRelPos = (e: React.MouseEvent | React.TouchEvent) => {
    const el = containerRef.current
    if (!el) return { x: 0, y: 0 }
    const rect = el.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    let x = ((clientX - rect.left) / rect.width) * 100; let y = ((clientY - rect.top) / rect.height) * 100
    x = Math.max(0, Math.min(100, x)); y = Math.max(0, Math.min(100, y))
    return { x, y }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => { e.preventDefault(); setDrawing(getRelPos(e)) }
  const moveDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return
    const pos = getRelPos(e)
    const x = Math.min(drawing.x, pos.x), y = Math.min(drawing.y, pos.y)
    const w = Math.abs(pos.x - drawing.x), h = Math.abs(pos.y - drawing.y)
    setRegions(prev => prev.map(r => r.id === activeRegion ? { ...r, rect: { x, y, w, h } } : r))
  }
  const endDraw = () => setDrawing(null)
  const clearRegion = (id: RegionId) => setRegions(prev => prev.map(r => r.id === id ? { ...r, rect: null } : r))

  const cropRegion = (rect: { x: number; y: number; w: number; h: number }): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = imgRef.current
      if (!img) return reject(new Error('no image'))
      const canvas = document.createElement('canvas')
      const x = Math.round((rect.x / 100) * img.naturalWidth); const y = Math.round((rect.y / 100) * img.naturalHeight)
      const w = Math.round((rect.w / 100) * img.naturalWidth); const h = Math.round((rect.h / 100) * img.naturalHeight)
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, x, y, w, h, 0, 0, w, h)
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('crop failed')), 'image/jpeg', 0.95)
    })
  }

  const autoDetectRegions = async () => {
    if (!file || !apiKeys.gemini) { setStatus('error'); setMsg('Upload a file and provide a Gemini API key for auto-detection.'); return; }
    if (status === 'processing') { setMsg('Already processing, please wait...'); return; }
    setStatus('processing'); setMsg('AI is analyzing the scan to detect Aadhaar, PAN, Voter, Photo, Signature...')
    
    const timeout = setTimeout(() => {
        setStatus('error'); setMsg('Auto-detection timed out. The AI API may be busy. Please try drawing manually.');
    }, 45000);

    try {
      const b64 = await fileToBase64(file);
      const prompt = `This is a scanned A4 sheet containing multiple Indian government documents and photos. 
Your task is to locate the bounding boxes for the physical edges of each document shown. 
1. Aadhaar Card (Look for the black border around the white card)
2. PAN Card
3. Voter ID
4. Face Photo
5. Signature

Return a JSON array of objects. Each object MUST have: 
- "label": exactly one of "aadhaar", "pan", "voter", "photo", "signature".
- "box": [x, y, width, height] as percentages (0 to 100) relative to the image width and height.
Only return the objects you are highly confident about. Do not include items you cannot clearly see. Do not include the entire page.
Return ONLY valid JSON, do not wrap in code fences.`;
      // SMART ROUTING: Force Gemini for auto-detection (best spatial vision)
      const response = await callAI(apiKeys, prompt, 'groq', autoFailover, b64, 'image/jpeg')
      const clean = response.replace(/```json|```/g, '').trim();
      const detections = JSON.parse(clean);
      
      clearTimeout(timeout);
      
      if (!Array.isArray(detections) || detections.length === 0) { setStatus('error'); setMsg('AI could not detect any valid documents. Draw manually.'); return; }
      
      setRegions(prev => prev.map(r => {
        const found = detections.find((d: any) => d.label === r.id);
        if (found && Array.isArray(found.box) && found.box.length === 4) {
          const [x, y, w, h] = found.box; return { ...r, rect: { x, y, w, h } };
        }
        return r;
      }));
      setStatus('done'); setMsg(`✓ Auto-detected ${detections.length} items! Review the boxes and hit "Crop & Extract".`);
    } catch (e: any) { 
      clearTimeout(timeout); 
      setStatus('error'); 
      setMsg('Auto-detect error: ' + (e.message || 'Check API key or try manual drawing.')); 
    }
  }

  const processAll = async () => {
    const drawn = regions.filter(r => r.rect && r.rect.w > 1 && r.rect.h > 1)
    if (drawn.length === 0) { setStatus('error'); setMsg('Draw at least one region first.'); return; }
    setStatus('processing'); setMsg('Cropping regions...'); setResults([])
    try {
      const out: RegionResult[] = []; const merged: Record<string, any> = {}
      for (const region of drawn) {
        const blob = await cropRegion(region.rect!)
        const cropFile = new File([blob], `${region.id}.jpg`, { type: 'image/jpeg' })
        if (region.kind === 'id') {
          const processed = await processImagePng(cropFile, { width: 0, height: 0, threshold: 240 }) 
          const regionResult: RegionResult = { 
            regionId: region.id, label: region.label, kind: region.kind, 
            files: [{ label: `${region.label} JPG`, dataUrl: processed.dataUrl, filename: `${region.id}.jpg`, width: 1240, height: 877, dpi: 150, format: 'JPG' }] 
          }
          if (apiKeys.gemini || apiKeys.groq) {
            setMsg(`Reading ${region.label} with AI...`)
            try {
              const b64 = await fileToBase64(cropFile)
              const fields = DOC_FIELDS[region.id] || ['name', 'date_of_birth', 'id_number', 'address']
              const prompt = `Read this ${region.label} carefully. The document may contain a mix of Telugu and English text. Extract ONLY these fields: ${fields.join(', ')}. Rules: Return ONLY valid JSON, no other text, no markdown code fences. If a field is unreadable, set its value to null. For names, use exact spelling as printed (prefer English). For dates, use DD-MM-YYYY format. For id numbers, include them exactly as printed.`
              // SMART ROUTING: Force Groq for simple extraction on cards
              const response = await callAI(apiKeys, prompt, 'gemini', autoFailover, b64, 'image/jpeg')
              const clean = response.replace(/```json|```/g, '').trim()
              const info = JSON.parse(clean)
              regionResult.extractedData = info
              for (const [k, v] of Object.entries(info)) { if (v && !merged[k]) merged[k] = v }
            } catch (aiErr: any) { regionResult.extractedData = { AI_ERROR: aiErr.message || 'Unknown AI error' } }
          }
          out.push(regionResult)
        }
        if (region.kind === 'photo') {
          const uti = await processImage(cropFile, { width: 213, height: 213, whiteBg: true, quality: 0.85 })
          const custom3545 = await processImage(cropFile, { width: 413, height: 531, whiteBg: true, quality: 0.92 }) 
          const wb = await processImage(cropFile, { width: 213, height: 213, whiteBg: true, quality: 0.9 })
          out.push({ regionId: region.id, label: region.label, kind: region.kind, files: [
            { label: 'UTI Photo JPG (213×213)', dataUrl: uti.dataUrl, filename: 'uti-photo.jpg', width: 213, height: 213, dpi: 300, format: 'JPG' },
            { label: '3.5x4.5 Photo JPG (413×531)', dataUrl: custom3545.dataUrl, filename: '35x45-photo.jpg', width: 413, height: 531, dpi: 300, format: 'JPG' },
            { label: 'White Background Photo', dataUrl: wb.dataUrl, filename: 'white-bg-photo.jpg', width: 213, height: 213, dpi: 300, format: 'JPG' }
          ]})
        }
        if (region.kind === 'signature') {
          const sigJpg = await processImage(cropFile, { width: 400, height: 200, whiteBg: true, quality: 0.9 })
          const sigPng = await processImagePng(cropFile, { width: 400, height: 200, threshold: 200 })
          out.push({ regionId: region.id, label: region.label, kind: region.kind, files: [{ label: 'UTI Signature JPG (400×200)', dataUrl: sigJpg.dataUrl, filename: 'uti-signature.jpg', width: 400, height: 200, dpi: 600, format: 'JPG' }, { label: 'Signature PNG (Transparent)', dataUrl: sigPng.dataUrl, filename: 'signature-transparent.png', width: 400, height: 200, dpi: 600, format: 'PNG' }] })
        }
      }
      setResults(out); setCombinedData(merged); setStatus('extracted'); setMsg(`✓ ${out.length} region${out.length > 1 ? 's' : ''} processed`)
      if (Object.keys(merged).length > 0) { setMatching(true); findLikelyMatches(merged).then(setMatches).catch(() => setMatches([])).finally(() => setMatching(false)) }
    } catch (e: any) { setStatus('error'); setMsg('Error: ' + (e.message || 'Processing failed')) }
  }

  const saveUnderApplicant = async (applicantId?: string) => {
    setStatus('saving'); setMsg('Uploading files & saving records...')
    try {
      let resolvedApplicantId = applicantId; let finalApplicant: any = null; const customerName = combinedData.name || combinedData.full_name || combinedData.applicant_name
      for (const region of results) {
        const main = region.files[0]; setMsg(`Uploading ${region.label}...`)
        const fileUrl = await uploadDataUrl(main.dataUrl, main.filename, customerName)
        const result = await saveExtractedDocument({ documentType: region.regionId, fileName: main.filename, fileUrl, extractedData: region.kind === 'id' ? (region.extractedData || {}) : {}, applicantId: resolvedApplicantId })
        resolvedApplicantId = result.applicant.id; finalApplicant = result.applicant
      }
      setSavedApplicant(finalApplicant); setStatus('done'); setMsg(`✓ Saved all files for ${finalApplicant?.full_name || 'this customer'}`)
    } catch (e: any) { setStatus('error'); setMsg('Error saving: ' + (e.message || 'Save failed')) }
  }

  async function runManualSearch() { if (manualQuery.trim().length < 2) return; const r = await searchApplicantsByName(manualQuery); setManualResults(r) }

  const drawnCount = regions.filter(r => r.rect && r.rect.w > 1 && r.rect.h > 1).length

  return (
    <div className="page">
      <div className="page-header"><h2><ScanLine size={20} style={{ verticalAlign: -3, marginRight: 6 }} />Combined Scan (Multi-Doc)</h2><p>Upload one A4 page with Aadhaar + PAN + Voter ID + Photo + Signature all on it. Draw a box around each one present — they're auto-cropped, ID cards are AI-read, and everything is saved together under the customer's name.</p><div className="badge-row">{['One Scan → 5 Files', 'AI Extraction', 'Auto-Crop', 'Saved to Neon', 'Files on Vercel Blob'].map(b => (<span className="badge" key={b}>{b}</span>))}</div></div>
      {!apiKeys.gemini && (<div className="alert alert-warning">⚠️ Add a Gemini API key in the top bar for AI extraction of Aadhaar/PAN/Voter text — cropping & saving still work without it.</div>)}
      {!file && (<div className="card"><div className="card-title">Upload Combined Scan</div><UploadZone file={file} onFile={onFile} label="Upload one A4 scan with all documents on it" /></div>)}
      {imgUrl && status !== 'done' && (
        <div className="card">
          <div className="card-title">Select Region to Draw</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {regions.map(r => (<button key={r.id} className="btn btn-sm" style={{ border: `2px solid ${r.color}`, background: activeRegion === r.id ? r.color : 'transparent', color: activeRegion === r.id ? '#fff' : r.color }} onClick={() => setActiveRegion(r.id)}>{r.rect && r.rect.w > 1 ? '✓ ' : ''}{r.label}</button>))}
          </div>
          <div className="alert alert-info" style={{ fontSize: 12, marginBottom: 12 }}>💡 Select "{regions.find(r => r.id === activeRegion)?.label}" above, then drag on the scan below to draw a box around it. Only draw the documents actually present — skip the rest.</div>
          <div ref={containerRef} style={{ position: 'relative', width: '100%', maxWidth: 560, margin: '0 auto', cursor: 'crosshair', userSelect: 'none', touchAction: 'none' }} onMouseDown={startDraw} onMouseMove={moveDraw} onMouseUp={endDraw} onTouchStart={startDraw} onTouchMove={moveDraw} onTouchEnd={endDraw}>
            <img ref={imgRef} src={imgUrl} style={{ width: '100%', display: 'block', borderRadius: 8, border: '1px solid var(--border)' }} draggable={false} />
            {regions.map(r => r.rect && r.rect.w > 0.5 && r.rect.h > 0.5 && (<div key={r.id} style={{ position: 'absolute', left: `${r.rect.x}%`, top: `${r.rect.y}%`, width: `${r.rect.w}%`, height: `${r.rect.h}%`, border: `2px solid ${r.color}`, background: `${r.color}22`, pointerEvents: 'none', boxSizing: 'border-box' }}><span style={{ position: 'absolute', top: -20, left: 0, fontSize: 11, color: r.color, fontWeight: 600, background: 'var(--bg2)', padding: '1px 6px', borderRadius: 4 }}>{r.label}</span></div>))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>{regions.map(r => r.rect && (<button key={r.id} className="btn btn-sm" onClick={() => clearRegion(r.id)} style={{ fontSize: 12 }}>✕ Clear {r.label}</button>))}</div>
          <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={autoDetectRegions} disabled={!apiKeys.gemini || status === 'processing'}><Sparkles size={14} /> ✨ Auto-Detect Documents</button>
            <button className="btn btn-secondary" onClick={processAll} disabled={drawnCount === 0 || status === 'processing'}>{status === 'processing' ? <><span className="spinner" /> Processing...</> : `📋 Crop & Extract ${drawnCount > 0 ? `(${drawnCount})` : ''}`}</button>
            <button className="btn btn-ghost" onClick={() => onFile(file!)}><RefreshCw size={14} /> Reset Regions</button>
          </div>
        </div>
      )}
      {status !== 'idle' && status !== 'done' && (<div className={`status ${status === 'processing' || status === 'saving' ? 'loading' : status === 'error' ? 'error' : 'success'}`}>{(status === 'processing' || status === 'saving') && <span className="spinner" />}{msg}</div>)}
      {results.length > 0 && status !== 'done' && (
        <div className="card">
          <div className="card-title">Cropped & Extracted Files</div>
          {results.map(r => (<div key={r.regionId} style={{ marginBottom: 16 }}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{r.label}</div><div className="results-grid">{r.files.map((f, i) => <ResultCard key={i} item={f} />)}</div>{r.extractedData && (<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>{Object.entries(r.extractedData).map(([k, v]) => v ? (<div key={k} style={{ background: 'var(--bg3)', padding: '8px 12px', borderRadius: 8, fontSize: 12 }}><span style={{ color: 'var(--text3)' }}>{k.replace(/_/g, ' ')}: </span><span style={{ fontWeight: 500 }}>{String(v)}</span></div>) : null)}</div>)}</div>))}
        </div>
      )}
      {status === 'extracted' && (
        <div className="card" style={{ borderColor: 'var(--accent)' }}>
          <div className="card-title"><UploadCloud size={16} style={{ marginRight: 6, verticalAlign: -3 }} />Save All Files for "{combinedData.name || combinedData.full_name || 'this customer'}"</div>
          {matching && (<div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', color: 'var(--text3)' }}><Loader2 size={16} className="spin" /> Checking for an existing customer record...</div>)}
          {!matching && matches.length > 0 && (<><p style={{ fontSize: 12, color: 'var(--text3)', margin: '8px 0' }}>Found {matches.length} possible existing customer record(s) — merge into one, or create new below.</p><div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>{matches.map(m => (<button key={m.id} onClick={() => setSelectedId(m.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 8, textAlign: 'left', border: `1px solid ${selectedId === m.id ? 'var(--accent)' : 'var(--border)'}`, background: selectedId === m.id ? 'var(--accent-bg)' : 'var(--bg3)', cursor: 'pointer' }}><div><div style={{ fontWeight: 600, fontSize: 13 }}>{m.full_name || '(no name)'}</div><div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{m.aadhaar_number && `Aadhaar: ${m.aadhaar_number}`}{m.pan_number && `  PAN: ${m.pan_number}`} · {m.document_count} on file</div></div>{selectedId === m.id && <Check size={16} color="var(--accent)" />}</button>))}</div>{selectedId && (<button className="btn btn-primary" onClick={() => saveUnderApplicant(selectedId)} style={{ marginBottom: 12 }}><Check size={14} /> Merge into Selected Customer</button>)}</>)}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}><button className="btn btn-secondary" onClick={() => saveUnderApplicant(undefined)}>Create New Customer Record</button></div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}><input type="text" placeholder="Or search by name to merge..." value={manualQuery} onChange={e => setManualQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && runManualSearch()} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)' }} /><button className="btn btn-secondary" onClick={runManualSearch}>Search</button></div>
          {manualResults.map(m => (<button key={m.id} onClick={() => saveUnderApplicant(m.id)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg3)', marginBottom: 6, cursor: 'pointer' }}>{m.full_name}</button>))}
        </div>
      )}
      {status === 'done' && savedApplicant && (<div className="card" style={{ borderColor: 'var(--green)' }}><div className="card-title">✓ Saved to Customer Record</div><p style={{ fontSize: 13 }}>All cropped files (Aadhaar/PAN/Voter/Photo/Signature, whichever were drawn) are uploaded and linked to <strong>{savedApplicant.full_name || 'this customer'}</strong>.</p><button className="btn btn-primary" onClick={() => onFile(file!)} style={{ marginTop: 8 }}><ScanLine size={14} /> Scan Next Customer</button></div>)}
    </div>
  )
}