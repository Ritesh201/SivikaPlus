import { useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, Minus, Plus } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import './CartPage.css';

export default function CartPage() {
  const { cart, loading, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();
  const items = cart.items || [];

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = subtotal > 499 ? 0 : 49;
  const total = subtotal + shipping;

  if (loading) return (
    <div className="cart-page container">
      <div className="cart-loading">
        {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />)}
      </div>
    </div>
  );

  if (!items.length) return (
    <div className="cart-page container">
      <div className="cart-empty">
        <div className="cart-empty-icon"><ShoppingBag size={56} /></div>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added anything yet.</p>
        <button className="btn-primary" onClick={() => navigate('/products')}>
          Start Shopping <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="cart-page container animate-fade">
      <h1 className="page-title cart-title">Your Cart <span className="cart-count">({items.length})</span></h1>

      <div className="cart-layout">
        {/* Items */}
        <div className="cart-items">
          {items.map((item) => (
            <div key={item.id} className="cart-item card">
              <div className="cart-item-img">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.productName} />
                ) : (
                  <div className="cart-item-placeholder">{item.productName?.[0]}</div>
                )}
              </div>

              <div className="cart-item-info">
                <div className="cart-item-category">{item.categoryName}</div>
                <h3 className="cart-item-name">{item.productName}</h3>
                {item.sellerName && <div className="cart-item-seller">by {item.sellerName}</div>}
              </div>

              <div className="cart-item-controls">
                <div className="cart-qty">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                    <Minus size={14} />
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= 10}>
                    <Plus size={14} />
                  </button>
                </div>
                <div className="cart-item-price">₹{(item.price * item.quantity).toLocaleString('en-IN')}</div>
                <button className="cart-remove" onClick={() => removeFromCart(item.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="cart-summary card">
          <h2 className="section-title">Order Summary</h2>
          <div className="divider" />

          <div className="summary-rows">
            <div className="summary-row">
              <span>Subtotal ({items.length} items)</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span className={shipping === 0 ? 'summary-free' : ''}>
                {shipping === 0 ? 'FREE' : `₹${shipping}`}
              </span>
            </div>
            {shipping > 0 && (
              <div className="summary-free-hint">
                Add ₹{(499 - subtotal).toLocaleString('en-IN')} more for free shipping
              </div>
            )}
          </div>

          <div className="divider" />
          <div className="summary-row summary-total">
            <span>Total</span>
            <span>₹{total.toLocaleString('en-IN')}</span>
          </div>

          <button
            className="btn-primary cart-checkout-btn"
            onClick={() => navigate('/checkout')}
          >
            Proceed to Checkout <ArrowRight size={16} />
          </button>

          <button className="btn-ghost cart-continue" onClick={() => navigate('/products')}>
            ← Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
