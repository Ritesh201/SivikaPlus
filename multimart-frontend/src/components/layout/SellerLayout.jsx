import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/authStore'
import api from '../../services/api'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, Package, ShoppingCart, DollarSign,
  LogOut, Menu, X, ChevronRight, Store, Bell, User
} from 'lucide-react'

const NAV = [
  { to: '/seller',           label: 'Dashboard',   icon: LayoutDashboard, end: true },
  { to: '/seller/products',  label: 'My Products',  icon: Package },
  { to: '/seller/listings',  label: 'Listings',     icon: Store },
  { to: '/seller/orders',    label: 'Orders',       icon: ShoppingCart },
  { to: '/seller/settlements', label: 'Earnings',   icon: DollarSign },
]

export default function SellerLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    try { await api.post('/auth/logout') } catch {}
    logout()
    toast.success('Logged out')
    navigate('/login')
  }

  const verificationStatus = user?.sellerProfile?.verificationStatus

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>

      {/* ---- SIDEBAR ---- */}
      <aside style={{
        width: '240px', flexShrink: 0,
        background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 50,
        transform: sidebarOpen ? 'translateX(0)' : undefined,
        transition: 'transform .2s',
      }} className="seller-sidebar">

        {/* Logo */}
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <div style={{ width: 36, height: 36, background: 'var(--brand)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={20} color="#fff" />
            </div>
            <div>
              <p style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', lineHeight: 1 }}>MultiMart</p>
              <p style={{ color: '#a5b4fc', fontSize: '.7rem', marginTop: 2 }}>Seller Portal</p>
            </div>
          </div>
        </div>

        {/* Seller info */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {user?.profileImageUrl
                ? <img src={user.profileImageUrl} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                : <User size={18} color="#a5b4fc" />
              }
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ color: '#fff', fontWeight: 600, fontSize: '.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.sellerProfile?.businessName || user?.fullName}
              </p>
              <span style={{
                fontSize: '.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: 9999,
                background: verificationStatus === 'APPROVED' ? '#d1fae5' : verificationStatus === 'REJECTED' ? '#fee2e2' : '#fef3c7',
                color: verificationStatus === 'APPROVED' ? '#065f46' : verificationStatus === 'REJECTED' ? '#991b1b' : '#92400e',
              }}>
                {verificationStatus || 'PENDING'}
              </span>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '.75rem .75rem', overflowY: 'auto' }}>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '.7rem',
                padding: '.65rem .75rem', borderRadius: '.6rem', marginBottom: '.2rem',
                textDecoration: 'none', fontWeight: 500, fontSize: '.875rem',
                transition: 'all .15s',
                background: isActive ? 'rgba(249,115,22,.2)' : 'transparent',
                color: isActive ? '#fdba74' : '#c7d2fe',
              })}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '.75rem', borderTop: '1px solid rgba(255,255,255,.1)' }}>
          <button onClick={handleLogout} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '.7rem',
            padding: '.65rem .75rem', borderRadius: '.6rem', border: 'none',
            background: 'transparent', color: '#fca5a5', cursor: 'pointer',
            fontWeight: 500, fontSize: '.875rem',
          }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 40 }} />
      )}

      {/* ---- MAIN AREA ---- */}
      <div style={{ marginLeft: '240px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* Top bar */}
        <header style={{
          height: 60, background: '#fff', borderBottom: '1px solid #e5e7eb',
          display: 'flex', alignItems: 'center', padding: '0 1.5rem',
          position: 'sticky', top: 0, zIndex: 30,
        }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ display: 'none', marginRight: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}
            className="mobile-menu-btn">
            <Menu size={22} />
          </button>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '.85rem', color: '#6b7280' }}>
              Welcome, <strong style={{ color: '#111' }}>{user?.fullName}</strong>
            </span>
          </div>
        </header>

        {/* Verification banner */}
        {verificationStatus === 'PENDING' && (
          <div style={{
            background: '#fffbeb', borderBottom: '1px solid #fde68a',
            padding: '.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '.75rem',
          }}>
            <Bell size={16} color="#d97706" />
            <p style={{ fontSize: '.85rem', color: '#92400e' }}>
              <strong>Account Pending Approval</strong> — An admin needs to verify your seller account before you can add products or listings.
            </p>
          </div>
        )}
        {verificationStatus === 'REJECTED' && (
          <div style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca', padding: '.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
            <Bell size={16} color="#dc2626" />
            <p style={{ fontSize: '.85rem', color: '#991b1b' }}>
              <strong>Account Rejected</strong> — Please contact support for more information.
            </p>
          </div>
        )}

        {/* Page content */}
        <main style={{ flex: 1, padding: '1.75rem 1.5rem' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .seller-sidebar { transform: translateX(-100%); }
          .seller-sidebar.open { transform: translateX(0); }
          div[style*="marginLeft: 240px"] { margin-left: 0 !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </div>
  )
}
