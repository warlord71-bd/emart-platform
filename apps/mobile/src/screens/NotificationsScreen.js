import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../theme/colors';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIF_KEY = '@emart_notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const NotificationsScreen = ({ navigation }) => {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [deals, setDeals] = useState(true);
  const [newArrivals, setNewArrivals] = useState(false);
  const [pushToken, setPushToken] = useState(null);

  useEffect(() => {
    loadPrefs();
  }, []);

  const loadPrefs = async () => {
    try {
      const saved = await AsyncStorage.getItem(NOTIF_KEY);
      if (saved) {
        const prefs = JSON.parse(saved);
        setPushEnabled(prefs.pushEnabled || false);
        setOrderUpdates(prefs.orderUpdates !== false);
        setDeals(prefs.deals !== false);
        setNewArrivals(prefs.newArrivals || false);
        setPushToken(prefs.pushToken || null);
      }
    } catch (e) {}
  };

  const savePrefs = async (prefs) => {
    try {
      await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(prefs));
    } catch (e) {}
  };

  const registerForPush = async () => {
    if (!Device.isDevice) {
      Alert.alert('Physical Device Required', 'Push notifications only work on a real device');
      return null;
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert('Permission Denied', 'Please enable notifications in your device settings');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'eMart BD',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: '8b0a3cc9-2926-4fe5-8504-6c549b5dedcd',
    })).data;

    return token;
  };

  const togglePush = async (value) => {
    if (value) {
      const token = await registerForPush();
      if (token) {
        setPushEnabled(true);
        setPushToken(token);
        savePrefs({ pushEnabled: true, orderUpdates, deals, newArrivals, pushToken: token });
        // TODO: Send token to your backend to enable server-side notifications
      }
    } else {
      setPushEnabled(false);
      setPushToken(null);
      savePrefs({ pushEnabled: false, orderUpdates, deals, newArrivals, pushToken: null });
    }
  };

  const updatePref = (key, value) => {
    const prefs = { pushEnabled, orderUpdates, deals, newArrivals, pushToken };
    prefs[key] = value;
    if (key === 'orderUpdates') setOrderUpdates(value);
    if (key === 'deals') setDeals(value);
    if (key === 'newArrivals') setNewArrivals(value);
    savePrefs(prefs);
  };

  const notifTypes = [
    { key: 'orderUpdates', icon: 'cube-outline', label: 'Order Updates', sub: 'Shipping, delivery, and order status', value: orderUpdates },
    { key: 'deals', icon: 'flash-outline', label: 'Deals & Offers', sub: 'Flash sales, discounts, and promotions', value: deals },
    { key: 'newArrivals', icon: 'sparkles-outline', label: 'New Arrivals', sub: 'New products added to the store', value: newArrivals },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={18} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.body}>
        {/* Master toggle */}
        <View style={styles.masterCard}>
          <View style={styles.masterLeft}>
            <View style={[styles.iconCircle, { backgroundColor: pushEnabled ? COLORS.accent + '18' : COLORS.bg }]}>
              <Ionicons name={pushEnabled ? 'notifications' : 'notifications-off-outline'} size={22} color={pushEnabled ? COLORS.accent : COLORS.textLight} />
            </View>
            <View>
              <Text style={styles.masterLabel}>Push Notifications</Text>
              <Text style={styles.masterSub}>{pushEnabled ? 'Enabled' : 'Disabled'}</Text>
            </View>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={togglePush}
            trackColor={{ false: COLORS.border, true: COLORS.accent }}
            thumbColor="#fff"
          />
        </View>

        {/* Notification types */}
        {pushEnabled && (
          <>
            <Text style={styles.sectionLabel}>Notification Types</Text>
            {notifTypes.map((item) => (
              <View key={item.key} style={styles.typeCard}>
                <View style={styles.typeIcon}>
                  <Ionicons name={item.icon} size={18} color={COLORS.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.typeLabel}>{item.label}</Text>
                  <Text style={styles.typeSub}>{item.sub}</Text>
                </View>
                <Switch
                  value={item.value}
                  onValueChange={(v) => updatePref(item.key, v)}
                  trackColor={{ false: COLORS.border, true: COLORS.accent }}
                  thumbColor="#fff"
                  style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                />
              </View>
            ))}
          </>
        )}

        {!pushEnabled && (
          <View style={styles.disabledBox}>
            <Ionicons name="notifications-off-outline" size={40} color={COLORS.textLight} />
            <Text style={styles.disabledTitle}>Notifications are off</Text>
            <Text style={styles.disabledSub}>Enable push notifications to get order updates, deals, and new arrival alerts</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, ...FONTS.bold, color: COLORS.text },
  body: { padding: 16 },

  masterCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, ...COLORS.shadow,
  },
  masterLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  masterLabel: { fontSize: 15, ...FONTS.bold, color: COLORS.text },
  masterSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },

  sectionLabel: { fontSize: 12, ...FONTS.semibold, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  typeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, ...COLORS.shadow,
  },
  typeIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.accentLight, alignItems: 'center', justifyContent: 'center' },
  typeLabel: { fontSize: 13, ...FONTS.semibold, color: COLORS.text },
  typeSub: { fontSize: 10, color: COLORS.textSecondary, marginTop: 1 },

  disabledBox: { alignItems: 'center', padding: 32, marginTop: 20, gap: 8 },
  disabledTitle: { fontSize: 16, ...FONTS.bold, color: COLORS.text },
  disabledSub: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 18 },
});
