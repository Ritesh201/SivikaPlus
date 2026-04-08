import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CreditCard, CheckCircle } from 'lucide-react';
import { orderApi, paymentApi } from '../../api';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';
import './CheckoutPage.css';

const STEPS = ['Address', 'Review', 'Payment'];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState({ fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'India' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);

  const items = cart.items || [];
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = subtotal > 499 ? 0 : 49;
  const total = subtotal + shipping;

  const validateAddress = () => {
    const e = {};
    if (!address.fullName.trim()) e.fullName = 'Required';
    if (!address.phone.trim() || !/^[6-9]\d{9}$/.test(address.phone)) e.phone = 'Enter valid 10-digit mobile';
    if (!address.line1.trim()) e.line1 = 'Required';
    if (!address.city.trim()) e.city = 'Required';
    if (!address.state.trim()) e.state = 'Required';
    if (!address.pincode.trim() || !/^\d{6}$/.test(address.pincode)) e.pincode = 'Enter valid 6-digit pincode';
    return e;
  };

  const handleAddressNext = () => {
    const e = validateAddress();
    if (Object.keys(e).length) { setErrors(e); return; }
    setStep(1);
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const { data } = await orderApi.checkout({ address, items: items.map(i => ({ cartItemId: i.id })) });
      setOrder(data);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!order) return;
    setLoading(true);
    try {
      const { data: payData } = await paymentApi.initiate(order.id);

      // Load Razorpay SDK dynamically
      const loadRazorpay = () => new Promise((res) => {
        if (window.Razorpay) { res(true); return; }
        const s = document.createElement('script');
        s.src = 'https://checkout.razorpay.com/v1/checkout.js';
        s.onload = () => res(true);
        s.onerror = () => res(false);
        document.body.appendChild(s);
      });

      const loaded = await loadRazorpay();
      if (!loaded) { toast.error('Payment gateway unavailable'); setLoading(false); return; }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: payData.amount,
        currency: payData.currency || 'INR',
        name: 'MultiMart',
        description: `Order #${order.id}`,
        order_id: payData.razorpayOrderId,
        handler: async (response) => {
          try {
            await paymentApi.verify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderId: order.id,
            });
            await clearCart();
            toast.success('Payment successful! 🎉');
            navigate('/orders');
          } catch { toast.error('Payment verification failed'); }
        },
        prefill: { name: address.fullName, contact: address.phone },
        theme: { color: '#FF2D6B' },
        modal: { ondismiss: () => setLoading(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment initiation failed');
      setLoading(false);
    }
  };

  const field = (k, v) => { setAddress({ ...address, [k]: v }); if (errors[k]) setErrors({ ...errors, [k]: '' }); };

  return (
    <div className="checkout-page container animate-fade">
      <h1 className="page-title checkout-title">Checkout</h1>

      {/* Progress */}
      <div className="checkout-steps">
        {STEPS.map((s, i) => (
          <div key={s} className={`checkout-step ${i <= step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
            <div className="step-num">{i < step ? <CheckCircle size={16} /> : i + 1}</div>
            <span>{s}</span>
            {i < STEPS.length - 1 && <div className="step-line" />}
          </div>
        ))}
      </div>

      <div className="checkout-layout">
        {/* Main content */}
        <div className="checkout-main">
          {/* Step 0 – Address */}
          {step === 0 && (
            <div className="card checkout-card">
              <div className="checkout-card-header"><MapPin size={20} className="cc-icon" /><h2>Delivery Address</h2></div>
              <div className="checkout-form">
                <div className="checkout-row">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input placeholder="Ritesh Kumar" value={address.fullName} onChange={e => field('fullName', e.target.value)} />
                    {errors.fullName && <span className="form-error">{errors.fullName}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input placeholder="10-digit mobile" value={address.phone} onChange={e => field('phone', e.target.value)} />
                    {errors.phone && <span className="form-error">{errors.phone}</span>}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Address Line 1</label>
                  <input placeholder="House / Flat / Street" value={address.line1} onChange={e => field('line1', e.target.value)} />
                  {errors.line1 && <span className="form-error">{errors.line1}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Address Line 2 (Optional)</label>
                  <input placeholder="Landmark, Area" value={address.line2} onChange={e => field('line2', e.target.value)} />
                </div>
                <div className="checkout-row">
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input placeholder="Gurugram" value={address.city} onChange={e => field('city', e.target.value)} />
                    {errors.city && <span className="form-error">{errors.city}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input placeholder="Haryana" value={address.state} onChange={e => field('state', e.target.value)} />
                    {errors.state && <span className="form-error">{errors.state}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pincode</label>
                    <input placeholder="122001" value={address.pincode} onChange={e => field('pincode', e.target.value)} />
                    {errors.pincode && <span className="form-error">{errors.pincode}</span>}
                  </div>
                </div>
                <button className="btn-primary checkout-next-btn" onClick={handleAddressNext}>
                  Continue to Review →
                </button>
              </div>
            </div>
          )}

          {/* Step 1 – Review */}
          {step === 1 && (
            <div className="card checkout-card">
              <div className="checkout-card-header"><CheckCircle size={20} className="cc-icon" /><h2>Review Order</h2></div>
              <div className="review-items">
                {items.map(item => (
                  <div key={item.id} className="review-item">
                    <div className="review-item-img">
                      {item.imageUrl ? <img src={item.imageUrl} alt={item.productName} /> : <div className="review-placeholder">{item.productName?.[0]}</div>}
                    </div>
                    <div className="review-item-info">
                      <div className="review-item-name">{item.productName}</div>
                      <div className="review-item-meta">Qty: {item.quantity}</div>
                    </div>
                    <div className="review-item-price">₹{(item.price * item.quantity).toLocaleString('en-IN')}</div>
                  </div>
                ))}
              </div>
              <div className="divider" />
              <div className="review-address">
                <strong>Delivering to:</strong>
                <p>{address.fullName} · {address.phone}</p>
                <p>{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p>
                <p>{address.city}, {address.state} – {address.pincode}</p>
              </div>
              <div className="checkout-btns">
                <button className="btn-outline" onClick={() => setStep(0)}>← Edit Address</button>
                <button className="btn-primary" onClick={handlePlaceOrder} disabled={loading}>
                  {loading ? 'Placing Order...' : 'Place Order →'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2 – Payment */}
          {step === 2 && order && (
            <div className="card checkout-card checkout-payment-card">
              <div className="checkout-card-header"><CreditCard size={20} className="cc-icon" /><h2>Payment</h2></div>
              <div className="payment-order-id">Order #{order.id} placed successfully!</div>
              <p className="payment-desc">Complete payment to confirm your order. Secure payment powered by Razorpay.</p>
              <div className="payment-total">Total to pay: <strong>₹{total.toLocaleString('en-IN')}</strong></div>
              <button className="btn-primary checkout-next-btn" onClick={handlePayment} disabled={loading}>
                <CreditCard size={18} /> {loading ? 'Opening Payment...' : `Pay ₹${total.toLocaleString('en-IN')}`}
              </button>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="card checkout-sidebar">
          <h3 className="section-title" style={{ fontSize: 18 }}>Summary</h3>
          <div className="divider" />
          <div className="summary-rows">
            {items.map(item => (
              <div key={item.id} className="summary-line">
                <span className="summary-line-name">{item.productName} × {item.quantity}</span>
                <span>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
          <div className="divider" />
          <div className="summary-rows">
            <div className="summary-row"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
            <div className="summary-row"><span>Shipping</span><span className={shipping === 0 ? 'summary-free' : ''}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
          </div>
          <div className="divider" />
          <div className="summary-row summary-total"><span>Total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
        </div>
      </div>
    </div>
  );
}
