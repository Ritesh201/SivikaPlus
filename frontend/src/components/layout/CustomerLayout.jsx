import { useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/authStore'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { ShoppingBag, Search, ShoppingCart, User, LogOut, Package } from 'lucide-react'

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

      <header style={{
  background: '#fff',
  borderBottom: '1px solid #f1f5f9',
  position: 'sticky',
  top: 0,
  zIndex: 50
}}>

  <div style={{
    maxWidth: 1200,
    margin: '0 auto',
    padding: '.6rem 1rem'
  }}>

    {/* 🔹 Container */}
    <div style={{
      display: 'flex',
      flexWrap: 'wrap', // ⭐ KEY for mobile break
      alignItems: 'center',
      gap: '.75rem'
    }}>

      {/* Logo */}
      <Link to="/" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '.5rem',
        textDecoration: 'none'
      }}>
        <div style={{
          width: 34,
          height: 34,
          background: 'var(--brand)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <ShoppingBag size={18} color="#fff" />
        </div>

        <span style={{
          fontWeight: 900,
          fontSize: '1.1rem',
          color: '#111'
        }}>
          SivikaPlus
        </span>
      </Link>

      {/* 🔍 Search */}
      <form
        onSubmit={handleSearch}
        style={{
          flex: 1,
          minWidth: '250px', // desktop keeps inline
          position: 'relative',
          order: 2 // default desktop position
        }}
      >
        <Search size={16} style={{
          position: 'absolute',
          left: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#9ca3af'
        }} />

        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search products..."
          style={{
            width: '100%',
            paddingLeft: 36,
            height: 38,
            border: '1.5px solid #e5e7eb',
            borderRadius: 9999,
            outline: 'none'
          }}
        />
      </form>

      {/* Right Section */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '.6rem',
        order: 3
      }}>
        {user ? (
          <>
            <Link to="/orders" style={navBtnStyle}>
              <Package size={18} />
            </Link>

            <Link to="/cart" style={navBtnStyle}>
              <ShoppingCart size={18} />
            </Link>

            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{ ...navBtnStyle, border: 'none', cursor: 'pointer' }}
              >
                {user.profileImageUrl
                  ? <img src={user.profileImageUrl} style={{ width: 28, height: 28, borderRadius: '50%' }} />
                  : <User size={18} />
                }
              </button>

              {menuOpen && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 10,
                  boxShadow: '0 8px 24px rgba(0,0,0,.1)'
                }}>
                  <Link to="/profile" style={menuItem}>
                    <User size={15} /> Profile
                  </Link>
                  <button onClick={handleLogout} style={logoutBtn}>
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/login" style={loginStyle}>Login</Link>
            <Link to="/register" style={signupStyle}>Sign Up</Link>
          </>
        )}
      </div>

    </div>

    {/* 🔥 Mobile-only tweak */}
    <style>
      {`
        @media (max-width: 768px) {
          form {
            order: 4 !important;
            width: 100% !important;
          }
        }
      `}
    </style>

  </div>
</header>


      <main>
        <Outlet />
      </main>
    </div>
  )
}

/* 🔹 Styles */

const navBtnStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '2px',
  padding: '.3rem .5rem',
  borderRadius: '.5rem',
  color: '#374151',
  textDecoration: 'none'
}

const menuItem = {
  display: 'flex',
  alignItems: 'center',
  gap: '.5rem',
  padding: '.7rem 1rem',
  textDecoration: 'none',
  color: '#374151',
  fontSize: '.875rem'
}

const logoutBtn = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: '.5rem',
  padding: '.7rem 1rem',
  color: '#ef4444',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '.875rem'
}

const loginStyle = {
  padding: '.45rem .75rem',
  borderRadius: 9999,
  color: '#374151',
  textDecoration: 'none',
  fontWeight: 500,
  fontSize: '.875rem'
}

const signupStyle = {
  padding: '.45rem .75rem',
  borderRadius: 9999,
  background: 'var(--brand)',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: '.875rem'
}