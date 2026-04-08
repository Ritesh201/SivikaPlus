import { useEffect, useState } from 'react';
import { Package, TrendingUp, IndianRupee, ShoppingBag, Plus, Eye, Edit2, Trash2 } from 'lucide-react';
import { sellerApi, listingApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './SellerDashboard.css';

export default function SellerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('listings');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    Promise.all([
      sellerApi.getDashboard().catch(() => ({ data: {} })),
      listingApi.getMyListings().catch(() => ({ data: [] })),
      sellerApi.getOrders().catch(() => ({ data: [] })),
      sellerApi.getSettlements().catch(() => ({ data: [] })),
    ]).then(([dashRes, listRes, ordRes, settRes]) => {
      setStats(dashRes.data);
      setListings(listRes.data || []);
      setOrders(ordRes.data || []);
      setSettlements(settRes.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleDeleteListing = async (id) => {
    if (!window.confirm('Delete this listing?')) return;
    try {
      await listingApi.delete(id);
      setListings(listings.filter(l => l.id !== id));
      toast.success('Listing deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const STAT_CARDS = [
    { icon: <Package size={22} />, label: 'Total Listings', value: stats?.totalListings ?? listings.length, color: 'pink' },
    { icon: <ShoppingBag size={22} />, label: 'Total Orders', value: stats?.totalOrders ?? orders.length, color: 'purple' },
    { icon: <IndianRupee size={22} />, label: 'Total Revenue', value: `₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`, color: 'orange' },
    { icon: <TrendingUp size={22} />, label: 'Pending Settlement', value: `₹${(stats?.pendingSettlement || 0).toLocaleString('en-IN')}`, color: 'gold' },
  ];

  const TABS = ['listings', 'orders', 'settlements'];

  return (
    <div className="seller-dashboard container animate-fade">
      {/* Header */}
      <div className="sd-header">
        <div>
          <h1 className="page-title">Seller Dashboard</h1>
          <p className="sd-subtitle">Welcome back, {user?.name}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Add Listing
        </button>
      </div>

      {/* Stat cards */}
      <div className="dashboard-grid sd-stats">
        {STAT_CARDS.map((s) => (
          <div key={s.label} className={`card sd-stat-card sd-stat-${s.color}`}>
            <div className="sd-stat-icon">{s.icon}</div>
            <div className="sd-stat-value">{loading ? <div className="skeleton" style={{width:60,height:24,borderRadius:8}} /> : s.value}</div>
            <div className="sd-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="sd-tabs">
        {TABS.map(t => (
          <button key={t} className={`sd-tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Listings tab */}
      {activeTab === 'listings' && (
        <div className="sd-table-wrap">
          {listings.length === 0 ? (
            <div className="sd-empty">
              <Package size={40} />
              <p>No listings yet. Create your first listing!</p>
              <button className="btn-primary" onClick={() => setShowAddModal(true)}><Plus size={14} /> Add Listing</button>
            </div>
          ) : (
            <table className="sd-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((l) => (
                  <tr key={l.id}>
                    <td className="sd-product-cell">
                      <div className="sd-product-img">
                        {l.imageUrl ? <img src={l.imageUrl} alt={l.productName} /> : <span>{l.productName?.[0]}</span>}
                      </div>
                      <span className="sd-product-name">{l.productName}</span>
                    </td>
                    <td><span className="badge badge-purple">{l.categoryName}</span></td>
                    <td className="sd-price">₹{l.price?.toLocaleString('en-IN')}</td>
                    <td>{l.stock ?? '—'}</td>
                    <td>
                      <span className={`badge ${l.active ? 'badge-green' : 'badge-orange'}`}>
                        {l.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="sd-actions">
                        <button className="sd-action-btn" title="View"><Eye size={15} /></button>
                        <button className="sd-action-btn" title="Edit"><Edit2 size={15} /></button>
                        <button className="sd-action-btn sd-action-delete" title="Delete" onClick={() => handleDeleteListing(l.id)}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Orders tab */}
      {activeTab === 'orders' && (
        <div className="sd-table-wrap">
          {orders.length === 0 ? (
            <div className="sd-empty"><ShoppingBag size={40} /><p>No orders yet.</p></div>
          ) : (
            <table className="sd-table">
              <thead><tr><th>Order ID</th><th>Buyer</th><th>Items</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="sd-order-id">#{o.id}</td>
                    <td>{o.buyerName || '—'}</td>
                    <td>{o.items?.length || 1}</td>
                    <td className="sd-price">₹{o.totalAmount?.toLocaleString('en-IN')}</td>
                    <td><span className={`badge badge-${o.status === 'DELIVERED' ? 'green' : o.status === 'PENDING' ? 'orange' : 'purple'}`}>{o.status}</span></td>
                    <td className="sd-date">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Settlements tab */}
      {activeTab === 'settlements' && (
        <div className="sd-table-wrap">
          {settlements.length === 0 ? (
            <div className="sd-empty"><IndianRupee size={40} /><p>No settlements yet.</p></div>
          ) : (
            <table className="sd-table">
              <thead><tr><th>Settlement ID</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {settlements.map((s) => (
                  <tr key={s.id}>
                    <td>#{s.id}</td>
                    <td className="sd-price">₹{s.amount?.toLocaleString('en-IN')}</td>
                    <td><span className={`badge ${s.status === 'PAID' ? 'badge-green' : 'badge-orange'}`}>{s.status}</span></td>
                    <td className="sd-date">{s.settledAt ? new Date(s.settledAt).toLocaleDateString('en-IN') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add Listing Modal */}
      {showAddModal && <AddListingModal onClose={() => setShowAddModal(false)} onCreated={(l) => { setListings([l, ...listings]); setShowAddModal(false); }} />}
    </div>
  );
}

function AddListingModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ productName: '', categoryId: '', price: '', stock: '', description: '', imageUrl: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.productName || !form.price) { toast.error('Name and price are required'); return; }
    setLoading(true);
    try {
      const { data } = await listingApi.create({ ...form, price: parseFloat(form.price), stock: parseInt(form.stock) || 0 });
      toast.success('Listing created!');
      onCreated(data);
    } catch { toast.error('Failed to create listing'); }
    finally { setLoading(false); }
  };

  const f = (k, v) => setForm({ ...form, [k]: v });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card animate-fade-up" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">Add New Listing</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group"><label className="form-label">Product Name *</label><input placeholder="e.g. Matte Lipstick" value={form.productName} onChange={e => f('productName', e.target.value)} /></div>
          <div className="checkout-row">
            <div className="form-group"><label className="form-label">Price (₹) *</label><input type="number" placeholder="999" value={form.price} onChange={e => f('price', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Stock</label><input type="number" placeholder="100" value={form.stock} onChange={e => f('stock', e.target.value)} /></div>
          </div>
          <div className="form-group"><label className="form-label">Description</label><textarea rows={3} placeholder="Product description..." value={form.description} onChange={e => f('description', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Image URL</label><input placeholder="https://..." value={form.imageUrl} onChange={e => f('imageUrl', e.target.value)} /></div>
          <div className="modal-btns">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Listing'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
