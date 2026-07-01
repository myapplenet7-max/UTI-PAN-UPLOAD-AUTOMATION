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
  {
    label: 'Main',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
    ]
  },
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
    items: [
      { id: 'faq', label: 'FAQ', icon: HelpCircle },
    ]
  }
]

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('claude_api_key') || '')

  const saveKey = (k: string) => {
    setApiKey(k)
    localStorage.setItem('claude_api_key', k)
  }

  const navigate = (p: Page) => {
    setPage(p)
    setSidebarOpen(false)
    window.scrollTo(0, 0)
  }

  const renderPage = () => {
    const props = { apiKey, navigate }
    switch (page) {
      case 'dashboard': return <Dashboard navigate={navigate} />
      case 'photo': return <PhotoExtract apiKey={apiKey} />
      case 'signature': return <SignatureExtract apiKey={apiKey} />
      case 'photo-sig': return <PhotoWithSignature apiKey={apiKey} />
      case 'document': return <DocumentExtractor apiKey={apiKey} navigate={navigate} />
      case 'combined-scan': return <CombinedScan apiKey={apiKey} navigate={navigate} />
      case 'form': return <FormFiller apiKey={apiKey} navigate={navigate} />
      case 'correction': return <CorrectionPacket apiKey={apiKey} />
      case 'newpan': return <NewPanPacket apiKey={apiKey} />
      case 'pdf': return <PdfTools />
      case 'image': return <ImageTools />
      case 'faq': return <FAQ />
      case 'applicants': return <Applicants />
      case 'templates': return <Templates apiKey={apiKey} />
      default: return <Dashboard navigate={navigate} />
    }
  }

  return (
    <div className="layout">
      {/* Mobile header */}
      <div className="mobile-header">
        <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
          <Menu size={22} />
        </button>
        <h1>UTI PAN Auto</h1>
      </div>

      {/* Overlay */}
      <div className={`overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
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

      {/* Main */}
      <main className="main">
        {/* API Key bar */}
        <div className="api-key-bar">
          <label>Claude API Key:</label>
          <input
            type="password"
            placeholder="sk-ant-api03-..."
            value={apiKey}
            onChange={e => saveKey(e.target.value)}
          />
          {apiKey && <span style={{ color: 'var(--green)', fontSize: 12 }}>✓ Set</span>}
        </div>

        {renderPage()}
      </main>
    </div>
  )
}
