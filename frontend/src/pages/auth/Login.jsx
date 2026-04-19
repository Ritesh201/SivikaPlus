import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/authStore'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { ShoppingBag, Eye, EyeOff } from 'lucide-react'

const labelStyle = { display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: '.3rem' }
const inputStyle = { width: '100%', padding: '.65rem .9rem', border: '1.5px solid #e5e7eb', borderRadius: '.5rem', fontSize: '.9rem', outline: 'none' }
const btnStyle = { width: '100%', padding: '.75rem', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '.6rem', fontWeight: 700, fontSize: '.95rem', cursor: 'pointer' }
const fieldWrap = { marginBottom: '1.1rem' }

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState('login') // 'login' | 'verify' | 'forgot' | 'otp' | 'reset'
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState('')
  const [reqId, setReqId] = useState('')
  const [newPassword, setNewPassword] = useState('')

  // ── LOGIN ───────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      login(data.user, data.accessToken, data.refreshToken)
      toast.success(`Welcome back, ${data.user.fullName}!`)
      navigate(data.user.role === 'SELLER' ? '/seller' : '/')
    } catch (err) {
      const msg = err.response?.data?.message || ''

      if (msg.includes('OTP sent|')) {
        const parts = msg.split('|')
        const extractedReqId = parts[1] || ''
        const extractedMobile = parts[2] || ''
        
        // Set all state before changing step
        setReqId(extractedReqId)
        setMobile(extractedMobile)
        setLoading(false)   // ← set here explicitly
        setStep('verify')   // ← step change last
        toast('Please verify your mobile first', { icon: '📱' })
        return
      }

      toast.error(msg || 'Login failed')
    } finally {
      setLoading(false)
    }
}

  // ── RESEND OTP (verify screen) ──────────────────────────
  const handleResendOtp = async () => {
    if (!mobile) return toast.error('Mobile number not found')
    setLoading(true)
    try {
      const { data } = await api.post(`/auth/resend-otp?mobile=${mobile}`)
      const parts = (data.message || '').split('|')
      if (parts[1]) setReqId(parts[1])
      setOtp('')
      toast.success('OTP resent!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP')
    } finally { setLoading(false) }
  }

  // ── VERIFY OTP (unverified user at login) ───────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/verify-mobile', { mobile, code: otp, reqId })
      toast.success('Mobile verified! Logging in…')
      const { data } = await api.post('/auth/login', form)
      login(data.user, data.accessToken, data.refreshToken)
      navigate(data.user.role === 'SELLER' ? '/seller' : '/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed')
    } finally { setLoading(false) }
  }

  // ── FORGOT — send OTP ───────────────────────────────────
  const handleForgotSend = async (e) => {
    e?.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post(`/auth/forgot-password?email=${form.email}`)
      const parts = (data.message || '').split('|')
      if (parts[1]) setReqId(parts[1])
      if (parts[3]) setMobile(parts[3]) // real mobile for verify call
      const maskedMobile = parts[2] || ''
      setOtp('')
      toast.success(`OTP sent to ${maskedMobile}`)
      setStep('otp')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP')
    } finally { setLoading(false) }
  }

  // ── RESET PASSWORD ──────────────────────────────────────
  const handleReset = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { mobile, code: otp, reqId, newPassword })
      toast.success('Password reset! Please login.')
      setStep('login')
      setOtp(''); setMobile(''); setNewPassword(''); setReqId('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed')
    } finally { setLoading(false) }
  }

  // ── RENDER: LOGIN ───────────────────────────────────────
  if (step === 'login') return (
    <Screen>
      <Logo subtitle="Sign in to your account" />
      <div className="card" style={{ padding: '2rem' }}>
        <form onSubmit={handleLogin}>
          <div style={fieldWrap}>
            <label style={labelStyle}>Email</label>
            <input type="email" required value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              style={inputStyle} placeholder="you@example.com" />
          </div>
          <div style={{ marginBottom: '.5rem' }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPw ? 'text' : 'password'} required value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                style={{ ...inputStyle, paddingRight: '2.5rem' }} placeholder="••••••••" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'right', marginBottom: '1.25rem' }}>
            <button type="button" onClick={() => setStep('forgot')}
              style={{ background: 'none', border: 'none', color: 'var(--brand)', fontWeight: 600, cursor: 'pointer', fontSize: '.8rem' }}>
              Forgot password?
            </button>
          </div>

          <button type="submit" disabled={loading}
            style={{ ...btnStyle, opacity: loading ? .7 : 1 }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '.875rem', color: '#6b7280' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>Sign up</Link>
        </p>
      </div>
    </Screen>
  )

  // ── RENDER: VERIFY (unverified user) ───────────────────
  if (step === 'verify') return (
    <Screen>
      <Logo subtitle="Verify your mobile" />
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>📱</div>
          <p style={{ fontWeight: 600, color: '#111', marginBottom: '.25rem' }}>OTP sent to your mobile</p>
          <p style={{ fontSize: '.85rem', color: '#6b7280' }}>
            {mobile ? <>Sent to <strong>{mobile}</strong></> : 'Enter your OTP below'}
          </p>
        </div>

        {!mobile && (
          <div style={fieldWrap}>
            <label style={labelStyle}>Your Mobile Number</label>
            <input type="tel" maxLength={10} value={mobile}
              onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
              style={inputStyle} placeholder="9876543210" />
          </div>
        )}

        <form onSubmit={handleVerifyOtp}>
          <div style={fieldWrap}>
            <label style={labelStyle}>6-digit OTP</label>
            <input required maxLength={6} value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              style={{ ...inputStyle, textAlign: 'center', fontSize: '1.5rem', letterSpacing: '.5rem', fontWeight: 700 }}
              placeholder="______" autoFocus />
          </div>
          <button type="submit" disabled={loading || otp.length !== 6}
            style={{ ...btnStyle, opacity: (loading || otp.length !== 6) ? .7 : 1 }}>
            {loading ? 'Verifying…' : 'Verify & Login'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button onClick={handleResendOtp} disabled={loading}
            style={{ background: 'none', border: 'none', color: 'var(--brand)', fontWeight: 600, cursor: 'pointer', fontSize: '.875rem' }}>
            Resend OTP
          </button>
          <span style={{ color: '#9ca3af' }}>·</span>
          <button onClick={() => setStep('login')}
            style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '.875rem' }}>
            ← Back
          </button>
        </div>
      </div>
    </Screen>
  )

  // ── RENDER: FORGOT ──────────────────────────────────────
  // ── RENDER: FORGOT ──────────────────────────────────────
if (step === 'forgot') return (
  <Screen>
    <Logo subtitle="Reset your password" />
    <div className="card" style={{ padding: '2rem' }}>
      <form onSubmit={handleForgotSend}>
        <div style={fieldWrap}>
          <label style={labelStyle}>Registered Email Address</label>
          <input
            type="email" required
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            style={inputStyle} placeholder="you@example.com"
          />
        </div>
        <button type="submit" disabled={loading}
          style={{ ...btnStyle, opacity: loading ? .7 : 1 }}>
          {loading ? 'Sending OTP…' : 'Send OTP'}
        </button>
      </form>
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <button onClick={() => setStep('login')}
          style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '.875rem' }}>
          ← Back to login
        </button>
      </div>
    </div>
  </Screen>
)

  // ── RENDER: OTP (forgot password) ──────────────────────
  if (step === 'otp') return (
    <Screen>
      <Logo subtitle="Enter OTP" />
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>📱</div>
          <p style={{ fontSize: '.85rem', color: '#6b7280' }}>
            OTP sent to <strong>{mobile}</strong>
          </p>
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>6-digit OTP</label>
          <input required maxLength={6} value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
            style={{ ...inputStyle, textAlign: 'center', fontSize: '1.5rem', letterSpacing: '.5rem', fontWeight: 700 }}
            placeholder="______" autoFocus />
        </div>
        <button onClick={() => setStep('reset')} disabled={otp.length !== 6}
          style={{ ...btnStyle, opacity: otp.length !== 6 ? .7 : 1 }}>
          Verify OTP
        </button>
        <div style={{ textAlign: 'center', marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button onClick={handleForgotSend} disabled={loading}
            style={{ background: 'none', border: 'none', color: 'var(--brand)', fontWeight: 600, cursor: 'pointer', fontSize: '.875rem' }}>
            Resend OTP
          </button>
          <span style={{ color: '#9ca3af' }}>·</span>
          <button onClick={() => setStep('forgot')}
            style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '.875rem' }}>
            Change number
          </button>
        </div>
      </div>
    </Screen>
  )

  // ── RENDER: RESET ───────────────────────────────────────
  if (step === 'reset') return (
    <Screen>
      <Logo subtitle="Set new password" />
      <div className="card" style={{ padding: '2rem' }}>
        <form onSubmit={handleReset}>
          <div style={fieldWrap}>
            <label style={labelStyle}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showNewPw ? 'text' : 'password'} required minLength={6}
                value={newPassword} onChange={e => setNewPassword(e.target.value)}
                style={{ ...inputStyle, paddingRight: '2.5rem' }} placeholder="Min 6 characters" />
              <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                {showNewPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            style={{ ...btnStyle, opacity: loading ? .7 : 1 }}>
            {loading ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>
      </div>
    </Screen>
  )
}

// ── Shared components ───────────────────────────────────
function Screen({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {children}
      </div>
    </div>
  )
}

function Logo({ subtitle }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.6rem', marginBottom: '.75rem' }}>
        <div style={{ width: 42, height: 42, background: 'var(--brand)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShoppingBag size={22} color="#fff" />
        </div>
        <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111' }}>SivikaPlus</span>
      </div>
      <p style={{ color: '#6b7280', fontSize: '.9rem' }}>{subtitle}</p>
    </div>
  )
}