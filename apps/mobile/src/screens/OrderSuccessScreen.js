import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';

const OrderSuccessScreen = ({ navigation, route }) => {
  const { t } = useLanguage();
  const { orderId } = route.params || {};

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Success Icon */}
      <Animated.View style={[styles.iconWrap, { transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient
          colors={[COLORS.success, '#2ECC71']}
          style={styles.iconCircle}
        >
          <Ionicons name="checkmark" size={48} color="#fff" />
        </LinearGradient>
      </Animated.View>

      {/* Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.title}>Order Placed!</Text>
        <Text style={styles.subtitle}>
          Your order has been placed successfully. We'll notify you when it's on the way.
        </Text>

        {orderId && (
          <View style={styles.orderIdBox}>
            <Text style={styles.orderIdLabel}>Order ID</Text>
            <Text style={styles.orderIdValue}>#{orderId}</Text>
          </View>
        )}

        {/* Info Cards */}
        <View style={styles.infoCards}>
          {[
            {
              icon: 'time-outline',
              label: 'Processing',
              sub: 'Your order is being confirmed',
            },
            {
              icon: 'bicycle-outline',
              label: 'Delivery',
              sub: 'Estimated 2-5 business days',
            },
            {
              icon: 'call-outline',
              label: 'Support',
              sub: 'WhatsApp for any queries',
            },
          ].map((item, i) => (
            <View key={i} style={styles.infoCard}>
              <View style={styles.infoIcon}>
                <Ionicons name={item.icon} size={18} color={COLORS.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoSub}>{item.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Actions */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('MyOrders')}
        >
          <LinearGradient
            colors={COLORS.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryBtn}
          >
            <Ionicons name="cube-outline" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>View My Orders</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('HomeTab')}
        >
          <Text style={styles.secondaryBtnText}>Continue Shopping</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default OrderSuccessScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconWrap: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    ...FONTS.bold,
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  orderIdBox: {
    backgroundColor: COLORS.accentLight,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.tagBg,
    alignItems: 'center',
    marginBottom: 24,
  },
  orderIdLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    ...FONTS.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orderIdValue: {
    fontSize: 20,
    ...FONTS.extrabold,
    color: COLORS.accent,
    marginTop: 2,
  },
  infoCards: {
    width: '100%',
    gap: 8,
    marginBottom: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    ...COLORS.shadow,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 13,
    ...FONTS.semibold,
    color: COLORS.text,
  },
  infoSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  primaryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryBtnText: {
    fontSize: 14,
    ...FONTS.bold,
    color: '#fff',
  },
  secondaryBtn: {
    marginTop: 12,
    paddingVertical: 12,
  },
  secondaryBtnText: {
    fontSize: 13,
    color: COLORS.accent,
    ...FONTS.bold,
  },
});
