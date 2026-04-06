import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../theme/colors';

const AddressScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={18} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Address</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.emptyWrap}>
        <View style={styles.iconCircle}>
          <Ionicons name="location-outline" size={40} color={COLORS.accent} />
        </View>
        <Text style={styles.title}>No Address Added</Text>
        <Text style={styles.subtitle}>
          Add your delivery address for faster checkout
        </Text>
        <TouchableOpacity activeOpacity={0.85}>
          <LinearGradient
            colors={COLORS.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btn}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.btnText}>Add Address</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AddressScreen;

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
  btn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  btnText: { fontSize: 13, ...FONTS.bold, color: '#fff' },
});
