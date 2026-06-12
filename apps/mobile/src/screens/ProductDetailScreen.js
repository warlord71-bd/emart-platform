import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Dimensions, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppIcon from '../components/AppIcon';
import { COLORS, FONTS } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getProductPrice, getProductImages, getProductReviews, submitProductReview, stripHTML } from '../services/woocommerce';
import { isProductAvailableForCart } from '../utils/stock';

const { width } = Dimensions.get('window');

// ── Star Rating Input ──
const StarInput = ({ rating, onRate }) => (
  <View style={{ flexDirection: 'row', gap: 4 }}>
    {[1, 2, 3, 4, 5].map((star) => (
      <TouchableOpacity key={star} onPress={() => onRate(star)}>
        <AppIcon
          name={star <= rating ? 'star' : 'star-outline'}
          size={24}
          color={COLORS.gold}
        />
      </TouchableOpacity>
    ))}
  </View>
);

// ── Single Review Card ──
const ReviewCard = ({ review }) => {
  const date = new Date(review.date_created).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewAvatar}>
          <Text style={styles.reviewAvatarText}>
            {(review.reviewer || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.reviewerName}>{review.reviewer}</Text>
          <Text style={styles.reviewDate}>{date}</Text>
        </View>
        <View style={styles.reviewStars}>
          <Text style={{ fontSize: 11, color: COLORS.gold }}>
            {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
          </Text>
        </View>
      </View>
      <Text style={styles.reviewText}>{stripHTML(review.review)}</Text>
    </View>
  );
};

const ProductDetailScreen = ({ navigation, route }) => {
  const { product } = route.params || {};

  // All hooks must be called before any conditional return
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const { user, isLoggedIn } = useAuth();
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);
  const isMounted = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const safeProduct = product || {};
  const pricing = getProductPrice(safeProduct);
  const images = getProductImages(safeProduct);
  const brand = Array.isArray(safeProduct.brands)
    ? safeProduct.brands[0]?.name || ''
    : safeProduct.brands || safeProduct.attributes?.find(a => a.name === 'Brand')?.options?.[0] || '';
  const inStock = isProductAvailableForCart(safeProduct);

  useEffect(() => {
    if (!product) navigation.goBack();
  }, [navigation, product]);

  // Load reviews
  useEffect(() => {
    if (product?.id) loadReviews();
  }, [product?.id]);

  if (!product) {
    return null;
  }

  const loadReviews = async () => {
    setReviewsLoading(true);
    const res = await getProductReviews(product.id);
    if (!isMounted.current) return;
    if (res.data) setReviews(res.data);
    setReviewsLoading(false);
  };

  const handleSubmitReview = async () => {
    if (!isLoggedIn) {
      Alert.alert(
        'Sign In Required',
        'Please sign in before writing a product review.',
        [{ text: 'Sign In', onPress: () => navigation.navigate('AccountTab', { screen: 'Login' }) }, { text: 'Cancel', style: 'cancel' }]
      );
      return;
    }
    if (!reviewText.trim()) {
      Alert.alert('Missing Review', 'Please write a review');
      return;
    }

    setSubmitting(true);
    const res = await submitProductReview(product.id, {
      review: reviewText.trim(),
      rating: reviewRating,
    });

    if (!isMounted.current) return;
    if (res.error) {
      Alert.alert('Error', res.error);
    } else {
      Alert.alert('Thank You!', 'Your review has been submitted.');
      setReviewText('');
      setShowReviewForm(false);
      loadReviews();
    }
    setSubmitting(false);
  };

  const handleAddToCart = () => {
    if (!inStock) {
      Alert.alert('Out of Stock', `${product.name} is currently out of stock.`);
      return false;
    }
    for (let i = 0; i < qty; i++) addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
    return true;
  };

  const cleanDescription = (html) => {
    return html?.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim() || '';
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBtn} onPress={() => navigation.goBack()}>
          <AppIcon name="arrow-back" size={18} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.topBtn}>
            <AppIcon name="heart-outline" size={18} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.topBtn}>
            <AppIcon name="share-outline" size={18} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageSection}>
          <Image source={{ uri: images[activeImage] }} style={styles.mainImage} resizeMode="contain" />
          {images.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbRow}>
              {images.map((img, i) => (
                <TouchableOpacity key={i} onPress={() => setActiveImage(i)}
                  style={[styles.thumb, i === activeImage && styles.thumbActive]}>
                  <Image source={{ uri: img }} style={styles.thumbImg} resizeMode="contain" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoSection}>
          <View style={styles.brandRow}>
            {brand ? <Text style={styles.brand}>{brand}</Text> : null}
            {product.on_sale && (
              <View style={styles.saleBadge}>
                <Text style={styles.saleBadgeText}>{pricing.discount}% {t('off')}</Text>
              </View>
            )}
          </View>

          <Text style={styles.productName}>{product.name}</Text>

          {/* Rating */}
          {parseFloat(product.average_rating) > 0 && (
            <View style={styles.ratingRow}>
              <Text style={styles.stars}>{'★'.repeat(Math.round(parseFloat(product.average_rating)))}</Text>
              <Text style={styles.ratingNum}>{product.average_rating}</Text>
              <Text style={styles.reviewCount}>({product.rating_count} {t('reviews')})</Text>
            </View>
          )}

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>৳{Math.round(pricing.current)}</Text>
            {pricing.onSale && <Text style={styles.oldPrice}>৳{Math.round(pricing.regular)}</Text>}
          </View>

          {/* Quantity */}
          <View style={styles.qtyRow}>
            <Text style={styles.label}>{t('quantity')}:</Text>
            <View style={styles.qtyBox}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(Math.max(1, qty - 1))}>
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyNum}>{qty}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(qty + 1)}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.stockLabel, !inStock && { color: COLORS.error }]}>
              {inStock ? `✓ ${t('inStock')}` : `✗ ${t('outOfStock')}`}
            </Text>
          </View>

          {/* Description */}
          {product.description ? (
            <View style={styles.descSection}>
              <Text style={styles.label}>{t('description')}</Text>
              <Text style={styles.descText}>{cleanDescription(product.description)}</Text>
            </View>
          ) : null}

          {/* Delivery & Payment Info */}
          <View style={styles.infoBox}>
            {[
              ['cube-outline', t('delivery'), t('deliveryInfo')],
              ['card-outline', t('payment'), t('paymentInfo')],
              ['shield-checkmark-outline', t('guarantee'), t('guaranteeInfo')],
            ].map(([icon, label, value]) => (
              <View key={label} style={styles.infoRow}>
                <AppIcon name={icon} size={16} color={COLORS.accent} />
                <Text style={styles.infoLabel}>{label}:</Text>
                <Text style={styles.infoValue}>{value}</Text>
              </View>
            ))}
          </View>

          {/* ════════════════════════════════════ */}
          {/* REVIEWS SECTION                      */}
          {/* ════════════════════════════════════ */}
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsSectionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.reviewsSectionTitle}>Customer Reviews</Text>
                {reviews.length > 0 && (
                  <Text style={styles.reviewsSummary}>
                    {product.average_rating} ★ from {reviews.length} reviews
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.writeReviewBtn}
                onPress={() => setShowReviewForm(!showReviewForm)}
              >
                <AppIcon name="create-outline" size={14} color={COLORS.accent} />
                <Text style={styles.writeReviewText}>Write Review</Text>
              </TouchableOpacity>
            </View>

            {/* Review Form */}
            {showReviewForm && (
              <View style={styles.reviewForm}>
                <Text style={styles.reviewFormTitle}>Your Review</Text>

                <StarInput rating={reviewRating} onRate={setReviewRating} />

                {!isLoggedIn && (
                  <Text style={styles.reviewLoginHint}>
                    Sign in to your Emart account to write a review.
                  </Text>
                )}

                <TextInput
                  style={[styles.reviewInput, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="Write your review..."
                  placeholderTextColor={COLORS.textLight}
                  value={reviewText}
                  onChangeText={setReviewText}
                  multiline
                />

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleSubmitReview}
                  disabled={submitting}
                >
                  <LinearGradient
                    colors={submitting ? [COLORS.textLight, COLORS.textLight] : COLORS.gradientButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitReviewBtn}
                  >
                    <Text style={styles.submitReviewText}>
                      {submitting ? 'Submitting...' : 'Submit Review'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Reviews List */}
            {reviewsLoading ? (
              <ActivityIndicator color={COLORS.accent} style={{ padding: 20 }} />
            ) : reviews.length > 0 ? (
              reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))
            ) : (
              <View style={styles.noReviews}>
                <AppIcon name="chatbubble-outline" size={28} color={COLORS.textLight} />
                <Text style={styles.noReviewsText}>No reviews yet. Be the first!</Text>
              </View>
            )}
          </View>

          <View style={{ height: 80 }} />
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.cartBtn, added && styles.cartBtnAdded, !inStock && styles.cartBtnDisabled]}
          onPress={handleAddToCart}
          disabled={!inStock}
          activeOpacity={0.8}
        >
          <Text style={[styles.cartBtnText, added && { color: '#fff' }, !inStock && styles.cartBtnTextDisabled]}>
            {!inStock ? t('outOfStock') : added ? `✓ ${t('addedToCart')}` : t('addToCart')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flex: 1.5 }}
          activeOpacity={0.8}
          disabled={!inStock}
          onPress={() => {
            if (handleAddToCart()) navigation.navigate('CartTab');
          }}
        >
          <LinearGradient colors={inStock ? COLORS.gradientButton : [COLORS.textLight, COLORS.textLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.buyBtn}>
            <Text style={styles.buyBtnText}>{inStock ? `${t('buyNow')} — ৳${Math.round(pricing.current * qty)}` : t('outOfStock')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: { position: 'absolute', top: 44, left: 16, right: 16, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between' },
  topBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', ...COLORS.shadow },
  imageSection: { backgroundColor: COLORS.accentLight, paddingTop: 80, paddingBottom: 12 },
  mainImage: { width: width, height: 280 },
  thumbRow: { paddingHorizontal: 16, paddingTop: 8, gap: 8 },
  thumb: { width: 50, height: 50, borderRadius: 8, borderWidth: 2, borderColor: COLORS.border, overflow: 'hidden', marginRight: 8 },
  thumbActive: { borderColor: COLORS.accent },
  thumbImg: { width: '100%', height: '100%' },
  infoSection: { padding: 16 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  brand: { fontSize: 11, ...FONTS.bold, color: COLORS.accent, textTransform: 'uppercase', letterSpacing: 0.8 },
  saleBadge: { backgroundColor: '#E74C3C12', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  saleBadgeText: { fontSize: 10, ...FONTS.bold, color: COLORS.sale },
  productName: { fontSize: 18, ...FONTS.bold, color: COLORS.text, lineHeight: 24, marginBottom: 6 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  stars: { fontSize: 12, color: COLORS.gold },
  ratingNum: { fontSize: 12, ...FONTS.semibold, color: COLORS.text },
  reviewCount: { fontSize: 11, color: COLORS.textSecondary },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 14 },
  price: { fontSize: 26, ...FONTS.extrabold, color: COLORS.accent },
  oldPrice: { fontSize: 16, color: COLORS.textLight, textDecorationLine: 'line-through' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  label: { fontSize: 13, ...FONTS.semibold, color: COLORS.text, marginBottom: 4 },
  qtyBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: COLORS.border, borderRadius: 8, overflow: 'hidden' },
  qtyBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 16, ...FONTS.bold, color: COLORS.text },
  qtyNum: { width: 40, textAlign: 'center', fontSize: 14, ...FONTS.bold, borderLeftWidth: 1, borderRightWidth: 1, borderColor: COLORS.border, lineHeight: 36 },
  stockLabel: { fontSize: 12, ...FONTS.semibold, color: COLORS.success },
  descSection: { marginBottom: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  descText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, marginTop: 4 },
  infoBox: { backgroundColor: COLORS.bg, borderRadius: 14, padding: 12, gap: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoLabel: { fontSize: 12, ...FONTS.semibold, color: COLORS.text },
  infoValue: { fontSize: 11, color: COLORS.textSecondary, flex: 1 },

  // ── Reviews ──
  reviewsSection: {
    marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  reviewsSectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12,
  },
  reviewsSectionTitle: { fontSize: 15, ...FONTS.bold, color: COLORS.text },
  reviewsSummary: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  writeReviewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 8, borderWidth: 1, borderColor: COLORS.accent,
  },
  writeReviewText: { fontSize: 11, ...FONTS.bold, color: COLORS.accent },

  reviewForm: {
    backgroundColor: COLORS.bg, borderRadius: 14, padding: 14, marginBottom: 14, gap: 10,
  },
  reviewFormTitle: { fontSize: 13, ...FONTS.bold, color: COLORS.text },
  reviewLoginHint: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  reviewInput: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, padding: 10, fontSize: 13, color: COLORS.text,
  },
  submitReviewBtn: {
    paddingVertical: 10, borderRadius: 10, alignItems: 'center',
  },
  submitReviewText: { fontSize: 13, ...FONTS.bold, color: '#fff' },

  reviewCard: {
    backgroundColor: COLORS.bg, borderRadius: 12, padding: 12, marginBottom: 8,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  reviewAvatar: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  reviewAvatarText: { fontSize: 14, ...FONTS.bold, color: '#fff' },
  reviewerName: { fontSize: 12, ...FONTS.bold, color: COLORS.text },
  reviewDate: { fontSize: 10, color: COLORS.textSecondary },
  reviewStars: { flexDirection: 'row' },
  reviewText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  noReviews: { alignItems: 'center', padding: 24, gap: 8 },
  noReviewsText: { fontSize: 12, color: COLORS.textSecondary },

  // ── Bottom Bar ──
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: 8, padding: 12, paddingBottom: 28,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.border,
    ...COLORS.shadowStrong,
  },
  cartBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 2, borderColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  cartBtnAdded: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  cartBtnDisabled: { borderColor: COLORS.textLight, backgroundColor: COLORS.bg },
  cartBtnText: { fontSize: 12, ...FONTS.bold, color: COLORS.accent },
  cartBtnTextDisabled: { color: COLORS.textLight },
  buyBtn: { paddingVertical: 13, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  buyBtnText: { fontSize: 13, ...FONTS.bold, color: '#fff' },
});

export default ProductDetailScreen;
