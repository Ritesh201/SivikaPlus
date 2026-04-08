import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import Spinner from '../../components/common/Spinner'
import EmptyState from '../../components/common/EmptyState'
import { Plus, Pencil, Trash2, Package, X, Check } from 'lucide-react'
import { useAuth } from '../../store/authStore'

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 480, padding: '1.5rem', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '.6rem .85rem', border: '1.5px solid #e5e7eb',
  borderRadius: '.5rem', fontSize: '.875rem', outline: 'none', marginBottom: '1rem',
}

export default function SellerProducts() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'create' | product object (edit)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', brand: '', categoryId: '' })

  const approved = user?.sellerProfile?.verificationStatus === 'APPROVED'

  const load = async () => {
    setLoading(true)
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/seller/products?page=0&size=50'),
        api.get('/products/categories'),
      ])
      setProducts(prodRes.data.content || [])
      setCategories(catRes.data || [])
    } catch { toast.error('Failed to load products') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setForm({ name: '', description: '', brand: '', categoryId: '' })
    setModal('create')
  }

  const openEdit = (p) => {
    setForm({ name: p.name, description: p.description || '', brand: p.brand || '', categoryId: '' })
    setModal(p)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, categoryId: form.categoryId || undefined }
      if (modal === 'create') {
        await api.post('/seller/products', payload)
        toast.success('Product created!')
      } else {
        await api.put(`/seller/products/${modal.id}`, payload)
        toast.success('Product updated!')
      }
      setModal(null)
      load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return
    try {
      await api.delete(`/seller/products/${id}`)
      toast.success('Product deleted')
      load()
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to delete') }
  }

  if (loading) return <Spinner center />

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: '1.35rem', color: '#111' }}>My Products</h1>
          <p style={{ color: '#6b7280', fontSize: '.875rem', marginTop: '.15rem' }}>{products.length} product{products.length !== 1 ? 's' : ''} in your catalog</p>
        </div>
        {approved && (
          <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.6rem 1.1rem', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '.6rem', fontWeight: 600, fontSize: '.875rem', cursor: 'pointer' }}>
            <Plus size={17} /> Add Product
          </button>
        )}
      </div>

      {products.length === 0 ? (
        <div className="card" style={{ padding: 0 }}>
          <EmptyState
            icon={Package}
            title="No products yet"
            subtitle={approved ? 'Add your first product to start selling.' : 'Your account needs approval before adding products.'}
            action={approved && (
              <button onClick={openCreate} style={{ padding: '.6rem 1.25rem', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '.6rem', fontWeight: 600, cursor: 'pointer' }}>
                Add Product
              </button>
            )}
          />
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Product', 'Brand', 'Category', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '.75rem 1rem', textAlign: 'left', fontSize: '.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '.85rem 1rem' }}>
                    <p style={{ fontWeight: 600, fontSize: '.875rem', color: '#111' }}>{p.name}</p>
                    {p.description && <p style={{ fontSize: '.75rem', color: '#9ca3af', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{p.description}</p>}
                  </td>
                  <td style={{ padding: '.85rem 1rem', fontSize: '.875rem', color: '#374151' }}>{p.brand || '—'}</td>
                  <td style={{ padding: '.85rem 1rem', fontSize: '.875rem', color: '#374151' }}>{p.categoryName || '—'}</td>
                  <td style={{ padding: '.85rem 1rem' }}>
                    <span style={{ fontSize: '.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 9999, background: p.active ? '#d1fae5' : '#f3f4f6', color: p.active ? '#065f46' : '#6b7280' }}>
                      {p.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '.85rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '.5rem' }}>
                      <button onClick={() => openEdit(p)} style={{ padding: '.35rem', background: '#f0fdf4', border: 'none', borderRadius: '.4rem', cursor: 'pointer', color: '#16a34a' }}><Pencil size={15} /></button>
                      <button onClick={() => handleDelete(p.id, p.name)} style={{ padding: '.35rem', background: '#fef2f2', border: 'none', borderRadius: '.4rem', cursor: 'pointer', color: '#dc2626' }}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <Modal title={modal === 'create' ? 'Add New Product' : 'Edit Product'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit}>
            <label style={labelStyle}>Product Name *</label>
            <input required style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Wireless Headphones" />

            <label style={labelStyle}>Brand</label>
            <input style={inputStyle} value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} placeholder="e.g. Sony" />

            <label style={labelStyle}>Category</label>
            <select style={{ ...inputStyle, background: '#fff' }} value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <label style={labelStyle}>Description</label>
            <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe this product..." />

            {modal !== 'create' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem', cursor: 'pointer', fontSize: '.875rem', fontWeight: 500 }}>
                <input type="checkbox" checked={form.active ?? true} onChange={e => setForm({ ...form, active: e.target.checked })} />
                Product is active
              </label>
            )}

            <div style={{ display: 'flex', gap: '.75rem' }}>
              <button type="button" onClick={() => setModal(null)} style={{ flex: 1, padding: '.65rem', border: '1.5px solid #e5e7eb', borderRadius: '.5rem', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ flex: 1, padding: '.65rem', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '.5rem', fontWeight: 700, cursor: 'pointer', opacity: saving ? .7 : 1 }}>
                {saving ? 'Saving…' : modal === 'create' ? 'Create' : 'Update'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: '.3rem' }
