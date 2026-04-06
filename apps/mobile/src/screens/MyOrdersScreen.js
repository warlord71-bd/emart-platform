import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useOrders } from "../context/OrderContext";
import { COLORS, FONTS } from "../theme/colors";

const STATUS_CONFIG = {
  Processing: { color: '#F7A81B', icon: 'time-outline', bg: '#FFF8E7' },
  Shipped: { color: '#0EA5E9', icon: 'airplane-outline', bg: '#EFF8FF' },
  Delivered: { color: '#27AE60', icon: 'checkmark-circle-outline', bg: '#EDFFF4' },
  Cancelled: { color: '#E74C3C', icon: 'close-circle-outline', bg: '#FFF0F0' },
};

const MyOrdersScreen = ({ navigation }) => {
  const { orders } = useOrders();

  if (orders.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={18} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Orders</Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <Ionicons name="cube-outline" size={44} color={COLORS.accent} />
          </View>
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptySub}>Your order history will appear here</Text>
          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('HomeTab')}>
            <LinearGradient colors={COLORS.gradientButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.shopBtn}>
              <Text style={styles.shopBtnText}>Start Shopping</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={18} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <Text style={styles.orderCount}>{orders.length}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
        {orders.map((order) => {
          const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.Processing;

          return (
            <View key={order.id} style={styles.card}>
              {/* Top row */}
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.orderId}>{order.id}</Text>
                  <Text style={styles.orderDate}>{order.date}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                  <Ionicons name={config.icon} size={12} color={config.color} />
                  <Text style={[styles.statusText, { color: config.color }]}>{order.status}</Text>
                </View>
              </View>

              {/* Product info */}
              <View style={styles.productRow}>
                {order.image ? (
                  <Image source={{ uri: order.image }} style={styles.productImage} />
                ) : (
                  <View style={styles.noImage}>
                    <Ionicons name="cube-outline" size={22} color={COLORS.textLight} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.productNames} numberOfLines={2}>{order.products}</Text>
                  <Text style={styles.itemCount}>{order.itemsCount} item(s)</Text>
                </View>
              </View>

              {/* Bottom row */}
              <View style={styles.cardBottom}>
                <View>
                  <Text style={styles.payLabel}>{order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod === 'bkash' ? 'bKash' : order.paymentMethod === 'nagad' ? 'Nagad' : order.paymentMethod}</Text>
                </View>
                <Text style={styles.orderTotal}>{order.total}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default MyOrdersScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, ...FONTS.bold, color: COLORS.text },
  orderCount: {
    fontSize: 12, ...FONTS.bold, color: COLORS.accent,
    backgroundColor: COLORS.accentLight, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 10, overflow: 'hidden',
  },

  // Empty
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.accentLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.tagBg,
  },
  emptyTitle: { fontSize: 18, ...FONTS.bold, color: COLORS.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 24 },
  shopBtn: { paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12 },
  shopBtnText: { fontSize: 13, ...FONTS.bold, color: '#fff' },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10,
    ...COLORS.shadow,
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: { fontSize: 14, ...FONTS.bold, color: COLORS.text },
  orderDate: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  statusText: { fontSize: 11, ...FONTS.bold },

  productRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  productImage: { width: 56, height: 56, borderRadius: 12, backgroundColor: COLORS.bg },
  noImage: {
    width: 56, height: 56, borderRadius: 12, backgroundColor: COLORS.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  productNames: { fontSize: 13, ...FONTS.semibold, color: COLORS.text, lineHeight: 18 },
  itemCount: { fontSize: 11, color: COLORS.textSecondary, marginTop: 3 },

  cardBottom: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 10,
  },
  payLabel: { fontSize: 11, color: COLORS.textSecondary },
  orderTotal: { fontSize: 16, ...FONTS.extrabold, color: COLORS.accent },
});
