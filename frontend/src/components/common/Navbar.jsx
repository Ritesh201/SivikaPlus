import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Search, User, LogOut, LayoutDashboard, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout, isSeller, isBuyer } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="logo-multi">Multi</span>
          <span className="logo-mart">Mart</span>
          <span className="logo-dot">✦</span>
        </Link>

        {/* Search */}
        <form className="navbar-search" onSubmit={handleSearch}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search cosmetics, skincare..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {/* Nav links */}
        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/products" className={`nav-link ${location.pathname === '/products' ? 'active' : ''}`}>
            Shop
          </Link>

          {!user && (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="btn-primary nav-cta">Get Started</Link>
            </>
          )}

          {user && isBuyer && (
            <>
              <Link to="/orders" className="nav-link">Orders</Link>
              <Link to="/cart" className="nav-cart-btn">
                <ShoppingBag size={20} />
                {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
              </Link>
            </>
          )}

          {user && isSeller && (
            <Link to="/seller/dashboard" className="nav-link">
              <LayoutDashboard size={16} /> Dashboard
            </Link>
          )}

          {user && (
            <div className="nav-user">
              <div className="nav-avatar">{user.name?.[0]?.toUpperCase() || <User size={14} />}</div>
              <div className="nav-dropdown">
                <div className="nav-dropdown-name">{user.name}</div>
                <div className="nav-dropdown-email">{user.email}</div>
                <div className="nav-dropdown-divider" />
                <button className="nav-dropdown-item" onClick={handleLogout}>
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="navbar-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </nav>
  );
}
