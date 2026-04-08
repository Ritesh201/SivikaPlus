import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Star, Shield, Truck } from 'lucide-react';
import { productApi } from '../../api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './ProductDetailPage.css';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user, isBuyer } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    productApi.getById(id)
      .then(({ data }) => setProduct(data))
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleAddToCart = async () => {
    if (!user) { navigate('/login'); return; }
    if (!isBuyer) { toast.error('Sellers cannot buy'); return; }
    try {
      setAdding(true);
      await addToCart(product.listingId || product.id, qty);
      toast.success(`${qty} item(s) added to cart!`);
    } catch { toast.error('Failed to add to cart'); }
    finally { setAdding(false); }
  };

  if (loading) return (
    <div className="container pdp-loading">
      <div className="skeleton pdp-img-skeleton" />
      <div className="pdp-info-skeleton">
        {[80, 60, 100, 40, 70].map((w, i) => (
          <div key={i} className="skeleton" style={{ height: 20, width: `${w}%`, borderRadius: 8 }} />
        ))}
      </div>
    </div>
  );

  if (!product) return null;

  const images = product.images?.length ? product.images : [product.imageUrl].filter(Boolean);
  const discount = product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  return (
    <div className="pdp container animate-fade">
      <button className="btn-ghost pdp-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="pdp-inner">
        {/* Images */}
        <div className="pdp-images">
          <div className="pdp-main-img">
            {images[activeImg] ? (
              <img src={images[activeImg]} alt={product.name} />
            ) : (
              <div className="pdp-img-placeholder">
                {product.name?.[0]?.toUpperCase()}
              </div>
            )}
            {discount && <div className="pdp-discount-badge">-{discount}% OFF</div>}
          </div>
          {images.length > 1 && (
            <div className="pdp-thumbnails">
              {images.map((img, i) => (
                <button
                  key={i}
                  className={`pdp-thumb ${i === activeImg ? 'active' : ''}`}
                  onClick={() => setActiveImg(i)}
                >
                  <img src={img} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="pdp-info">
          {product.categoryName && (
            <span className="badge badge-pink">{product.categoryName}</span>
          )}
          <h1 className="pdp-name">{product.name}</h1>

          {product.rating && (
            <div className="pdp-rating">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} size={16} fill={s <= Math.round(product.rating) ? 'var(--brand-gold)' : 'transparent'} color="var(--brand-gold)" />
              ))}
              <span>{product.rating.toFixed(1)}</span>
              {product.reviewCount && <span className="pdp-review-count">({product.reviewCount} reviews)</span>}
            </div>
          )}

          <div className="pdp-price-block">
            <span className="pdp-price">₹{product.price?.toLocaleString('en-IN')}</span>
            {product.originalPrice > product.price && (
              <span className="pdp-original">₹{product.originalPrice?.toLocaleString('en-IN')}</span>
            )}
            {discount && <span className="badge badge-pink">{discount}% off</span>}
          </div>

          {product.description && (
            <div className="pdp-desc">
              <h3>About this product</h3>
              <p>{product.description}</p>
            </div>
          )}

          <div className="divider" />

          {/* Quantity + CTA */}
          <div className="pdp-actions">
            <div className="pdp-qty">
              <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty(Math.min(10, qty + 1))}>+</button>
            </div>
            <button className="btn-primary pdp-cart-btn" onClick={handleAddToCart} disabled={adding}>
              <ShoppingCart size={18} />
              {adding ? 'Adding...' : 'Add to Cart'}
            </button>
          </div>

          {/* Trust badges */}
          <div className="pdp-trust">
            <div className="trust-item"><Truck size={16} /><span>Free delivery above ₹499</span></div>
            <div className="trust-item"><Shield size={16} /><span>100% authentic product</span></div>
          </div>

          {/* Seller info */}
          {product.sellerName && (
            <div className="pdp-seller">
              <span className="pdp-seller-label">Sold by</span>
              <span className="pdp-seller-name">{product.sellerName}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
