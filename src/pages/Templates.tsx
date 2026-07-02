import { useState, useEffect, useRef } from 'react'
import { FileSpreadsheet, Plus, Search, User, Loader2, Eye, Save, Download, ChevronLeft, Check, Edit2, Trash2, FileText, Sparkles, Upload, X } from 'lucide-react'
import { getTemplates, saveTemplate, updateTemplate, deleteTemplate, extractPlaceholders, fillTemplate, type Template } from '../lib/templateStorageApi'
import { searchApplicantsByName, searchApplicantByAadhaar, searchApplicantByPan, getApplicant, type ApplicantSearchResult } from '../lib/applicantsApi'
import { autoFillFromApplicant } from '../lib/applicantToTemplate'
import { downloadBlob, fileToBase64, extractTextFromPdf } from '../lib/utils'
import { callAI } from '../lib/aiApi'
import { generateDocxBlob, buildDocxFilename } from '../lib/templateToDocx'

type View = 'list' | 'editor' | 'fill'

export default function Templates({ apiKeys, selectedAi, autoFailover }: { apiKeys: any; selectedAi: string; autoFailover: boolean }) {
  const [view, setView] = useState<View>('list')
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { setTemplates(await getTemplates()) } finally { setLoading(false) }
  }

  if (view === 'editor') {
    return (<TemplateEditor template={activeTemplate} apiKeys={apiKeys} selectedAi={selectedAi} autoFailover={autoFailover} onSaved={() => { setView('list'); setActiveTemplate(null); load() }} onCancel={() => { setView('list'); setActiveTemplate(null) }} />)
  }
  if (view === 'fill' && activeTemplate) {
    return (<TemplateFiller template={activeTemplate} onClose={() => { setView('list'); setActiveTemplate(null) }} />)
  }

  return (
    <div className="page">
      <div className="page-header"><h2>Templates</h2><p>Reusable document templates with placeholder fields — fill manually or pull data straight from a saved applicant.</p></div>
      <div className="card"><button className="btn btn-primary" onClick={() => { setActiveTemplate(null); setView('editor') }}><Plus size={14} /> New Template</button></div>
      {loading ? (<div style={{ padding: 32, textAlign: 'center' }}><Loader2 size={20} className="spin" /></div>) : templates.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>No templates yet.</div>
      ) : (
        <div className="card">
          <div className="card-title">{templates.length} Template{templates.length !== 1 ? 's' : ''}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {templates.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg3)' }}>
                <div><div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{extractPlaceholders(t.content).length} fields · updated {new Date(t.updatedAt).toLocaleDateString()}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-primary" onClick={() => { setActiveTemplate(t); setView('fill') }}><FileSpreadsheet size={14} /> Fill</button>
                  <button className="btn btn-secondary" onClick={() => { setActiveTemplate(t); setView('editor') }}><Edit2 size={14} /></button>
                  <button className="btn btn-ghost" onClick={async () => { if (confirm(`Delete template "${t.name}"?`)) { await deleteTemplate(t.id); load() } }}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TemplateEditor({ template, apiKeys, selectedAi, autoFailover, onSaved, onCancel }: { template: Template | null; apiKeys: any; selectedAi: string; autoFailover: boolean; onSaved: () => void; onCancel: () => void }) {
  const [name, setName] = useState(template?.name || '')
  const [content, setContent] = useState(template?.content || '')
  const [saving, setSaving] = useState(false)
  const [aiFile, setAiFile] = useState<File | null>(null)
  const [aiStatus, setAiStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [aiMsg, setAiMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const placeholders = extractPlaceholders(content)

  async function handleSave() {
    if (!name.trim() || !content.trim()) return
    setSaving(true)
    try {
      if (template) { await updateTemplate(template.id, { name, content }) }
      else { const samples = placeholders.map(key => ({ key, sample: '' })); await saveTemplate(name, content, samples) }
      onSaved()
    } finally { setSaving(false) }
  }

  async function handleAiGenerate() {
    if (!aiFile || !apiKeys.gemini) return
    setAiStatus('loading'); setAiMsg('Reading document...')
    try {
      let textContent = ''; const mime = aiFile.type
      if (mime === 'text/plain') { textContent = await aiFile.text() }
      else if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        setAiMsg('Extracting text from Word document...')
        const mammoth = await import('mammoth')
        const arrayBuffer = await aiFile.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        textContent = result.value
      } else if (mime === 'application/pdf') {
        setAiMsg('Extracting text from PDF...')
        textContent = await extractTextFromPdf(aiFile)
      } else {
        setAiMsg('Sending scanned document to AI...')
        const b64 = await fileToBase64(aiFile)
        const readPrompt = `Read every word of this document carefully. It contains a mix of Telugu and/or English text (if both, read both). Extract the COMPLETE full text of the document, preserving structure, paragraphs, and headings. Return ONLY the plain text content, no commentary.`
        // SMART ROUTING: Force Gemini for Telugu Document Extraction
        textContent = await callAI(apiKeys, readPrompt, 'gemini', autoFailover, b64, mime)
      }
      setAiMsg('Generating template structure with placeholders...')
      const templatePrompt = `You are a document template generator for government certificates and affidavits. Below is the text of an official document. It may be in Telugu, English, or both.
Your task:
1. Convert this document into a reusable template.
2. Replace ALL person-specific, date-specific, and number-specific values with {{PLACEHOLDER}} tokens in UPPERCASE_WITH_UNDERSCORES.
3. Keep all static text, headings, clauses, and structure exactly as-is.
4. If it is Telugu text, keep the Telugu script but replace the specific values with {{PLACEHOLDER}} tokens.
5. Common placeholders to use: {{NAME}}, {{FATHER_NAME}}, {{HUSBAND_NAME}}, {{DATE_OF_BIRTH}}, {{ADDRESS}}, {{AADHAAR_NUMBER}}, {{PAN_NUMBER}}, {{VOTER_ID_NUMBER}}, {{MOBILE}}, {{SURVEY_NUMBER}}, {{EXTENT}}, {{VILLAGE}}, {{MANDAL}}, {{DISTRICT}}, {{REGISTRATION_NUMBER}}, {{DATE}}, {{ISSUE_DATE}}, {{SALE_DATE}}.
6. Create new placeholder names as needed for other specific values.
Return ONLY the template text with {{PLACEHOLDER}} tokens — no explanation, no JSON, no markdown. Just the raw template string.
DOCUMENT TEXT:
${textContent.slice(0, 15000)}`
      // We still force Gemini for placeholder generation because it's the best at Telugu
      const templateText = await callAI(apiKeys, templatePrompt, 'gemini', autoFailover)
      setContent(templateText.trim())
      if (!name.trim()) {
        const firstLine = templateText.split('\n').find(l => l.trim().length > 3 && l.trim().length < 80)
        if (firstLine) setName(firstLine.replace(/{{[^}]+}}/g, '').trim().slice(0, 60))
      }
      setAiStatus('done'); setAiMsg('✓ Template generated successfully!')
    } catch (err: any) { setAiStatus('error'); setAiMsg('Error: ' + (err.message || 'Unknown error.')) }
  }

  return (
    <div className="page">
      <button className="btn btn-ghost" onClick={onCancel} style={{ marginBottom: 16 }}><ChevronLeft size={14} /> Back to Templates</button>
      {apiKeys.gemini && (
        <div className="card" style={{ marginBottom: 16, border: '1px solid var(--accent)', background: 'var(--accent-bg)' }}>
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Sparkles size={16} color="var(--accent)" /> AI Template Generator</div>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>Upload any document (PDF, image, Word .docx, or .txt) — AI will read it and auto-generate a reusable template with <code style={{ background: 'var(--bg3)', padding: '1px 4px', borderRadius: 4 }}>{'{{PLACEHOLDERS}}'}</code>.</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.txt" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { setAiFile(f); setAiStatus('idle'); setAiMsg('') } }} />
            <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}><Upload size={14} /> {aiFile ? 'Change File' : 'Upload Document'}</button>
            {aiFile && (
              <>
                <span style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>📄 {aiFile.name}<button onClick={() => { setAiFile(null); setAiStatus('idle'); setAiMsg('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text3)' }}><X size={12} /></button></span>
                <button className="btn btn-primary" onClick={handleAiGenerate} disabled={aiStatus === 'loading'}>
                  {aiStatus === 'loading' ? <><Loader2 size={14} className="spin" /> Generating...</> : <><Sparkles size={14} /> Generate Template</>}
                </button>
              </>
            )}
          </div>
          {aiMsg && (
            <div style={{ marginTop: 10, fontSize: 12, padding: '8px 12px', borderRadius: 6, background: aiStatus === 'error' ? '#fee2e2' : aiStatus === 'done' ? '#dcfce7' : 'var(--bg3)', color: aiStatus === 'error' ? '#dc2626' : aiStatus === 'done' ? '#16a34a' : 'var(--text)' }}>
              {aiStatus === 'loading' && <Loader2 size={12} className="spin" style={{ display: 'inline', marginRight: 6 }} />}{aiMsg}
            </div>
          )}
        </div>
      )}
      <div className="card">
        <div className="card-title">{template ? 'Edit Template' : 'New Template'}</div>
        <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Template Name</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Income Certificate" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)', marginBottom: 16 }} />
        <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Template Content</label>
        <textarea value={content} onChange={e => setContent(e.target.value)} rows={18} placeholder={'This is to certify that {{NAME}}, S/O {{FATHER_NAME}}, residing at {{ADDRESS}}, ...'} style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)', fontFamily: 'monospace', fontSize: 13, resize: 'vertical', marginBottom: 12 }} />
        {placeholders.length > 0 && (<div style={{ marginBottom: 16 }}><div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>Detected fields ({placeholders.length}):</div><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{placeholders.map(p => <span key={p} className="badge">{p}</span>)}</div></div>)}
        <button className="btn btn-primary" onClick={handleSave} disabled={saving || !name.trim() || !content.trim()}>{saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />} Save Template</button>
      </div>
    </div>
  )
}

function TemplateFiller({ template, onClose }: { template: Template; onClose: () => void }) {
  const placeholders = extractPlaceholders(template.content)
  const [applicant, setApplicant] = useState<any>(null)
  const [values, setValues] = useState<Record<string, string>>(Object.fromEntries(placeholders.map(p => [p, ''])))
  const [unmatched, setUnmatched] = useState<string[]>(placeholders)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<ApplicantSearchResult[]>([])
  const [showSearch, setShowSearch] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function runSearch() {
    const q = query.trim()
    if (q.length < 2) return
    setSearching(true)
    try {
      let r: ApplicantSearchResult[]
      if (/^\d{12}$/.test(q.replace(/\s/g, ''))) r = await searchApplicantByAadhaar(q)
      else if (/^[A-Za-z]{5}\d{4}[A-Za-z]$/.test(q)) r = await searchApplicantByPan(q)
      else r = await searchApplicantsByName(q)
      setResults(r)
    } finally { setSearching(false) }
  }

  async function selectApplicant(id: string) {
    const { applicant: full } = await getApplicant(id)
    setApplicant(full)
    const { values: autoValues, unmatched: stillUnmatched } = autoFillFromApplicant(placeholders, full)
    setValues(prev => ({ ...prev, ...autoValues }))
    setUnmatched(stillUnmatched)
    setShowSearch(false)
  }

  const filledPreview = fillTemplate(template.content, values)
  const allFilled = placeholders.every(p => values[p]?.trim())

  async function saveFilledRecord() {
    try { await fetch('/api/filled-documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ applicant_id: applicant?.id || null, template_id: template.id, filled_content: filledPreview, field_values: values }) }); setSaved(true) } catch {}
  }

  async function handleDownloadTxt() {
    const blob = new Blob([filledPreview], { type: 'text/plain' }); downloadBlob(blob, `${template.name.replace(/\s+/g, '_')}.txt`); setSaving(true); await saveFilledRecord(); setSaving(false)
  }
  async function handleDownloadDocx() {
    setSaving(true); try { const blob = await generateDocxBlob(filledPreview, { title: template.name, applicantName: applicant?.full_name }); downloadBlob(blob, buildDocxFilename(template.name, applicant?.full_name)); await saveFilledRecord() } finally { setSaving(false) }
  }
  async function handleDownloadPdf() {
    setSaving(true); try {
      const { jsPDF } = await import('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm' as any); const doc = new jsPDF({ unit: 'pt', format: 'a4' }); const margin = 56; const pageWidth = doc.internal.pageSize.getWidth(); const usableWidth = pageWidth - margin * 2
      doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.text(template.name.toUpperCase(), pageWidth / 2, margin, { align: 'center' })
      doc.setFont('helvetica', 'normal'); doc.setFontSize(11); const lines = doc.splitTextToSize(filledPreview, usableWidth); doc.text(lines, margin, margin + 36, { lineHeightFactor: 1.5 })
      const filename = buildDocxFilename(template.name, applicant?.full_name).replace(/\.docx$/, '.pdf'); doc.save(filename); await saveFilledRecord()
    } finally { setSaving(false) }
  }

  return (
    <div className="page">
      <button className="btn btn-ghost" onClick={onClose} style={{ marginBottom: 16 }}><ChevronLeft size={14} /> Back to Templates</button>
      <div className="card">
        <div className="card-title">Fill: {template.name}</div>
        {showSearch && (
          <>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>Search for an applicant to auto-fill matching fields, or skip and fill everything manually below.</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input type="text" placeholder="Search by name, Aadhaar, or PAN..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && runSearch()} style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)' }} />
              <button className="btn btn-primary" onClick={runSearch} disabled={searching}>{searching ? <Loader2 size={14} className="spin" /> : <Search size={14} />}</button>
              <button className="btn btn-secondary" onClick={() => setShowSearch(false)}>Skip — Fill Manually</button>
            </div>
            {results.length > 0 && (<div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>{results.map(r => (<button key={r.id} onClick={() => selectApplicant(r.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg3)', cursor: 'pointer', textAlign: 'left', color: 'var(--text)' }}><User size={14} color="var(--text3)" /><div><div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{r.full_name}</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.aadhaar_number && `Aadhaar: ${r.aadhaar_number}`}</div></div></button>))}</div>)}
          </>
        )}
        {applicant && (<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: 'var(--accent-bg)', border: '1px solid var(--accent)', marginBottom: 16 }}><span style={{ fontSize: 13 }}><Check size={14} style={{ verticalAlign: -2, marginRight: 6 }} color="var(--accent)" /> Auto-filled from <strong>{applicant.full_name}</strong> ({placeholders.length - unmatched.length}/{placeholders.length} fields matched)</span><button className="btn btn-ghost" onClick={() => setShowSearch(true)}>Change</button></div>)}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {placeholders.map(p => (<div key={p}><label style={{ fontSize: 11, display: 'block', marginBottom: 4, color: unmatched.includes(p) ? 'var(--amber, #d97706)' : 'var(--text3)' }}>{p.replace(/_/g, ' ')}{unmatched.includes(p) && applicant && ' (not on file — enter manually)'}</label><input type="text" value={values[p] || ''} onChange={e => setValues(v => ({ ...v, [p]: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `${unmatched.includes(p) && applicant ? 'var(--amber, #d97706)' : 'var(--border)'}`, background: 'var(--bg3)', color: 'var(--text)' }} /></div>))}
        </div>
        {!allFilled && (<p style={{ fontSize: 12, color: 'var(--amber, #d97706)', marginBottom: 12 }}>Some fields are still empty — they will appear as raw placeholder tokens in the output until filled.</p>)}
      </div>
      <div className="card">
        <div className="card-title"><Eye size={16} style={{ marginRight: 6, verticalAlign: -3 }} />Preview</div>
        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 13, lineHeight: 1.6, background: 'var(--bg3)', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>{filledPreview}</pre>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn btn-primary" onClick={handleDownloadDocx} disabled={saving}>{saving ? <Loader2 size={14} className="spin" /> : <FileText size={14} />} Download as Word (.docx)</button>
          <button className="btn btn-secondary" onClick={handleDownloadPdf} disabled={saving}><Download size={14} /> Download as PDF</button>
          <button className="btn btn-secondary" onClick={handleDownloadTxt} disabled={saving}><Download size={14} /> Download as Text (.txt)</button>
          {saved && (<span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent)' }}><Check size={14} /> Saved to history</span>)}
        </div>
      </div>
    </div>
  )
}