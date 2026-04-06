import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ORDERS_KEY = '@emart_orders';
const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Restore orders on launch
  useEffect(() => {
    const restore = async () => {
      try {
        const saved = await AsyncStorage.getItem(ORDERS_KEY);
        if (saved) setOrders(JSON.parse(saved));
      } catch (e) {
        console.log('Orders restore error:', e);
      } finally {
        setLoaded(true);
      }
    };
    restore();
  }, []);

  // Persist orders on every change (skip initial empty state)
  useEffect(() => {
    if (!loaded) return;
    const save = async () => {
      try {
        await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
      } catch (e) {
        console.log('Orders save error:', e);
      }
    };
    save();
  }, [orders, loaded]);

  const addOrder = (orderData) => {
    const newOrder = {
      id: `#EM${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      status: 'Processing',
      ...orderData,
      createdAt: Date.now(),
    };

    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  };

  const updateOrderStatus = (orderId, status) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status } : order
      )
    );
  };

  const clearOrders = () => {
    setOrders([]);
  };

  const value = useMemo(
    () => ({
      orders,
      addOrder,
      updateOrderStatus,
      clearOrders,
    }),
    [orders]
  );

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrders must be used within OrderProvider');
  return context;
};
