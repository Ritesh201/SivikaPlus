import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #2a2a2a', borderTopColor: '#FF2D6B', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  );

  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'SELLER' ? '/seller/dashboard' : '/products'} replace />;
  }

  return children;
}
