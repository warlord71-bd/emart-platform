import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';

const WishlistScreen = ({ navigation }) => {
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={18} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('wishlist')}</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.emptyWrap}>
        <View style={styles.iconCircle}>
          <Ionicons name="heart-outline" size={40} color={COLORS.accent} />
        </View>
        <Text style={styles.title}>Your Wishlist is Empty</Text>
        <Text style={styles.subtitle}>
          Save your favorite products here to buy them later
        </Text>
        <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('HomeTab')}>
          <LinearGradient
            colors={COLORS.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btn}
          >
            <Text style={styles.btnText}>Explore Products</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default WishlistScreen;

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
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.accentLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.tagBg,
  },
  title: { fontSize: 18, ...FONTS.bold, color: COLORS.text, marginBottom: 6 },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  btn: { paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12 },
  btnText: { fontSize: 13, ...FONTS.bold, color: '#fff' },
});
