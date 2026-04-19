import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import Spinner from '../../components/common/Spinner'
import { Filter } from 'lucide-react'

function ProductCard({ p }) {
  const disc = p.maxPrice && p.minPrice ? Math.round((1 - p.minPrice / p.maxPrice) * 100) : 0
  return (
    <Link to={`/products/${p.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="card" style={{ overflow: 'hidden', height: '100%', transition: 'transform .2s', cursor: 'pointer' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={e => e.currentTarget.style.transform = ''}>
        <div style={{ aspectRatio: '1', background: '#f9fafb', position: 'relative' }}>
          {p.primaryImageUrl
            ? <img src={p.primaryImageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>📦</div>
          }
          {disc >= 10 && <span style={{ position: 'absolute', top: 8, left: 8, background: '#dc2626', color: '#fff', fontSize: '.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: 9999 }}>{disc}% OFF</span>}
        </div>
        <div style={{ padding: '.9rem' }}>
          <p style={{ fontSize: '.72rem', color: '#9ca3af', marginBottom: '.2rem' }}>{p.categoryName}</p>
          <p style={{ fontWeight: 600, fontSize: '.875rem', color: '#111', marginBottom: '.4rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.name}</p>
          {p.brand && <p style={{ fontSize: '.72rem', color: '#6b7280', marginBottom: '.4rem' }}>{p.brand}</p>}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
            <span style={{ fontWeight: 800, fontSize: '.95rem', color: '#111' }}>₹{p.minPrice ? Number(p.minPrice).toLocaleString('en-IN') : '—'}</span>
            {p.maxPrice && p.maxPrice !== p.minPrice && <span style={{ fontSize: '.78rem', color: '#9ca3af', textDecoration: 'line-through' }}>₹{Number(p.maxPrice).toLocaleString('en-IN')}</span>}
          </div>
          <p style={{ fontSize: '.7rem', color: '#6b7280', marginTop: '.25rem' }}>{p.totalListings} seller{p.totalListings !== 1 ? 's' : ''}</p>
        </div>
      </div>
    </Link>
  )
}

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const categoryId = searchParams.get('category')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/products/categories').then(r => setCategories(r.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const url = categoryId
      ? `/products/category/${categoryId}?page=${page}&size=20`
      : `/products?page=${page}&size=20&sort=createdAt&dir=desc`
    api.get(url)
      .then(r => { setProducts(r.data.content || []); setTotal(r.data.totalElements || 0); setPages(r.data.totalPages || 1) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [categoryId, page])

  return (
    <div className="page-container" style={{ padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', gap: '1.5rem' }}>

        {/* Sidebar filters */}
        <aside style={{ width: 200, flexShrink: 0 }}>
          <div className="card" style={{ padding: '1rem' }}>
            <p style={{ fontWeight: 700, fontSize: '.85rem', color: '#111', marginBottom: '.75rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
              <Filter size={15} /> Categories
            </p>
            <button onClick={() => { setSearchParams({}); setPage(0) }}
              style={{ width: '100%', textAlign: 'left', padding: '.4rem .6rem', borderRadius: '.4rem', border: 'none', cursor: 'pointer', fontSize: '.85rem', fontWeight: !categoryId ? 700 : 400, background: !categoryId ? '#fff7ed' : 'transparent', color: !categoryId ? 'var(--brand)' : '#374151', marginBottom: '.2rem' }}>
              All Products
            </button>
            {categories.map(c => (
              <button key={c.id} onClick={() => { setSearchParams({ category: c.id }); setPage(0) }}
                style={{ width: '100%', textAlign: 'left', padding: '.4rem .6rem', borderRadius: '.4rem', border: 'none', cursor: 'pointer', fontSize: '.85rem', fontWeight: categoryId === c.id ? 700 : 400, background: categoryId === c.id ? '#fff7ed' : 'transparent', color: categoryId === c.id ? 'var(--brand)' : '#374151', marginBottom: '.2rem' }}>
                {c.name}
              </button>
            ))}
          </div>
        </aside>

        {/* Products grid */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <p style={{ fontSize: '.875rem', color: '#6b7280' }}><strong style={{ color: '#111' }}>{total}</strong> products</p>
          </div>

          {loading ? <Spinner center /> : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>No products found</div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {products.map(p => <ProductCard key={p.id} p={p} />)}
              </div>
              {pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '.5rem' }}>
                  {Array.from({ length: Math.min(pages, 8) }, (_, i) => (
                    <button key={i} onClick={() => setPage(i)}
                      style={{ width: 34, height: 34, borderRadius: '.4rem', border: '1.5px solid', fontWeight: 600, fontSize: '.85rem', cursor: 'pointer', borderColor: page === i ? 'var(--brand)' : '#e5e7eb', background: page === i ? 'var(--brand)' : '#fff', color: page === i ? '#fff' : '#374151' }}>
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
