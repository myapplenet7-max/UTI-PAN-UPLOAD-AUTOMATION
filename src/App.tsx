// src/App.tsx
import { useState, useEffect } from 'react'
import { Home, ScanLine, FileSpreadsheet, Users, Image, PenLine, Layers, FilePlus, FileStack, Wrench, Settings, HelpCircle, Menu, X, ChevronDown, Server } from 'lucide-react'
import HomePage from './pages/Home'
import IDCardExtract from './pages/IDCardExtract'
import FullDocExtract from './pages/FullDocExtract'
import PhotoExtract from './pages/PhotoExtract'
import SignatureExtract from './pages/SignatureExtract'
import PhotoWithSignature from './pages/PhotoWithSignature'
import CorrectionPacket from './pages/CorrectionPacket'
import NewPanPacket from './pages/NewPanPacket'
import PdfTools from './pages/PdfTools'
import ImageTools from './pages/ImageTools'
import FAQ from './pages/FAQ'
import Applicants from './pages/Applicants'
import Templates from './pages/Templates'
import SettingsPage from './pages/Settings'

type Page = 'home' | 'id-extract' | 'full-extract' | 'settings' | 'photo' | 'signature' | 'photo-sig' | 'correction' | 'newpan' | 'pdf' | 'image' | 'faq' | 'applicants' | 'templates'

export default function App() {
  const [page, setPage] = useState<Page>('home')
  const [hoveringSidebar, setHoveringSidebar] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Submenu state
  const [isUtilitiesOpen, setIsUtilitiesOpen] = useState(false)

  // Check if any API keys are set to show status dot
  const hasKeys = !!(
    localStorage.getItem('ai_key_gemini') ||
    localStorage.getItem('ai_key_openrouter') ||
    localStorage.getItem('ai_key_groq') ||
    localStorage.getItem('ai_key_huggingface')
  )

  const navigate = (p: Page) => { 
    setPage(p); 
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0);
    setIsUtilitiesOpen(false); 
  }

  const renderPage = () => {
    switch (page) {
      case 'home': return <HomePage navigate={navigate} />
      case 'id-extract': return <IDCardExtract navigate={navigate} />
      case 'full-extract': return <FullDocExtract navigate={navigate} />
      case 'photo': return <PhotoExtract apiKey={localStorage.getItem('ai_key_gemini') || ''} />
      case 'signature': return <SignatureExtract apiKey={localStorage.getItem('ai_key_gemini') || ''} />
      case 'photo-sig': return <PhotoWithSignature apiKey={localStorage.getItem('ai_key_gemini') || ''} />
      case 'correction': return <CorrectionPacket apiKey={localStorage.getItem('ai_key_gemini') || ''} />
      case 'newpan': return <NewPanPacket apiKey={localStorage.getItem('ai_key_gemini') || ''} />
      case 'pdf': return <PdfTools />
      case 'image': return <ImageTools />
      case 'faq': return <FAQ />
      case 'applicants': return <Applicants />
      case 'templates': return <Templates />
      case 'settings': return <SettingsPage />
      default: return <HomePage navigate={navigate} />
    }
  }

  return (
    <div className="layout" style={{ height: '100vh', overflow: 'hidden' }}>
      <div className="mobile-header">
        <button className="menu-btn" onClick={() => setIsMobileMenuOpen(true)}><Menu size={22} /></button>
        <h1 style={{ fontSize: '16px', fontWeight: 700 }}>Doc Auto</h1>
      </div>

      <div className={`overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)} />

      {/* MODERN FLOATING COLLAPSIBLE SIDEBAR */}
      <aside 
        className={`sidebar`} 
        style={{ 
          width: hoveringSidebar ? '240px' : '72px', 
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s',
          background: 'rgba(11, 16, 32, 0.75)',
          backdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          padding: '20px 12px',
          display: 'flex', flexDirection: 'column', gap: '8px',
          zIndex: 100, height: '100vh', position: 'fixed', top: 0, left: 0, 
          overflow: 'hidden',
          boxShadow: '4px 0 24px rgba(0,0,0,0.4)'
        }}
        onMouseEnter={() => setHoveringSidebar(true)}
        onMouseLeave={() => { setHoveringSidebar(false); setIsUtilitiesOpen(false); }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 4px 16px 4px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '12px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <div style={{ width: '36px', height: '36px', minWidth: '36px', background: 'linear-gradient(135deg, #4F7FFF, #7C5CFF)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>📄</div>
          {hoveringSidebar && <span style={{ fontSize: '16px', fontWeight: 700 }}>Doc Auto</span>}
        </div>

        {/* Nav Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflowY: 'auto' }}>
          <div className="sidebar-section-label" style={{ paddingLeft: '12px', opacity: hoveringSidebar ? 1 : 0, transition: 'opacity 0.2s', fontSize: '10px', color: 'var(--text3)', fontWeight: 700, letterSpacing: '1px', marginTop: '4px' }}>Main</div>
          <NavItem icon={<Home size={20} />} label="Home" active={page === 'home'} onClick={() => navigate('home')} open={hoveringSidebar} />
          <NavItem icon={<ScanLine size={20} />} label="Quick Extract" active={page === 'id-extract'} onClick={() => navigate('id-extract')} open={hoveringSidebar} />
          <NavItem icon={<FileSpreadsheet size={20} />} label="Full Extract" active={page === 'full-extract'} onClick={() => navigate('full-extract')} open={hoveringSidebar} />

          <div className="sidebar-section-label" style={{ paddingLeft: '12px', opacity: hoveringSidebar ? 1 : 0, transition: 'opacity 0.2s', fontSize: '10px', color: 'var(--text3)', fontWeight: 700, letterSpacing: '1px', marginTop: '16px' }}>Management</div>
          <NavItem icon={<Users size={20} />} label="Applicants" active={page === 'applicants'} onClick={() => navigate('applicants')} open={hoveringSidebar} />
          <NavItem icon={<FileText size={20} />} label="Templates" active={page === 'templates'} onClick={() => navigate('templates')} open={hoveringSidebar} />

          {/* Utilities Submenu */}
          <div>
            <div 
              onClick={() => setIsUtilitiesOpen(!isUtilitiesOpen)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                color: isUtilitiesOpen ? 'var(--text)' : 'var(--text2)', transition: 'all 0.2s'
              }}
            >
              <Wrench size={20} style={{ minWidth: '20px' }} />
              {hoveringSidebar && <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}><span>Utilities</span><ChevronDown size={16} style={{ transform: isUtilitiesOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} /></div>}
            </div>
            
            {hoveringSidebar && isUtilitiesOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '8px', borderLeft: '2px solid rgba(79,127,255,0.3)', marginLeft: '10px' }}>
                <SubItem icon={<Image size={16} />} label="Photo Extract" onClick={() => navigate('photo')} />
                <SubItem icon={<PenLine size={16} />} label="Signature Extract" onClick={() => navigate('signature')} />
                <SubItem icon={<Layers size={16} />} label="Photo + Signature" onClick={() => navigate('photo-sig')} />
                <SubItem icon={<FilePlus size={16} />} label="Correction Packet" onClick={() => navigate('correction')} />
                <SubItem icon={<FileStack size={16} />} label="New PAN Packet" onClick={() => navigate('newpan')} />
                <SubItem icon={<Wrench size={16} />} label="PDF Tools" onClick={() => navigate('pdf')} />
                <SubItem icon={<Settings size={16} />} label="Image Tools" onClick={() => navigate('image')} />
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
          <NavItem icon={<Settings size={20} />} label="Settings" active={page === 'settings'} onClick={() => navigate('settings')} open={hoveringSidebar} />
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ marginLeft: '72px', height: '100vh', overflowY: 'auto', padding: '0', position: 'relative', background: 'var(--bg)' }}>
        {/* Clean Top Bar */}
        <div style={{ 
          position: 'sticky', top: 0, zIndex: 10, 
          padding: '16px 40px', marginBottom: '20px',
          background: 'rgba(11, 16, 32, 0.7)', backdropFilter: 'blur(12px)', 
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text3)' }}>
            <Server size={14} /> AI Status:
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: hasKeys ? 'var(--green)' : 'var(--yellow)', marginLeft: '4px' }} />
            {hasKeys ? 'Connected' : 'Setup Required'}
          </div>
        </div>
        
        <div style={{ padding: '0 40px 40px 40px', maxWidth: '1400px', margin: '0 auto' }}>
          {renderPage()}
        </div>
      </main>
    </div>
  )
}

// Helper Components
function NavItem({ icon, label, active, onClick, open }: { icon: any, label: string, active: boolean, onClick: () => void, open: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
        borderRadius: '10px', width: '100%', border: 'none', cursor: 'pointer',
        color: active ? 'var(--text)' : 'var(--text2)',
        background: active ? 'rgba(79,127,255,0.15)' : 'transparent',
        transition: 'all 0.2s'
      }}
    >
      <div style={{ minWidth: '20px', display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <span style={{ whiteSpace: 'nowrap', opacity: open ? 1 : 0, transition: 'opacity 0.15s', fontWeight: active ? 600 : 400, fontSize: '14px', display: open ? 'block' : 'none' }}>{label}</span>
    </button>
  )
}

function SubItem({ icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', width: '100%', border: 'none', cursor: 'pointer', color: 'var(--text2)', background: 'transparent', transition: 'all 0.2s', fontSize: '13px' }}
      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text2)'}>
      <div style={{ minWidth: '16px', display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <span>{label}</span>
    </button>
  )
}