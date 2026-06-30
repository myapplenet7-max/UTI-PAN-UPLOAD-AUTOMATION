// src/pages/Templates.tsx
//
// New sidebar page: "Templates" — create reusable document templates with
// {{PLACEHOLDER}} tokens, and fill them either manually or by pulling data
// straight from a saved Applicant record (the feature this file delivers).
//
// Add to App.tsx:
//   import Templates from './pages/Templates'
//   ...
//   { id: 'templates', label: 'Templates', icon: FileSpreadsheet }
//   ...
//   case 'templates': return <Templates />

import { useState, useEffect } from 'react'
import {
  FileSpreadsheet, Plus, Search, User, Loader2, Eye,
  Save, Download, ChevronLeft, Check, Edit2, Trash2, FileText,
} from 'lucide-react'
import {
  getTemplates, saveTemplate, updateTemplate, deleteTemplate,
  extractPlaceholders, fillTemplate, type Template,
} from '../lib/templateStorageApi'
import {
  searchApplicantsByName, searchApplicantByAadhaar, searchApplicantByPan,
  getApplicant, type ApplicantSearchResult,
} from '../lib/applicantsApi'
import { autoFillFromApplicant } from '../lib/applicantToTemplate'
import { downloadBlob } from '../lib/utils'
import { generateDocxBlob, buildDocxFilename } from '../lib/templateToDocx'

type View = 'list' | 'editor' | 'fill'

export default function Templates() {
  const [view, setView] = useState<View>('list')
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      setTemplates(await getTemplates())
    } finally {
      setLoading(false)
    }
  }

  if (view === 'editor') {
    return (
      <TemplateEditor
        template={activeTemplate}
        onSaved={() => { setView('list'); setActiveTemplate(null); load() }}
        onCancel={() => { setView('list'); setActiveTemplate(null) }}
      />
    )
  }

  if (view === 'fill' && activeTemplate) {
    return (
      <TemplateFiller
        template={activeTemplate}
        onClose={() => { setView('list'); setActiveTemplate(null) }}
      />
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Templates</h2>
        <p>Reusable document templates with placeholder fields — fill manually or pull data straight from a saved applicant.</p>
      </div>

      <div className="card">
        <button className="btn btn-primary" onClick={() => { setActiveTemplate(null); setView('editor') }}>
          <Plus size={14} /> New Template
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 32, textAlign: 'center' }}><Loader2 size={20} className="spin" /></div>
      ) : templates.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>
          No templates yet. Create one to get started — e.g. an Income Certificate
          or Affidavit with fields like NAME, FATHER_NAME, ADDRESS.
        </div>
      ) : (
        <div className="card">
          <div className="card-title">{templates.length} Template{templates.length !== 1 ? 's' : ''}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {templates.map(t => (
              <div
                key={t.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)',
                  background: 'var(--bg3)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                    {extractPlaceholders(t.content).length} fields ·
                    {' '}updated {new Date(t.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-primary" onClick={() => { setActiveTemplate(t); setView('fill') }}>
                    <FileSpreadsheet size={14} /> Fill
                  </button>
                  <button className="btn btn-secondary" onClick={() => { setActiveTemplate(t); setView('editor') }}>
                    <Edit2 size={14} />
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={async () => {
                      if (confirm(`Delete template "${t.name}"?`)) {
                        await deleteTemplate(t.id); load()
                      }
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Template Editor ──────────────────────────────────────────────────────

function TemplateEditor({
  template, onSaved, onCancel,
}: { template: Template | null; onSaved: () => void; onCancel: () => void }) {
  const [name, setName] = useState(template?.name || '')
  const [content, setContent] = useState(template?.content || '')
  const [saving, setSaving] = useState(false)

  const placeholders = extractPlaceholders(content)

  async function handleSave() {
    if (!name.trim() || !content.trim()) return
    setSaving(true)
    try {
      if (template) {
        await updateTemplate(template.id, { name, content })
      } else {
        const samples = placeholders.map(key => ({ key, sample: '' }))
        await saveTemplate(name, content, samples)
      }
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <button className="btn btn-ghost" onClick={onCancel} style={{ marginBottom: 16 }}>
        <ChevronLeft size={14} /> Back to Templates
      </button>

      <div className="card">
        <div className="card-title">{template ? 'Edit Template' : 'New Template'}</div>

        <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>
          Template Name
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Income Certificate"
          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)', marginBottom: 16 }}
        />

        <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>
          Template Content — wrap field names in double curly braces, e.g. NAME in braces, to mark fillable fields
        </label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={14}
          placeholder={'This is to certify that {{NAME}}, S/O {{FATHER_NAME}}, residing at {{ADDRESS}}, ...'}
          style={{
            width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)',
            background: 'var(--bg3)', color: 'var(--text)', fontFamily: 'monospace', fontSize: 13,
            resize: 'vertical', marginBottom: 12,
          }}
        />

        {placeholders.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>
              Detected fields ({placeholders.length}):
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {placeholders.map(p => (
                <span key={p} className="badge">{p}</span>
              ))}
            </div>
          </div>
        )}

        <button className="btn btn-primary" onClick={handleSave} disabled={saving || !name.trim() || !content.trim()}>
          {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
          Save Template
        </button>
      </div>
    </div>
  )
}

// ── Template Filler — the core "fill from applicant" feature ────────────

function TemplateFiller({ template, onClose }: { template: Template; onClose: () => void }) {
  const placeholders = extractPlaceholders(template.content)

  const [applicant, setApplicant] = useState<any>(null)
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(placeholders.map(p => [p, '']))
  )
  const [unmatched, setUnmatched] = useState<string[]>(placeholders)

  // Applicant search
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
    } finally {
      setSearching(false)
    }
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
    try {
      await fetch('/api/filled-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicant_id: applicant?.id || null,
          template_id: template.id,
          filled_content: filledPreview,
          field_values: values,
        }),
      })
      setSaved(true)
    } catch {
      // non-fatal — download still succeeds even if the history save fails
    }
  }

  async function handleDownloadTxt() {
    const blob = new Blob([filledPreview], { type: 'text/plain' })
    downloadBlob(blob, `${template.name.replace(/\s+/g, '_')}.txt`)
    setSaving(true)
    await saveFilledRecord()
    setSaving(false)
  }

  async function handleDownloadDocx() {
    setSaving(true)
    try {
      const blob = await generateDocxBlob(filledPreview, {
        title: template.name,
        applicantName: applicant?.full_name,
      })
      downloadBlob(blob, buildDocxFilename(template.name, applicant?.full_name))
      await saveFilledRecord()
    } finally {
      setSaving(false)
    }
  }

  async function handleDownloadPdf() {
    setSaving(true)
    try {
      const { jsPDF } = await import('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm' as any)
      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      const margin = 56
      const pageWidth = doc.internal.pageSize.getWidth()
      const usableWidth = pageWidth - margin * 2

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text(template.name.toUpperCase(), pageWidth / 2, margin, { align: 'center' })

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      const lines = doc.splitTextToSize(filledPreview, usableWidth)
      doc.text(lines, margin, margin + 36, { lineHeightFactor: 1.5 })

      const filename = buildDocxFilename(template.name, applicant?.full_name).replace(/\.docx$/, '.pdf')
      doc.save(filename)
      await saveFilledRecord()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <button className="btn btn-ghost" onClick={onClose} style={{ marginBottom: 16 }}>
        <ChevronLeft size={14} /> Back to Templates
      </button>

      <div className="card">
        <div className="card-title">Fill: {template.name}</div>

        {showSearch && (
          <>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>
              Search for an applicant to auto-fill matching fields, or skip and fill everything manually below.
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                type="text"
                placeholder="Search by name, Aadhaar, or PAN..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && runSearch()}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)' }}
              />
              <button className="btn btn-primary" onClick={runSearch} disabled={searching}>
                {searching ? <Loader2 size={14} className="spin" /> : <Search size={14} />}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowSearch(false)}>
                Skip — Fill Manually
              </button>
            </div>

            {results.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {results.map(r => (
                  <button
                    key={r.id}
                    onClick={() => selectApplicant(r.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                      borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg3)',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <User size={14} color="var(--text3)" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{r.full_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                        {r.aadhaar_number && `Aadhaar: ${r.aadhaar_number}`}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {applicant && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderRadius: 8, background: 'var(--accent-bg)',
            border: '1px solid var(--accent)', marginBottom: 16,
          }}>
            <span style={{ fontSize: 13 }}>
              <Check size={14} style={{ verticalAlign: -2, marginRight: 6 }} color="var(--accent)" />
              Auto-filled from <strong>{applicant.full_name}</strong>
              {' '}({placeholders.length - unmatched.length}/{placeholders.length} fields matched)
            </span>
            <button className="btn btn-ghost" onClick={() => setShowSearch(true)}>Change</button>
          </div>
        )}

        {/* Field inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {placeholders.map(p => (
            <div key={p}>
              <label style={{
                fontSize: 11, display: 'block', marginBottom: 4,
                color: unmatched.includes(p) ? 'var(--amber, #d97706)' : 'var(--text3)',
              }}>
                {p.replace(/_/g, ' ')}
                {unmatched.includes(p) && applicant && ' (not on file — enter manually)'}
              </label>
              <input
                type="text"
                value={values[p] || ''}
                onChange={e => setValues(v => ({ ...v, [p]: e.target.value }))}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8,
                  border: `1px solid ${unmatched.includes(p) && applicant ? 'var(--amber, #d97706)' : 'var(--border)'}`,
                  background: 'var(--bg3)', color: 'var(--text)',
                }}
              />
            </div>
          ))}
        </div>

        {!allFilled && (
          <p style={{ fontSize: 12, color: 'var(--amber, #d97706)', marginBottom: 12 }}>
            Some fields are still empty — they will appear as raw placeholder tokens in the output until filled.
          </p>
        )}
      </div>

      {/* Live preview */}
      <div className="card">
        <div className="card-title"><Eye size={16} style={{ marginRight: 6, verticalAlign: -3 }} />Preview</div>
        <pre style={{
          whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 13, lineHeight: 1.6,
          background: 'var(--bg3)', padding: 16, borderRadius: 8, border: '1px solid var(--border)',
        }}>
          {filledPreview}
        </pre>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn btn-primary" onClick={handleDownloadDocx} disabled={saving}>
            {saving ? <Loader2 size={14} className="spin" /> : <FileText size={14} />}
            Download as Word (.docx)
          </button>
          <button className="btn btn-secondary" onClick={handleDownloadPdf} disabled={saving}>
            <Download size={14} />
            Download as PDF
          </button>
          <button className="btn btn-secondary" onClick={handleDownloadTxt} disabled={saving}>
            <Download size={14} />
            Download as Text (.txt)
          </button>
          {saved && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent)' }}>
              <Check size={14} /> Saved to history
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
