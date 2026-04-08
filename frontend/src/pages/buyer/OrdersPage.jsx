import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import { orderApi } from '../../api';
import './OrdersPage.css';

const STATUS_BADGE = {
  PENDING: 'badge-orange',
  CONFIRMED: 'badge-purple',
  SHIPPED: 'badge-pink',
  DELIVERED: 'badge-green',
  CANCELLED: 'badge badge-red',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    orderApi.getMyOrders()
      .then(({ data }) => setOrders(data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="orders-page container">
      <div className="orders-loading">
        {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />)}
      </div>
    </div>
  );

  return (
    <div className="orders-page container animate-fade">
      <h1 className="page-title orders-title">My Orders</h1>

      {orders.length === 0 ? (
        <div className="orders-empty">
          <Package size={56} />
          <h3>No orders yet</h3>
          <p>Your order history will appear here.</p>
          <button className="btn-primary" onClick={() => navigate('/products')}>Shop Now</button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card card" onClick={() => navigate(`/orders/${order.id}`)}>
              <div className="order-card-top">
                <div>
                  <div className="order-id">Order #{order.id}</div>
                  <div className="order-date">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>
                <div className="order-card-right">
                  <span className={`badge ${STATUS_BADGE[order.status] || 'badge-pink'}`}>{order.status}</span>
                  <ChevronRight size={18} className="order-chevron" />
                </div>
              </div>
              <div className="order-items-preview">
                {order.items?.slice(0, 3).map((item) => (
                  <div key={item.id} className="order-item-preview">
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt={item.productName} />
                      : <div className="order-item-preview-placeholder">{item.productName?.[0]}</div>
                    }
                  </div>
                ))}
                {order.items?.length > 3 && (
                  <div className="order-item-preview order-item-more">+{order.items.length - 3}</div>
                )}
              </div>
              <div className="order-card-footer">
                <span className="order-item-count">{order.items?.length || 0} item(s)</span>
                <span className="order-total">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
