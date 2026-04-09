import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import Spinner from '../../components/common/Spinner'
import toast from 'react-hot-toast'
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react'

export default function Cart() {
  const navigate = useNavigate()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  const loadCart = () => {
    api.get('/cart').then(r => setCart(r.data)).catch(() => toast.error('Failed to load cart')).finally(() => setLoading(false))
  }

  useEffect(() => { loadCart() }, [])

  const updateQty = async (itemId, qty) => {
    setUpdating(itemId)
    try {
      const r = await api.put(`/cart/${itemId}?quantity=${qty}`)
      setCart(r.data)
    } catch (e) { toast.error(e.response?.data?.message || 'Error') }
    finally { setUpdating(null) }
  }

  const remove = async (itemId) => {
    setUpdating(itemId)
    try {
      await api.delete(`/cart/${itemId}`)
      loadCart()
    } catch { toast.error('Error') }
    finally { setUpdating(null) }
  }

  if (loading) return <Spinner center />

  if (!cart?.items?.length) return (
    <div className="page-container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
      <ShoppingBag size={56} style={{ margin: '0 auto 1rem', display: 'block', color: '#d1d5db' }} />
      <h2 style={{ fontWeight: 700, color: '#111', marginBottom: '.5rem' }}>Your cart is empty</h2>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Add some products to get started</p>
      <Link to="/products" style={{ display: 'inline-block', padding: '.75rem 2rem', background: 'var(--brand)', color: '#fff', borderRadius: '.6rem', fontWeight: 700, textDecoration: 'none' }}>Shop Now</Link>
    </div>
  )

  return (
    <div className="page-container" style={{ padding: '2rem 1.5rem' }}>
      <h1 style={{ fontWeight: 800, fontSize: '1.35rem', color: '#111', marginBottom: '1.5rem' }}>
        Your Cart ({cart.totalItems} item{cart.totalItems !== 1 ? 's' : ''})
      </h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>

        {/* Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {cart.items.map(item => (
            <div key={item.id} className="card" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', opacity: updating === item.id ? .6 : 1 }}>
              <div style={{ width: 72, height: 72, borderRadius: '.5rem', background: '#f9fafb', flexShrink: 0, overflow: 'hidden' }}>
                {item.imageUrl ? <img src={item.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📦</div>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: '.9rem', color: '#111', marginBottom: '.15rem' }}>{item.productName}</p>
                <p style={{ fontSize: '.78rem', color: '#6b7280' }}>Sold by: {item.sellerName}</p>
                <p style={{ fontSize: '.78rem', color: '#6b7280' }}>₹{Number(item.price).toLocaleString('en-IN')} each</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e5e7eb', borderRadius: '.4rem', overflow: 'hidden' }}>
                  <button onClick={() => updateQty(item.id, item.quantity - 1)} disabled={updating === item.id}
                    style={{ width: 30, height: 32, background: '#f9fafb', border: 'none', cursor: 'pointer', fontWeight: 700 }}>−</button>
                  <span style={{ width: 32, textAlign: 'center', fontSize: '.875rem', fontWeight: 700 }}>{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, item.quantity + 1)} disabled={updating === item.id || item.quantity >= item.availableStock}
                    style={{ width: 30, height: 32, background: '#f9fafb', border: 'none', cursor: 'pointer', fontWeight: 700 }}>+</button>
                </div>
                <p style={{ fontWeight: 800, fontSize: '.95rem', color: '#111', minWidth: 70, textAlign: 'right' }}>₹{Number(item.itemTotal).toLocaleString('en-IN')}</p>
                <button onClick={() => remove(item.id)} disabled={updating === item.id}
                  style={{ background: '#fef2f2', border: 'none', borderRadius: '.4rem', padding: '.35rem', cursor: 'pointer', color: '#dc2626' }}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="card" style={{ padding: '1.25rem', position: 'sticky', top: 80 }}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', color: '#111' }}>Order Summary</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.6rem', fontSize: '.9rem' }}>
            <span style={{ color: '#6b7280' }}>Subtotal</span>
            <span style={{ fontWeight: 600 }}>₹{Number(cart.subtotal).toLocaleString('en-IN')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '.9rem' }}>
            <span style={{ color: '#6b7280' }}>Delivery</span>
            <span style={{ color: '#059669', fontWeight: 600 }}>Free</span>
          </div>
          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>Total</span>
            <span style={{ fontWeight: 900, fontSize: '1.15rem', color: '#111' }}>₹{Number(cart.subtotal).toLocaleString('en-IN')}</span>
          </div>
          <button onClick={() => navigate('/checkout')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem', padding: '.85rem', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '.6rem', fontWeight: 700, fontSize: '.95rem', cursor: 'pointer' }}>
            Checkout <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </div>
  )
}
