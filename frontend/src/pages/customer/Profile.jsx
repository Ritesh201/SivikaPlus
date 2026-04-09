import { useState, useRef } from 'react'
import { useAuth } from '../../store/authStore'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { User, Camera, Save } from 'lucide-react'

const inputStyle = { width: '100%', padding: '.65rem .9rem', border: '1.5px solid #e5e7eb', borderRadius: '.5rem', fontSize: '.875rem', outline: 'none' }
const labelStyle = { display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: '.3rem' }

export default function Profile() {
  const { user, updateUser } = useAuth()
  const fileRef = useRef()
  const [form, setForm] = useState({ fullName: user?.fullName || '', phone: user?.phone || '' })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const saveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await api.patch('/auth/profile', form)
      updateUser(data)
      toast.success('Profile updated!')
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('photo', file)
      const { data } = await api.patch('/auth/profile/photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      updateUser(data)
      toast.success('Photo updated!')
    } catch (e) { toast.error(e.response?.data?.message || 'Upload failed') }
    finally { setUploading(false) }
  }

  return (
    <div className="page-container" style={{ padding: '2rem 1.5rem', maxWidth: 600 }}>
      <h1 style={{ fontWeight: 800, fontSize: '1.35rem', color: '#111', marginBottom: '1.5rem' }}>My Profile</h1>

      <div className="card" style={{ padding: '1.75rem' }}>
        {/* Photo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.75rem' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f3f4f6', overflow: 'hidden', border: '3px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {user?.profileImageUrl
                ? <img src={user.profileImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <User size={32} color="#9ca3af" />
              }
            </div>
            <button onClick={() => fileRef.current.click()} disabled={uploading}
              style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: 'var(--brand)', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Camera size={12} color="#fff" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadPhoto} />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '1rem', color: '#111' }}>{user?.fullName}</p>
            <p style={{ fontSize: '.85rem', color: '#6b7280' }}>{user?.email}</p>
            <span style={{ fontSize: '.75rem', fontWeight: 700, padding: '1px 7px', borderRadius: 9999, background: '#fff7ed', color: 'var(--brand)', marginTop: '.25rem', display: 'inline-block' }}>
              {user?.role}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={saveProfile}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Full Name</label>
            <input style={inputStyle} value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Email</label>
            <input style={{ ...inputStyle, background: '#f9fafb', color: '#6b7280' }} value={user?.email} disabled />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>Phone</label>
            <input style={inputStyle} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" />
          </div>
          <button type="submit" disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.7rem 1.5rem', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '.5rem', fontWeight: 700, cursor: 'pointer', opacity: saving ? .7 : 1 }}>
            <Save size={16} /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
