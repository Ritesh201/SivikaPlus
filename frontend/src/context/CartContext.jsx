import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartApi } from '../api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user, isBuyer } = useAuth();
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user || !isBuyer) return;
    try {
      setLoading(true);
      const { data } = await cartApi.get();
      setCart(data);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [user, isBuyer]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = useCallback(async (listingId, quantity = 1) => {
    await cartApi.addItem({ listingId, quantity });
    await fetchCart();
  }, [fetchCart]);

  const updateQuantity = useCallback(async (itemId, quantity) => {
    if (quantity <= 0) {
      await cartApi.removeItem(itemId);
    } else {
      await cartApi.updateItem(itemId, { quantity });
    }
    await fetchCart();
  }, [fetchCart]);

  const removeFromCart = useCallback(async (itemId) => {
    await cartApi.removeItem(itemId);
    await fetchCart();
  }, [fetchCart]);

  const clearCart = useCallback(async () => {
    await cartApi.clear();
    setCart({ items: [], total: 0 });
  }, []);

  const itemCount = cart.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

  return (
    <CartContext.Provider value={{ cart, loading, itemCount, addToCart, updateQuantity, removeFromCart, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};
