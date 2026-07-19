import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, LogOut, User, Settings, Moon, Sun, Zap } from 'lucide-react'
import { useAuthStore } from '../../context/AuthContext'
import { useUnreadNotificationCount } from '../../hooks/useQueries'
import { authApi } from '../../api/client'

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/dashboard/overview': { title: 'Overview', subtitle: 'Meet your own numbers regarding all operations' },
  '/dashboard/orders': { title: 'Orders', subtitle: 'Manage and track all your shipments' },
  '/dashboard/carriers': { title: 'Carriers', subtitle: 'Browse and manage carrier partners' },
  '/dashboard/invoices': { title: 'Invoices', subtitle: 'Track payments and billing' },
  '/dashboard/automations': { title: 'Automations', subtitle: 'Automate your workflows' },
  '/dashboard/analytics': { title: 'Analytics', subtitle: 'Deep dive into your metrics' },
  '/dashboard/reporting': { title: 'Reporting', subtitle: 'Generate and export reports' },
  '/dashboard/messages': { title: 'Messages', subtitle: 'Communicate with your team' },
  '/dashboard/settings': { title: 'Settings', subtitle: 'Manage your account preferences' },
}

export default function Topbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { data: unreadData } = useUnreadNotificationCount()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dark, setDark] = useState(true)
  const menuRef = useRef<HTMLDivElement>(null)

  const meta = pageMeta[location.pathname] || { title: 'Dashboard', subtitle: '' }
  const unreadCount = unreadData?.data?.data?.count || 0

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleLogout() {
    try { await authApi.logout() } catch { /* ignore */ }
    logout()
    navigate('/login')
  }

  return (
    <header className="h-16 bg-dark-surface/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 flex-shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-white">{meta.title}</h1>
        <p className="text-xs text-slate-400">{meta.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setDark(!dark)}
          className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
          <Zap size={14} className="text-yellow-400" />
          <span className="text-xs font-semibold text-white">2,847</span>
        </div>

        <button className="relative p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-semibold">
              {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-white leading-tight">{user?.fullName}</p>
              <p className="text-[10px] text-slate-400 capitalize">{user?.role}</p>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-dark-card border border-white/10 rounded-xl shadow-2xl py-1 z-50">
              <button
                onClick={() => { navigate('/dashboard/settings'); setMenuOpen(false) }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5"
              >
                <User size={16} /> Profile
              </button>
              <button
                onClick={() => { navigate('/dashboard/settings'); setMenuOpen(false) }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5"
              >
                <Settings size={16} /> Settings
              </button>
              <hr className="border-white/5 my-1" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
