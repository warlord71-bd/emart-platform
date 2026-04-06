import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Animated, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { getProducts, searchProducts, getProductsByCategory, getOnSaleProducts } from '../services/woocommerce';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';

// ── Skeleton ──
const SkeletonCard = () => {
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
    <View style={skStyles.card}>
      <Animated.View style={[skStyles.image, { opacity: anim }]} />
      <View style={skStyles.info}>
        <Animated.View style={[skStyles.line, { width: '80%', opacity: anim }]} />
        <Animated.View style={[skStyles.line, { width: '50%', opacity: anim }]} />
        <Animated.View style={[skStyles.line, { width: '40%', height: 14, opacity: anim }]} />
      </View>
    </View>
  );
};

const skStyles = StyleSheet.create({
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', ...COLORS.shadow, borderWidth: 1, borderColor: COLORS.border },
  image: { height: 170, backgroundColor: '#E8E4EC' },
  info: { padding: 10, gap: 8 },
  line: { height: 10, backgroundColor: '#E8E4EC', borderRadius: 4 },
});

const ProductsScreen = ({ navigation, route }) => {
  const { t } = useLanguage();
  const { cartCount } = useCart();
  const { categoryId, categoryName, search: initialSearch, onSale } = route.params || {};

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [sortBy, setSortBy] = useState('');
  const [showSort, setShowSort] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  useEffect(() => {
    loadProducts(1, true);
  }, [categoryId, onSale, sortBy]);

  const loadProducts = async (pageNum = 1, reset = false) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);

    let result;
    let sortParams = '';
    if (sortBy === 'price_asc') sortParams = 'orderby=price&order=asc';
    else if (sortBy === 'price_desc') sortParams = 'orderby=price&order=desc';
    else if (sortBy === 'rating') sortParams = 'orderby=rating&order=desc';
    else if (sortBy === 'popularity') sortParams = 'orderby=popularity&order=desc';

    if (searchQuery) {
      result = await searchProducts(searchQuery, pageNum);
    } else if (categoryId) {
      result = await getProductsByCategory(categoryId, pageNum);
    } else if (onSale) {
      result = await getOnSaleProducts(pageNum);
    } else {
      result = await getProducts(pageNum, 20, sortParams);
    }

    if (result.data) {
      setProducts(prev => reset ? result.data : [...prev, ...result.data]);
      setHasMore(result.data.length >= 20);
      setPage(pageNum);
    }
    setLoading(false);
    setLoadingMore(false);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query) {
      searchProducts(query, 1).then(result => {
        if (result.data) {
          setProducts(result.data);
          setHasMore(result.data.length >= 20);
          setPage(1);
        }
      });
    } else {
      loadProducts(1, true);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) loadProducts(page + 1);
  };

  const sortOptions = [
    { key: '', label: t('sortByNewest'), icon: 'time-outline' },
    { key: 'price_asc', label: t('sortByPrice'), icon: 'arrow-up-outline' },
    { key: 'price_desc', label: t('sortByPriceDesc'), icon: 'arrow-down-outline' },
    { key: 'rating', label: t('sortByRating'), icon: 'star-outline' },
    { key: 'popularity', label: 'Best Selling', icon: 'flame-outline' },
  ];

  const screenTitle = categoryName || (onSale ? t('flashDeals') : (searchQuery ? `"${searchQuery}"` : t('allProducts')));
  const currentSort = sortOptions.find(s => s.key === sortBy);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={18} color={COLORS.text} />
          </TouchableOpacity>

          <View style={styles.titleWrap}>
            <Text style={styles.title} numberOfLines={1}>{screenTitle}</Text>
            {!loading && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{products.length} {t('items')}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.cartIcon} onPress={() => navigation.navigate('CartTab')}>
            <Ionicons name="cart-outline" size={20} color={COLORS.text} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <SearchBar onSearch={handleSearch} placeholder={t('searchPlaceholder')} />

        {/* Filter bar */}
        <View style={styles.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {/* Sort button */}
            <TouchableOpacity
              style={[styles.filterChip, showSort && styles.filterChipActive]}
              onPress={() => setShowSort(!showSort)}
            >
              <Ionicons name="swap-vertical" size={13} color={showSort ? '#fff' : COLORS.text} />
              <Text style={[styles.filterChipText, showSort && { color: '#fff' }]}>
                {currentSort?.key ? currentSort.label : t('sort')}
              </Text>
            </TouchableOpacity>

            {/* On Sale chip */}
            {onSale && (
              <View style={styles.activeChip}>
                <Ionicons name="flash" size={12} color={COLORS.accent} />
                <Text style={styles.activeChipText}>On Sale</Text>
              </View>
            )}

            {/* Category chip */}
            {categoryId && (
              <View style={styles.activeChip}>
                <Text style={styles.activeChipText}>{categoryName}</Text>
                <TouchableOpacity onPress={() => navigation.setParams({ categoryId: null, categoryName: null })}>
                  <Ionicons name="close-circle" size={14} color={COLORS.accent} />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* View toggle */}
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.viewBtn, viewMode === 'grid' && styles.viewBtnActive]}
              onPress={() => setViewMode('grid')}
            >
              <Ionicons name="grid-outline" size={14} color={viewMode === 'grid' ? COLORS.accent : COLORS.textLight} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewBtn, viewMode === 'list' && styles.viewBtnActive]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons name="list-outline" size={14} color={viewMode === 'list' ? COLORS.accent : COLORS.textLight} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sort Dropdown */}
        {showSort && (
          <View style={styles.sortDropdown}>
            {sortOptions.map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.sortOption, sortBy === opt.key && styles.sortOptionActive]}
                onPress={() => { setSortBy(opt.key); setShowSort(false); }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name={opt.icon} size={14} color={sortBy === opt.key ? COLORS.accent : COLORS.textSecondary} />
                  <Text style={[styles.sortOptionText, sortBy === opt.key && styles.sortOptionTextActive]}>{opt.label}</Text>
                </View>
                {sortBy === opt.key && <Ionicons name="checkmark-circle" size={16} color={COLORS.accent} />}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Product Grid */}
      {loading ? (
        <View style={styles.skeletonGrid}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <View key={i} style={{ flex: 1, maxWidth: '50%', padding: 5 }}>
              <SkeletonCard />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.id.toString()}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode}
          contentContainerStyle={{ padding: 12 }}
          columnWrapperStyle={viewMode === 'grid' ? { gap: 10, marginBottom: 10 } : undefined}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          renderItem={({ item }) => (
            <View style={viewMode === 'grid' ? { flex: 1 } : { marginBottom: 10 }}>
              <ProductCard
                product={item}
                onPress={() => navigation.navigate('ProductDetail', { product: item })}
              />
            </View>
          )}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator color={COLORS.accent} />
                <Text style={styles.loadingMoreText}>Loading more...</Text>
              </View>
            ) : !hasMore && products.length > 0 ? (
              <View style={styles.endOfList}>
                <Text style={styles.endOfListText}>You've seen all products</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="search-outline" size={36} color={COLORS.textLight} />
              </View>
              <Text style={styles.emptyTitle}>{t('noProducts')}</Text>
              <Text style={styles.emptySub}>Try a different search or browse categories</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => { setSearchQuery(''); loadProducts(1, true); }}
              >
                <Text style={styles.emptyBtnText}>Clear Search</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // Header
  header: {
    backgroundColor: '#fff', paddingTop: 48, paddingHorizontal: 16, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  backBtn: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  titleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 17, ...FONTS.bold, color: COLORS.text, flexShrink: 1 },
  countBadge: {
    backgroundColor: COLORS.accentLight, paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 8, borderWidth: 1, borderColor: COLORS.tagBg,
  },
  countText: { fontSize: 10, ...FONTS.bold, color: COLORS.accent },
  cartIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  cartBadge: {
    position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16,
    paddingHorizontal: 3, borderRadius: 8, backgroundColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  cartBadgeText: { fontSize: 8, color: '#fff', fontWeight: '700' },

  // Filter bar
  filterBar: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  filterScroll: { flexDirection: 'row', gap: 8, flex: 1 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10,
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 11, ...FONTS.semibold, color: COLORS.text },
  activeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10,
    backgroundColor: COLORS.accentLight, borderWidth: 1, borderColor: COLORS.tagBg,
  },
  activeChipText: { fontSize: 11, ...FONTS.semibold, color: COLORS.accent },

  // View toggle
  viewToggle: {
    flexDirection: 'row', borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  viewBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  viewBtnActive: { backgroundColor: COLORS.accentLight },

  // Sort
  sortDropdown: {
    marginTop: 8, backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', ...COLORS.shadow,
  },
  sortOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  sortOptionActive: { backgroundColor: COLORS.accentLight },
  sortOptionText: { fontSize: 13, color: COLORS.text },
  sortOptionTextActive: { ...FONTS.bold, color: COLORS.accent },

  // Skeleton
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12 },

  // Loading more
  loadingMore: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 20 },
  loadingMoreText: { fontSize: 12, color: COLORS.textSecondary },
  endOfList: { alignItems: 'center', padding: 20 },
  endOfListText: { fontSize: 12, color: COLORS.textLight },

  // Empty
  empty: { alignItems: 'center', marginTop: 60, padding: 20 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.accentLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.tagBg,
  },
  emptyTitle: { fontSize: 16, ...FONTS.bold, color: COLORS.text, marginBottom: 6 },
  emptySub: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 16 },
  emptyBtn: {
    paddingVertical: 10, paddingHorizontal: 24, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.accent,
  },
  emptyBtnText: { fontSize: 12, ...FONTS.bold, color: COLORS.accent },
});

export default ProductsScreen;
