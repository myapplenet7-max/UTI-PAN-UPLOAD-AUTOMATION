// src/components/ApplicantMatchPicker.tsx
import { useState, useEffect } from 'react'
import { Search, UserPlus, Users, Check, Loader2 } from 'lucide-react'
import {
  findLikelyMatches,
  searchApplicantsByName,
  saveExtractedDocument,
  type ApplicantSearchResult,
} from '../lib/applicantsApi'

interface Props {
  extractedData: Record<string, any>
  documentType: string
  fileName?: string
  ocrText?: string
  confidence?: Record<string, number>
  onSaved: (applicant: any, document: any) => void
  onCancel: () => void
}

export default function ApplicantMatchPicker({
  extractedData, documentType, fileName, ocrText, confidence,
  onSaved, onCancel,
}: Props) {
  const [loading, setLoading] = useState(true)
  const [matches, setMatches] = useState<ApplicantSearchResult[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mode, setMode] = useState<'choosing' | 'manual-search' | 'saving'>('choosing')
  const [manualQuery, setManualQuery] = useState('')
  const [manualResults, setManualResults] = useState<ApplicantSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    findLikelyMatches(extractedData)
      .then(results => { if (!cancelled) setMatches(results) })
      .catch(() => { if (!cancelled) setMatches([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function runManualSearch() {
    if (manualQuery.trim().length < 2) return
    setSearching(true)
    try {
      const results = await searchApplicantsByName(manualQuery)
      setManualResults(results)
    } catch {
      setManualResults([])
    } finally {
      setSearching(false)
    }
  }

  async function handleSave(applicantId?: string) {
    setMode('saving')
    setError(null)
    try {
      const result = await saveExtractedDocument({
        documentType,
        fileName,
        extractedData,
        ocrText,
        confidence,
        applicantId: applicantId || undefined,
      })
      onSaved(result.applicant, result.document)
    } catch (e: any) {
      setError(e.message || 'Failed to save')
      setMode('choosing')
    }
  }

  const displayName = extractedData.name || extractedData.full_name || extractedData.applicant_name || 'this applicant'

  return (
    <div className="card" style={{ borderColor: 'var(--accent)' }}>
      <div className="card-title">
        <Users size={16} style={{ marginRight: 6, verticalAlign: -3 }} />
        Save Extracted Data for "{displayName}"
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 0', color: 'var(--text3)' }}>
          <Loader2 size={16} className="spin" />
          Checking for existing applicant records...
        </div>
      )}

      {!loading && mode === 'choosing' && (
        <>
          {matches.length > 0 && (
            <>
              <p style={{ fontSize: 12, color: 'var(--text3)', margin: '8px 0' }}>
                Found {matches.length} possible existing record{matches.length > 1 ? 's' : ''} —
                merge this document's data into one of them, or create a new record below.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {matches.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedId(m.id)}
                    className={`match-row ${selectedId === m.id ? 'selected' : ''}`}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', borderRadius: 8, textAlign: 'left',
                      border: `1px solid ${selectedId === m.id ? 'var(--accent)' : 'var(--border)'}`,
                      background: selectedId === m.id ? 'var(--accent-bg)' : 'var(--bg3)',
                      cursor: 'pointer', color: 'var(--text)' // Added text color
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{m.full_name || '(no name)'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                        {m.aadhaar_number && `Aadhaar: ${m.aadhaar_number}`}
                        {m.pan_number && `  PAN: ${m.pan_number}`}
                        {m.father_name && `  S/O: ${m.father_name}`}
                        {' '}· {m.document_count} document{m.document_count !== 1 ? 's' : ''} on file
                      </div>
                    </div>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'var(--bg2)', color: 'var(--text3)' }}>
                      matched by {m.matched_on}
                    </span>
                    {selectedId === m.id && <Check size={16} color="var(--accent)" />}
                  </button>
                ))}
              </div>

              {selectedId && (
                <button className="btn btn-primary" onClick={() => handleSave(selectedId)} style={{ marginBottom: 12 }}>
                  <Check size={14} /> Merge into Selected Applicant
                </button>
              )}
            </>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => setMode('manual-search')}>
              <Search size={14} /> Search for a Different Applicant
            </button>
            <button className="btn btn-secondary" onClick={() => handleSave(undefined)}>
              <UserPlus size={14} /> Create New Applicant Record
            </button>
            <button className="btn btn-ghost" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </>
      )}

      {mode === 'manual-search' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              type="text"
              placeholder="Search by name..."
              value={manualQuery}
              onChange={e => setManualQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runManualSearch()}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)' }}
            />
            <button className="btn btn-primary" onClick={runManualSearch} disabled={searching}>
              {searching ? <Loader2 size={14} className="spin" /> : <Search size={14} />}
            </button>
          </div>

          {manualResults.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {manualResults.map(m => (
                <button
                  key={m.id}
                  onClick={() => handleSave(m.id)}
                  className="match-row"
                  style={{
                    display: 'flex', justifyContent: 'space-between', padding: '10px 14px',
                    borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg3)',
                    cursor: 'pointer', textAlign: 'left', color: 'var(--text)' // Added text color
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{m.full_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                      {m.document_count} document{m.document_count !== 1 ? 's' : ''} on file
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => setMode('choosing')}>← Back</button>
          </div>
        </>
      )}

      {mode === 'saving' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 0', color: 'var(--text3)' }}>
          <Loader2 size={16} className="spin" /> Saving...
        </div>
      )}

      {error && (
        <p style={{ fontSize: 12, color: 'var(--red, #ef4444)', marginTop: 8 }}>{error}</p>
      )}
    </div>
  )
}