import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, DollarSign, Activity, ChevronLeft, ChevronRight } from 'lucide-react'

const NAV = [
  { to: '/',           label: 'Overview',                 icon: LayoutDashboard },
  { to: '/patients',   label: 'Patient Intelligence',     icon: Users },
  { to: '/finance',    label: 'Financial Intelligence',   icon: DollarSign },
  { to: '/operations', label: 'Operational Intelligence', icon: Activity },
]

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 99 }}
        />
      )}

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
             style={{ position: mobileOpen ? 'fixed' : 'relative', zIndex: mobileOpen ? 100 : 'auto' }}>

        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <img src="/logo.svg" alt="HealthCore" />
          </div>
          {!collapsed && (
            <div className="sidebar-brand-text">
              <div className="sidebar-brand-title">HealthCore</div>
              <div className="sidebar-brand-sub">Healthcare Intelligence &amp;<br />Operations Platform</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              onClick={onMobileClose}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} />
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle — desktop only */}
        <div className="sidebar-footer" style={{ display: 'none' }}>
          <button className="sidebar-toggle" onClick={() => setCollapsed(c => !c)}>
            {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
          </button>
        </div>
      </aside>
    </>
  )
}
