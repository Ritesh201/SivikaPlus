import { ShoppingCart, Star, Heart } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { user, isBuyer } = useAuth();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [wished, setWished] = useState(false);

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    if (!isBuyer) { toast.error('Sellers cannot add to cart'); return; }
    try {
      setAdding(true);
      await addToCart(product.listingId || product.id, 1);
      toast.success('Added to cart!');
    } catch {
      toast.error('Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  return (
    <div className="product-card" onClick={() => navigate(`/products/${product.id}`)}>
      <div className="product-card-img-wrap">
        {product.imageUrl || product.images?.[0] ? (
          <img src={product.imageUrl || product.images[0]} alt={product.name} loading="lazy" />
        ) : (
          <div className="product-card-placeholder">
            <span>{product.name?.[0]?.toUpperCase()}</span>
          </div>
        )}
        {discount && <div className="product-card-discount">-{discount}%</div>}
        <button
          className={`product-card-wish ${wished ? 'wished' : ''}`}
          onClick={(e) => { e.stopPropagation(); setWished(!wished); }}
        >
          <Heart size={15} fill={wished ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="product-card-body">
        {product.categoryName && (
          <span className="product-card-category">{product.categoryName}</span>
        )}
        <h3 className="product-card-name">{product.name}</h3>

        {product.rating && (
          <div className="product-card-rating">
            <Star size={12} fill="var(--brand-gold)" color="var(--brand-gold)" />
            <span>{product.rating.toFixed(1)}</span>
            {product.reviewCount && <span className="rating-count">({product.reviewCount})</span>}
          </div>
        )}

        <div className="product-card-footer">
          <div className="product-card-price">
            <span className="price-current">₹{product.price?.toLocaleString('en-IN')}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="price-original">₹{product.originalPrice?.toLocaleString('en-IN')}</span>
            )}
          </div>
          <button
            className={`product-card-cart-btn ${adding ? 'loading' : ''}`}
            onClick={handleAddToCart}
            disabled={adding}
          >
            <ShoppingCart size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
