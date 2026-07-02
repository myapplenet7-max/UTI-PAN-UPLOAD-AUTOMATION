// src/pages/Settings.tsx
import { useState } from 'react'
import { Save, Check, Loader2 } from 'lucide-react'

export default function Settings() {
  const [keys, setKeys] = useState(() => ({
    gemini: localStorage.getItem('ai_key_gemini') || '',
    openrouter: localStorage.getItem('ai_key_openrouter') || '',
    groq: localStorage.getItem('ai_key_groq') || '',
    huggingface: localStorage.getItem('ai_key_huggingface') || '',
  }))

  const [selectedAi, setSelectedAi] = useState(() => localStorage.getItem('selected_ai_service') || 'gemini')
  const [autoFailover, setAutoFailover] = useState(() => localStorage.getItem('ai_auto_failover') === 'true')

  const saveKey = (service: string, value: string) => {
    setKeys(k => ({ ...k, [service]: value }))
    localStorage.setItem(`ai_key_${service}`, value)
  }

  const toggleFailover = () => {
    const newVal = !autoFailover
    setAutoFailover(newVal)
    localStorage.setItem('ai_auto_failover', String(newVal))
  }

  const totalKeys = Object.values(keys).filter(k => k).length

  return (
    <div className="page" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header">
        <h2 style={{ fontSize: '28px' }}>⚙️ AI Providers</h2>
        <p style={{ color: 'var(--text2)' }}>Manage your AI services and API keys. {totalKeys > 0 ? `${totalKeys} active connections.` : 'Connect your first AI provider to get started.'}</p>
      </div>

      <div className="card" style={{ padding: '28px', border: '1px solid rgba(79,127,255,0.2)', background: 'rgba(17,25,40,0.8)' }}>
        <div className="card-title" style={{ fontSize: '16px', marginBottom: '20px' }}>Service Configuration</div>
        
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '13px', color: 'var(--text2)', display: 'block', marginBottom: '8px' }}>Default AI Service</label>
          <select value={selectedAi} onChange={e => { setSelectedAi(e.target.value); localStorage.setItem('selected_ai_service', e.target.value) }} 
            style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)', fontSize: '14px' }}>
            <option value="gemini">Gemini (Google)</option>
            <option value="openrouter">OpenRouter (Universal)</option>
            <option value="groq">Groq (Fastest)</option>
            <option value="huggingface">Hugging Face (Open Source)</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.05)' }}>
          <input type="checkbox" id="failover" checked={autoFailover} onChange={toggleFailover} style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }} />
          <label htmlFor="failover" style={{ fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>🤖 Auto-Failover
            <span style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: 400, display: 'block' }}>If the selected AI hits a limit, automatically route to the next available AI provider.</span>
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {Object.entries(keys).map(([service, key]) => (
            <div key={service} style={{ background: 'var(--bg3)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text2)', textTransform: 'capitalize', display: 'block', marginBottom: '6px' }}>{service}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="password" placeholder={`Enter ${service} key...`} value={key} onChange={e => saveKey(service, e.target.value)} 
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px' }} />
                {key && <Check size={18} color="var(--green)" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}