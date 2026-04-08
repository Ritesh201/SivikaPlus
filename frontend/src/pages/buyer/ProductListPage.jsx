import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Search, X } from 'lucide-react';
import { productApi } from '../../api';
import ProductCard from '../../components/buyer/ProductCard';
import './ProductListPage.css';

const SORT_OPTIONS = [
  { value: 'createdAt,desc', label: 'Newest' },
  { value: 'price,asc', label: 'Price: Low to High' },
  { value: 'price,desc', label: 'Price: High to Low' },
  { value: 'name,asc', label: 'Name A-Z' },
];

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const page = parseInt(searchParams.get('page') || '0');
  const sort = searchParams.get('sort') || 'createdAt,desc';
  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, sort, size: 12 };
      if (category) params.categoryId = category;
      if (search) params.search = search;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      const { data } = await productApi.getAll(params);
      setProducts(data.content || data || []);
      setTotalPages(data.totalPages || 1);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  }, [page, sort, category, search, minPrice, maxPrice]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    productApi.getCategories().then(({ data }) => setCategories(data || [])).catch(() => {});
  }, []);

  const setParam = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    p.set('page', '0');
    setSearchParams(p);
  };

  const clearFilters = () => setSearchParams(new URLSearchParams());

  const hasFilters = category || search || minPrice || maxPrice;

  return (
    <div className="product-list-page container">
      {/* Header */}
      <div className="plp-header">
        <div>
          <h1 className="page-title">Shop</h1>
          <p className="plp-subtitle">Discover beauty products from verified sellers</p>
        </div>
        <div className="plp-controls">
          <button className={`btn-outline plp-filter-btn ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal size={16} /> Filters {hasFilters && <span className="filter-dot" />}
          </button>
          <select
            className="plp-sort-select"
            value={sort}
            onChange={(e) => setParam('sort', e.target.value)}
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="plp-filters animate-fade">
          {/* Search */}
          <div className="filter-group">
            <label className="filter-label">Search</label>
            <div className="filter-search-wrap">
              <Search size={14} className="filter-search-icon" />
              <input
                type="text"
                placeholder="Product name..."
                defaultValue={search}
                onKeyDown={(e) => { if (e.key === 'Enter') setParam('search', e.target.value); }}
              />
            </div>
          </div>

          {/* Category */}
          <div className="filter-group">
            <label className="filter-label">Category</label>
            <select value={category} onChange={(e) => setParam('category', e.target.value)}>
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Price range */}
          <div className="filter-group filter-price">
            <label className="filter-label">Price Range</label>
            <div className="filter-price-inputs">
              <input type="number" placeholder="Min ₹" defaultValue={minPrice} onBlur={(e) => setParam('minPrice', e.target.value)} />
              <span>—</span>
              <input type="number" placeholder="Max ₹" defaultValue={maxPrice} onBlur={(e) => setParam('maxPrice', e.target.value)} />
            </div>
          </div>

          {hasFilters && (
            <button className="btn-ghost filter-clear" onClick={clearFilters}>
              <X size={14} /> Clear all
            </button>
          )}
        </div>
      )}

      {/* Active filter chips */}
      {hasFilters && (
        <div className="active-filters">
          {search && (
            <span className="filter-chip">
              "{search}" <button onClick={() => setParam('search', '')}><X size={12} /></button>
            </span>
          )}
          {category && (
            <span className="filter-chip">
              {categories.find((c) => String(c.id) === category)?.name || 'Category'}
              <button onClick={() => setParam('category', '')}><X size={12} /></button>
            </span>
          )}
          {(minPrice || maxPrice) && (
            <span className="filter-chip">
              ₹{minPrice || '0'} – ₹{maxPrice || '∞'}
              <button onClick={() => { setParam('minPrice', ''); setParam('maxPrice', ''); }}><X size={12} /></button>
            </span>
          )}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="products-grid">
          {Array(12).fill(0).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '320px', borderRadius: '20px' }} />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="products-grid">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="plp-empty">
          <div className="plp-empty-icon">🔍</div>
          <h3>No products found</h3>
          <p>Try adjusting your filters or search term</p>
          <button className="btn-outline" onClick={clearFilters}>Clear filters</button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="plp-pagination">
          <button
            className="btn-outline"
            disabled={page === 0}
            onClick={() => setParam('page', String(page - 1))}
          >← Prev</button>
          <span className="plp-page-info">Page {page + 1} of {totalPages}</span>
          <button
            className="btn-outline"
            disabled={page >= totalPages - 1}
            onClick={() => setParam('page', String(page + 1))}
          >Next →</button>
        </div>
      )}
    </div>
  );
}
