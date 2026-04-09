import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/authStore'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { ShoppingBag, Search, ShoppingCart, User, LogOut, Menu, X, Package } from 'lucide-react'

export default function CustomerLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    try { await api.post('/auth/logout') } catch {}
    logout()
    toast.success('Logged out')
    navigate('/login')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>

      {/* ---- NAVBAR ---- */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="page-container" style={{ height: 64, display: 'flex', alignItems: 'center', gap: '1rem' }}>

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '.5rem', textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 34, height: 34, background: 'var(--brand)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={18} color="#fff" />
            </div>
            <span style={{ fontWeight: 900, fontSize: '1.15rem', color: '#111' }}>SivikaPlus</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 480, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search products..."
              style={{
                width: '100%', paddingLeft: 36, paddingRight: 12, height: 38,
                border: '1.5px solid #e5e7eb', borderRadius: 9999, outline: 'none',
                fontSize: '.875rem', transition: 'border-color .15s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--brand)'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </form>

          <div style={{ flex: 1 }} />

          {/* Nav items */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '.25rem' }}>
            {user ? (
              <>
                <Link to="/orders" style={navBtnStyle}>
                  <Package size={18} />
                  <span style={{ fontSize: '.8rem' }}>Orders</span>
                </Link>
                <Link to="/cart" style={navBtnStyle}>
                  <ShoppingCart size={18} />
                  <span style={{ fontSize: '.8rem' }}>Cart</span>
                </Link>
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setMenuOpen(!menuOpen)} style={{ ...navBtnStyle, border: 'none', cursor: 'pointer' }}>
                    {user.profileImageUrl
                      ? <img src={user.profileImageUrl} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                      : <User size={18} />
                    }
                    <span style={{ fontSize: '.8rem' }}>{user.fullName?.split(' ')[0]}</span>
                  </button>
                  {menuOpen && (
                    <div style={{
                      position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
                      boxShadow: '0 8px 24px rgba(0,0,0,.1)', minWidth: 160, zIndex: 100,
                    }}>
                      <Link to="/profile" onClick={() => setMenuOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.7rem 1rem', color: '#374151', textDecoration: 'none', fontSize: '.875rem' }}>
                        <User size={15} /> My Profile
                      </Link>
                      <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9' }} />
                      <button onClick={() => { setMenuOpen(false); handleLogout() }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.7rem 1rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '.875rem' }}>
                        <LogOut size={15} /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" style={{ padding: '.45rem 1rem', borderRadius: 9999, color: '#374151', textDecoration: 'none', fontWeight: 500, fontSize: '.875rem' }}>Login</Link>
                <Link to="/register" style={{ padding: '.45rem 1rem', borderRadius: 9999, background: 'var(--brand)', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '.875rem' }}>Sign Up</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  )
}

const navBtnStyle = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
  padding: '.4rem .6rem', borderRadius: '.5rem', color: '#374151',
  textDecoration: 'none', background: 'transparent',
  transition: 'background .15s',
}
