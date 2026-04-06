import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, FONTS } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';

const CartScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const { items, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount } = useCart();

  const deliveryFee = cartTotal >= 2000 ? 0 : 80;
  const total = cartTotal + deliveryFee;

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={{ fontSize: 60, marginBottom: 12 }}>🛒</Text>
        <Text style={styles.emptyTitle}>{t('cartEmpty')}</Text>
        <Text style={styles.emptySub}>{t('cartEmptySub')}</Text>

        <TouchableOpacity onPress={() => navigation.navigate('HomeTab')} activeOpacity={0.8}>
          <LinearGradient
            colors={COLORS.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shopBtn}
          >
            <Text style={styles.shopBtnText}>{t('startShopping')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.itemImage}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={{ width: '100%', height: '100%', borderRadius: 10 }}
            resizeMode="contain"
          />
        ) : (
          <Text style={{ fontSize: 28 }}>📦</Text>
        )}
      </View>

      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.name}
        </Text>

        {item.brand ? <Text style={styles.itemBrand}>{item.brand}</Text> : null}

        <View style={styles.itemBottom}>
          <Text style={styles.itemPrice}>৳{Math.round(item.price)}</Text>

          <View style={styles.qtyBox}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => updateQuantity(item.id, item.quantity - 1)}
            >
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>

            <Text style={styles.qtyNum}>{item.quantity}</Text>

            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => updateQuantity(item.id, item.quantity + 1)}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.removeBtn} onPress={() => removeFromCart(item.id)}>
        <Ionicons name="trash-outline" size={16} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {t('myCart')} <Text style={styles.titleCount}>({cartCount})</Text>
        </Text>

        <TouchableOpacity onPress={clearCart}>
          <Text style={styles.clearText}>{t('clearCart')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ListFooterComponent={
          <View>
            {/* Summary */}
            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('subtotal')}</Text>
                <Text style={styles.summaryValue}>৳{Math.round(cartTotal)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('deliveryFee')}</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    deliveryFee === 0 && { color: COLORS.success },
                  ]}
                >
                  {deliveryFee === 0 ? t('free') : `৳${deliveryFee}`}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>{t('total')}</Text>
                <Text style={styles.totalValue}>৳{Math.round(total)}</Text>
              </View>
            </View>

            {/* Checkout Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Checkout')}
            >
              <LinearGradient
                colors={COLORS.gradientButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.checkoutBtn}
              >
                <Text style={styles.checkoutText}>{t('checkout')} →</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={{ height: 30 }} />
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  emptyContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },

  emptyTitle: {
    fontSize: 18,
    ...FONTS.bold,
    color: COLORS.text,
    marginBottom: 4,
  },

  emptySub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },

  shopBtn: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },

  shopBtnText: {
    fontSize: 13,
    ...FONTS.bold,
    color: '#fff',
  },

  header: {
    backgroundColor: '#fff',
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  title: {
    fontSize: 20,
    ...FONTS.bold,
    color: COLORS.text,
  },

  titleCount: {
    fontSize: 14,
    ...FONTS.regular,
    color: COLORS.textSecondary,
  },

  clearText: {
    fontSize: 12,
    color: COLORS.error,
    ...FONTS.semibold,
  },

  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    ...COLORS.shadow,
    gap: 10,
    alignItems: 'center',
  },

  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: COLORS.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  itemInfo: { flex: 1 },

  itemName: {
    fontSize: 12,
    ...FONTS.semibold,
    color: COLORS.text,
    lineHeight: 16,
    marginBottom: 2,
  },

  itemBrand: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },

  itemBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  itemPrice: {
    fontSize: 14,
    ...FONTS.extrabold,
    color: COLORS.accent,
  },

  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
  },

  qtyBtn: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },

  qtyBtnText: {
    fontSize: 14,
    ...FONTS.bold,
  },

  qtyNum: {
    width: 26,
    textAlign: 'center',
    fontSize: 12,
    ...FONTS.bold,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.border,
    lineHeight: 26,
  },

  removeBtn: { padding: 6 },

  summary: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    ...COLORS.shadow,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  summaryLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  summaryValue: {
    fontSize: 13,
    ...FONTS.semibold,
    color: COLORS.text,
  },

  divider: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderTopColor: COLORS.border,
    marginVertical: 6,
  },

  totalLabel: {
    fontSize: 15,
    ...FONTS.bold,
    color: COLORS.text,
  },

  totalValue: {
    fontSize: 17,
    ...FONTS.extrabold,
    color: COLORS.accent,
  },

  checkoutBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  checkoutText: {
    fontSize: 14,
    ...FONTS.bold,
    color: '#fff',
  },
});

export default CartScreen;