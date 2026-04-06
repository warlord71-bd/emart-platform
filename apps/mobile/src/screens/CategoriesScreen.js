import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';
import { getParentCategories, getSubCategories } from '../services/woocommerce';
import SearchBar from '../components/SearchBar';

// ── Popular Brands (update names/slugs to match your WooCommerce brands) ──
const BRANDS = [
  { name: 'COSRX', slug: 'cosrx', emoji: '🇰🇷', bg: '#E8F5E9' },
  { name: 'Missha', slug: 'missha', emoji: '✨', bg: '#FFF3E0' },
  { name: 'Innisfree', slug: 'innisfree', emoji: '🌿', bg: '#E8F5E9' },
  { name: 'Maybelline', slug: 'maybelline', emoji: '💋', bg: '#FCE4EC' },
  { name: 'The Ordinary', slug: 'the-ordinary', emoji: '🧪', bg: '#F3E5F5' },
  { name: 'Cetaphil', slug: 'cetaphil', emoji: '💧', bg: '#E3F2FD' },
  { name: 'Laneige', slug: 'laneige', emoji: '💎', bg: '#E0F7FA' },
  { name: 'Some By Mi', slug: 'some-by-mi', emoji: '🌸', bg: '#FFF0F5' },
  { name: 'CeraVe', slug: 'cerave', emoji: '🛡️', bg: '#E8EAF6' },
  { name: 'Hada Labo', slug: 'hada-labo', emoji: '🇯🇵', bg: '#FFF8E1' },
];

// ── Skincare Concerns ──
const CONCERNS = [
  { name: 'Acne & Breakouts', icon: 'medical-outline', search: 'acne', color: '#E74C3C', bg: '#FFF0F0' },
  { name: 'Dark Spots', icon: 'sunny-outline', search: 'dark spot brightening', color: '#F7A81B', bg: '#FFF8E7' },
  { name: 'Dry Skin', icon: 'water-outline', search: 'moisturizer hydrating', color: '#0EA5E9', bg: '#EFF8FF' },
  { name: 'Oily Skin', icon: 'sparkles-outline', search: 'oil control mattifying', color: '#10B981', bg: '#EDFFF4' },
  { name: 'Anti-Aging', icon: 'hourglass-outline', search: 'anti aging wrinkle', color: '#8B5CF6', bg: '#F5F0FF' },
  { name: 'Sun Protection', icon: 'shield-checkmark-outline', search: 'sunscreen spf', color: '#F59E0B', bg: '#FFFBEB' },
  { name: 'Sensitive Skin', icon: 'heart-outline', search: 'sensitive gentle', color: '#EC4899', bg: '#FFF0F5' },
  { name: 'Pore Care', icon: 'ellipse-outline', search: 'pore minimizing', color: '#6366F1', bg: '#EEF0FF' },
];

// ── Skeleton ──
const SkeletonPill = () => {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={{ width: 80, height: 95, borderRadius: 16, backgroundColor: '#E8E4EC', opacity: anim, marginRight: 10 }} />;
};

const CategoriesScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, brands, concerns

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    setLoading(true);
    const { data } = await getParentCategories();
    if (data) setCategories(data);
    setLoading(false);
  };

  const handleSearch = (query) => {
    if (query.trim()) {
      navigation.navigate('Products', { search: query.trim() });
    }
  };

  const handleBrandPress = (brand) => {
    navigation.navigate('Products', { search: brand.name });
  };

  const handleConcernPress = (concern) => {
    navigation.navigate('Products', { search: concern.search });
  };

  const handleCategoryPress = (cat) => {
    navigation.navigate('Products', { categoryId: cat.id, categoryName: cat.name });
  };

  const categoryIcons = ['🧴', '✨', '💧', '☀️', '🎭', '💋', '🧖', '💇', '🌿', '💅'];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <SearchBar onSearch={handleSearch} placeholder="Search brands, products, concerns..." />

        {/* Tab pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          {[
            { key: 'all', label: 'All', icon: 'apps-outline' },
            { key: 'brands', label: 'Brands', icon: 'pricetag-outline' },
            { key: 'concerns', label: 'By Concern', icon: 'medkit-outline' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <Ionicons name={tab.icon} size={14} color={activeTab === tab.key ? '#fff' : COLORS.text} />
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>

        {/* ══════════════════════════════════ */}
        {/* BRANDS SECTION                     */}
        {/* ══════════════════════════════════ */}
        {(activeTab === 'all' || activeTab === 'brands') && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="pricetag" size={16} color={COLORS.accent} />
                <Text style={styles.sectionTitle}>Shop by Brand</Text>
              </View>
              {activeTab === 'all' && (
                <TouchableOpacity onPress={() => setActiveTab('brands')}>
                  <Text style={styles.seeAll}>See All →</Text>
                </TouchableOpacity>
              )}
            </View>

            {activeTab === 'brands' ? (
              // Full grid view for brands tab
              <View style={styles.brandGrid}>
                {BRANDS.map((brand, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.brandGridCard, { backgroundColor: brand.bg }]}
                    onPress={() => handleBrandPress(brand)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.brandGridEmoji}>{brand.emoji}</Text>
                    <Text style={styles.brandGridName}>{brand.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              // Horizontal scroll for all tab
              <FlatList
                data={BRANDS}
                horizontal
                keyExtractor={(_, i) => i.toString()}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.brandScroll}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.brandPill, { backgroundColor: item.bg }]}
                    onPress={() => handleBrandPress(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.brandEmoji}>{item.emoji}</Text>
                    <Text style={styles.brandName}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        )}

        {/* ══════════════════════════════════ */}
        {/* SKINCARE BY CONCERN                */}
        {/* ══════════════════════════════════ */}
        {(activeTab === 'all' || activeTab === 'concerns') && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="medkit" size={16} color={COLORS.accent} />
                <Text style={styles.sectionTitle}>Skincare by Concern</Text>
              </View>
            </View>

            <View style={styles.concernGrid}>
              {CONCERNS.map((concern, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.concernCard, { backgroundColor: concern.bg }]}
                  onPress={() => handleConcernPress(concern)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.concernIcon, { backgroundColor: concern.color + '20' }]}>
                    <Ionicons name={concern.icon} size={20} color={concern.color} />
                  </View>
                  <Text style={styles.concernName}>{concern.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ══════════════════════════════════ */}
        {/* PRODUCT CATEGORIES                 */}
        {/* ══════════════════════════════════ */}
        {(activeTab === 'all') && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="grid" size={16} color={COLORS.accent} />
                <Text style={styles.sectionTitle}>Product Categories</Text>
              </View>
            </View>

            {loading ? (
              <FlatList
                data={[1, 2, 3, 4]}
                horizontal
                keyExtractor={(i) => i.toString()}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.brandScroll}
                renderItem={() => <SkeletonPill />}
              />
            ) : (
              <View style={styles.catList}>
                {categories.map((cat, i) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.catCard}
                    onPress={() => handleCategoryPress(cat)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.catIconBox}>
                      {cat.image?.src ? (
                        <Image source={{ uri: cat.image.src }} style={styles.catImage} />
                      ) : (
                        <Text style={{ fontSize: 22 }}>{categoryIcons[i % categoryIcons.length]}</Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.catName}>{cat.name}</Text>
                      <Text style={styles.catCount}>{cat.count} products</Text>
                    </View>
                    <View style={styles.catArrow}>
                      <Ionicons name="chevron-forward" size={14} color={COLORS.textLight} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Quick action banner */}
        {activeTab === 'all' && (
          <View style={styles.ctaWrap}>
            <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('Products', { onSale: true })}>
              <LinearGradient colors={COLORS.gradientBanner} style={styles.ctaBanner}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ctaTitle}>Flash Deals</Text>
                  <Text style={styles.ctaSub}>Check out today's best discounts</Text>
                </View>
                <View style={styles.ctaArrow}>
                  <Ionicons name="flash" size={20} color={COLORS.accent} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // Header
  header: {
    backgroundColor: '#fff', paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 22, ...FONTS.bold, color: COLORS.text, marginBottom: 10 },

  // Tabs
  tabRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12,
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border,
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 12, ...FONTS.semibold, color: COLORS.text },
  tabTextActive: { color: '#fff' },

  // Section
  section: { marginTop: 20 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, marginBottom: 12,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 16, ...FONTS.bold, color: COLORS.text },
  seeAll: { fontSize: 12, ...FONTS.bold, color: COLORS.accent },

  // Brands horizontal
  brandScroll: { paddingHorizontal: 16, gap: 10 },
  brandPill: {
    width: 80, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6,
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },
  brandEmoji: { fontSize: 24, marginBottom: 6 },
  brandName: { fontSize: 10, ...FONTS.bold, color: COLORS.text, textAlign: 'center' },

  // Brands grid (full tab)
  brandGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12,
  },
  brandGridCard: {
    width: '30%', margin: '1.6%', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 8, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },
  brandGridEmoji: { fontSize: 28, marginBottom: 8 },
  brandGridName: { fontSize: 12, ...FONTS.bold, color: COLORS.text, textAlign: 'center' },

  // Concerns
  concernGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12,
  },
  concernCard: {
    width: '46%', margin: '2%', flexDirection: 'row', alignItems: 'center',
    gap: 10, padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
  },
  concernIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  concernName: { fontSize: 12, ...FONTS.bold, color: COLORS.text, flex: 1 },

  // Categories list
  catList: { paddingHorizontal: 16, gap: 8 },
  catCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 12,
    ...COLORS.shadow, borderWidth: 1, borderColor: COLORS.border,
  },
  catIconBox: {
    width: 46, height: 46, borderRadius: 14, backgroundColor: COLORS.accentLight,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.tagBg,
  },
  catImage: { width: 28, height: 28, borderRadius: 8 },
  catName: { fontSize: 14, ...FONTS.bold, color: COLORS.text },
  catCount: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  catArrow: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: COLORS.bg,
    alignItems: 'center', justifyContent: 'center',
  },

  // CTA Banner
  ctaWrap: { paddingHorizontal: 16, marginTop: 24 },
  ctaBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 16, padding: 18,
  },
  ctaTitle: { fontSize: 16, ...FONTS.extrabold, color: '#fff' },
  ctaSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  ctaArrow: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
});

export default CategoriesScreen;
