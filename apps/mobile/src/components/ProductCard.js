import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, FONTS } from '../theme/colors';
import { useCart } from '../context/CartContext';
import { getProductPrice as calcProductPrice, getProductImage, decodeHTML } from '../services/woocommerce';

const ProductCard = ({ product, onPress, compact = false }) => {
  const { addToCart } = useCart();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const pricing = calcProductPrice(product);
  const imageUrl = getProductImage(product);

  const brand =
    product?.brands ||
    product?.attributes?.find((a) => a.name === 'Brand')?.options?.[0] ||
    '';

  const name = decodeHTML(product?.name || '');

  // ── Compact layout (horizontal scroll cards) ──
  if (compact) {
    return (
      <TouchableOpacity style={styles.compactCard} onPress={onPress} activeOpacity={0.85}>
        {product?.on_sale && pricing.discount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>-{pricing.discount}%</Text>
          </View>
        )}

        <View style={styles.compactImageBox}>
          {imageLoading && (
            <ActivityIndicator size="small" color={COLORS.accent} style={StyleSheet.absoluteFill} />
          )}
          {!imageError ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.compactImage}
              resizeMode="contain"
              onLoad={() => setImageLoading(false)}
              onError={() => { setImageError(true); setImageLoading(false); }}
            />
          ) : (
            <Ionicons name="image-outline" size={30} color={COLORS.textLight} />
          )}
        </View>

        <View style={styles.compactInfo}>
          {brand ? (
            <Text style={styles.brand} numberOfLines={1}>{decodeHTML(brand)}</Text>
          ) : null}
          <Text style={styles.compactName} numberOfLines={2}>{name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>৳{Math.round(pricing.current || 0)}</Text>
            {pricing.onSale && (
              <Text style={styles.oldPrice}>৳{Math.round(pricing.regular || 0)}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // ── Full layout (grid cards) ──
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Sale / Discount Badge */}
      {product?.on_sale && pricing.discount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>-{pricing.discount}%</Text>
        </View>
      )}

      {/* Product Image */}
      <View style={styles.imageBox}>
        {imageLoading && (
          <ActivityIndicator size="small" color={COLORS.accent} style={styles.loader} />
        )}
        {!imageError ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="contain"
            onLoad={() => setImageLoading(false)}
            onError={() => { setImageError(true); setImageLoading(false); }}
          />
        ) : (
          <View style={styles.errorBox}>
            <Ionicons name="image-outline" size={36} color={COLORS.textLight} />
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.info}>
        {brand ? (
          <Text style={styles.brand} numberOfLines={1}>{decodeHTML(brand)}</Text>
        ) : null}

        <Text style={styles.name} numberOfLines={2}>{name}</Text>

        {/* Rating (if exists) */}
        {parseFloat(product?.average_rating) > 0 && (
          <View style={styles.ratingRow}>
            <Text style={styles.stars}>
              {'★'.repeat(Math.round(parseFloat(product.average_rating)))}
              {'☆'.repeat(5 - Math.round(parseFloat(product.average_rating)))}
            </Text>
            <Text style={styles.ratingCount}>({product.rating_count || 0})</Text>
          </View>
        )}

        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>৳{Math.round(pricing.current || 0)}</Text>
          {pricing.onSale && (
            <Text style={styles.oldPrice}>৳{Math.round(pricing.regular || 0)}</Text>
          )}
        </View>

        {/* Add to Cart */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation?.();
            addToCart(product);
          }}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={COLORS.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addBtn}
          >
            <Ionicons name="cart-outline" size={13} color="#fff" />
            <Text style={styles.addBtnText}>ADD TO CART</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // ═══════════════════════════════
  // FULL CARD (grid layout)
  // ═══════════════════════════════
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    overflow: 'hidden',
    ...COLORS.shadow,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 2,
    backgroundColor: COLORS.sale,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    ...FONTS.bold,
    color: '#fff',
  },

  imageBox: {
    height: 170,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  image: {
    width: '90%',
    height: '90%',
  },
  errorBox: {
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.4,
  },

  info: {
    padding: 10,
    paddingTop: 8,
  },

  brand: {
    fontSize: 9,
    ...FONTS.bold,
    color: COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 3,
  },

  name: {
    fontSize: 12,
    ...FONTS.semibold,
    color: COLORS.text,
    lineHeight: 17,
    minHeight: 34,
    marginBottom: 4,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 4,
  },
  stars: {
    fontSize: 10,
    color: COLORS.gold,
    letterSpacing: -1,
  },
  ratingCount: {
    fontSize: 9,
    color: COLORS.textSecondary,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    ...FONTS.extrabold,
    color: COLORS.accent,
  },
  oldPrice: {
    fontSize: 11,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    fontSize: 10,
    ...FONTS.bold,
    color: '#fff',
    letterSpacing: 0.5,
  },

  // ═══════════════════════════════
  // COMPACT CARD (horizontal scroll)
  // ═══════════════════════════════
  compactCard: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    overflow: 'hidden',
    ...COLORS.shadow,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  compactImageBox: {
    height: 140,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactImage: {
    width: '85%',
    height: '85%',
  },

  compactInfo: {
    padding: 8,
  },
  compactName: {
    fontSize: 11,
    ...FONTS.semibold,
    color: COLORS.text,
    lineHeight: 15,
    minHeight: 30,
    marginBottom: 4,
  },
});

export default ProductCard;
