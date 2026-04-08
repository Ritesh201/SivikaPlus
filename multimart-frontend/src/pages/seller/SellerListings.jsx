import { useState, useEffect, useRef } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import Spinner from '../../components/common/Spinner'
import EmptyState from '../../components/common/EmptyState'
import { Plus, Pencil, Trash2, Store, X, Search as SearchIcon, ExternalLink } from 'lucide-react'
import { useAuth } from '../../store/authStore'

const inputStyle = { width: '100%', padding: '.6rem .85rem', border: '1.5px solid #e5e7eb', borderRadius: '.5rem', fontSize: '.875rem', outline: 'none', marginBottom: '1rem', boxSizing: 'border-box' }
const labelStyle = { display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: '.3rem' }

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 520, padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function PendingBanner() {
  return (
    <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '.5rem', padding: '.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '.5rem' }}>
      <span style={{ fontSize: '1rem' }}>⏳</span>
      <div>
        <p style={{ fontSize: '.8rem', fontWeight: 700, color: '#92400e', margin: 0 }}>Admin Approval Required</p>
        <p style={{ fontSize: '.75rem', color: '#b45309', margin: '2px 0 0' }}>Your listing will go live only after admin reviews and approves it.</p>
      </div>
    </div>
  )
}

export default function SellerListings() {
  const { user } = useAuth()
  const approved = user?.sellerProfile?.verificationStatus === 'APPROVED'

  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)

  // Search existing product
  const [productSearch, setProductSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const searchTimer = useRef(null)

  // Mode toggle
  const [createMode, setCreateMode] = useState('search') // 'search' | 'new'

  // New product form
  const [newProduct, setNewProduct] = useState({ name: '', description: '', brand: '', categoryId: '' })
  const [categories, setCategories] = useState([])

  // Listing fields
  const [form, setForm] = useState({ price: '', originalPrice: '', stockQuantity: '', sku: '', customDescription: '' })

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/seller/listings?page=0&size=50')
      setListings(res.data.content || [])
    } catch { toast.error('Failed to load listings') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    api.get('/products/categories').then(r => setCategories(r.data || [])).catch(() => {})
  }, [])

  // Debounced product search
  useEffect(() => {
    if (productSearch.length < 2) { setSearchResults([]); return }
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await api.get(`/products/search?q=${encodeURIComponent(productSearch)}&size=8`)
        setSearchResults(res.data.content || [])
      } catch {}
    }, 300)
  }, [productSearch])

  const resetModal = () => {
    setForm({ price: '', originalPrice: '', stockQuantity: '', sku: '', customDescription: '' })
    setSelectedProduct(null)
    setProductSearch('')
    setSearchResults([])
    setCreateMode('search')
    setNewProduct({ name: '', description: '', brand: '', categoryId: '' })
  }

  const openCreate = () => { resetModal(); setModal('create') }

  const openEdit = (l) => {
    setForm({
      price: l.price, originalPrice: l.originalPrice || '',
      stockQuantity: l.stockQuantity, sku: l.sku || '',
      customDescription: l.customDescription || '', active: l.active
    })
    setModal(l)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (modal === 'create') {
      if (createMode === 'search' && !selectedProduct) { toast.error('Please select a product'); return }
      if (createMode === 'new' && !newProduct.name.trim()) { toast.error('Product name is required'); return }
      if (!form.price) { toast.error('Price is required'); return }
      if (!form.stockQuantity) { toast.error('Stock quantity is required'); return }
    }

    setSaving(true)
    try {
      if (modal === 'create' && createMode === 'new') {
        await api.post('/seller/listings/with-product', {
          ...newProduct,
          categoryId: newProduct.categoryId || undefined,
          price: parseFloat(form.price),
          originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : undefined,
          stockQuantity: parseInt(form.stockQuantity),
          sku: form.sku || undefined,
          customDescription: form.customDescription || undefined,
        })
        toast.success('Submitted for approval! Goes live once admin approves.')
      } else if (modal === 'create' && createMode === 'search') {
        await api.post('/seller/listings', {
          productId: selectedProduct.id,
          price: parseFloat(form.price),
          originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : undefined,
          stockQuantity: parseInt(form.stockQuantity),
          sku: form.sku || undefined,
          customDescription: form.customDescription || undefined,
        })
        toast.success('Listing submitted for approval!')
      } else {
        await api.put(`/seller/listings/${modal.id}`, {
          ...form,
          price: parseFloat(form.price),
          originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : undefined,
          stockQuantity: parseInt(form.stockQuantity),
        })
        toast.success('Listing updated!')
      }
      setModal(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Remove listing for "${name}"?`)) return
    try { await api.delete(`/seller/listings/${id}`); toast.success('Removed'); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  if (loading) return <Spinner center />

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: '1.35rem', color: '#111' }}>My Listings</h1>
          <p style={{ color: '#6b7280', fontSize: '.875rem', marginTop: '.15rem' }}>{listings.length} listing{listings.length !== 1 ? 's' : ''}</p>
        </div>
        {approved && (
          <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.6rem 1.1rem', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '.6rem', fontWeight: 600, fontSize: '.875rem', cursor: 'pointer' }}>
            <Plus size={17} /> Add Listing
          </button>
        )}
      </div>

      {/* Table */}
      {listings.length === 0 ? (
        <div className="card" style={{ padding: 0 }}>
          <EmptyState icon={Store} title="No listings yet"
            subtitle={approved ? 'List a product to start selling on MultiMart.' : 'Account approval needed to add listings.'}
            action={approved && <button onClick={openCreate} style={{ padding: '.6rem 1.25rem', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '.6rem', fontWeight: 600, cursor: 'pointer' }}>Add Listing</button>} />
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Product', 'Price', 'MRP', 'Stock', 'SKU', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '.75rem 1rem', textAlign: 'left', fontSize: '.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listings.map(l => (
                <tr key={l.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '.85rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                      {l.primaryImageUrl && <img src={l.primaryImageUrl} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />}
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '.875rem', color: '#111' }}>{l.productName}</span>
                        {/* {l.productSlug && (
                          // <a href={`/products/${l.productSlug}`} target="_blank" rel="noopener noreferrer"
                          //   style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '.72rem', color: 'var(--brand)', marginTop: 2, textDecoration: 'none' }}>
                          //   View product <ExternalLink size={11} />
                          // </a>
                        )} */}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '.85rem 1rem', fontWeight: 700, fontSize: '.9rem', color: '#111' }}>₹{Number(l.price).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '.85rem 1rem', fontSize: '.85rem', color: '#9ca3af', textDecoration: 'line-through' }}>{l.originalPrice ? `₹${Number(l.originalPrice).toLocaleString('en-IN')}` : '—'}</td>
                  <td style={{ padding: '.85rem 1rem', fontSize: '.875rem', fontWeight: 600, color: l.stockQuantity === 0 ? '#dc2626' : l.stockQuantity < 5 ? '#d97706' : '#111' }}>{l.stockQuantity}</td>
                  <td style={{ padding: '.85rem 1rem', fontSize: '.8rem', color: '#6b7280' }}>{l.sku || '—'}</td>
                  <td style={{ padding: '.85rem 1rem' }}>
                    <span style={{ fontSize: '.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 9999, background: l.active ? '#d1fae5' : '#fef3c7', color: l.active ? '#065f46' : '#92400e' }}>
                      {l.active ? 'Active' : 'Pending Approval'}
                    </span>
                  </td>
                  <td style={{ padding: '.85rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '.5rem' }}>
                      <button onClick={() => openEdit(l)} style={{ padding: '.35rem', background: '#f0fdf4', border: 'none', borderRadius: '.4rem', cursor: 'pointer', color: '#16a34a' }}><Pencil size={15} /></button>
                      <button onClick={() => handleDelete(l.id, l.productName)} style={{ padding: '.35rem', background: '#fef2f2', border: 'none', borderRadius: '.4rem', cursor: 'pointer', color: '#dc2626' }}><Trash2 size={15} /></button>
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
        <Modal
          title={modal === 'create' ? 'Add New Listing' : `Edit: ${modal.productName}`}
          onClose={() => setModal(null)}
        >
          <form onSubmit={handleSubmit}>

            {/* CREATE MODE */}
            {modal === 'create' && (
              <>
                <PendingBanner />

                {/* Toggle */}
                <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.25rem', background: '#f3f4f6', padding: '.25rem', borderRadius: '.6rem' }}>
                  {[{ key: 'search', label: '🔍 Search Platform Products' }, { key: 'new', label: '✚ Submit New Product' }].map(({ key, label }) => (
                    <button key={key} type="button" onClick={() => setCreateMode(key)}
                      style={{ flex: 1, padding: '.5rem', borderRadius: '.45rem', border: 'none', fontWeight: 600, fontSize: '.8rem', cursor: 'pointer', transition: 'all .15s',
                        background: createMode === key ? '#fff' : 'transparent',
                        color: createMode === key ? 'var(--brand)' : '#6b7280',
                        boxShadow: createMode === key ? '0 1px 4px rgba(0,0,0,.1)' : 'none' }}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* SEARCH MODE */}
                {createMode === 'search' && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={labelStyle}>Select Platform Product *</label>
                    {selectedProduct ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.6rem .85rem', border: '1.5px solid #16a34a', borderRadius: '.5rem', background: '#f0fdf4' }}>
                        <div>
                          <p style={{ fontSize: '.875rem', fontWeight: 600, color: '#111', margin: 0 }}>{selectedProduct.name}</p>
                          {selectedProduct.brand && <p style={{ fontSize: '.75rem', color: '#6b7280', margin: '2px 0 0' }}>{selectedProduct.brand}</p>}
                        </div>
                        {/* <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                          {selectedProduct.slug && (
                            <a href={`/products/${selectedProduct.slug}`} target="_blank" rel="noopener noreferrer"
                              title="View product page"
                              style={{ color: 'var(--brand)', display: 'flex', alignItems: 'center' }}>
                              <ExternalLink size={14} />
                            </a>
                          )}
                          <button type="button" onClick={() => setSelectedProduct(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={15} /></button>
                        </div> */}
                      </div>
                    ) : (
                      <div style={{ position: 'relative' }}>
                        <SearchIcon size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                        <input
                          style={{ ...inputStyle, paddingLeft: 30, marginBottom: 0 }}
                          placeholder="Search by name, brand..."
                          value={productSearch}
                          onChange={e => setProductSearch(e.target.value)}
                          autoFocus
                        />
                        {searchResults.length > 0 && (
                          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '.5rem', boxShadow: '0 4px 12px rgba(0,0,0,.1)', zIndex: 10, maxHeight: 220, overflowY: 'auto' }}>
                            {searchResults.map(p => (
                              <div key={p.id}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.65rem 1rem', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                              >
                                <button type="button"
                                  onClick={() => { setSelectedProduct(p); setProductSearch(''); setSearchResults([]) }}
                                  style={{ flex: 1, textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
                                  <strong style={{ fontSize: '.875rem' }}>{p.name}</strong>
                                  {p.brand && <span style={{ fontSize: '.8rem', color: '#6b7280' }}> · {p.brand}</span>}
                                </button>
                                {/* {p.slug && (
                                  <a href={`/products/${p.slug}`} target="_blank" rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    title="View product page"
                                    style={{ color: '#9ca3af', marginLeft: '.5rem', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                                    <ExternalLink size={13} />
                                  </a>
                                )} */}
                              </div>
                            ))}
                          </div>
                        )}
                        {productSearch.length >= 2 && searchResults.length === 0 && (
                          <p style={{ fontSize: '.78rem', color: '#9ca3af', marginTop: '.5rem' }}>
                            No products found. Try <button type="button" onClick={() => setCreateMode('new')} style={{ background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer', fontWeight: 600, padding: 0, fontSize: '.78rem' }}>submitting a new product</button>.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* NEW PRODUCT MODE */}
                {createMode === 'new' && (
                  <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '.5rem', padding: '1rem', marginBottom: '1rem' }}>
                    <p style={{ fontSize: '.78rem', fontWeight: 700, color: '#374151', marginBottom: '.75rem', textTransform: 'uppercase', letterSpacing: '.04em' }}>Product Details</p>
                    <label style={labelStyle}>Product Name *</label>
                    <input
                      style={inputStyle}
                      value={newProduct.name}
                      onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                      placeholder="e.g. Nike Air Max 270"
                    />
                    <label style={labelStyle}>Brand</label>
                    <input
                      style={inputStyle}
                      value={newProduct.brand}
                      onChange={e => setNewProduct({ ...newProduct, brand: e.target.value })}
                      placeholder="e.g. Nike"
                    />
                    <label style={labelStyle}>Category</label>
                    <select style={inputStyle} value={newProduct.categoryId}
                      onChange={e => setNewProduct({ ...newProduct, categoryId: e.target.value })}>
                      <option value="">Select category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <label style={labelStyle}>Description</label>
                    <textarea rows={2} style={{ ...inputStyle, resize: 'vertical' }}
                      value={newProduct.description}
                      onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                      placeholder="Brief product description..." />
                  </div>
                )}
              </>
            )}

            {/* LISTING FIELDS — always shown */}
            <div style={{ ...(modal === 'create' ? { background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '.5rem', padding: '1rem' } : {}) }}>
              {modal === 'create' && <p style={{ fontSize: '.78rem', fontWeight: 700, color: '#374151', marginBottom: '.75rem', textTransform: 'uppercase', letterSpacing: '.04em' }}>Listing Details</p>}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                <div>
                  <label style={labelStyle}>Your Price (₹) *</label>
                  <input required type="number" min="0.01" step="0.01" style={inputStyle} value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="999" />
                </div>
                <div>
                  <label style={labelStyle}>Original MRP (₹)</label>
                  <input type="number" min="0" step="0.01" style={inputStyle} value={form.originalPrice} onChange={e => setForm({ ...form, originalPrice: e.target.value })} placeholder="1299" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                <div>
                  <label style={labelStyle}>Stock Qty *</label>
                  <input required type="number" min="0" style={inputStyle} value={form.stockQuantity} onChange={e => setForm({ ...form, stockQuantity: e.target.value })} placeholder="100" />
                </div>
                <div>
                  <label style={labelStyle}>SKU</label>
                  <input style={inputStyle} value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="MY-001" />
                </div>
              </div>

              <label style={labelStyle}>Custom Description</label>
              <textarea rows={2} style={{ ...inputStyle, resize: 'vertical' }} value={form.customDescription} onChange={e => setForm({ ...form, customDescription: e.target.value })} placeholder="Any special notes about your listing..." />

              {modal !== 'create' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem', cursor: 'pointer', fontSize: '.875rem', fontWeight: 500 }}>
                  <input type="checkbox" checked={form.active ?? true} onChange={e => setForm({ ...form, active: e.target.checked })} />
                  Listing is active
                </label>
              )}
            </div>

            <div style={{ display: 'flex', gap: '.75rem', marginTop: '1rem' }}>
              <button type="button" onClick={() => setModal(null)}
                style={{ flex: 1, padding: '.65rem', border: '1.5px solid #e5e7eb', borderRadius: '.5rem', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                Cancel
              </button>
              <button type="submit" disabled={saving}
                style={{ flex: 1, padding: '.65rem', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '.5rem', fontWeight: 700, cursor: 'pointer', opacity: saving ? .7 : 1 }}>
                {saving ? 'Saving…' : modal === 'create' ? 'Submit for Approval' : 'Update'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}