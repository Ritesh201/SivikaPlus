import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../store/authStore'
import api from '../../services/api'
import toast from 'react-hot-toast'
import {
  User, Camera, Save, Building2, CreditCard,
  ShieldCheck, Star, ChevronRight, Eye, EyeOff, Loader2
} from 'lucide-react'

// ── Styles ────────────────────────────────────────────────
const input = {
  width: '100%', padding: '.65rem .9rem',
  border: '1.5px solid #e5e7eb', borderRadius: '.5rem',
  fontSize: '.875rem', outline: 'none', background: '#fff',
  transition: 'border-color .2s',
}
const inputFocus = { borderColor: 'var(--brand)' }
const label = {
  display: 'block', fontSize: '.78rem', fontWeight: 700,
  color: '#374151', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.04em'
}
const fieldWrap = { marginBottom: '1rem' }
const sectionCard = {
  background: '#fff', borderRadius: '1rem',
  border: '1.5px solid #f3f4f6', padding: '1.5rem',
  marginBottom: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,.04)'
}
const sectionTitle = {
  fontWeight: 800, fontSize: '1rem', color: '#111',
  marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '.5rem'
}
const badge = (color, bg) => ({
  fontSize: '.72rem', fontWeight: 800, padding: '2px 10px',
  borderRadius: 9999, background: bg, color, letterSpacing: '.04em'
})
const saveBtn = (loading) => ({
  display: 'inline-flex', alignItems: 'center', gap: '.5rem',
  padding: '.65rem 1.4rem', background: 'var(--brand)', color: '#fff',
  border: 'none', borderRadius: '.5rem', fontWeight: 700,
  fontSize: '.875rem', cursor: loading ? 'not-allowed' : 'pointer',
  opacity: loading ? .7 : 1, transition: 'opacity .2s'
})

// ── Tab config ────────────────────────────────────────────
const TABS = [
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'business', label: 'Business', icon: Building2 },
  { id: 'bank', label: 'Bank Details', icon: CreditCard },
]

// ── Masked account display ────────────────────────────────
function MaskedAccount({ value }) {
  const [show, setShow] = useState(false)
  if (!value) return <span style={{ color: '#9ca3af', fontSize: '.85rem' }}>Not set</span>
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', fontFamily: 'monospace', fontSize: '.9rem' }}>
      {show ? value : value}
      <button type="button" onClick={() => setShow(s => !s)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}>
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </span>
  )
}

// ── Focused input ─────────────────────────────────────────
function Field({ label: lbl, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={fieldWrap}>
      <label style={label}>{lbl}</label>
      <input
        style={{ ...input, ...(focused ? inputFocus : {}) }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
    </div>
  )
}

// ── Main component ────────────────────────────────────────
export default function SellerProfile() {
  const { user, updateUser } = useAuth()
  const fileRef = useRef()
  const [tab, setTab] = useState('profile')
  const [uploading, setUploading] = useState(false)
  const [sellerData, setSellerData] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  // Form states
  const [profileForm, setProfileForm] = useState({ fullName: user?.fullName || '', phone: user?.phone || '' })
  const [bizForm, setBizForm] = useState({ businessName: '', businessDescription: '', gstin: '' })
  const [bankForm, setBankForm] = useState({ accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '' })

  const [savingProfile, setSavingProfile] = useState(false)
  const [savingBiz, setSavingBiz] = useState(false)
  const [savingBank, setSavingBank] = useState(false)

  // ── Fetch seller profile ──────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/seller/profile')
        setSellerData(data)
        setBizForm({
          businessName: data.businessName || '',
          businessDescription: data.businessDescription || '',
          gstin: data.gstin || '',
        })
        setBankForm({
          accountHolderName: data.bankDetails?.accountHolderName || '',
          accountNumber: '',  // never prefill account number for security
          ifscCode: data.bankDetails?.ifscCode || '',
          bankName: data.bankDetails?.bankName || '',
        })
      } catch {
        toast.error('Failed to load seller profile')
      } finally {
        setLoadingProfile(false)
      }
    }
    fetch()
  }, [])

  // ── Upload photo ──────────────────────────────────────
  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('photo', file)
      const { data } = await api.patch('/auth/profile/photo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      updateUser(data)
      toast.success('Photo updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally { setUploading(false) }
  }

  // ── Save personal profile ─────────────────────────────
  const saveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const { data } = await api.patch('/auth/profile', profileForm)
      updateUser(data)
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally { setSavingProfile(false) }
  }

  // ── Save business info ────────────────────────────────
  const saveBusiness = async (e) => {
    e.preventDefault()
    setSavingBiz(true)
    try {
      const { data } = await api.put('/seller/profile', bizForm)
      setSellerData(data)
      toast.success('Business info updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update business info')
    } finally { setSavingBiz(false) }
  }

  // ── Save bank details ─────────────────────────────────
  const saveBank = async (e) => {
    e.preventDefault()
    if (!bankForm.accountNumber) {
      toast.error('Please enter account number')
      return
    }
    setSavingBank(true)
    try {
      const { data } = await api.put('/seller/profile/bank-details', bankForm)
      setSellerData(data)
      setBankForm(f => ({ ...f, accountNumber: '' })) // clear after save
      toast.success('Bank details updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update bank details')
    } finally { setSavingBank(false) }
  }

  // ── Verification badge ────────────────────────────────
  const verificationBadge = () => {
    const status = sellerData?.verificationStatus || 'PENDING'
    const map = {
      VERIFIED: { color: '#065f46', bg: '#d1fae5' },
      PENDING:  { color: '#92400e', bg: '#fef3c7' },
      REJECTED: { color: '#991b1b', bg: '#fee2e2' },
    }
    const { color, bg } = map[status] || map.PENDING
    return <span style={badge(color, bg)}>{status}</span>
  }

  if (loadingProfile) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand)' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: 640, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontWeight: 900, fontSize: '1.5rem', color: '#111', marginBottom: '.25rem' }}>
          Seller Account
        </h1>
        <p style={{ color: '#6b7280', fontSize: '.875rem' }}>Manage your profile, business info and payment details</p>
      </div>

      {/* ── Seller Summary Card ── */}
      <div style={{ ...sectionCard, display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f3f4f6', overflow: 'hidden', border: '3px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {user?.profileImageUrl
              ? <img src={user.profileImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <User size={30} color="#9ca3af" />
            }
          </div>
          <button onClick={() => fileRef.current.click()} disabled={uploading}
            style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: '50%', background: 'var(--brand)', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {uploading ? <Loader2 size={10} color="#fff" /> : <Camera size={10} color="#fff" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadPhoto} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
            <p style={{ fontWeight: 800, fontSize: '1rem', color: '#111' }}>{user?.fullName}</p>
            {verificationBadge()}
          </div>
          <p style={{ fontSize: '.82rem', color: '#6b7280', marginTop: '.15rem' }}>{user?.email}</p>
          {sellerData?.businessName && (
            <p style={{ fontSize: '.82rem', color: '#374151', marginTop: '.2rem', fontWeight: 600 }}>
              🏪 {sellerData.businessName}
            </p>
          )}
        </div>

        {/* Rating */}
        {sellerData?.rating > 0 && (
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.25rem', justifyContent: 'center' }}>
              <Star size={16} fill="#f59e0b" color="#f59e0b" />
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111' }}>{sellerData.rating.toFixed(1)}</span>
            </div>
            <p style={{ fontSize: '.72rem', color: '#6b7280' }}>{sellerData.totalRatings} ratings</p>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem', background: '#f9fafb', padding: '.3rem', borderRadius: '.75rem', border: '1.5px solid #f3f4f6' }}>
        {TABS.map(({ id, label: lbl, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '.4rem', padding: '.55rem .5rem', border: 'none', borderRadius: '.55rem',
              fontWeight: 700, fontSize: '.8rem', cursor: 'pointer', transition: 'all .2s',
              background: tab === id ? '#fff' : 'transparent',
              color: tab === id ? 'var(--brand)' : '#6b7280',
              boxShadow: tab === id ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
            }}>
            <Icon size={14} /> {lbl}
          </button>
        ))}
      </div>

      {/* ── Tab: My Profile ── */}
      {tab === 'profile' && (
        <div style={sectionCard}>
          <div style={sectionTitle}><User size={18} color="var(--brand)" /> Personal Information</div>
          <form onSubmit={saveProfile}>
            <div style={fieldWrap}>
              <label style={label}>Full Name</label>
              <input style={{ ...input, background: '#f9fafb', color: '#9ca3af', cursor: 'not-allowed' }}
                value={ profileForm?.fullName} disabled />
            </div>
            <div style={fieldWrap}>
              <label style={label}>Email</label>
              <input style={{ ...input, background: '#f9fafb', color: '#9ca3af', cursor: 'not-allowed' }}
                value={user?.email} disabled />
            </div>
            {/* <div style={fieldWrap}>
              <label style={label}>Phone</label>
              <input style={{ ...input, background: '#f9fafb', color: '#9ca3af', cursor: 'not-allowed' }}
                value={user?.phone} disabled />
            </div> */}
            {/* <button type="submit" disabled={savingProfile} style={saveBtn(savingProfile)}>
              {savingProfile ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
              {savingProfile ? 'Saving…' : 'Save Changes'}
            </button> */}
          </form>
        </div>
      )}

      {/* ── Tab: Business ── */}
      {tab === 'business' && (
        <div style={sectionCard}>
          <div style={sectionTitle}><Building2 size={18} color="var(--brand)" /> Business Information</div>
          <form onSubmit={saveBusiness}>
            <Field label="Business Name *" required value={bizForm.businessName}
              onChange={e => setBizForm({ ...bizForm, businessName: e.target.value })} />
            <div style={fieldWrap}>
              <label style={label}>Business Description</label>
              <textarea
                value={bizForm.businessDescription}
                onChange={e => setBizForm({ ...bizForm, businessDescription: e.target.value })}
                placeholder="Tell customers about your business…"
                rows={4}
                style={{ ...input, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
            <Field label="GSTIN (optional)" value={bizForm.gstin} placeholder="22AAAAA0000A1Z5"
              onChange={e => setBizForm({ ...bizForm, gstin: e.target.value.toUpperCase() })} />

            {/* Verification status info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.75rem 1rem', background: '#f9fafb', borderRadius: '.5rem', marginBottom: '1.25rem' }}>
              <ShieldCheck size={16} color="#6b7280" />
              <span style={{ fontSize: '.82rem', color: '#6b7280' }}>Verification status:</span>
              {verificationBadge()}
            </div>

            <button type="submit" disabled={savingBiz} style={saveBtn(savingBiz)}>
              {savingBiz ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
              {savingBiz ? 'Saving…' : 'Save Business Info'}
            </button>
          </form>
        </div>
      )}

      {/* ── Tab: Bank Details ── */}
      {tab === 'bank' && (
        <div>
          {/* Current bank info (read-only) */}
          {sellerData?.bankDetails?.accountHolderName && (
            <div style={{ ...sectionCard, background: '#f9fafb', marginBottom: '1rem' }}>
              <div style={sectionTitle}><CreditCard size={18} color="var(--brand)" /> Current Bank Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                {[
                  { lbl: 'Account Holder', val: sellerData.bankDetails.accountHolderName },
                  { lbl: 'Bank Name', val: sellerData.bankDetails.bankName },
                  { lbl: 'IFSC Code', val: sellerData.bankDetails.ifscCode },
                  { lbl: 'Account Number', val: sellerData.bankDetails.accountNumber, masked: false},
                ].map(({ lbl, val, masked }) => (
                  <div key={lbl}>
                    <p style={{ fontSize: '.72rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: '.2rem' }}>{lbl}</p>
                    {masked
                      ? <MaskedAccount value={val} />
                      : <p style={{ fontWeight: 600, color: '#111', fontSize: '.9rem' }}>{val || '—'}</p>
                    }
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Update bank form */}
          <div style={sectionCard}>
            <div style={sectionTitle}>
              <CreditCard size={18} color="var(--brand)" />
              {sellerData?.bankDetails?.accountHolderName ? 'Update Bank Details' : 'Add Bank Details'}
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.5rem', padding: '.75rem 1rem', background: '#fffbeb', borderRadius: '.5rem', marginBottom: '1.25rem', border: '1px solid #fde68a' }}>
              <span style={{ fontSize: '1rem' }}>⚠️</span>
              <p style={{ fontSize: '.8rem', color: '#92400e', lineHeight: 1.5 }}>
                Bank details are used for settlement payouts. Ensure the account belongs to your registered business.
              </p>
            </div>

            <form onSubmit={saveBank}>
              <Field label="Account Holder Name *" required value={bankForm.accountHolderName}
                placeholder="As per bank records"
                onChange={e => setBankForm({ ...bankForm, accountHolderName: e.target.value })} />
              <Field label="Account Number *" required value={bankForm.accountNumber}
                placeholder="Enter account number"
                onChange={e => setBankForm({ ...bankForm, accountNumber: e.target.value.replace(/\D/g, '') })} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Field label="IFSC Code *" required value={bankForm.ifscCode}
                  placeholder="SBIN0001234"
                  onChange={e => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })} />
                <Field label="Bank Name *" required value={bankForm.bankName}
                  placeholder="State Bank of India"
                  onChange={e => setBankForm({ ...bankForm, bankName: e.target.value })} />
              </div>
              <button type="submit" disabled={savingBank} style={saveBtn(savingBank)}>
                {savingBank ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
                {savingBank ? 'Saving…' : 'Save Bank Details'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
