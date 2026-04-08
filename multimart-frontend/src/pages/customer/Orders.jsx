import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import Spinner from '../../components/common/Spinner'
import { ShoppingBag, ChevronDown, ChevronUp, FileText, ExternalLink } from 'lucide-react'

const STATUS = {
  PENDING:    { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
  CONFIRMED:  { bg: '#dbeafe', color: '#1e40af', label: 'Confirmed' },
  PROCESSING: { bg: '#ede9fe', color: '#5b21b6', label: 'Processing' },
  SHIPPED:    { bg: '#cffafe', color: '#155e75', label: 'Shipped' },
  DELIVERED:  { bg: '#d1fae5', color: '#065f46', label: 'Delivered' },
  CANCELLED:  { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
  REFUNDED:   { bg: '#f3f4f6', color: '#6b7280', label: 'Refunded' },
}

const STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']

function OrderCard({ order }) {
  const [open, setOpen] = useState(false)
  const s = STATUS[order.status] || STATUS.PENDING
  const stepIdx = STEPS.indexOf(order.status)

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', cursor: 'pointer' }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: '.9rem', color: '#111', marginBottom: '.2rem' }}>{order.orderNumber}</p>
          <p style={{ fontSize: '.78rem', color: '#6b7280' }}>
            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
            {' · '}{order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <span style={{ fontSize: '.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 9999, background: s.bg, color: s.color }}>{s.label}</span>
          <span style={{ fontWeight: 900, fontSize: '1rem' }}>₹{Number(order.finalAmount).toLocaleString('en-IN')}</span>
          {open ? <ChevronUp size={18} color="#6b7280" /> : <ChevronDown size={18} color="#6b7280" />}
        </div>
      </div>

      {/* Expanded detail */}
      {open && (
        <div style={{ borderTop: '1px solid #f3f4f6', padding: '1rem 1.25rem' }}>
          {/* Progress bar */}
          {order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && (
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.25rem', gap: 0 }}>
              {STEPS.map((step, i) => (
                <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  {i < STEPS.length - 1 && (
                    <div style={{ position: 'absolute', top: 10, left: '50%', width: '100%', height: 3, background: i < stepIdx ? 'var(--brand)' : '#e5e7eb', zIndex: 0 }} />
                  )}
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: i <= stepIdx ? 'var(--brand)' : '#e5e7eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.65rem', fontWeight: 700, zIndex: 1, position: 'relative' }}>
                    {i < stepIdx ? '✓' : i + 1}
                  </div>
                  <p style={{ fontSize: '.65rem', color: i <= stepIdx ? 'var(--brand)' : '#9ca3af', fontWeight: i <= stepIdx ? 700 : 400, marginTop: '.25rem', textAlign: 'center' }}>{step}</p>
                </div>
              ))}
            </div>
          )}

          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', marginBottom: '1rem' }}>
            {order.items?.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: '.4rem', background: '#f9fafb', flexShrink: 0, overflow: 'hidden' }}>
                  {item.imageUrl ? <img src={item.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: '.85rem', color: '#111' }}>{item.productName}</p>
                  <p style={{ fontSize: '.75rem', color: '#6b7280' }}>{item.sellerName} · Qty: {item.quantity}</p>
                </div>
                <p style={{ fontWeight: 700, fontSize: '.875rem' }}>₹{Number(item.totalPrice).toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>

          {/* Address + Invoice */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', paddingTop: '.75rem' }}>
            {order.address && (
              <p style={{ fontSize: '.78rem', color: '#6b7280' }}>
                📍 {order.address.city}, {order.address.state} - {order.address.pincode}
              </p>
            )}
            {order.invoiceUrl && (
              <a href={order.invoiceUrl} target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.8rem', color: 'var(--brand)', textDecoration: 'none', fontWeight: 600 }}>
                <FileText size={14} /> Download Invoice <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [page, setPage] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = (p = 0) => {
    setLoading(true)
    api.get(`/orders?page=${p}&size=10`)
      .then(r => { setOrders(r.data.content || []); setPages(r.data.totalPages || 1); setPage(p) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(0) }, [])

  if (loading) return <Spinner center />

  return (
    <div className="page-container" style={{ padding: '2rem 1.5rem', maxWidth: 800 }}>
      <h1 style={{ fontWeight: 800, fontSize: '1.35rem', color: '#111', marginBottom: '1.5rem' }}>My Orders</h1>
      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <ShoppingBag size={56} style={{ margin: '0 auto 1rem', display: 'block', color: '#d1d5db' }} />
          <p style={{ fontWeight: 600, color: '#374151', marginBottom: '.5rem' }}>No orders yet</p>
          <Link to="/" style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>Start shopping →</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {orders.map(o => <OrderCard key={o.id} order={o} />)}
        </div>
      )}
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '.5rem', marginTop: '1.5rem' }}>
          {Array.from({ length: pages }, (_, i) => (
            <button key={i} onClick={() => load(i)}
              style={{ width: 34, height: 34, borderRadius: '.4rem', border: '1.5px solid', fontWeight: 600, fontSize: '.85rem', cursor: 'pointer', borderColor: page === i ? 'var(--brand)' : '#e5e7eb', background: page === i ? 'var(--brand)' : '#fff', color: page === i ? '#fff' : '#374151' }}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
