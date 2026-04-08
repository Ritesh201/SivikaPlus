import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/authStore'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { ShoppingBag, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      login(data.user, data.accessToken, data.refreshToken)
      toast.success(`Welcome back, ${data.user.fullName}!`)
      // Role-based redirect — sellers always go to their portal
      navigate(data.user.role === 'SELLER' ? '/seller' : '/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.6rem', marginBottom: '.75rem' }}>
            <div style={{ width: 42, height: 42, background: 'var(--brand)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={22} color="#fff" />
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111' }}>MultiMart</span>
          </div>
          <p style={{ color: '#6b7280', fontSize: '.9rem' }}>Sign in to your account</p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.1rem' }}>
              <label style={labelStyle}>Email</label>
              <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                style={inputStyle} placeholder="you@example.com" />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  style={{ ...inputStyle, paddingRight: '2.5rem' }} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} style={btnStyle}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '.875rem', color: '#6b7280' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: '.3rem' }
const inputStyle = { width: '100%', padding: '.65rem .9rem', border: '1.5px solid #e5e7eb', borderRadius: '.5rem', fontSize: '.9rem', outline: 'none' }
const btnStyle = { width: '100%', padding: '.75rem', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '.6rem', fontWeight: 700, fontSize: '.95rem', cursor: 'pointer' }
