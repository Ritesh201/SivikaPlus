import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, Truck, RefreshCcw } from 'lucide-react';
import { productApi } from '../../api';
import ProductCard from '../../components/buyer/ProductCard';
import './HomePage.css';

const HERO_STATS = [
  { value: '50K+', label: 'Happy customers' },
  { value: '200+', label: 'Beauty brands' },
  { value: '4.9★', label: 'Average rating' },
];

const FEATURES = [
  { icon: <Truck size={22} />, title: 'Free Delivery', desc: 'On orders above ₹499' },
  { icon: <ShieldCheck size={22} />, title: '100% Authentic', desc: 'Verified sellers only' },
  { icon: <RefreshCcw size={22} />, title: 'Easy Returns', desc: '7-day return policy' },
];

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([productApi.getAll({ size: 8 }), productApi.getCategories()])
      .then(([pRes, cRes]) => {
        setProducts(pRes.data.content || pRes.data || []);
        setCategories(cRes.data?.slice(0, 6) || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="container hero-inner">
          <div className="hero-content animate-fade-up">
            <div className="hero-pill">
              <Sparkles size={14} /> New arrivals every week
            </div>
            <h1 className="hero-title">
              Beauty That <br />
              <span className="gradient-text">Speaks Loud</span>
            </h1>
            <p className="hero-desc">
              Discover curated cosmetics from top brands and indie sellers. From bold lips to glowing skin — find your vibe.
            </p>
            <div className="hero-actions">
              <Link to="/products" className="btn-primary hero-cta">
                Shop Now <ArrowRight size={18} />
              </Link>
              <Link to="/register?role=seller" className="btn-outline hero-cta-sec">
                Sell with us
              </Link>
            </div>
            <div className="hero-stats">
              {HERO_STATS.map((s) => (
                <div key={s.label} className="hero-stat">
                  <span className="hero-stat-value">{s.value}</span>
                  <span className="hero-stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-orb hero-orb-1" />
            <div className="hero-orb hero-orb-2" />
            <div className="hero-orb hero-orb-3" />
            <div className="hero-card-mock">
              <div className="hero-card-mock-inner">
                <div className="mock-img" />
                <div className="mock-tag">New Drop ✦</div>
                <div className="mock-title">Velvet Matte Lipstick</div>
                <div className="mock-price">₹1,299</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features bar */}
      <section className="features-bar">
        <div className="container features-inner">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-item">
              <div className="feature-icon">{f.icon}</div>
              <div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="home-section container">
          <div className="home-section-header">
            <h2 className="section-title">Shop by Category</h2>
            <Link to="/products" className="btn-ghost">View all <ArrowRight size={14} /></Link>
          </div>
          <div className="categories-grid">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className="category-chip"
                onClick={() => navigate(`/products?category=${cat.id}`)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="home-section container">
        <div className="home-section-header">
          <h2 className="section-title">Featured Products</h2>
          <Link to="/products" className="btn-ghost">See all <ArrowRight size={14} /></Link>
        </div>
        {loading ? (
          <div className="products-grid">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '320px', borderRadius: '20px' }} />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="products-grid">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="home-empty">No products yet. <Link to="/register">Become a seller →</Link></div>
        )}
      </section>

      {/* CTA banner */}
      <section className="cta-banner container">
        <div className="cta-banner-inner">
          <div>
            <h2 className="section-title">Start selling your beauty products</h2>
            <p>Join our growing network of cosmetics sellers and reach thousands of customers.</p>
          </div>
          <Link to="/register" className="btn-primary">
            Become a Seller <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
