import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../store/authStore'
import api from '../../services/api'
import Spinner from '../../components/common/Spinner'
import { Package, ShoppingCart, DollarSign, TrendingUp, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
        <p style={{ fontSize: '.8rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</p>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={color} />
        </div>
      </div>
      <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111' }}>{value}</p>
    </div>
  )
}

const STATUS_COLOR = {
  PENDING: { bg: '#fef3c7', color: '#92400e' },
  CONFIRMED: { bg: '#dbeafe', color: '#1e40af' },
  PROCESSING: { bg: '#ede9fe', color: '#5b21b6' },
  SHIPPED: { bg: '#cffafe', color: '#155e75' },
  DELIVERED: { bg: '#d1fae5', color: '#065f46' },
  CANCELLED: { bg: '#fee2e2', color: '#991b1b' },
}

export default function SellerDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/seller/settlements/summary').catch(() => ({ data: { totalPaid: 0, totalPending: 0 } })),
      api.get('/seller/orders?page=0&size=5').catch(() => ({ data: { content: [], totalElements: 0 } })),
      api.get('/seller/listings?page=0&size=5').catch(() => ({ data: { content: [], totalElements: 0 } })),
    ]).then(([summaryRes, ordersRes, listingsRes]) => {
      setStats(summaryRes.data)
      setOrders(ordersRes.data.content || [])
      setListings(listingsRes.data.content || [])
    }).finally(() => setLoading(false))
  }, [])

  const status = user?.sellerProfile?.verificationStatus

  if (loading) return <Spinner center />

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111', marginBottom: '.25rem' }}>
          Welcome back, {user?.sellerProfile?.businessName || user?.fullName} 👋
        </h1>
        <p style={{ color: '#6b7280', fontSize: '.9rem' }}>Here's what's happening with your store today.</p>
      </div>

      {/* Verification notice */}
      {status !== 'APPROVED' && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '.75rem', padding: '1rem 1.25rem',
          borderRadius: '.75rem', marginBottom: '1.5rem',
          background: status === 'REJECTED' ? '#fef2f2' : '#fffbeb',
          border: `1px solid ${status === 'REJECTED' ? '#fecaca' : '#fde68a'}`,
        }}>
          <AlertCircle size={20} color={status === 'REJECTED' ? '#dc2626' : '#d97706'} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontWeight: 600, color: status === 'REJECTED' ? '#991b1b' : '#92400e', marginBottom: '.2rem' }}>
              {status === 'REJECTED' ? 'Account Rejected' : 'Pending Admin Approval'}
            </p>
            <p style={{ fontSize: '.85rem', color: status === 'REJECTED' ? '#b91c1c' : '#a16207' }}>
              {status === 'REJECTED'
                ? 'Your seller account was rejected. Please contact support@multimart.com for assistance.'
                : 'Your account is under review. You can explore the dashboard, but adding products requires approval.'}
            </p>
          </div>
        </div>
      )}

      {status === 'APPROVED' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.75rem 1rem', background: '#d1fae5', border: '1px solid #a7f3d0', borderRadius: '.75rem', marginBottom: '1.5rem' }}>
          <CheckCircle2 size={18} color="#059669" />
          <p style={{ fontSize: '.85rem', color: '#065f46', fontWeight: 500 }}>Your account is verified. You can add products and listings.</p>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard icon={Package} label="My Listings" value={listings.length || '0'} color="#7c3aed" bg="#ede9fe" />
        <StatCard icon={ShoppingCart} label="Recent Orders" value={orders.length || '0'} color="#2563eb" bg="#dbeafe" />
        <StatCard icon={DollarSign} label="Settled Earnings" value={`₹${Number(stats?.totalPaid || 0).toLocaleString('en-IN')}`} color="#059669" bg="#d1fae5" />
        <StatCard icon={TrendingUp} label="Pending Payout" value={`₹${Number(stats?.totalPending || 0).toLocaleString('en-IN')}`} color="#d97706" bg="#fef3c7" />
      </div>

      {/* Two column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

        {/* Recent Orders */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#111' }}>Recent Orders</h2>
            <Link to="/seller/orders" style={{ display: 'flex', alignItems: 'center', gap: '.25rem', fontSize: '.8rem', color: 'var(--brand)', textDecoration: 'none', fontWeight: 600 }}>
              View all <ArrowRight size={13} />
            </Link>
          </div>
          {orders.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '.875rem', padding: '2rem 0' }}>No orders yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {orders.map(o => {
                const s = STATUS_COLOR[o.status] || STATUS_COLOR.PENDING
                return (
                  <div key={o.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '.75rem', borderBottom: '1px solid #f3f4f6' }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '.85rem', color: '#111', marginBottom: '.15rem' }}>{o.productName}</p>
                      <p style={{ fontSize: '.75rem', color: '#6b7280' }}>Qty: {o.quantity}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 700, fontSize: '.85rem', marginBottom: '.25rem' }}>₹{Number(o.totalPrice).toLocaleString('en-IN')}</p>
                      <span style={{ fontSize: '.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 9999, background: s.bg, color: s.color }}>{o.status}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* My Listings */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#111' }}>My Listings</h2>
            <Link to="/seller/listings" style={{ display: 'flex', alignItems: 'center', gap: '.25rem', fontSize: '.8rem', color: 'var(--brand)', textDecoration: 'none', fontWeight: 600 }}>
              View all <ArrowRight size={13} />
            </Link>
          </div>
          {listings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <p style={{ color: '#9ca3af', fontSize: '.875rem', marginBottom: '.75rem' }}>No listings yet</p>
              {status === 'APPROVED' && (
                <Link to="/seller/listings/new" style={{ fontSize: '.8rem', color: 'var(--brand)', textDecoration: 'none', fontWeight: 600 }}>+ Add your first listing</Link>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {listings.map(l => (
                <div key={l.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '.75rem', borderBottom: '1px solid #f3f4f6' }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '.85rem', color: '#111', marginBottom: '.15rem' }}>{l.productName}</p>
                    <p style={{ fontSize: '.75rem', color: '#6b7280' }}>Stock: {l.stockQuantity}</p>
                  </div>
                  <p style={{ fontWeight: 700, fontSize: '.9rem', color: '#111' }}>₹{Number(l.price).toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
