import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../theme/colors';

const WHATSAPP_NUMBER = '8801919797399';

const SupportScreen = ({ navigation }) => {
  const openWhatsApp = () => {
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=Hi, I need help with my eMart BD order.`);
  };

  const supportOptions = [
    { icon: 'logo-whatsapp', label: 'WhatsApp Support', sub: 'Chat with us instantly', color: '#25D366', onPress: openWhatsApp },
    { icon: 'call-outline', label: 'Call Us', sub: '+880 1919-797399', color: COLORS.accent, onPress: () => Linking.openURL('tel:+8801919797399') },
    { icon: 'mail-outline', label: 'Email Support', sub: 'support@e-mart.com.bd', color: '#0EA5E9', onPress: () => Linking.openURL('mailto:support@e-mart.com.bd') },
  ];

  const faqItems = [
    { q: 'How long does delivery take?', a: '2-5 business days inside Dhaka' },
    { q: 'Can I return a product?', a: '7-day return policy on all items' },
    { q: 'Are all products authentic?', a: '100% original Korean & Japanese products' },
    { q: 'How does Cash on Delivery work?', a: 'Pay in cash when your order arrives' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={18} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.body}>
        {/* Contact Options */}
        {supportOptions.map((opt, i) => (
          <TouchableOpacity key={i} style={styles.card} activeOpacity={0.8} onPress={opt.onPress}>
            <View style={[styles.cardIcon, { backgroundColor: opt.color + '18' }]}>
              <Ionicons name={opt.icon} size={20} color={opt.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>{opt.label}</Text>
              <Text style={styles.cardSub}>{opt.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
          </TouchableOpacity>
        ))}

        {/* FAQ */}
        <Text style={styles.faqTitle}>Frequently Asked</Text>
        {faqItems.map((item, i) => (
          <View key={i} style={styles.faqCard}>
            <Text style={styles.faqQ}>{item.q}</Text>
            <Text style={styles.faqA}>{item.a}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default SupportScreen;

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
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
    ...COLORS.shadow,
  },
  cardIcon: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  cardLabel: { fontSize: 14, ...FONTS.semibold, color: COLORS.text },
  cardSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  faqTitle: {
    fontSize: 12, ...FONTS.semibold, color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 20, marginBottom: 12,
  },
  faqCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
    ...COLORS.shadow,
  },
  faqQ: { fontSize: 13, ...FONTS.semibold, color: COLORS.text, marginBottom: 4 },
  faqA: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
