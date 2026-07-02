// src/components/FieldDataEditor.tsx
import { useState } from 'react'
import { Plus, Trash2, Save, X } from 'lucide-react'

export default function FieldDataEditor({ data, onSave, onCancel }: { data: Record<string, any>, onSave: (d: Record<string, any>) => void, onCancel: () => void }) {
  const [fields, setFields] = useState<[string, string][]>(Object.entries(data))
  const [newKey, setNewKey] = useState('')

  const updateField = (idx: number, key: string, value: string) => {
    const newFields = [...fields]
    newFields[idx] = [key, value]
    setFields(newFields)
  }

  const deleteField = (idx: number) => setFields(fields.filter((_, i) => i !== idx))
  const addField = () => { if(newKey.trim()) { setFields([...fields, [newKey.trim(), '']]); setNewKey('') } }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {fields.map(([key, val], idx) => (
        <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input value={key} onChange={e => updateField(idx, e.target.value, val)} style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 12 }} />
          <input value={val} onChange={e => updateField(idx, key, e.target.value)} style={{ flex: 2, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 12 }} />
          <button className="btn btn-ghost btn-sm" onClick={() => deleteField(idx)}><Trash2 size={14} color="var(--red)" /></button>
        </div>
      ))}
      
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <input placeholder="New Field Name" value={newKey} onChange={e => setNewKey(e.target.value)} onKeyDown={e => e.key === 'Enter' && addField()} style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)' }} />
        <button className="btn btn-secondary btn-sm" onClick={addField}><Plus size={14} /> Add Field</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="btn btn-primary btn-sm" onClick={() => onSave(Object.fromEntries(fields))}><Save size={14} /> Save Changes</button>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}><X size={14} /> Cancel</button>
      </div>
    </div>
  )
}