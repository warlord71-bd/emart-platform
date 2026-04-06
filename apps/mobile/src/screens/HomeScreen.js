import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import {
  getOnSaleProducts,
  getLatestProducts,
  getParentCategories,
} from '../services/woocommerce';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';

const { width } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 160;
const HEADER_MIN_HEIGHT = 72 + (Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0);
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

// ─── Skeleton Loader ────────────────────────────────────────────────────────
const SkeletonBox = ({ w, h, radius = 8, style }) => {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View
      style={[
        { width: w, height: h, borderRadius: radius, backgroundColor: '#E0E0E0', opacity: anim },
        style,
      ]}
    />
  );
};

// ─── Countdown Timer ────────────────────────────────────────────────────────
const useCountdown = (targetHours = 6) => {
  const [time, setTime] = useState({ h: targetHours, m: 0, s: 0 });
  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => {
        let { h, m, s } = prev;
        if (s > 0) return { h, m, s: s - 1 };
        if (m > 0) return { h, m: m - 1, s: 59 };
        if (h > 0) return { h: h - 1, m: 59, s: 59 };
        return { h: targetHours, m: 0, s: 0 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(time.h)}:${pad(time.m)}:${pad(time.s)}`;
};

// ─── FlashSale Header ────────────────────────────────────────────────────────
const FlashSaleHeader = ({ onSeeAll, t }) => {
  const countdown = useCountdown(5);
  return (
    <View style={styles.flashHeader}>
      <View style={styles.flashLeft}>
        <Ionicons name="flash" size={18} color={COLORS.accent} />
        <Text style={styles.flashTitle}>{t('flashDeals')}</Text>
      </View>
      <View style={styles.flashRight}>
        <Text style={styles.flashEnds}>Ends in </Text>
        <View style={styles.countdownBox}>
          <Text style={styles.countdownText}>{countdown}</Text>
        </View>
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAll}>{t('seeAll')} →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Horizontal Product Row ──────────────────────────────────────────────────
const HorizontalProductRow = ({ products, onPress, loading }) => {
  if (loading) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRowContent}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.hProductCard}>
            <SkeletonBox w={140} h={150} radius={14} />
            <SkeletonBox w={100} h={12} radius={4} style={{ marginTop: 8 }} />
            <SkeletonBox w={70} h={12} radius={4} style={{ marginTop: 6 }} />
          </View>
        ))}
      </ScrollView>
    );
  }
  return (
    <FlatList
      data={products}
      horizontal
      keyExtractor={(item) => item.id.toString()}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.hRowContent}
      renderItem={({ item }) => (
        <View style={styles.hProductCard}>
          <ProductCard
            product={item}
            onPress={() => onPress(item)}
            compact
          />
        </View>
      )}
    />
  );
};

// ─── Featured Hero Card ──────────────────────────────────────────────────────
const FeaturedCard = ({ product, onPress }) => {
  if (!product) return null;
  const imgSrc = product.images?.[0]?.src;
  return (
    <TouchableOpacity style={styles.featuredCard} activeOpacity={0.9} onPress={() => onPress(product)}>
      <LinearGradient colors={['#1B1B2F', '#2D2B55']} style={styles.featuredGradient}>
        {imgSrc && (
          <Image source={{ uri: imgSrc }} style={styles.featuredImage} resizeMode="cover" />
        )}
        <LinearGradient
          colors={['transparent', 'rgba(27,27,47,0.95)']}
          style={styles.featuredOverlay}
        >
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>FEATURED</Text>
          </View>
          <Text style={styles.featuredName} numberOfLines={2}>
            {product.name}
          </Text>
          <View style={styles.featuredPriceRow}>
            <Text style={styles.featuredPrice}>৳{product.price}</Text>
            {product.regular_price && product.regular_price !== product.price && (
              <Text style={styles.featuredRegular}>৳{product.regular_price}</Text>
            )}
          </View>
        </LinearGradient>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// ─── Category Pill (redesigned) ──────────────────────────────────────────────
const CategoryPill = ({ item, index, onPress }) => {
  const icons = ['🧴', '✨', '💧', '☀️', '🎭', '💋', '🧖', '💇'];
  const pastelBgs = ['#FFF0F5', '#F0F4FF', '#F0FFF4', '#FFFBF0', '#F8F0FF', '#FFF5F0', '#F0FFFC', '#FFF0FB'];
  return (
    <TouchableOpacity style={[styles.catPill, { backgroundColor: pastelBgs[index % pastelBgs.length] }]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.catPillIconWrap}>
        {item.image?.src ? (
          <Image source={{ uri: item.image.src }} style={styles.catPillImage} />
        ) : (
          <Text style={styles.catPillEmoji}>{icons[index % icons.length]}</Text>
        )}
      </View>
      <Text style={styles.catPillName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.catPillCount}>{item.count || 0}</Text>
    </TouchableOpacity>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const HomeScreen = ({ navigation }) => {
  const { t, toggleLanguage, langLabel } = useLanguage();
  const { cartCount } = useCart();
  const [categories, setCategories] = useState([]);
  const [saleProducts, setSaleProducts] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bannerIndex, setBannerIndex] = useState(0);

  const scrollY = useRef(new Animated.Value(0)).current;
  const bannerRef = useRef(null);

  // ── Banner auto-scroll ──
  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex((i) => {
        const next = (i + 1) % 3;
        bannerRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // ── Data loading ──
  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [catRes, saleRes, newRes] = await Promise.all([
        getParentCategories(),
        getOnSaleProducts(),
        getLatestProducts(),
      ]);
      if (catRes?.data) setCategories(catRes.data.slice(0, 8));
      if (saleRes?.data) setSaleProducts(saleRes.data);
      if (newRes?.data) setNewProducts(newRes.data);
    } catch (error) {
      console.log('Home load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback((query) => {
    navigation.navigate('Products', { search: query });
  }, [navigation]);

  const topPicks = useMemo(() => {
    const combined = [...saleProducts, ...newProducts];
    const seen = new Set();
    return combined.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    }).slice(0, 10);
  }, [saleProducts, newProducts]);

  const featuredProduct = useMemo(() => newProducts[0] || saleProducts[0], [newProducts, saleProducts]);

  // ── Animated header values ──
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const miniHeaderOpacity = scrollY.interpolate({
    inputRange: [HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const banners = [
    { title: t('bannerSaleTitle'), sub: t('bannerSaleSub'), emoji: '🌸', colors: COLORS.gradientBanner, onPress: () => navigation.navigate('Products', { onSale: true }) },
    { title: t('bannerNewTitle'), sub: t('bannerNewSub'), emoji: '🇯🇵', colors: ['#2D2B55', '#1B1B2F', '#E8739E'], onPress: () => navigation.navigate('Products', { sort: 'newest' }) },
    { title: t('bannerDeliveryTitle'), sub: t('bannerDeliverySub'), emoji: '🚚', colors: ['#1B1B2F', '#0BA360', '#3CBA92'], onPress: () => navigation.navigate('Products') },
  ];

  // ── Render ──
  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* ── Sticky Animated Header ── */}
      <Animated.View style={[styles.stickyHeader, { height: headerHeight }]}>
        <LinearGradient colors={COLORS.gradientHeader} style={StyleSheet.absoluteFill} />

        {/* Full header (visible when not scrolled) */}
        <Animated.View style={[styles.fullHeader, { opacity: headerOpacity }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Image source={require('../../assets/logo.png')} style={styles.logo} />
              <View>
                <Text style={styles.appName}>eMart BD</Text>
                <Text style={styles.appTagline}>{t('appTagline')}</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.headerIcon} onPress={toggleLanguage}>
                <Text style={styles.langText}>{langLabel === 'English' ? 'বাং' : 'EN'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerIcon}>
                <Ionicons name="notifications-outline" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('CartTab')}>
                <Ionicons name="cart-outline" size={18} color="#fff" />
                {cartCount > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
          <SearchBar onSearch={handleSearch} dark />
        </Animated.View>

        {/* Mini header (visible when scrolled) */}
        <Animated.View style={[styles.miniHeader, { opacity: miniHeaderOpacity }]}>
          <Image source={require('../../assets/logo.png')} style={styles.miniLogo} />
          <View style={styles.miniSearch}>
            <Ionicons name="search-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.miniSearchText}>Search products…</Text>
          </View>
          <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('CartTab')}>
            <Ionicons name="cart-outline" size={18} color="#fff" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* ── Scrollable Body ── */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        refreshing={loading}
        onRefresh={loadData}
      >
        {/* ── Delivery Bar ── */}
        <View style={styles.deliveryBar}>
          <Ionicons name="location-outline" size={14} color={COLORS.accent} />
          <Text style={styles.deliveryText}>Deliver to <Text style={styles.deliveryBold}>Dhaka</Text></Text>
          <View style={styles.deliveryDivider} />
          <Ionicons name="checkmark-circle-outline" size={13} color="#27AE60" />
          <Text style={styles.deliveryCod}>Cash on Delivery</Text>
        </View>

        {/* ── Banner Carousel ── */}
        <View style={styles.bannerSection}>
          <FlatList
            ref={bannerRef}
            data={banners}
            horizontal
            pagingEnabled
            keyExtractor={(_, i) => i.toString()}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / (width - 32));
              setBannerIndex(idx);
            }}
            renderItem={({ item }) => (
              <TouchableOpacity activeOpacity={0.9} onPress={item.onPress}>
                <LinearGradient colors={item.colors} style={styles.banner}>
                  <View style={styles.bannerContent}>
                    <Text style={styles.bannerTitle}>{item.title}</Text>
                    <Text style={styles.bannerSub}>{item.sub}</Text>
                    <TouchableOpacity style={styles.bannerBtn} activeOpacity={0.85} onPress={item.onPress}>
                      <Text style={styles.bannerBtnText}>{t('shopNow')} →</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.bannerEmoji}>{item.emoji}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          />
          {/* Dot indicators */}
          <View style={styles.dotRow}>
            {banners.map((_, i) => (
              <View key={i} style={[styles.dot, i === bannerIndex && styles.dotActive]} />
            ))}
          </View>
        </View>

        {/* ── Quick Chips ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContent}>
          {[
            { key: 'sale', label: t('flashDeals'), icon: 'flash', color: '#FF6B35', onPress: () => navigation.navigate('Products', { onSale: true }) },
            { key: 'new', label: t('newArrivals'), icon: 'sparkles', color: '#7C3AED', onPress: () => navigation.navigate('Products', { sort: 'newest' }) },
            { key: 'all', label: t('seeAll'), icon: 'grid', color: '#0EA5E9', onPress: () => navigation.navigate('Products') },
            { key: 'cat', label: t('shopByCategory'), icon: 'layers', color: '#10B981', onPress: () => navigation.navigate('CategoriesTab') },
          ].map((chip) => (
            <TouchableOpacity key={chip.key} style={styles.chip} onPress={chip.onPress} activeOpacity={0.85}>
              <View style={[styles.chipIconCircle, { backgroundColor: chip.color + '18' }]}>
                <Ionicons name={chip.icon} size={15} color={chip.color} />
              </View>
              <Text style={styles.chipText}>{chip.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Categories ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('shopByCategory')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CategoriesTab')}>
              <Text style={styles.seeAll}>{t('seeAll')} →</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRowContent}>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={{ marginRight: 12, alignItems: 'center' }}>
                  <SkeletonBox w={64} h={64} radius={20} />
                  <SkeletonBox w={50} h={10} radius={4} style={{ marginTop: 8 }} />
                </View>
              ))}
            </ScrollView>
          ) : (
            <FlatList
              data={categories}
              horizontal
              keyExtractor={(item) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContent}
              renderItem={({ item, index }) => (
                <CategoryPill
                  item={item}
                  index={index}
                  onPress={() => navigation.navigate('Products', { categoryId: item.id, categoryName: item.name })}
                />
              )}
            />
          )}
        </View>

        {/* ── Featured Product ── */}
        {!loading && featuredProduct && (
          <View style={[styles.section, { paddingHorizontal: 16 }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured</Text>
            </View>
            <FeaturedCard
              product={featuredProduct}
              onPress={(p) => navigation.navigate('ProductDetail', { product: p })}
            />
          </View>
        )}

        {/* ── Flash Deals ── */}
        <View style={styles.section}>
          <FlashSaleHeader
            onSeeAll={() => navigation.navigate('Products', { onSale: true })}
            t={t}
          />
          <HorizontalProductRow
            products={saleProducts.slice(0, 8)}
            loading={loading}
            onPress={(p) => navigation.navigate('ProductDetail', { product: p })}
          />
        </View>

        {/* ── Top Picks (2-column grid) ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="trophy-outline" size={16} color={COLORS.accent} />
              <Text style={[styles.sectionTitle, { marginLeft: 6 }]}>Top Picks</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Products')}>
              <Text style={styles.seeAll}>{t('seeAll')} →</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.gridWrap}>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={styles.gridCell}>
                  <SkeletonBox w="100%" h={180} radius={14} />
                  <SkeletonBox w="70%" h={12} radius={4} style={{ marginTop: 8 }} />
                  <SkeletonBox w="50%" h={12} radius={4} style={{ marginTop: 6 }} />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.gridWrap}>
              {topPicks.slice(0, 6).map((item) => (
                <View key={item.id} style={styles.gridCell}>
                  <ProductCard
                    product={item}
                    onPress={() => navigation.navigate('ProductDetail', { product: item })}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── New Arrivals ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="sparkles-outline" size={16} color="#7C3AED" />
              <Text style={[styles.sectionTitle, { marginLeft: 6 }]}>{t('newArrivals')}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Products', { sort: 'newest' })}>
              <Text style={styles.seeAll}>{t('seeAll')} →</Text>
            </TouchableOpacity>
          </View>
          <HorizontalProductRow
            products={newProducts.slice(0, 8)}
            loading={loading}
            onPress={(p) => navigation.navigate('ProductDetail', { product: p })}
          />
        </View>

        {/* ── Promo Strip ── */}
        <View style={styles.promoStrip}>
          {[
            { icon: 'car-outline', label: 'Free Delivery', sub: 'On orders ৳999+' },
            { icon: 'shield-checkmark-outline', label: '100% Authentic', sub: 'Verified products' },
            { icon: 'refresh-outline', label: 'Easy Returns', sub: '7 day policy' },
          ].map((item, i) => (
            <View key={i} style={[styles.promoItem, i < 2 && styles.promoItemBorder]}>
              <Ionicons name={item.icon} size={22} color={COLORS.accent} />
              <Text style={styles.promoLabel}>{item.label}</Text>
              <Text style={styles.promoSub}>{item.sub}</Text>
            </View>
          ))}
        </View>

        {/* ── Browse All CTA ── */}
        <View style={styles.ctaWrap}>
          <TouchableOpacity style={styles.cta} activeOpacity={0.9} onPress={() => navigation.navigate('Products')}>
            <LinearGradient colors={COLORS.gradientHeader} style={styles.ctaGradient}>
              <View>
                <Text style={styles.ctaTitle}>Browse All Products</Text>
                <Text style={styles.ctaSub}>Explore the full collection</Text>
              </View>
              <View style={styles.ctaArrow}>
                <Ionicons name="arrow-forward" size={20} color={COLORS.accent} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </Animated.ScrollView>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // ── Sticky Header ──
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: 'hidden',
  },
  fullHeader: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 28) + 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  miniHeader: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
  },
  miniLogo: { width: 28, height: 28, borderRadius: 7 },
  miniSearch: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
  },
  miniSearchText: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },

  scrollView: { flex: 1 },

  // ── Header inner ──
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  logo: { width: 34, height: 34, borderRadius: 8 },
  appName: { fontSize: 16, ...FONTS.extrabold, color: '#fff' },
  appTagline: { fontSize: 8, color: 'rgba(255,255,255,0.72)' },
  headerRight: { flexDirection: 'row', gap: 8 },
  headerIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  langText: { fontSize: 11, color: '#fff', fontWeight: '700' },
  cartBadge: {
    position: 'absolute', top: -3, right: -3,
    minWidth: 16, height: 16, paddingHorizontal: 3,
    borderRadius: 8, backgroundColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  cartBadgeText: { fontSize: 8, color: '#fff', fontWeight: '700' },

  // ── Delivery Bar ──
  deliveryBar: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9,
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
    gap: 6,
  },
  deliveryText: { fontSize: 12, color: COLORS.text },
  deliveryBold: { fontWeight: '700', color: COLORS.text },
  deliveryDivider: { width: 1, height: 14, backgroundColor: COLORS.border, marginHorizontal: 4 },
  deliveryCod: { fontSize: 12, color: '#27AE60', fontWeight: '600' },

  // ── Banner ──
  bannerSection: { paddingHorizontal: 16, marginTop: 14 },
  banner: {
    width: width - 32, borderRadius: 20, padding: 20,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', minHeight: 150,
  },
  bannerContent: { flex: 1, paddingRight: 12 },
  bannerTitle: { fontSize: 19, ...FONTS.extrabold, color: '#fff', lineHeight: 24 },
  bannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 6, lineHeight: 17 },
  bannerBtn: {
    marginTop: 12, paddingVertical: 7, paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 20, alignSelf: 'flex-start',
  },
  bannerBtnText: { fontSize: 12, color: '#fff', ...FONTS.bold },
  bannerEmoji: { fontSize: 48 },
  dotRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 10, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.border },
  dotActive: { width: 18, backgroundColor: COLORS.accent },

  // ── Chips ──
  chipsContent: { paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 22, backgroundColor: '#fff',
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  chipIconCircle: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 12, color: COLORS.text, ...FONTS.bold },

  // ── Section ──
  section: { marginTop: 20 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, marginBottom: 12, alignItems: 'center',
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 16, ...FONTS.bold, color: COLORS.text },
  seeAll: { fontSize: 13, color: COLORS.accent, ...FONTS.bold },

  // ── Category Pill ──
  categoriesContent: { paddingHorizontal: 16, gap: 10 },
  catPill: {
    width: 76, alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 4,
    borderRadius: 16, borderWidth: 1, borderColor: COLORS.border,
  },
  catPillIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  catPillImage: { width: 30, height: 30, borderRadius: 10 },
  catPillEmoji: { fontSize: 22 },
  catPillName: { marginTop: 7, fontSize: 10, color: COLORS.text, textAlign: 'center', ...FONTS.bold },
  catPillCount: { marginTop: 2, fontSize: 9, color: COLORS.textSecondary },

  // ── Featured Card ──
  featuredCard: { borderRadius: 20, overflow: 'hidden', height: 220 },
  featuredGradient: { flex: 1 },
  featuredImage: { ...StyleSheet.absoluteFillObject, opacity: 0.55 },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end', padding: 16,
  },
  featuredBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: COLORS.accent, borderRadius: 8, marginBottom: 8,
  },
  featuredBadgeText: { fontSize: 9, color: '#fff', fontWeight: '800', letterSpacing: 1 },
  featuredName: { fontSize: 17, color: '#fff', ...FONTS.bold, lineHeight: 22 },
  featuredPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  featuredPrice: { fontSize: 18, color: '#fff', ...FONTS.extrabold },
  featuredRegular: { fontSize: 13, color: 'rgba(255,255,255,0.6)', textDecorationLine: 'line-through' },

  // ── Flash Sale ──
  flashHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, marginBottom: 12,
  },
  flashLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flashTitle: { fontSize: 16, ...FONTS.bold, color: COLORS.text },
  flashRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flashEnds: { fontSize: 11, color: COLORS.textSecondary },
  countdownBox: {
    backgroundColor: COLORS.accent, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8,
  },
  countdownText: { fontSize: 12, color: '#fff', fontWeight: '700', fontVariant: ['tabular-nums'] },

  // ── Horizontal Row ──
  hRowContent: { paddingHorizontal: 16, paddingBottom: 4, gap: 10 },
  hProductCard: { width: 150 },

  // ── Grid ──
  gridWrap: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 10,
  },
  gridCell: { width: '50%', paddingHorizontal: 6, marginBottom: 8 },

  // ── Promo Strip ──
  promoStrip: {
    flexDirection: 'row', marginHorizontal: 16, marginTop: 24,
    backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    overflow: 'hidden',
  },
  promoItem: { flex: 1, alignItems: 'center', paddingVertical: 16, paddingHorizontal: 6 },
  promoItemBorder: { borderRightWidth: 1, borderRightColor: COLORS.border },
  promoLabel: { fontSize: 11, color: COLORS.text, ...FONTS.bold, marginTop: 6, textAlign: 'center' },
  promoSub: { fontSize: 9, color: COLORS.textSecondary, marginTop: 2, textAlign: 'center' },

  // ── Browse CTA ──
  ctaWrap: { paddingHorizontal: 16, marginTop: 20 },
  cta: { borderRadius: 20, overflow: 'hidden' },
  ctaGradient: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 20,
  },
  ctaTitle: { fontSize: 16, color: '#fff', ...FONTS.extrabold },
  ctaSub: { marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,0.78)' },
  ctaArrow: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
});

export default HomeScreen;