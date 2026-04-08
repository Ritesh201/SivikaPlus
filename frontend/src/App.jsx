import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import HomePage from './pages/buyer/HomePage';
import ProductListPage from './pages/buyer/ProductListPage';
import ProductDetailPage from './pages/buyer/ProductDetailPage';
import CartPage from './pages/buyer/CartPage';
import CheckoutPage from './pages/buyer/CheckoutPage';
import OrdersPage from './pages/buyer/OrdersPage';
import SellerDashboard from './pages/seller/SellerDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <div className="app">
            <Navbar />
            <main>
              <Routes>
                {/* Public */}
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductListPage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Buyer protected */}
                <Route path="/cart" element={
                  <ProtectedRoute role="BUYER"><CartPage /></ProtectedRoute>
                } />
                <Route path="/checkout" element={
                  <ProtectedRoute role="BUYER"><CheckoutPage /></ProtectedRoute>
                } />
                <Route path="/orders" element={
                  <ProtectedRoute role="BUYER"><OrdersPage /></ProtectedRoute>
                } />

                {/* Seller protected */}
                <Route path="/seller/dashboard" element={
                  <ProtectedRoute role="SELLER"><SellerDashboard /></ProtectedRoute>
                } />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>

          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1A1A1A',
                color: '#fff',
                border: '1px solid #2A2A2A',
                borderRadius: '12px',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#00E5A0', secondary: '#1A1A1A' } },
              error: { iconTheme: { primary: '#FF4D4D', secondary: '#1A1A1A' } },
            }}
          />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
