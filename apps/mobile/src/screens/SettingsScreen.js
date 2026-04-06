import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';

const SettingsScreen = ({ navigation }) => {
  const { t, toggleLanguage, isBangla } = useLanguage();

  const sections = [
    {
      title: 'Preferences',
      items: [
        { icon: 'language-outline', label: 'Language', value: isBangla ? 'বাংলা' : 'English', toggle: true },
        { icon: 'notifications-outline', label: 'Push Notifications', toggle: true, defaultOn: true },
      ],
    },
    {
      title: 'About',
      items: [
        { icon: 'globe-outline', label: 'Visit Website', onPress: () => Linking.openURL('https://e-mart.com.bd') },
        { icon: 'logo-facebook', label: 'Follow on Facebook', onPress: () => Linking.openURL('https://facebook.com/emartbd') },
        { icon: 'document-text-outline', label: 'Privacy Policy' },
        { icon: 'document-outline', label: 'Terms of Service' },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={18} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.body}>
        {sections.map((section, si) => (
          <View key={si} style={styles.section}>
            <Text style={styles.sectionLabel}>{section.title}</Text>
            {section.items.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.row}
                activeOpacity={item.onPress ? 0.7 : 1}
                onPress={item.onPress}
              >
                <View style={styles.rowIcon}>
                  <Ionicons name={item.icon} size={18} color={COLORS.accent} />
                </View>
                <Text style={styles.rowLabel}>{item.label}</Text>
                {item.value && <Text style={styles.rowValue}>{item.value}</Text>}
                {item.toggle && item.label === 'Language' ? (
                  <Switch
                    value={isBangla}
                    onValueChange={toggleLanguage}
                    trackColor={{ false: COLORS.border, true: COLORS.accent }}
                    thumbColor="#fff"
                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                  />
                ) : item.toggle ? (
                  <Switch
                    value={item.defaultOn}
                    trackColor={{ false: COLORS.border, true: COLORS.accent }}
                    thumbColor="#fff"
                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                  />
                ) : (
                  <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>eMart BD v1.0.0</Text>
          <Text style={styles.footerText}>e-mart.com.bd</Text>
        </View>
      </View>
    </View>
  );
};

export default SettingsScreen;

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
  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 12, ...FONTS.semibold, color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 6,
    ...COLORS.shadow,
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.accentLight,
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 13, ...FONTS.semibold, color: COLORS.text },
  rowValue: { fontSize: 12, color: COLORS.textSecondary, marginRight: 4 },
  footer: { alignItems: 'center', marginTop: 24, gap: 2 },
  footerText: { fontSize: 11, color: COLORS.textLight },
});
