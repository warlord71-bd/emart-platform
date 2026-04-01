'use client';

import { useEffect, useState } from 'react';
import { Package, User, Mail, Phone, MapPin, Calendar, CreditCard, Heart, Truck } from 'lucide-react';
import Link from 'next/link';

interface Order {
  id: number;
  date_created: string;
  status: string;
  total: string;
  currency: string;
}

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    // Mock user data for now since we don't have auth implemented yet
    // In production, this would fetch from WordPress REST API or session
    const mockUser = {
      first_name: 'Guest',
      last_name: 'User',
      email: 'guest@example.com',
    };
    setUser(mockUser);
    
    // Load wishlist count
    const storedWishlist = localStorage.getItem('wishlist');
    if (storedWishlist) {
      try {
        const items = JSON.parse(storedWishlist);
        setWishlistCount(items.length);
      } catch (e) {
        console.error('Error loading wishlist:', e);
      }
    }
    
    // Mock recent orders
    const mockOrders: Order[] = [
      {
        id: 1001,
        date_created: new Date(Date.now() - 86400000 * 2).toISOString(),
        status: 'processing',
        total: '2500.00',
        currency: 'BDT'
      },
      {
        id: 1002,
        date_created: new Date(Date.now() - 86400000 * 5).toISOString(),
        status: 'completed',
        total: '1800.00',
        currency: 'BDT'
      }
    ];
    
    setRecentOrders(mockOrders);
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
          <p className="mt-2 text-gray-600">Manage your profile and view your orders</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {user ? `${user.first_name} ${user.last_name}` : 'Guest User'}
                    </h3>
                    <p className="text-sm text-gray-500">{user?.email || 'Not logged in'}</p>
                  </div>
                </div>
              </div>
              <nav className="p-4 space-y-1">
                <Link href="/account/orders" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-md transition-colors group">
                  <Package className="h-5 w-5 mr-3 text-gray-400 group-hover:text-primary-600" />
                  <span className="font-medium">Order History</span>
                </Link>
                <Link href="/wishlist" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-md transition-colors group">
                  <Heart className="h-5 w-5 mr-3 text-gray-400 group-hover:text-primary-600" />
                  <span className="font-medium">Wishlist</span>
                  {wishlistCount > 0 && (
                    <span className="ml-auto bg-primary-100 text-primary-600 text-xs font-bold px-2 py-1 rounded-full">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
                <Link href="/track-order" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-md transition-colors group">
                  <Truck className="h-5 w-5 mr-3 text-gray-400 group-hover:text-primary-600" />
                  <span className="font-medium">Track Order</span>
                </Link>
                <button className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-md transition-colors group">
                  <User className="h-5 w-5 mr-3 text-gray-400 group-hover:text-primary-600" />
                  <span className="font-medium">Edit Profile</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Dashboard Overview</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">Total Orders</h3>
                    <Package className="h-5 w-5 text-primary-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{recentOrders.length}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">Wishlist Items</h3>
                    <Heart className="h-5 w-5 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{wishlistCount}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">Account Status</h3>
                    <User className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">Active</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">Member Since</h3>
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">2024</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
                  <Link href="/account/orders" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                    View All
                  </Link>
                </div>
                {recentOrders.length > 0 ? (
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Order #{order.id}</p>
                          <p className="text-sm text-gray-500">{new Date(order.date_created).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{order.total} {order.currency}</p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">No recent orders found</p>
                    <Link href="/shop" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
                      Start Shopping
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/shop"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition-colors"
                >
                  <Package className="h-6 w-6 text-primary-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Browse Products</p>
                    <p className="text-sm text-gray-500">Explore our latest arrivals</p>
                  </div>
                </Link>
                <Link
                  href="/track-order"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition-colors"
                >
                  <Truck className="h-6 w-6 text-primary-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Track Order</p>
                    <p className="text-sm text-gray-500">Check delivery status</p>
                  </div>
                </Link>
                <Link
                  href="/contact"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition-colors"
                >
                  <Mail className="h-6 w-6 text-primary-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Contact Support</p>
                    <p className="text-sm text-gray-500">Get help with your orders</p>
                  </div>
                </Link>
                <Link
                  href="/wishlist"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition-colors"
                >
                  <Heart className="h-6 w-6 text-primary-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">My Wishlist</p>
                    <p className="text-sm text-gray-500">View saved items</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
