import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, ShoppingCart, Truck, FileText, Zap, BarChart3,
  FileBarChart, MessageSquare, Settings, HelpCircle, Search,
  PanelLeftClose, PanelLeftOpen, Boxes
} from 'lucide-react'
import { classNames } from '../../lib/formatters'

const menuItems = [
  { label: 'Menu', items: [
    { to: '/dashboard/overview', icon: LayoutDashboard, label: 'Overview' },
    { to: '/dashboard/orders', icon: ShoppingCart, label: 'Orders' },
    { to: '/dashboard/carriers', icon: Truck, label: 'Carriers' },
    { to: '/dashboard/invoices', icon: FileText, label: 'Invoice' },
    { to: '/dashboard/automations', icon: Zap, label: 'Automations' },
    { to: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/dashboard/reporting', icon: FileBarChart, label: 'Reporting' },
    { to: '/dashboard/messages', icon: MessageSquare, label: 'Messages' },
  ]},
  { label: 'Support', items: [
    { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
    { to: '/dashboard/help', icon: HelpCircle, label: 'Help' },
  ]},
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={classNames(
      'fixed left-0 top-0 h-full bg-dark-surface border-r border-white/5 z-40 flex flex-col transition-all duration-300',
      collapsed ? 'w-[68px]' : 'w-60'
    )}>
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/5 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
          <Boxes size={18} className="text-white" />
        </div>
        {!collapsed && <span className="text-lg font-bold text-white whitespace-nowrap">Path Wounded</span>}
      </div>

      {!collapsed && (
        <div className="px-3 py-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        {menuItems.map((section) => (
          <div key={section.label}>
            {!collapsed && <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">{section.label}</p>}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => classNames(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500 ml-0'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent',
                    collapsed && 'justify-center ml-0'
                  )}
                >
                  <item.icon size={18} className="flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mx-3 mb-4 flex items-center justify-center gap-2 py-2 text-slate-400 hover:text-white text-xs transition-colors rounded-lg hover:bg-white/5"
      >
        {collapsed ? <PanelLeftOpen size={16} /> : <><PanelLeftClose size={16} /><span>Collapse</span></>}
      </button>
    </aside>
  )
}
