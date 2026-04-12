'use client';

import { useEffect, useState } from 'react';
import { Heart, ShoppingCart, Trash2, Eye, Share2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface WishlistItem {
  id: number;
  name: string;
  price: string;
  regular_price: string;
  on_sale: boolean;
  images: Array<{ src: string; alt: string }>;
  permalink: string;
  stock_status: string;
  added_date: string;
}

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load wishlist from localStorage (in production, sync with user account)
    const stored = localStorage.getItem('wishlist');
    if (stored) {
      try {
        const items = JSON.parse(stored);
        setWishlistItems(items);
      } catch (e) {
        console.error('Error loading wishlist:', e);
      }
    }
    setLoading(false);
  }, []);

  const removeFromWishlist = (productId: number) => {
    const updated = wishlistItems.filter(item => item.id !== productId);
    setWishlistItems(updated);
    localStorage.setItem('wishlist', JSON.stringify(updated));
  };

  const clearWishlist = () => {
    setWishlistItems([]);
    localStorage.removeItem('wishlist');
  };

  const moveAllToCart = () => {
    // Get current cart
    const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Add all wishlist items to cart
    const newItems = wishlistItems.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.images[0]?.src || '/images/placeholder.png'
    }));

    const updatedCart = [...currentCart, ...newItems];
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    
    // Clear wishlist
    clearWishlist();
    
    // Show success message (you could use a toast notification here)
    alert(`${newItems.length} item(s) moved to cart!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex items-center text-sm text-gray-500 mb-4">
            <Link href="/account" className="hover:text-primary-600">Account</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Wishlist</span>
          </nav>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
              <p className="mt-2 text-gray-600">
                {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved for later
              </p>
            </div>
            {wishlistItems.length > 0 && (
              <div className="mt-4 md:mt-0 flex space-x-3">
                <button
                  onClick={moveAllToCart}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Move All to Cart
                </button>
                <button
                  onClick={clearWishlist}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Wishlist Grid */}
        {wishlistItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-shadow"
              >
                {/* Product Image */}
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  <Image
                    src={item.images[0]?.src || '/images/placeholder.png'}
                    alt={item.images[0]?.alt || item.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  {item.on_sale && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                      SALE
                    </span>
                  )}
                  {item.stock_status === 'outofstock' && (
                    <span className="absolute top-2 left-2 bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded">
                      Out of Stock
                    </span>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <Link href={`/product/${item.id}`} className="block mb-2">
                    <h3 className="font-medium text-gray-900 line-clamp-2 hover:text-primary-600 transition-colors">
                      {item.name}
                    </h3>
                  </Link>
                  
                  <div className="flex items-baseline mb-3">
                    <span className="text-lg font-bold text-gray-900">{item.price}</span>
                    {item.on_sale && (
                      <span className="ml-2 text-sm text-gray-500 line-through">{item.regular_price}</span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Link
                      href={`/product/${item.id}`}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Link>
                    <button
                      onClick={() => removeFromWishlist(item.id)}
                      className="inline-flex items-center justify-center p-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Heart className="h-20 w-20 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Save products you love by clicking the heart icon on any product. You can view them here anytime and easily move them to your cart.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Browse Products
            </Link>
          </div>
        )}

        {/* Wishlist Tips */}
        {wishlistItems.length > 0 && (
          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">Wishlist Tips</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                Items in your wishlist are saved locally. Create an account to sync across devices.
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                We'll notify you when items go on sale (coming soon).
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                Move items to cart when you're ready to checkout.
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
