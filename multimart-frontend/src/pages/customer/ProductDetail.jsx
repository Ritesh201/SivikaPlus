import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useAuth } from '../../store/authStore'
import Spinner from '../../components/common/Spinner'
import toast from 'react-hot-toast'
import { ShoppingCart, Star, ChevronDown, ChevronUp, Shield } from 'lucide-react'

export default function ProductDetail() {
  const { slug } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [listings, setListings] = useState([])
  const [selectedListing, setSelectedListing] = useState(null)
  const [qty, setQty] = useState(1)
  const [imgIdx, setImgIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [showAllSellers, setShowAllSellers] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get(`/products/${slug}`)
      .then(async r => {
        setProduct(r.data)
        const listRes = await api.get(`/products/${r.data.id}/listings`)
        const ls = listRes.data || []
        setListings(ls)
        if (ls.length > 0) setSelectedListing(ls[0])
      })
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false))
  }, [slug])

  const addToCart = async () => {
    if (!user) { navigate('/login'); return }
    if (!selectedListing) { toast.error('Please select a seller'); return }
    setAdding(true)
    try {
      await api.post('/cart/add', { listingId: selectedListing.id, quantity: qty })
      toast.success('Added to cart!')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to add to cart')
    } finally { setAdding(false) }
  }

  if (loading) return <Spinner center />
  if (!product) return <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>Product not found</div>

  const images = product.images?.length > 0 ? product.images : []
  const displayedListings = showAllSellers ? listings : listings.slice(0, 3)

  return (
    <div className="page-container" style={{ padding: '2rem 1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', alignItems: 'start' }}>

        {/* Images */}
        <div>
          <div style={{ aspectRatio: '1', background: '#f9fafb', borderRadius: '1rem', overflow: 'hidden', marginBottom: '.75rem', border: '1px solid #e5e7eb' }}>
            {images.length > 0
              ? <img src={images[imgIdx]?.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>📦</div>
            }
          </div>
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '.5rem', overflowX: 'auto' }}>
              {images.map((img, i) => (
                <button key={i} onClick={() => setImgIdx(i)}
                  style={{ width: 60, height: 60, borderRadius: '.5rem', overflow: 'hidden', border: `2px solid ${imgIdx === i ? 'var(--brand)' : '#e5e7eb'}`, cursor: 'pointer', flexShrink: 0, padding: 0, background: 'none' }}>
                  <img src={img.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.category && <p style={{ fontSize: '.8rem', color: '#9ca3af', marginBottom: '.4rem' }}>{product.category.name}</p>}
          <h1 style={{ fontWeight: 800, fontSize: '1.35rem', color: '#111', marginBottom: '.5rem', lineHeight: 1.3 }}>{product.name}</h1>
          {product.brand && <p style={{ fontSize: '.875rem', color: '#6b7280', marginBottom: '1rem' }}>Brand: <strong>{product.brand}</strong></p>}

          {selectedListing && (
            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#111' }}>₹{Number(selectedListing.price).toLocaleString('en-IN')}</span>
              {selectedListing.originalPrice && (
                <span style={{ marginLeft: '.75rem', fontSize: '1rem', color: '#9ca3af', textDecoration: 'line-through' }}>₹{Number(selectedListing.originalPrice).toLocaleString('en-IN')}</span>
              )}
            </div>
          )}

          {/* Sellers */}
          {listings.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontWeight: 700, fontSize: '.85rem', color: '#374151', marginBottom: '.6rem' }}>Available from {listings.length} seller{listings.length > 1 ? 's' : ''}:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                {displayedListings.map(l => (
                  <button key={l.id} onClick={() => setSelectedListing(l)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.75rem 1rem', border: `2px solid ${selectedListing?.id === l.id ? 'var(--brand)' : '#e5e7eb'}`, borderRadius: '.6rem', background: selectedListing?.id === l.id ? '#fff7ed' : '#fff', cursor: 'pointer', transition: 'all .15s' }}>
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ fontWeight: 600, fontSize: '.875rem', color: '#111' }}>{l.seller?.businessName || 'Seller'}</p>
                      <p style={{ fontSize: '.75rem', color: '#6b7280' }}>Stock: {l.stockQuantity} · Rating: {l.seller?.rating?.toFixed(1) || '—'}</p>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: selectedListing?.id === l.id ? 'var(--brand)' : '#111' }}>
                      ₹{Number(l.price).toLocaleString('en-IN')}
                    </span>
                  </button>
                ))}
              </div>
              {listings.length > 3 && (
                <button onClick={() => setShowAllSellers(!showAllSellers)}
                  style={{ display: 'flex', alignItems: 'center', gap: '.3rem', marginTop: '.5rem', background: 'none', border: 'none', color: 'var(--brand)', fontWeight: 600, fontSize: '.825rem', cursor: 'pointer' }}>
                  {showAllSellers ? <><ChevronUp size={15} /> Show less</> : <><ChevronDown size={15} /> Show all {listings.length} sellers</>}
                </button>
              )}
            </div>
          )}

          {/* Quantity + Add to cart */}
          <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e5e7eb', borderRadius: '.5rem', overflow: 'hidden' }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 36, height: 42, background: '#f9fafb', border: 'none', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 700 }}>−</button>
              <span style={{ width: 40, textAlign: 'center', fontWeight: 700 }}>{qty}</span>
              <button onClick={() => setQty(q => q + 1)} style={{ width: 36, height: 42, background: '#f9fafb', border: 'none', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 700 }}>+</button>
            </div>
            <button onClick={addToCart} disabled={adding || !selectedListing || selectedListing.stockQuantity === 0}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem', padding: '.75rem', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '.5rem', fontWeight: 700, fontSize: '.95rem', cursor: 'pointer', opacity: adding || !selectedListing || selectedListing.stockQuantity === 0 ? .6 : 1 }}>
              <ShoppingCart size={18} />
              {selectedListing?.stockQuantity === 0 ? 'Out of Stock' : adding ? 'Adding…' : 'Add to Cart'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.8rem', color: '#6b7280' }}>
            <Shield size={14} /> Secure payment via Razorpay
          </div>

          {product.description && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f3f4f6' }}>
              <p style={{ fontWeight: 700, fontSize: '.875rem', color: '#111', marginBottom: '.5rem' }}>Description</p>
              <p style={{ fontSize: '.875rem', color: '#4b5563', lineHeight: 1.6 }}>{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
