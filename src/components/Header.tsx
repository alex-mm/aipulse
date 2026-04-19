import { Link, useLocation } from 'react-router-dom'
import { Radio, Globe, Cpu, MessageSquare, Clock, Sun, Moon } from 'lucide-react'
import { useTheme } from '../lib/theme'

export default function Header() {
  const location = useLocation()
  const path = location.pathname
  const { isDark, toggle } = useTheme()

  const isActive = (prefix: string) => path.startsWith(prefix)

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{
      backgroundColor: 'var(--c-bg-hdr)',
      borderColor: 'var(--c-bd)',
    }}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg" style={{color:'var(--c-ac)'}}>
          <div className="relative">
            <Radio size={20} style={{color:'var(--c-ac)'}} />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full animate-pulse" style={{backgroundColor:'#34d399'}}></span>
          </div>
          <span className="tracking-wider">AI<span style={{color:'var(--c-ac2)'}}>PULSE</span></span>
        </Link>

        <nav className="flex items-center gap-0.5 sm:gap-1 text-sm">
          <Link
            to="/overseas/brief"
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg transition-all"
            style={isActive('/overseas') ? {
              backgroundColor: 'rgba(56,189,248,0.12)',
              color: '#38bdf8',
              border: '1px solid rgba(56,189,248,0.3)',
            } : {
              color: 'var(--c-tx3)',
              border: '1px solid transparent',
            }}
          >
            <Globe size={14} />
            <span className="hidden sm:inline">海外</span>
          </Link>
          <Link
            to="/domestic/brief"
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg transition-all"
            style={isActive('/domestic') ? {
              backgroundColor: 'rgba(244,114,182,0.12)',
              color: '#f472b6',
              border: '1px solid rgba(244,114,182,0.3)',
            } : {
              color: 'var(--c-tx3)',
              border: '1px solid transparent',
            }}
          >
            <Cpu size={14} />
            <span className="hidden sm:inline">国内</span>
          </Link>
          <Link
            to="/forum"
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg transition-all"
            style={isActive('/forum') ? {
              backgroundColor: 'rgba(110,231,247,0.12)',
              color: 'var(--c-ac)',
              border: '1px solid rgba(110,231,247,0.3)',
            } : {
              color: 'var(--c-tx3)',
              border: '1px solid transparent',
            }}
          >
            <MessageSquare size={14} />
            <span className="hidden sm:inline">讨论</span>
          </Link>
          <Link
            to="/archive"
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg transition-all"
            style={isActive('/archive') ? {
              backgroundColor: 'rgba(167,139,250,0.12)',
              color: '#a78bfa',
              border: '1px solid rgba(167,139,250,0.3)',
            } : {
              color: 'var(--c-tx3)',
              border: '1px solid transparent',
            }}
          >
            <Clock size={14} />
            <span className="hidden sm:inline">往期回顾</span>
          </Link>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="ml-1 sm:ml-2 p-1.5 rounded-lg transition-all"
            style={{
              color: 'var(--c-tx3)',
              border: '1px solid transparent',
            }}
            title={isDark ? '切换浅色模式' : '切换深色模式'}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </nav>
      </div>
    </header>
  )
}
