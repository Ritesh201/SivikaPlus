import { useState, useEffect } from 'react'
import api from '../../services/api'
import Spinner from '../../components/common/Spinner'
import EmptyState from '../../components/common/EmptyState'
import { ShoppingCart, Printer, ChevronDown, ChevronUp } from 'lucide-react'

const STATUS = {
  PENDING:    { bg: '#fef3c7', color: '#92400e' },
  CONFIRMED:  { bg: '#dbeafe', color: '#1e40af' },
  PROCESSING: { bg: '#ede9fe', color: '#5b21b6' },
  SHIPPED:    { bg: '#cffafe', color: '#155e75' },
  DELIVERED:  { bg: '#d1fae5', color: '#065f46' },
  CANCELLED:  { bg: '#fee2e2', color: '#991b1b' },
  REFUNDED:   { bg: '#f3f4f6', color: '#6b7280' },
}

const STATUS_FLOW = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']

function printBill(order) {
  const win = window.open('', '_blank', 'width=480,height=650')
  const itemRows = order.items.map(i => `
    <tr>
      <td>${i.productName}</td>
      <td>${i.quantity}</td>
      <td>₹${Number(i.unitPrice).toLocaleString('en-IN')}</td>
      <td>₹${Number(i.totalPrice).toLocaleString('en-IN')}</td>
    </tr>`).join('')

  win.document.write(`
    <html>
      <head>
        <title>Bill - ${order.orderNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
          h2 { margin-bottom: 4px; }
          .meta { color: #6b7280; font-size: 13px; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { text-align: left; font-size: 12px; color: #6b7280; border-bottom: 1px solid #e5e7eb; padding: 6px 0; }
          td { padding: 8px 0; font-size: 14px; border-bottom: 1px solid #f3f4f6; }
          .total-row td { font-weight: 700; font-size: 15px; border-bottom: none; padding-top: 14px; }
          .footer { margin-top: 32px; font-size: 12px; color: #9ca3af; text-align: center; }
        </style>
      </head>
      <body>
        <h2>SivikaPlus</h2>
        <div class="meta">
          Order ${order.orderNumber} &nbsp;|&nbsp;
          ${order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
        </div>
        <hr/>
        <table>
          <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
          <tbody>
            ${itemRows}
            <tr class="total-row">
              <td colspan="3">Grand Total</td>
              <td>₹${Number(order.orderTotal).toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>
        <div class="footer">Thank you for shopping with SivikaPlus!</div>
        <script>window.onload = () => { window.print(); window.close(); }</script>
      </body>
    </html>
  `)
  win.document.close()
}

export default function SellerOrders() {
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})
  const [updatingId, setUpdatingId] = useState(null)

  const load = async (p = 0) => {
    setLoading(true)
    try {
      const res = await api.get(`/seller/orders?page=${p}&size=15`)
      setOrders(res.data.content || [])
      setTotal(res.data.totalElements || 0)
      setPages(res.data.totalPages || 1)
      setPage(p)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { load(0) }, [])

  const toggleExpand = (orderId) => {
    setExpanded(prev => ({ ...prev, [orderId]: !prev[orderId] }))
  }

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId)
    try {
      await api.patch(`/seller/orders/${orderId}/status`, { status: newStatus })
      setOrders(prev => prev.map(o =>
        o.orderId === orderId ? { ...o, orderStatus: newStatus } : o
      ))
    } catch {
      alert('Failed to update status.')
    } finally { setUpdatingId(null) }
  }

  if (loading) return <Spinner center />

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontWeight: 800, fontSize: '1.35rem', color: '#111' }}>Customer Orders</h1>
        <p style={{ color: '#6b7280', fontSize: '.875rem', marginTop: '.15rem' }}>
          {total} order{total !== 1 ? 's' : ''}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="card" style={{ padding: 0 }}>
          <EmptyState icon={ShoppingCart} title="No orders yet" subtitle="When customers buy your products, orders will appear here." />
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', marginBottom: '1rem' }}>
            {orders.map(order => {
              const s = STATUS[order.orderStatus] || STATUS.PENDING
              const isOpen = expanded[order.orderId]
              const isUpdating = updatingId === order.orderId

              return (
                <div key={order.orderId} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  {/* Order Header Row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.9rem 1.1rem', borderBottom: isOpen ? '1px solid #f3f4f6' : 'none', flexWrap: 'wrap', gap: '.5rem' }}>
                    
                    {/* Left: order info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '.9rem', color: '#111', margin: 0 }}>{order.orderNumber}</p>
                        <p style={{ fontSize: '.75rem', color: '#9ca3af', margin: '2px 0 0' }}>
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </p>
                      </div>
                      <div style={{ fontSize: '.8rem', color: '#374151' }}>
                        <span style={{ fontWeight: 600 }}>{order.items.length}</span> item{order.items.length !== 1 ? 's' : ''}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '.95rem', color: '#111' }}>
                        ₹{Number(order.orderTotal).toLocaleString('en-IN')}
                      </div>
                    </div>

                    {/* Right: status + actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                      <select
                        value={order.orderStatus}
                        disabled={isUpdating}
                        onChange={e => handleStatusChange(order.orderId, e.target.value)}
                        style={{ fontSize: '.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: 9999, border: `1.5px solid ${s.color}`, background: s.bg, color: s.color, cursor: 'pointer', outline: 'none', opacity: isUpdating ? 0.6 : 1 }}
                      >
                        {STATUS_FLOW.map(st => <option key={st} value={st}>{st}</option>)}
                      </select>

                      <button onClick={() => printBill(order)} title="Print Bill"
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: '.4rem', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer' }}>
                        <Printer size={13} /> Bill
                      </button>

                      <button onClick={() => toggleExpand(order.orderId)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: '.4rem', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer' }}>
                        {isOpen ? <><ChevronUp size={13} /> Hide</> : <><ChevronDown size={13} /> Items</>}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Items */}
                  {isOpen && (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          {['Product', 'Qty', 'Unit Price', 'Total'].map(h => (
                            <th key={h} style={{ padding: '.6rem 1.1rem', textAlign: 'left', fontSize: '.72rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map(item => (
                          <tr key={item.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '.7rem 1.1rem' }}>
                              <p style={{ fontWeight: 600, fontSize: '.875rem', color: '#111', margin: 0 }}>{item.productName}</p>
                            </td>
                            <td style={{ padding: '.7rem 1.1rem', fontSize: '.875rem', color: '#374151' }}>{item.quantity}</td>
                            <td style={{ padding: '.7rem 1.1rem', fontSize: '.875rem', color: '#374151' }}>₹{Number(item.unitPrice).toLocaleString('en-IN')}</td>
                            <td style={{ padding: '.7rem 1.1rem', fontWeight: 700, fontSize: '.9rem', color: '#111' }}>₹{Number(item.totalPrice).toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )
            })}
          </div>

          {pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '.5rem' }}>
              {Array.from({ length: pages }, (_, i) => (
                <button key={i} onClick={() => load(i)}
                  style={{ width: 34, height: 34, borderRadius: '.4rem', border: '1.5px solid', fontWeight: 600, fontSize: '.85rem', cursor: 'pointer', borderColor: page === i ? 'var(--brand)' : '#e5e7eb', background: page === i ? 'var(--brand)' : '#fff', color: page === i ? '#fff' : '#374151' }}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}