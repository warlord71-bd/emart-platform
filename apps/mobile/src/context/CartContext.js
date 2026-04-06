import React, { createContext, useContext, useEffect, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_KEY = '@emart_cart';
const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'RESTORE':
      return { ...state, items: action.payload };

    case 'ADD_ITEM': {
      const existingIndex = state.items.findIndex(item => item.id === action.payload.id);
      if (existingIndex >= 0) {
        const updated = [...state.items];
        updated[existingIndex].quantity += 1;
        return { ...state, items: updated };
      }
      return { ...state, items: [...state.items, { ...action.payload, quantity: 1 }] };
    }

    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(item => item.id !== action.payload) };

    case 'UPDATE_QUANTITY': {
      // Remove item if quantity drops to 0 or below
      if (action.payload.quantity <= 0) {
        return { ...state, items: state.items.filter(item => item.id !== action.payload.id) };
      }
      const updated = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
      return { ...state, items: updated };
    }

    case 'CLEAR_CART':
      return { ...state, items: [] };

    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  // Restore cart on launch
  useEffect(() => {
    const restore = async () => {
      try {
        const saved = await AsyncStorage.getItem(CART_KEY);
        if (saved) {
          dispatch({ type: 'RESTORE', payload: JSON.parse(saved) });
        }
      } catch (e) {
        console.log('Cart restore error:', e);
      }
    };
    restore();
  }, []);

  // Persist cart on every change
  useEffect(() => {
    const save = async () => {
      try {
        await AsyncStorage.setItem(CART_KEY, JSON.stringify(state.items));
      } catch (e) {
        console.log('Cart save error:', e);
      }
    };
    save();
  }, [state.items]);

  const addToCart = (product) => {
    const price = parseFloat(product.sale_price) || parseFloat(product.price) || 0;
    const regularPrice = parseFloat(product.regular_price) || price;

    dispatch({
      type: 'ADD_ITEM',
      payload: {
        id: product.id,
        name: product.name,
        price,
        regularPrice,
        onSale: price < regularPrice,
        image: product.images?.[0]?.src?.replace(/^http:/, 'https:') || '',
        brand: product.brands || product.attributes?.find(a => a.name === 'Brand')?.options?.[0] || '',
      },
    });
  };

  const removeFromCart = (productId) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
  };

  const updateQuantity = (productId, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: productId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const cartTotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items: state.items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartCount,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
