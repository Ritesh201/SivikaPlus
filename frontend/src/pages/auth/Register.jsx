import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/authStore'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { ShoppingBag, Eye, EyeOff } from 'lucide-react'

const inputStyle = { width: '100%', padding: '.65rem .9rem', border: '1.5px solid #e5e7eb', borderRadius: '.5rem', fontSize: '.875rem', outline: 'none' }
const labelStyle = { display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: '.3rem' }
const fieldWrap = { marginBottom: '1rem' }
const btnStyle = { width: '100%', padding: '.75rem', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '.6rem', fontWeight: 700, fontSize: '.95rem', cursor: 'pointer', marginTop: '.5rem' }

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState('form') // 'form' | 'otp'
  const [role, setRole] = useState('CUSTOMER')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [otp, setOtp] = useState('')
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', phone: '',
    businessName: '', businessDescription: '', gstin: '',
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const [reqId, setReqId] = useState('')

  // Step 1 — Register
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
        const payload = {          // ← define payload here
            fullName: form.fullName,
            email: form.email,
            password: form.password,
            phone: form.phone.replace(/^\+91/, '').replace(/\D/g, ''),
            role,
            ...(role === 'SELLER' ? {
                businessName: form.businessName,
                businessDescription: form.businessDescription,
                gstin: form.gstin,
            } : {}),
        }

        const { data } = await api.post('/auth/register', payload)

        // extract reqId from message "OTP sent|reqId"
        const parts = data.message.split('|')
        if (parts[1]) setReqId(parts[1])

        toast.success('OTP sent to ' + form.phone)
        setStep('otp')
    } catch (err) {
        toast.error(err.response?.data?.message || 'Registration failed')
    } finally { 
      setLoading(false)
    }
  }
  
  // Step 2 — Verify OTP
  const handleVerifyOtp = async (e) => {
      e.preventDefault()
      setLoading(true)
      try {
          await api.post('/auth/verify-mobile', {
              mobile: form.phone,
              code: otp,      // OTP entered by user
              reqId           // reqId from MSG91
          })
          toast.success('Mobile verified!')
  
          const { data } = await api.post('/auth/login', {
              email: form.email,
              password: form.password,
          })
          login(data.user, data.accessToken, data.refreshToken)
          navigate(data.user.role === 'SELLER' ? '/seller' : '/')
      } catch (err) {
          toast.error(err.response?.data?.message || 'OTP verification failed')
      } finally { setLoading(false) }
  }

  // Resend OTP
  const handleResend = async () => {
    try {
      await api.post('/auth/register', {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone,
        role,
      })
      toast.success('OTP resent!')
    } catch {
      toast.error('Failed to resend OTP')
    }
  }

  // ── OTP Screen ─────────────────────────────────────────
  if (step === 'otp') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.6rem', marginBottom: '.5rem' }}>
              <div style={{ width: 42, height: 42, background: 'var(--brand)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag size={22} color="#fff" />
              </div>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111' }}>SivikaPlus</span>
            </div>
            <p style={{ color: '#6b7280', fontSize: '.9rem' }}>Verify your mobile number</p>
          </div>

          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>📱</div>
              <p style={{ fontWeight: 600, color: '#111', marginBottom: '.25rem' }}>Enter OTP</p>
              <p style={{ fontSize: '.85rem', color: '#6b7280' }}>
                We sent a 6-digit code to <strong>{form.phone}</strong>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp}>
              <div style={fieldWrap}>
                <label style={labelStyle}>6-digit OTP</label>
                <input
                  required
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  style={{ ...inputStyle, textAlign: 'center', fontSize: '1.5rem', letterSpacing: '.5rem', fontWeight: 700 }}
                  placeholder="______"
                />
              </div>

              <button type="submit" disabled={loading || otp.length !== 6} style={{ ...btnStyle, opacity: (loading || otp.length !== 6) ? .7 : 1 }}>
                {loading ? 'Verifying…' : 'Verify & Continue'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button onClick={handleResend} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontWeight: 600, cursor: 'pointer', fontSize: '.875rem' }}>
                Resend OTP
              </button>
              <span style={{ color: '#9ca3af', margin: '0 .5rem' }}>·</span>
              <button onClick={() => setStep('form')} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '.875rem' }}>
                Change number
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Register Form ───────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.6rem', marginBottom: '.5rem' }}>
            <div style={{ width: 42, height: 42, background: 'var(--brand)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={22} color="#fff" />
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111' }}>SivikaPlus</span>
          </div>
          <p style={{ color: '#6b7280', fontSize: '.9rem' }}>Create your account</p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          {/* Role toggle */}
          <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '.6rem', padding: '.25rem', marginBottom: '1.5rem' }}>
            {[['CUSTOMER', '🛒 Customer'], ['SELLER', '🏪 Seller']].map(([r, label]) => (
              <button key={r} type="button" onClick={() => setRole(r)}
                style={{ flex: 1, padding: '.55rem', borderRadius: '.45rem', border: 'none', fontWeight: 600, fontSize: '.875rem', cursor: 'pointer', transition: 'all .15s', background: role === r ? '#fff' : 'transparent', color: role === r ? 'var(--brand)' : '#6b7280', boxShadow: role === r ? '0 1px 4px rgba(0,0,0,.1)' : 'none' }}>
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={fieldWrap}>
              <label style={labelStyle}>Full Name *</label>
              <input required style={inputStyle} value={form.fullName} onChange={set('fullName')} placeholder="Your full name" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={labelStyle}>Email *</label>
                <input type="email" required style={inputStyle} value={form.email} onChange={set('email')} placeholder="you@example.com" />
              </div>
              <div>
                <label style={labelStyle}>Phone *</label>
                <input type="tel" required pattern="[6-9]\d{9}" style={inputStyle} value={form.phone} onChange={set('phone')} placeholder="9876543210" />
              </div>
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>Password * (min 6 chars)</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} required minLength={6}
                  style={{ ...inputStyle, paddingRight: '2.5rem' }}
                  value={form.password} onChange={set('password')} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {role === 'SELLER' && (
              <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '1rem', marginTop: '.5rem' }}>
                <p style={{ fontSize: '.8rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: '.75rem' }}>Business Details</p>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Business Name *</label>
                  <input required={role === 'SELLER'} style={inputStyle} value={form.businessName} onChange={set('businessName')} placeholder="Your store name" />
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Business Description</label>
                  <textarea rows={2} style={{ ...inputStyle, resize: 'vertical' }} value={form.businessDescription} onChange={set('businessDescription')} placeholder="What do you sell?" />
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>GSTIN (optional)</label>
                  <input style={inputStyle} value={form.gstin} onChange={set('gstin')} placeholder="22AAAAA0000A1Z5" />
                </div>
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ ...btnStyle, opacity: loading ? .7 : 1 }}>
              {loading ? 'Sending OTP…' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '.875rem', color: '#6b7280' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}