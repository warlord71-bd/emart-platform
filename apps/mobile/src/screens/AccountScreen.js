import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const AccountScreen = ({ navigation }) => {
  const { t, toggleLanguage, isBangla } = useLanguage();
  const { user, isLoggedIn, signOut } = useAuth();

  const menuItems = [
    {
      icon: 'cube-outline',
      label: t('myOrders'),
      sub: t('myOrdersSub'),
      screen: 'MyOrders'
    },
    {
      icon: 'heart-outline',
      label: t('wishlist'),
      sub: t('wishlistSub'),
      screen: 'Wishlist'
    },
    {
      icon: 'location-outline',
      label: t('deliveryAddress'),
      sub: t('deliveryAddressSub'),
      screen: 'Address'
    },
    {
      icon: 'card-outline',
      label: t('paymentMethods'),
      sub: t('paymentMethodsSub'),
      screen: 'Payments'
    },
    {
      icon: 'notifications-outline',
      label: t('notifications'),
      sub: t('notificationsSub'),
      screen: 'Notifications'
    },
    {
      icon: 'help-circle-outline',
      label: t('helpSupport'),
      sub: t('helpSupportSub'),
      screen: 'Support'
    },
    {
      icon: 'settings-outline',
      label: t('settings'),
      sub: t('settingsSub'),
      screen: 'Settings'
    }
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={COLORS.gradientHeader} style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={28} color="rgba(255,255,255,0.6)" />
        </View>

        {isLoggedIn ? (
          <>
            <Text style={styles.welcomeText}>{user?.name || 'User'}</Text>
            <Text style={styles.loginPrompt}>{user?.email || user?.phone || user?.emailOrPhone || 'Signed in'}</Text>

            <TouchableOpacity style={styles.signInBtn} onPress={signOut}>
              <Text style={styles.signInText}>Logout</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.welcomeText}>{t('welcome')}</Text>
            <Text style={styles.loginPrompt}>{t('loginPrompt')}</Text>

            <TouchableOpacity
              style={styles.signInBtn}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.signInText}>{t('signIn')}</Text>
            </TouchableOpacity>
          </>
        )}
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
        <View style={styles.langCard}>
          <View style={styles.langLeft}>
            <View style={styles.menuIcon}>
              <Ionicons name="language-outline" size={18} color={COLORS.accent} />
            </View>

            <View>
              <Text style={styles.menuLabel}>{t('language')}</Text>
              <Text style={styles.menuSub}>{t('languageSub')}</Text>
            </View>
          </View>

          <View style={styles.langToggle}>
            <Text style={[styles.langOption, !isBangla && styles.langOptionActive]}>EN</Text>

            <Switch
              value={isBangla}
              onValueChange={toggleLanguage}
              trackColor={{ false: COLORS.border, true: COLORS.accent }}
              thumbColor="#fff"
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />

            <Text style={[styles.langOption, isBangla && styles.langOptionActive]}>বাং</Text>
          </View>
        </View>

        {menuItems.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={styles.menuCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate(item.screen)}
          >
            <View style={styles.menuIcon}>
              <Ionicons name={item.icon} size={18} color={COLORS.accent} />
            </View>

            <View style={styles.menuInfo}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuSub}>{item.sub}</Text>
            </View>

            <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
          </TouchableOpacity>
        ))}

        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>eMart BD v1.0.0</Text>
          <Text style={styles.appInfoText}>e-mart.com.bd</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg
  },
  header: {
    paddingTop: 56,
    paddingBottom: 20,
    alignItems: 'center'
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    marginBottom: 8
  },
  welcomeText: {
    fontSize: 18,
    ...FONTS.bold,
    color: '#fff'
  },
  loginPrompt: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    marginBottom: 12
  },
  signInBtn: {
    backgroundColor: '#fff',
    paddingVertical: 7,
    paddingHorizontal: 24,
    borderRadius: 20
  },
  signInText: {
    fontSize: 12,
    ...FONTS.bold,
    color: COLORS.accent
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.accentLight,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.tagBg
  },
  langLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  langToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  langOption: {
    fontSize: 12,
    ...FONTS.semibold,
    color: COLORS.textLight
  },
  langOptionActive: {
    color: COLORS.accent,
    ...FONTS.bold
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 6,
    ...COLORS.shadow
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.accentLight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  menuInfo: {
    flex: 1
  },
  menuLabel: {
    fontSize: 13,
    ...FONTS.semibold,
    color: COLORS.text
  },
  menuSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 1
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 20,
    gap: 2
  },
  appInfoText: {
    fontSize: 11,
    color: COLORS.textLight
  }
});

export default AccountScreen;