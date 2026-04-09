import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import Spinner from '../../components/common/Spinner'
import { ArrowRight, Zap, ShieldCheck, Truck, Tag } from 'lucide-react'

function ProductCard({ product }) {
  const discount = product.maxPrice && product.minPrice
    ? Math.round((1 - product.minPrice / product.maxPrice) * 100)
    : 0

  return (
    <Link to={`/products/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="card" style={{ overflow: 'hidden', transition: 'transform .2s, box-shadow .2s', cursor: 'pointer' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.1)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
        <div style={{ aspectRatio: '4/3', background: '#f9fafb', position: 'relative', overflow: 'hidden' }}>
          {product.primaryImageUrl
            ? <img src={product.primaryImageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d1d5db', fontSize: '2.5rem' }}>📦</div>
          }
          {discount >= 10 && (
            <span style={{ position: 'absolute', top: 8, left: 8, background: '#dc2626', color: '#fff', fontSize: '.7rem', fontWeight: 700, padding: '2px 7px', borderRadius: 9999 }}>
              {discount}% OFF
            </span>
          )}
        </div>
        <div style={{ padding: '1rem' }}>
          <p style={{ fontSize: '.75rem', color: '#9ca3af', marginBottom: '.2rem' }}>{product.categoryName || ''}</p>
          <p style={{ fontWeight: 600, fontSize: '.9rem', color: '#111', marginBottom: '.5rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{product.name}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <span style={{ fontWeight: 800, fontSize: '1rem', color: '#111' }}>
              ₹{product.minPrice ? Number(product.minPrice).toLocaleString('en-IN') : '—'}
            </span>
            {product.maxPrice && product.maxPrice !== product.minPrice && (
              <span style={{ fontSize: '.8rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                ₹{Number(product.maxPrice).toLocaleString('en-IN')}
              </span>
            )}
          </div>
          {product.totalListings > 0 && (
            <p style={{ fontSize: '.72rem', color: '#6b7280', marginTop: '.3rem' }}>{product.totalListings} seller{product.totalListings > 1 ? 's' : ''}</p>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function Home() {
  const [deals, setDeals] = useState([])
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/recommendations?size=8'),
      api.get('/products?size=12&sort=createdAt&dir=desc'),
      api.get('/products/categories'),
    ]).then(([dealsRes, prodRes, catRes]) => {
      setDeals(dealsRes.data.content || [])
      setProducts(prodRes.data.content || [])
      setCategories(catRes.data || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner center />

  return (
    <div>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #f97316 100%)', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="page-container">
          <p style={{ color: '#fed7aa', fontSize: '.85rem', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '.75rem' }}>Best prices across all sellers</p>
          <h1 style={{ color: '#fff', fontSize: 'clamp(1.75rem, 5vw, 3rem)', fontWeight: 900, marginBottom: '1rem', lineHeight: 1.15 }}>
            Shop Smart.<br />Compare Sellers. Save More.
          </h1>
          <p style={{ color: '#c4b5fd', fontSize: '1rem', marginBottom: '2rem', maxWidth: 480, margin: '0 auto 2rem' }}>
            SivikaPlus shows you the lowest price available across all verified sellers for every product.
          </p>
          <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', background: 'var(--brand)', color: '#fff', padding: '.85rem 2rem', borderRadius: 9999, fontWeight: 700, fontSize: '1rem', textDecoration: 'none' }}>
            Shop Now <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      {/* Trust badges */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f3f4f6' }}>
        <div className="page-container" style={{ display: 'flex', justifyContent: 'center', gap: '3rem', padding: '1.25rem 1.5rem', flexWrap: 'wrap' }}>
          {[[Truck, 'Free Delivery', 'On orders over ₹499'], [ShieldCheck, 'Secure Payments', 'Razorpay protected'], [Tag, 'Best Price', 'Auto-aggregated'], [Zap, 'Fast Delivery', '2-5 business days']].map(([Icon, title, sub]) => (
            <div key={title} style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
              <Icon size={20} color="var(--brand)" />
              <div>
                <p style={{ fontWeight: 600, fontSize: '.8rem', color: '#111' }}>{title}</p>
                <p style={{ fontSize: '.72rem', color: '#9ca3af' }}>{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="page-container" style={{ padding: '2.5rem 1.5rem' }}>

        {/* Categories */}
        {categories.length > 0 && (
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontWeight: 800, fontSize: '1.2rem', color: '#111', marginBottom: '1rem' }}>Shop by Category</h2>
            <div style={{ display: 'flex', gap: '.75rem', overflowX: 'auto', paddingBottom: '.5rem' }}>
              {categories.map(c => (
                <Link key={c.id} to={`/products?category=${c.id}`}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.4rem', padding: '.75rem 1.25rem', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '.75rem', textDecoration: 'none', flexShrink: 0, transition: 'border-color .15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}>
                  <span style={{ fontSize: '1.5rem' }}>
                    {c.slug === 'electronics' ? '📱' : c.slug === 'fashion' ? '👗' : c.slug === 'home-kitchen' ? '🏠' : c.slug === 'books' ? '📚' : c.slug === 'sports' ? '⚽' : '🛍️'}
                  </span>
                  <span style={{ fontSize: '.78rem', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{c.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Deals */}
        {deals.length > 0 && (
          <section style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.2rem', color: '#111', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                <Zap size={20} color="var(--brand)" /> Today's Best Deals
              </h2>
              <Link to="/products" style={{ fontSize: '.85rem', color: 'var(--brand)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '.2rem' }}>
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {deals.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {/* New arrivals */}
        {products.length > 0 && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.2rem', color: '#111' }}>New Arrivals</h2>
              <Link to="/products" style={{ fontSize: '.85rem', color: 'var(--brand)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '.2rem' }}>
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
