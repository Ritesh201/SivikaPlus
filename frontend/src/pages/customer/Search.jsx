import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import Spinner from '../../components/common/Spinner'
import { Search as SearchIcon } from 'lucide-react'

export default function Search() {
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const [results, setResults] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!q) return
    setLoading(true)
    api.get(`/products/search?q=${encodeURIComponent(q)}&size=24`)
      .then(r => { setResults(r.data.content || []); setTotal(r.data.totalElements || 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [q])

  return (
    <div className="page-container" style={{ padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontWeight: 800, fontSize: '1.25rem', color: '#111' }}>
          {q ? `Search results for "${q}"` : 'Search Products'}
        </h1>
        {q && <p style={{ fontSize: '.875rem', color: '#6b7280', marginTop: '.25rem' }}>{total} result{total !== 1 ? 's' : ''} found</p>}
      </div>

      {loading ? <Spinner center /> : results.length === 0 && q ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>
          <SearchIcon size={48} style={{ margin: '0 auto 1rem', display: 'block', opacity: .3 }} />
          <p>No products found for "<strong>{q}</strong>"</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
          {results.map(p => (
            <Link key={p.id} to={`/products/${p.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card" style={{ overflow: 'hidden', cursor: 'pointer' }}>
                <div style={{ aspectRatio: '1', background: '#f9fafb' }}>
                  {p.primaryImageUrl ? <img src={p.primaryImageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>📦</div>}
                </div>
                <div style={{ padding: '.9rem' }}>
                  <p style={{ fontWeight: 600, fontSize: '.875rem', color: '#111', marginBottom: '.35rem' }}>{p.name}</p>
                  <p style={{ fontWeight: 800, fontSize: '.95rem', color: '#111' }}>₹{p.minPrice ? Number(p.minPrice).toLocaleString('en-IN') : '—'}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
