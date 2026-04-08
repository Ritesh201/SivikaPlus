import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './store/authStore'

// Layouts
import CustomerLayout from './components/layout/CustomerLayout'
import SellerLayout from './components/layout/SellerLayout'

// Auth
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Customer pages
import Home from './pages/customer/Home'
import ProductList from './pages/customer/ProductList'
import ProductDetail from './pages/customer/ProductDetail'
import Search from './pages/customer/Search'
import Cart from './pages/customer/Cart'
import Checkout from './pages/customer/Checkout'
import Orders from './pages/customer/Orders'
import Profile from './pages/customer/Profile'

// Seller pages
import SellerDashboard from './pages/seller/SellerDashboard'
import SellerProducts from './pages/seller/SellerProducts'
import SellerListings from './pages/seller/SellerListings'
import SellerOrders from './pages/seller/SellerOrders'
import SellerSettlements from './pages/seller/SellerSettlements'

// ---- Route guards ----

/** Require any authenticated user */
function RequireAuth({ children }) {
  const { token } = useAuth()
  const location = useLocation()
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

/** Require SELLER role — redirect customers to shop */
function RequireSeller({ children }) {
  const { token, user } = useAuth()
  const location = useLocation()
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />
  if (user?.role !== 'SELLER' && user?.role !== 'ADMIN') return <Navigate to="/" replace />
  return children
}

/**
 * If a SELLER hits a customer-facing route (e.g. "/"),
 * redirect them to /seller automatically.
 */
function CustomerGuard({ children }) {
  const { user, token } = useAuth()
  if (token && (user?.role === 'SELLER' || user?.role === 'ADMIN')) {
    return <Navigate to="/seller" replace />
  }
  return children
}

/** Redirect logged-in users away from login/register */
function GuestOnly({ children }) {
  const { token, user } = useAuth()
  if (token) {
    return <Navigate to={user?.role === 'SELLER' ? '/seller' : '/'} replace />
  }
  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* ---- Auth ---- */}
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />

      {/* ---- Seller Portal ---- */}
      <Route path="/seller" element={<RequireSeller><SellerLayout /></RequireSeller>}>
        <Route index element={<SellerDashboard />} />
        <Route path="products" element={<SellerProducts />} />
        <Route path="listings" element={<SellerListings />} />
        <Route path="orders" element={<SellerOrders />} />
        <Route path="settlements" element={<SellerSettlements />} />
      </Route>

      {/* ---- Customer Shop ---- */}
      <Route path="/" element={<CustomerGuard><CustomerLayout /></CustomerGuard>}>
        <Route index element={<Home />} />
        <Route path="products" element={<ProductList />} />
        <Route path="products/:slug" element={<ProductDetail />} />
        <Route path="search" element={<Search />} />
        <Route path="cart" element={<RequireAuth><Cart /></RequireAuth>} />
        <Route path="checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
        <Route path="orders" element={<RequireAuth><Orders /></RequireAuth>} />
        <Route path="profile" element={<RequireAuth><Profile /></RequireAuth>} />
      </Route>

      {/* ---- Catch-all ---- */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
