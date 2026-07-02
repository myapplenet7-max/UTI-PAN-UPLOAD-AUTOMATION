import { useState } from 'react'
import {
  Home, Image, PenLine, Layers, FileText, ClipboardList,
  FilePlus, FileStack, Wrench, HelpCircle, Menu, X, BookOpen, Phone, Settings,
  Users, FileSpreadsheet, ScanLine
} from 'lucide-react'
import Dashboard from './pages/Dashboard'
import PhotoExtract from './pages/PhotoExtract'
import SignatureExtract from './pages/SignatureExtract'
import PhotoWithSignature from './pages/PhotoWithSignature'
import DocumentExtractor from './pages/DocumentExtractor'
import CombinedScan from './pages/CombinedScan'
import FormFiller from './pages/FormFiller'
import CorrectionPacket from './pages/CorrectionPacket'
import NewPanPacket from './pages/NewPanPacket'
import PdfTools from './pages/PdfTools'
import ImageTools from './pages/ImageTools'
import FAQ from './pages/FAQ'
import Applicants from './pages/Applicants'
import Templates from './pages/Templates'

type Page =
  | 'dashboard' | 'photo' | 'signature' | 'photo-sig'
  | 'document' | 'combined-scan' | 'form' | 'correction' | 'newpan'
  | 'pdf' | 'image' | 'faq'
  | 'applicants' | 'templates'

const NAV = [
  { label: 'Main', items: [{ id: 'dashboard', label: 'Dashboard', icon: Home }] },
  {
    label: 'Records',
    items: [
      { id: 'applicants', label: 'Applicants', icon: Users },
      { id: 'templates', label: 'Templates', icon: FileSpreadsheet },
    ]
  },
  {
    label: 'Tools',
    items: [
      { id: 'photo', label: 'UTI Photo Extract', icon: Image },
      { id: 'signature', label: 'Signature Extract', icon: PenLine },
      { id: 'photo-sig', label: 'Photo + Signature', icon: Layers },
      { id: 'document', label: 'Document Extractor', icon: FileText },
      { id: 'combined-scan', label: 'Combined Scan (Multi-Doc)', icon: ScanLine },
      { id: 'form', label: 'Auto Form Filler', icon: ClipboardList },
      { id: 'correction', label: 'Correction Packet', icon: FilePlus },
      { id: 'newpan', label: 'New PAN Packet', icon: FileStack },
      { id: 'pdf', label: 'PDF Tools', icon: Wrench },
      { id: 'image', label: 'Image Tools', icon: Settings },
    ]
  },
  {
    label: 'Support',
    items: [{ id: 'faq', label: 'FAQ', icon: HelpCircle }]
  }
]

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Load API Keys from localStorage
  const [keys, setKeys] = useState(() => {
    return {
      gemini: localStorage.getItem('ai_key_gemini') || '',
      openrouter: localStorage.getItem('ai_key_openrouter') || '',
      groq: localStorage.getItem('ai_key_groq') || '',
      huggingface: localStorage.getItem('ai_key_huggingface') || '',
    }
  })

  const [selectedAi, setSelectedAi] = useState(() => localStorage.getItem('selected_ai_service') || 'gemini')
  const [autoFailover, setAutoFailover] = useState(() => localStorage.getItem('ai_auto_failover') === 'true')

  const saveKey = (service: string, value: string) => {
    const newKeys = { ...keys, [service]: value }
    setKeys(newKeys)
    localStorage.setItem(`ai_key_${service}`, value)
  }

  const saveAiService = (service: string) => {
    setSelectedAi(service)
    localStorage.setItem('selected_ai_service', service)
  }

  const toggleFailover = () => {
    const newVal = !autoFailover
    setAutoFailover(newVal)
    localStorage.setItem('ai_auto_failover', String(newVal))
  }

  const navigate = (p: Page) => {
    setPage(p)
    setSidebarOpen(false)
    window.scrollTo(0, 0)
  }

  const renderPage = () => {
    const props = { apiKeys: keys, selectedAi, autoFailover, navigate }
    switch (page) {
      case 'dashboard': return <Dashboard navigate={navigate} />
      case 'photo': return <PhotoExtract apiKey={keys.gemini} />
      case 'signature': return <SignatureExtract apiKey={keys.gemini} />
      case 'photo-sig': return <PhotoWithSignature apiKey={keys.gemini} />
      case 'document': return <DocumentExtractor {...props} />
      case 'combined-scan': return <CombinedScan {...props} />
      case 'form': return <FormFiller {...props} />
      case 'correction': return <CorrectionPacket apiKey={keys.gemini} />
      case 'newpan': return <NewPanPacket apiKey={keys.gemini} />
      case 'pdf': return <PdfTools />
      case 'image': return <ImageTools />
      case 'faq': return <FAQ />
      case 'applicants': return <Applicants />
      case 'templates': return <Templates {...props} />
      default: return <Dashboard navigate={navigate} />
    }
  }

  return (
    <div className="layout">
      <div className="mobile-header">
        <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
          <Menu size={22} />
        </button>
        <h1>UTI PAN Auto</h1>
      </div>

      <div className={`overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="logo">
            <div className="logo-icon">📄</div>
            <h1>UTI PAN Auto</h1>
          </div>
          <p>Upload Once • Extract Everything</p>
        </div>

        {NAV.map(section => (
          <div className="sidebar-section" key={section.label}>
            <div className="sidebar-section-label">{section.label}</div>
            {section.items.map(item => (
              <button
                key={item.id}
                className={`nav-item ${page === item.id ? 'active' : ''}`}
                onClick={() => navigate(item.id as Page)}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </aside>

      <main className="main">
        {/* API Key bar */}
        <div className="api-key-bar" style={{ padding: '12px 16px', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>Select AI:</label>
              <select 
                value={selectedAi}
                onChange={(e) => saveAiService(e.target.value)}
                style={{
                  padding: '6px 12px', borderRadius: 6, background: 'var(--bg3)', 
                  border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13
                }}
              >
                <option value="gemini">Gemini (Google)</option>
                <option value="openrouter">OpenRouter (Universal)</option>
                <option value="groq">Groq (Fastest)</option>
                <option value="huggingface">Hugging Face (Open Source)</option>
              </select>

              <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text2)', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={autoFailover} 
                  onChange={toggleFailover}
                  style={{ accentColor: 'var(--accent)' }}
                />
                🤖 Auto-Failover
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {Object.entries(keys).map(([service, key]) => (
                <div key={service} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: 11, fontWeight: 600, minWidth: '80px', color: 'var(--text2)', textTransform: 'capitalize' }}>
                    {service}:
                  </label>
                  <input
                    type="password"
                    placeholder={`Enter ${service} key...`}
                    value={key}
                    onChange={e => saveKey(service, e.target.value)}
                    style={{ flex: 1, padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 12 }}
                  />
                  {key && <span style={{ color: 'var(--green)', fontSize: 12 }}>✓</span>}
                </div>
              ))}
            </div>

          </div>
        </div>

        {renderPage()}
      </main>
    </div>
  )
}