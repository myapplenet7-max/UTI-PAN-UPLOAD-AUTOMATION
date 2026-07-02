// src/pages/Settings.tsx
import { useState } from 'react'
import { Check, Server, Zap, Cpu, Globe, Layers, Lock } from 'lucide-react'

export default function SettingsPage() {
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

  const serviceIconMap: Record<string, any> = {
    gemini: <Cpu size={22} />,
    openrouter: <Globe size={22} />,
    groq: <Zap size={22} />,
    huggingface: <Layers size={22} />,
  }

  const serviceColorMap: Record<string, string> = {
    gemini: 'rgba(79,127,255,0.15)',
    openrouter: 'rgba(124,92,255,0.15)',
    groq: 'rgba(255,159,67,0.15)',
    huggingface: 'rgba(255,107,107,0.15)',
  }

  return (
    <div className="page" style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700 }}>Settings</h2>
        <p style={{ color: 'var(--text2)' }}>Configure your AI providers and default behavior.</p>
      </div>

      {/* AUTO-FAILOVER GLASS CARD */}
      <div style={{
        background: 'rgba(13, 18, 34, 0.6)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px', padding: '24px', marginBottom: '32px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.2)'
      }}>
        <div className="card-title" style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Server size={18} /> Configuration
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '13px', color: 'var(--text2)', display: 'block', marginBottom: '6px' }}>Default AI Service</label>
          <select value={selectedAi} onChange={e => { setSelectedAi(e.target.value); localStorage.setItem('selected_ai_service', e.target.value) }} 
            style={{ width: '100%', maxWidth: '300px', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.04)', color: 'var(--text)', fontSize: '14px', outline: 'none', cursor: 'pointer' }}>
            <option value="gemini">Gemini (Google)</option>
            <option value="openrouter">OpenRouter (Universal)</option>
            <option value="groq">Groq (Fastest)</option>
            <option value="huggingface">Hugging Face (Open Source)</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', borderRadius: '12px', border: '1px solid rgba(34,197,94,0.2)', background: 'rgba(34,197,94,0.05)' }}>
          <input type="checkbox" id="failover" checked={autoFailover} onChange={toggleFailover} style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#4F7FFF', cursor: 'pointer' }} />
          <div>
            <label htmlFor="failover" style={{ fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>Auto-Failover</label>
            <p style={{ fontSize: '12px', color: 'var(--text2)', margin: 0, lineHeight: '1.5' }}>If the selected AI hits a rate limit, automatically route to the next available AI provider.</p>
          </div>
        </div>
      </div>

      {/* AI PROVIDER GLASS CARDS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {Object.entries(keys).map(([service, key]) => (
          <div key={service} style={{
            background: 'rgba(13, 18, 34, 0.6)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px', padding: '20px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            display: 'flex', flexDirection: 'column', gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: serviceColorMap[service], display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}>
                  {serviceIconMap[service]}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px', textTransform: 'capitalize' }}>{service}</div>
                  <div style={{ fontSize: '11px', color: key ? 'var(--green)' : 'var(--text3)' }}>
                    {key ? 'Active' : 'Not connected'}
                  </div>
                </div>
              </div>
              {key && <Check size={18} color="var(--green)" />}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <Lock size={14} color="var(--text3)" />
              <input 
                type="password" 
                placeholder={`Enter ${service} API key...`} 
                value={key} 
                onChange={e => saveKey(service, e.target.value)} 
                style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '13px', padding: '6px 0', outline: 'none', fontFamily: 'monospace' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}