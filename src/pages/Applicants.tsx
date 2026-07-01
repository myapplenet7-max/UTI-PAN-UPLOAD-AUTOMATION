import { useState, useEffect } from 'react'
import { Search, User, FileText, Loader2, ChevronLeft } from 'lucide-react'
import { listApplicants, searchApplicantsByName, searchApplicantByAadhaar, searchApplicantByPan, getApplicant, updateApplicant, type ApplicantSearchResult } from '../lib/applicantsApi'
import { downloadBlob } from '../lib/utils'

const DOC_TYPE_LABELS: Record<string, string> = { aadhaar: 'Aadhaar Card', pan: 'PAN Card', voter: 'Voter ID', passport: 'Passport', ssc: 'SSC Memo', birth: 'Birth Certificate', land: 'Land Document', affidavit: 'Affidavit', resume: 'Resume', other: 'Other' }

export default function Applicants() {
  const [list, setList] = useState<ApplicantSearchResult[]>([]); const [loading, setLoading] = useState(true); const [query, setQuery] = useState(''); const [searching, setSearching] = useState(false); const [selectedId, setSelectedId] = useState<string | null>(null)
  useEffect(() => { loadAll() }, [])
  async function loadAll() { setLoading(true); try { const applicants = await listApplicants(100); setList(applicants) } finally { setLoading(false) } }
  async function handleSearch() {
    const q = query.trim(); if (!q) return loadAll()
    setSearching(true); try {
      let results: ApplicantSearchResult[]
      if (/^\d{12}$/.test(q.replace(/\s/g, ''))) results = await searchApplicantByAadhaar(q)
      else if (/^[A-Za-z]{5}\d{4}[A-Za-z]$/.test(q.trim())) results = await searchApplicantByPan(q)
      else results = await searchApplicantsByName(q)
      setList(results)
    } finally { setSearching(false) }
  }
  if (selectedId) { return <ApplicantDetail id={selectedId} onBack={() => { setSelectedId(null); loadAll() }} /> }
  return (
    <div className="page">
      <div className="page-header"><h2>👥 Applicants</h2><p>All saved applicant records, built up from extracted documents over time.</p></div>
      <div className="card"><div style={{ display: 'flex', gap: 8 }}><input type="text" placeholder="Search by name, Aadhaar, or PAN number..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)' }} /><button className="btn btn-primary" onClick={handleSearch} disabled={searching}>{searching ? <Loader2 size={14} className="spin" /> : <Search size={14} />} Search</button>{query && (<button className="btn btn-secondary" onClick={() => { setQuery(''); loadAll() }}>Clear</button>)}</div></div>
      {loading ? (<div style={{ padding: 32, textAlign: 'center', color: 'var(--text3)' }}><Loader2 size={20} className="spin" /></div>) : list.length === 0 ? (<div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>No applicants found{query ? ` matching "${query}"` : ' yet'}.</div>) : (
        <div className="card"><div className="card-title">{list.length} Applicant{list.length !== 1 ? 's' : ''}</div><div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{list.map(a => (<button key={a.id} onClick={() => setSelectedId(a.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg3)', cursor: 'pointer', textAlign: 'left' }}><div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><User size={16} color="var(--text3)" /></div><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{a.full_name || '(no name)'}</div><div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{a.aadhaar_number && `Aadhaar: ${a.aadhaar_number}`}{a.pan_number && `  •  PAN: ${a.pan_number}`}{a.father_name && `  •  S/O: ${a.father_name}`}</div></div><div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text3)' }}><FileText size={12} /> {a.document_count}</div></button>))}</div></div>
      )}
    </div>
  )
}

function downloadSummaryFile(applicant: any, documents: any[]) {
  let csv = `"Field","Value"\n`;
  const fields = ['full_name', 'father_name', 'date_of_birth', 'gender', 'aadhaar_number', 'pan_number', 'mobile', 'email', 'address', 'pincode', 'city', 'state'];
  fields.forEach(f => { csv += `"${f.replace(/_/g, ' ')}","${applicant[f] || ''}"\n` });
  csv += `\n\n"Document History","File Name"\n`;
  documents.forEach((d: any) => { csv += `"${d.document_type}","${d.file_name || 'N/A'}"\n` });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const filename = `Customer_${applicant.full_name || 'Unknown'}_Summary.csv`;
  downloadBlob(blob, filename);
}

function ApplicantDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const [data, setData] = useState<{ applicant: any; documents: any[] } | null>(null); const [loading, setLoading] = useState(true); const [editing, setEditing] = useState(false); const [form, setForm] = useState<Record<string, string>>({}); const [saving, setSaving] = useState(false)
  useEffect(() => { load() }, [id])
  async function load() {
    setLoading(true); try { const result = await getApplicant(id); setData(result); setForm({ full_name: result.applicant.full_name || '', father_name: result.applicant.father_name || '', date_of_birth: result.applicant.date_of_birth?.slice(0, 10) || '', gender: result.applicant.gender || '', aadhaar_number: result.applicant.aadhaar_number || '', pan_number: result.applicant.pan_number || '', mobile: result.applicant.mobile || '', email: result.applicant.email || '', address: result.applicant.address || '', pincode: result.applicant.pincode || '', city: result.applicant.city || '', state: result.applicant.state || '' }) } finally { setLoading(false) }
  }
  async function handleSave() { setSaving(true); try { await updateApplicant(id, form); await load(); setEditing(false) } finally { setSaving(false) } }
  if (loading) { return <div style={{ padding: 32, textAlign: 'center' }}><Loader2 size={20} className="spin" /></div> }
  if (!data) return null
  const { applicant, documents } = data
  return (
    <div className="page">
      <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: 16 }}><ChevronLeft size={14} /> Back to Applicants</button>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="card-title">
          <span>{applicant.full_name || '(no name)'}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={() => downloadSummaryFile(applicant, documents)}><FileText size={14} /> Download Summary</button>
            {!editing ? (<button className="btn btn-secondary" onClick={() => setEditing(true)}>Edit</button>) : (<div style={{ display: 'flex', gap: 8 }}><button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? <Loader2 size={14} className="spin" /> : 'Save'}</button></div>)}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {Object.entries(form).map(([key, value]) => (<div key={key} style={{ background: 'var(--bg3)', padding: '10px 14px', borderRadius: 8 }}><div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'capitalize', marginBottom: 4 }}>{key.replace(/_/g, ' ')}</div>{editing ? (<input type="text" value={value} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 500, padding: '2px 0' }} />) : (<div style={{ fontSize: 13, fontWeight: 500 }}>{value || '—'}</div>)}</div>))}
        </div>
      </div>
      <div className="card">
        <div className="card-title"><FileText size={16} style={{ marginRight: 6, verticalAlign: -3 }} />Document History ({documents.length})</div>
        {documents.length === 0 ? (<p style={{ color: 'var(--text3)', fontSize: 13 }}>No documents linked yet.</p>) : (<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{documents.map(doc => (<div key={doc.id} style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--bg3)', border: '1px solid var(--border)' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontWeight: 600, fontSize: 13 }}>{DOC_TYPE_LABELS[doc.document_type] || doc.document_type}</span><span style={{ fontSize: 11, color: 'var(--text3)' }}>{new Date(doc.created_at).toLocaleDateString()}</span></div>{doc.file_name && (<div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>{doc.file_name}</div>)}{doc.extracted_data && Object.keys(doc.extracted_data).length > 0 && (<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>{Object.entries(doc.extracted_data).filter(([, v]) => v).map(([k, v]) => (<div key={k} style={{ fontSize: 12 }}><span style={{ color: 'var(--text3)' }}>{k.replace(/_/g, ' ')}: </span><span>{String(v)}</span></div>))}</div>)}</div>))}</div>)}
      </div>
    </div>
  )
}