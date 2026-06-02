import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCart, getCartCount, addToCart, updateCartItem, removeCartItem, clearCart, removeStaleItems } from '../services/cart.service';
import { useAuth } from '../hooks/useAuth';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  const [cart, setCart] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasStaleItems, setHasStaleItems] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'user') return;
    try {
      setLoading(true);
      const res = await getCart();
      if (res.cart) {
        setCart(res.cart);
        setCartCount(res.cart.items.length);
        setHasStaleItems(res.hasStaleItems || false);
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchCount = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'user') return;
    try {
      const res = await getCartCount();
      if (res && typeof res.count === 'number') {
        setCartCount(res.count);
      }
    } catch (err) {
      console.error('Failed to fetch cart count:', err);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    const handleAuthLogout = () => {
      setCart({ items: [], cartTotal: 0 });
      setCartCount(0);
      setHasStaleItems(false);
    };
    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'user') {
      fetchCart();
    } else {
      setCart(null);
      setCartCount(0);
      setHasStaleItems(false);
    }
  }, [isAuthenticated, user, fetchCart]);

  const addItem = async (payload) => {
    await addToCart(payload);
    await fetchCart();
  };

  const updateItem = async (itemId, slots) => {
    await updateCartItem(itemId, slots);
    await fetchCart();
  };

  const removeItem = async (itemId) => {
    await removeCartItem(itemId);
    await fetchCart();
  };

  const clear = async () => {
    await clearCart();
    await fetchCart();
  };

  const cleanStale = async () => {
    await removeStaleItems();
    await fetchCart();
  };

  return (
    <CartContext.Provider value={{
      cart,
      cartCount,
      loading,
      hasStaleItems,
      fetchCart,
      addItem,
      updateItem,
      removeItem,
      clearCart: clear,
      cleanStale
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
