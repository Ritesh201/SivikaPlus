import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import toast from 'react-hot-toast'
import Spinner from '../../components/common/Spinner'
import { Plus, MapPin, CreditCard } from 'lucide-react'

const inputStyle = { width: '100%', padding: '.6rem .85rem', border: '1.5px solid #e5e7eb', borderRadius: '.5rem', fontSize: '.875rem', outline: 'none' }
const labelStyle = { display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: '.3rem' }

export default function Checkout() {
  const navigate = useNavigate()
  const [cart, setCart] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [selectedAddr, setSelectedAddr] = useState(null)
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [showNewAddr, setShowNewAddr] = useState(false)
  const [addrForm, setAddrForm] = useState({ fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', country: 'India', defaultAddress: false })

  useEffect(() => {
    Promise.all([api.get('/cart'), api.get('/addresses')])
      .then(([cartR, addrR]) => {
        setCart(cartR.data)
        setAddresses(addrR.data || [])
        const def = addrR.data?.find(a => a.defaultAddress) || addrR.data?.[0]
        if (def) setSelectedAddr(def.id)
      })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  const saveAddress = async (e) => {
    e.preventDefault()
    try {
      const r = await api.post('/addresses', addrForm)
      setAddresses(prev => [...prev, r.data])
      setSelectedAddr(r.data.id)
      setShowNewAddr(false)
      toast.success('Address saved')
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
  }

  const placeOrder = async () => {
    if (!selectedAddr) { toast.error('Please select a delivery address'); return }
    setPlacing(true)
    try {
      const orderRes = await api.post('/orders', { addressId: selectedAddr })
      const order = orderRes.data

      // Razorpay payment
      const payRes = await api.post('/payments/create', { orderId: order.id })
      const pay = payRes.data

      const rzpKey = import.meta.env.VITE_RAZORPAY_KEY_ID || pay.keyId
      if (!rzpKey || rzpKey === 'your_razorpay_key_id_here') {
        toast.success(`Order placed! (Order #${order.orderNumber}) — Payment gateway not configured`)
        navigate('/orders')
        return
      }

      const rzp = new window.Razorpay({
        key: rzpKey,
        amount: pay.amount * 100,
        currency: pay.currency,
        name: 'SivikaPlus',
        description: `Order #${order.orderNumber}`,
        order_id: pay.razorpayOrderId,
        handler: async (response) => {
          try {
            await api.post('/payments/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })
            toast.success('Payment successful!')
            navigate('/orders')
          } catch { toast.error('Payment verification failed') }
        },
        prefill: {},
        theme: { color: '#f97316' },
      })
      rzp.open()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to place order')
    } finally { setPlacing(false) }
  }

  if (loading) return <Spinner center />

  return (
    <div className="page-container" style={{ padding: '2rem 1.5rem' }}>
      <h1 style={{ fontWeight: 800, fontSize: '1.35rem', color: '#111', marginBottom: '1.5rem' }}>Checkout</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>

        {/* Addresses */}
        <div>
          <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}><MapPin size={17} /> Delivery Address</h2>
              <button onClick={() => setShowNewAddr(!showNewAddr)} style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.8rem', color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}><Plus size={14} /> New</button>
            </div>

            {showNewAddr && (
              <form onSubmit={saveAddress} style={{ background: '#f9fafb', padding: '1rem', borderRadius: '.6rem', marginBottom: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginBottom: '.75rem' }}>
                  <div><label style={labelStyle}>Full Name *</label><input required style={inputStyle} value={addrForm.fullName} onChange={e => setAddrForm({ ...addrForm, fullName: e.target.value })} /></div>
                  <div><label style={labelStyle}>Phone *</label><input required style={inputStyle} value={addrForm.phone} onChange={e => setAddrForm({ ...addrForm, phone: e.target.value })} /></div>
                </div>
                <div style={{ marginBottom: '.75rem' }}><label style={labelStyle}>Address Line 1 *</label><input required style={inputStyle} value={addrForm.addressLine1} onChange={e => setAddrForm({ ...addrForm, addressLine1: e.target.value })} /></div>
                <div style={{ marginBottom: '.75rem' }}><label style={labelStyle}>Address Line 2</label><input style={inputStyle} value={addrForm.addressLine2} onChange={e => setAddrForm({ ...addrForm, addressLine2: e.target.value })} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.75rem', marginBottom: '.75rem' }}>
                  <div><label style={labelStyle}>City *</label><input required style={inputStyle} value={addrForm.city} onChange={e => setAddrForm({ ...addrForm, city: e.target.value })} /></div>
                  <div><label style={labelStyle}>State *</label><input required style={inputStyle} value={addrForm.state} onChange={e => setAddrForm({ ...addrForm, state: e.target.value })} /></div>
                  <div><label style={labelStyle}>Pincode *</label><input required style={inputStyle} value={addrForm.pincode} onChange={e => setAddrForm({ ...addrForm, pincode: e.target.value })} /></div>
                </div>
                <div style={{ display: 'flex', gap: '.75rem' }}>
                  <button type="button" onClick={() => setShowNewAddr(false)} style={{ flex: 1, padding: '.55rem', border: '1.5px solid #e5e7eb', borderRadius: '.5rem', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, padding: '.55rem', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '.5rem', fontWeight: 700, cursor: 'pointer' }}>Save Address</button>
                </div>
              </form>
            )}

            {addresses.length === 0 && !showNewAddr ? (
              <p style={{ color: '#9ca3af', fontSize: '.875rem', textAlign: 'center', padding: '1rem 0' }}>No saved addresses. Add one above.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                {addresses.map(a => (
                  <button key={a.id} onClick={() => setSelectedAddr(a.id)}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: '.75rem', padding: '.85rem 1rem', border: `2px solid ${selectedAddr === a.id ? 'var(--brand)' : '#e5e7eb'}`, borderRadius: '.6rem', background: selectedAddr === a.id ? '#fff7ed' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${selectedAddr === a.id ? 'var(--brand)' : '#d1d5db'}`, background: selectedAddr === a.id ? 'var(--brand)' : '#fff', flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '.875rem', color: '#111' }}>{a.fullName}</p>
                      <p style={{ fontSize: '.8rem', color: '#6b7280', marginTop: '.15rem' }}>{a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ''}, {a.city}, {a.state} - {a.pincode}</p>
                      <p style={{ fontSize: '.78rem', color: '#9ca3af' }}>{a.phone}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Order summary */}
        <div className="card" style={{ padding: '1.25rem', position: 'sticky', top: 80 }}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', color: '#111' }}>Order Summary</h2>
          {cart?.items?.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.6rem', fontSize: '.85rem' }}>
              <span style={{ color: '#374151', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.productName} ×{item.quantity}</span>
              <span style={{ fontWeight: 600 }}>₹{Number(item.itemTotal).toLocaleString('en-IN')}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>Total</span>
            <span style={{ fontWeight: 900, fontSize: '1.15rem', color: '#111' }}>₹{Number(cart?.subtotal || 0).toLocaleString('en-IN')}</span>
          </div>
          <button onClick={placeOrder} disabled={placing}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem', padding: '.85rem', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '.6rem', fontWeight: 700, fontSize: '.95rem', cursor: 'pointer', opacity: placing ? .7 : 1 }}>
            <CreditCard size={17} /> {placing ? 'Processing…' : 'Pay Now'}
          </button>
          <p style={{ fontSize: '.75rem', color: '#9ca3af', textAlign: 'center', marginTop: '.75rem' }}>Secured by Razorpay</p>
        </div>
      </div>
    </div>
  )
}
