import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../theme/colors';

const PaymentsScreen = ({ navigation }) => {
  const methods = [
    { icon: 'cash-outline', label: 'Cash on Delivery', sub: 'Pay when you receive your order', active: true },
    { icon: 'phone-portrait-outline', label: 'bKash', sub: 'Merchant payment available', active: true },
    { icon: 'phone-portrait-outline', label: 'Nagad', sub: 'Merchant payment available', active: true },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={18} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.sectionLabel}>Available Methods</Text>

        {methods.map((method, i) => (
          <View key={i} style={styles.card}>
            <View style={styles.cardIcon}>
              <Ionicons name={method.icon} size={20} color={COLORS.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>{method.label}</Text>
              <Text style={styles.cardSub}>{method.sub}</Text>
            </View>
            <View style={[styles.statusDot, method.active && styles.statusActive]} />
          </View>
        ))}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.accent} />
          <Text style={styles.infoText}>
            Payment method is selected during checkout. All transactions are secure.
          </Text>
        </View>
      </View>
    </View>
  );
};

export default PaymentsScreen;

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
  body: { padding: 16 },
  sectionLabel: { fontSize: 12, ...FONTS.semibold, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
    ...COLORS.shadow,
  },
  cardIcon: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: COLORS.accentLight,
    alignItems: 'center', justifyContent: 'center',
  },
  cardLabel: { fontSize: 14, ...FONTS.semibold, color: COLORS.text },
  cardSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.border },
  statusActive: { backgroundColor: COLORS.success },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: COLORS.accentLight, borderRadius: 12, padding: 12, marginTop: 16,
    borderWidth: 1, borderColor: COLORS.tagBg,
  },
  infoText: { flex: 1, fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
