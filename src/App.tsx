// src/App.tsx
import { useState, useEffect } from 'react'
import { 
  Home, ScanLine, FileSpreadsheet, Users, FileText, 
  Image, PenLine, Layers, FilePlus, FileStack, Wrench, 
  Settings, Menu, X, ChevronDown, Search, Bell, User, PanelLeftClose, PanelLeftOpen
} from 'lucide-react'

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
  // Sidebar toggle state persisted in localStorage
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebar_open')
    return saved !== null ? JSON.parse(saved) : true
  })
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUtilitiesOpen, setIsUtilitiesOpen] = useState(false)

  // Toggle handler with local storage save
  const toggleSidebar = () => {
    const newState = !isSidebarOpen
    setIsSidebarOpen(newState)
    localStorage.setItem('sidebar_open', JSON.stringify(newState))
  }

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
    <div className="layout" style={{ height: '100vh', overflow: 'hidden', background: '#05080F' }}>
      <div className="mobile-header">
        <button className="menu-btn" onClick={() => setIsMobileMenuOpen(true)}><Menu size={22} /></button>
        <h1 style={{ fontSize: '16px', fontWeight: 700 }}>Doc Auto</h1>
      </div>

      <div className={`overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)} />

      {/* 240px / 72px TOGGLE SIDEBAR */}
      <aside 
        className={`sidebar`} 
        style={{ 
          width: isSidebarOpen ? '240px' : '72px', 
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          background: 'rgba(10, 15, 30, 0.65)',
          backdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 0 30px rgba(0,0,0,0.4)',
          padding: '24px 12px',
          display: 'flex', flexDirection: 'column', gap: '4px',
          zIndex: 100, height: '100vh', position: 'fixed', top: 0, left: 0, 
          overflow: 'hidden'
        }}
      >
        {/* Logo Section */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 4px 20px 4px', marginBottom: '12px', overflow: 'hidden', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', minWidth: '36px', background: 'linear-gradient(135deg, #4F7FFF, #7C5CFF)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', boxShadow: '0 4px 12px rgba(79,127,255,0.3)' }}>📄</div>
            {isSidebarOpen && <span style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-0.5px' }}>Doc Auto</span>}
          </div>
          {isSidebarOpen && (
            <button onClick={toggleSidebar} style={{ background: 'transparent', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: '4px', borderRadius: '6px', transition: '0.2s' }}>
              <PanelLeftClose size={18} />
            </button>
          )}
        </div>

        {!isSidebarOpen && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '12px' }}>
             <button onClick={toggleSidebar} style={{ background: 'transparent', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}>
              <PanelLeftOpen size={18} />
            </button>
          </div>
        )}

        {/* Nav Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflowY: 'auto' }}>
          <SectionLabel label="MAIN" open={isSidebarOpen} />
          <NavItem icon={<Home size={18} />} label="Home" active={page === 'home'} onClick={() => navigate('home')} open={isSidebarOpen} />
          <NavItem icon={<ScanLine size={18} />} label="Quick Extract" active={page === 'id-extract'} onClick={() => navigate('id-extract')} open={isSidebarOpen} />
          <NavItem icon={<FileSpreadsheet size={18} />} label="Full Extract" active={page === 'full-extract'} onClick={() => navigate('full-extract')} open={isSidebarOpen} />

          <SectionLabel label="MANAGEMENT" open={isSidebarOpen} />
          <NavItem icon={<Users size={18} />} label="Applicants" active={page === 'applicants'} onClick={() => navigate('applicants')} open={isSidebarOpen} />
          <NavItem icon={<FileText size={18} />} label="Templates" active={page === 'templates'} onClick={() => navigate('templates')} open={isSidebarOpen} />

          <SectionLabel label="UTILITIES" open={isSidebarOpen} />
          <div style={{ marginLeft: isSidebarOpen ? '0px' : '0px', paddingLeft: isSidebarOpen ? '0px' : '0px' }}>
             <div 
              onClick={() => setIsUtilitiesOpen(!isUtilitiesOpen)}
              style={{ 
                display: 'flex', alignItems: 'center', justifyContent: isSidebarOpen ? 'space-between' : 'center', gap: isSidebarOpen ? '12px' : '0px', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                color: isUtilitiesOpen ? 'var(--text)' : 'var(--text2)', transition: 'all 0.2s'
              }}
            >
              <Wrench size={18} style={{ minWidth: '18px' }} />
              {isSidebarOpen && <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}><span style={{ fontSize: '14px' }}>Utilities</span><ChevronDown size={14} style={{ transform: isUtilitiesOpen ? 'rotate(180deg)' : 'none', transition: '0.2s', color: 'var(--text3)' }} /></div>}
            </div>
            
            {isSidebarOpen && isUtilitiesOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '8px', borderLeft: '2px solid rgba(79,127,255,0.2)', marginLeft: '10px' }}>
                <SubItem icon={<Image size={14} />} label="Photo Extract" onClick={() => navigate('photo')} />
                <SubItem icon={<PenLine size={14} />} label="Signature Extract" onClick={() => navigate('signature')} />
                <SubItem icon={<Layers size={14} />} label="Photo + Signature" onClick={() => navigate('photo-sig')} />
                <SubItem icon={<FilePlus size={14} />} label="Correction Packet" onClick={() => navigate('correction')} />
                <SubItem icon={<FileStack size={14} />} label="New PAN Packet" onClick={() => navigate('newpan')} />
                <SubItem icon={<Wrench size={14} />} label="PDF Tools" onClick={() => navigate('pdf')} />
                <SubItem icon={<Settings size={14} />} label="Image Tools" onClick={() => navigate('image')} />
              </div>
            )}
          </div>
        </div>

        {/* Bottom Fixed Settings */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '12px', marginTop: '4px' }}>
          <NavItem icon={<Settings size={18} />} label="Settings" active={page === 'settings'} onClick={() => navigate('settings')} open={isSidebarOpen} />
        </div>
      </aside>

      {/* MAIN CONTENT AREA - Strict 1600px max-width container */}
      <main style={{ marginLeft: isSidebarOpen ? '240px' : '72px', transition: 'margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)', height: '100vh', overflowY: 'auto', padding: '0', position: 'relative', background: 'var(--bg)' }}>
        
        {/* PREMIUM COMMAND BAR */}
        <div style={{ 
          position: 'sticky', top: 0, zIndex: 20, 
          padding: '12px 40px', 
          background: 'rgba(5, 8, 15, 0.8)', backdropFilter: 'blur(16px)', 
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.04)', padding: '6px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', flex: 1, maxWidth: '420px', minWidth: '200px' }}>
            <Search size={16} color="var(--text3)" />
            <input 
              type="text" 
              placeholder="Search documents..." 
              style={{ background: 'transparent', border: 'none', color: 'var(--text)', width: '100%', fontSize: '14px', outline: 'none' }}
            />
            <span style={{ fontSize: '10px', color: 'var(--text3)', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: '4px' }}>⌘K</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <Bell size={18} color="var(--text2)" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text3)', cursor: 'pointer', padding: '4px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)' }} />
              Online
            </div>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #4F7FFF, #7C5CFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <User size={14} color="#fff" />
            </div>
          </div>
        </div>
        
        {/* PAGE RENDER - 1600px max-width container, 32px padding */}
        <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '32px' }}>
          {renderPage()}
        </div>
      </main>
    </div>
  )
}

// Helper Components
function SectionLabel({ label, open }: { label: string, open: boolean }) {
  if (!open) return null;
  return (
    <div style={{ padding: '8px 12px 4px 12px', fontSize: '10px', color: 'var(--text3)', fontWeight: 600, letterSpacing: '1px' }}>{label}</div>
  )
}

function NavItem({ icon, label, active, onClick, open }: { icon: any, label: string, active: boolean, onClick: () => void, open: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: open ? 'flex-start' : 'center', gap: '12px', padding: '8px 12px',
        borderRadius: '8px', width: '100%', border: 'none', cursor: 'pointer',
        color: active ? 'var(--text)' : 'var(--text2)',
        background: active ? 'rgba(79,127,255,0.12)' : 'transparent',
        transition: 'all 0.2s'
      }}
    >
      <div style={{ minWidth: '18px', display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <span style={{ whiteSpace: 'nowrap', opacity: open ? 1 : 0, transition: 'opacity 0.15s', fontWeight: active ? 500 : 400, fontSize: '14px', display: open ? 'block' : 'none' }}>{label}</span>
    </button>
  )
}

function SubItem({ icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 12px', borderRadius: '6px', width: '100%', border: 'none', cursor: 'pointer', color: 'var(--text2)', background: 'transparent', transition: 'all 0.2s', fontSize: '13px' }}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }} 
      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text2)'; e.currentTarget.style.background = 'transparent'; }}>
      <div style={{ minWidth: '14px', display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <span>{label}</span>
    </button>
  )
}