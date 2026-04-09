import { useState, useEffect } from 'react'
import api from '../../services/api'
import Spinner from '../../components/common/Spinner'
import { DollarSign, CheckCircle2, Clock } from 'lucide-react'

export default function SellerSettlements() {
  const [settlements, setSettlements] = useState([])
  const [summary, setSummary] = useState(null)
  const [page, setPage] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = async (p = 0) => {
    setLoading(true)
    try {
      const [sRes, sumRes] = await Promise.all([
        api.get(`/seller/settlements?page=${p}&size=15`),
        api.get('/seller/settlements/summary'),
      ])
      setSettlements(sRes.data.content || [])
      setPages(sRes.data.totalPages || 1)
      setPage(p)
      setSummary(sumRes.data)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { load(0) }, [])

  const fmt = v => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

  if (loading) return <Spinner center />

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontWeight: 800, fontSize: '1.35rem', color: '#111' }}>Earnings & Settlements</h1>
        <p style={{ color: '#6b7280', fontSize: '.875rem', marginTop: '.15rem' }}>Platform fee: 2% per order</p>
      </div>

      {/* Summary cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
          <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 9, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={20} color="#059669" />
            </div>
            <div>
              <p style={{ fontSize: '.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Total Paid Out</p>
              <p style={{ fontWeight: 800, fontSize: '1.25rem', color: '#111' }}>{fmt(summary.totalPaid)}</p>
            </div>
          </div>
          <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 9, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} color="#d97706" />
            </div>
            <div>
              <p style={{ fontSize: '.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Pending Payout</p>
              <p style={{ fontWeight: 800, fontSize: '1.25rem', color: '#111' }}>{fmt(summary.totalPending)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ overflow: 'hidden' }}>
        {settlements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
            <DollarSign size={40} style={{ margin: '0 auto .75rem', display: 'block', opacity: .4 }} />
            <p style={{ fontSize: '.875rem' }}>No settlement records yet</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Order', 'Product', 'Gross', 'Platform Fee', 'Net Amount', 'Status', 'Date'].map(h => (
                  <th key={h} style={{ padding: '.75rem 1rem', textAlign: 'left', fontSize: '.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {settlements.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '.85rem 1rem', fontSize: '.8rem', color: '#6b7280', fontFamily: 'monospace' }}>{s.orderNumber || '—'}</td>
                  <td style={{ padding: '.85rem 1rem', fontSize: '.875rem', color: '#111', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.productName || '—'}</td>
                  <td style={{ padding: '.85rem 1rem', fontSize: '.875rem', color: '#374151' }}>{fmt(s.grossAmount)}</td>
                  <td style={{ padding: '.85rem 1rem', fontSize: '.875rem', color: '#dc2626' }}>-{fmt(s.platformFee)}</td>
                  <td style={{ padding: '.85rem 1rem', fontWeight: 700, color: '#059669' }}>{fmt(s.netAmount)}</td>
                  <td style={{ padding: '.85rem 1rem' }}>
                    <span style={{
                      fontSize: '.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 9999,
                      background: s.status === 'COMPLETED' ? '#d1fae5' : s.status === 'PROCESSING' ? '#dbeafe' : '#fef3c7',
                      color: s.status === 'COMPLETED' ? '#065f46' : s.status === 'PROCESSING' ? '#1e40af' : '#92400e',
                    }}>{s.status}</span>
                  </td>
                  <td style={{ padding: '.85rem 1rem', fontSize: '.8rem', color: '#6b7280' }}>
                    {s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '.5rem', marginTop: '1rem' }}>
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
