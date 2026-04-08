import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Sparkles, ShoppingBag, Store } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('CUSTOMER');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    businessDescription: '',
    gstin: ''
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'At least 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (role === 'SELLER' && !form.businessName.trim())
      e.businessName = 'Business name is required';
    
    if (role === 'SELLER' && !form.gstin.trim())
      e.gstin = 'GSTIN is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const payload = { fullName: form.fullName, email: form.email, password: form.password, role };
      if (role === 'SELLER') {
        payload.businessName = form.businessName;
        payload.businessDescription = form.businessDescription;
        payload.gstin = form.gstin;
      }
      const user = await register(payload);
      toast.success(`Welcome to MultiMart, ${user.fullName}!`);
      navigate(role === 'SELLER' ? '/seller/dashboard' : '/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const field = (key, value) => {
    setForm({ ...form, [key]: value });
    if (errors[key]) setErrors({ ...errors, [key]: '' });
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-container auth-container--wide animate-fade-up">
        <div className="auth-brand">
          <Sparkles size={28} className="auth-brand-icon" />
          <span>MultiMart</span>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Join thousands of beauty lovers</p>

        {/* Role toggle */}
        <div className="role-toggle">
          <button
            type="button"
            className={`role-btn ${role === 'CUSTOMER' ? 'active' : ''}`}
            onClick={() => setRole('CUSTOMER')}
          >
            <ShoppingBag size={16} /> Shop as Buyer
          </button>
          <button
            type="button"
            className={`role-btn ${role === 'SELLER' ? 'active' : ''}`}
            onClick={() => setRole('SELLER')}
          >
            <Store size={16} /> Sell on MultiMart
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-form-row">
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input type="text" placeholder="Your name" value={form.fullName} onChange={(e) => field('fullName', e.target.value)} />
              {errors.fullName && <span className="form-error">{errors.fullName}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => field('email', e.target.value)} />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>
          </div>



                  {role === 'SELLER' && (
          <>
            <div className="form-group">
              <label className="form-label">Business Name</label>
              <input
                type="text"
                placeholder="Your business name"
                value={form.businessName}
                onChange={(e) => field('businessName', e.target.value)}
              />
              {errors.businessName && <span className="form-error">{errors.businessName}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Business Description</label>
              <input
                type="text"
                placeholder="Describe your business"
                value={form.businessDescription}
                onChange={(e) => field('businessDescription', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">GSTIN</label>
              <input
                type="text"
                placeholder="GSTIN number"
                value={form.gstin}
                onChange={(e) => field('gstin', e.target.value)}
              />
              {errors.gstin && <span className="form-error">{errors.gstin}</span>}
            </div>
          </>
        )}

          <div className="auth-form-row">
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="auth-input-wrap">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={(e) => field('password', e.target.value)}
                />
                <button type="button" className="auth-eye" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Confirm password</label>
              <input type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={(e) => field('confirmPassword', e.target.value)} />
              {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
            </div>
          </div>

          <button type="submit" className="btn-primary auth-submit" disabled={loading}>
            {loading ? <span className="auth-spinner" /> : `Create ${role === 'SELLER' ? 'Seller' : ''} Account`}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in →</Link>
        </p>
      </div>
    </div>
  );
}
