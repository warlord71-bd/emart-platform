import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';

import ErrorBoundary from './src/components/ErrorBoundary';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider, useCart } from './src/context/CartContext';
import { LanguageProvider, useLanguage } from './src/context/LanguageContext';
import { OrderProvider } from './src/context/OrderContext';

import { COLORS } from './src/theme/colors';

import HomeScreen from './src/screens/HomeScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import CartScreen from './src/screens/CartScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import OrderSuccessScreen from './src/screens/OrderSuccessScreen';
import AccountScreen from './src/screens/AccountScreen';

import MyOrdersScreen from './src/screens/MyOrdersScreen';
import WishlistScreen from './src/screens/WishlistScreen';
import AddressScreen from './src/screens/AddressScreen';
import PaymentsScreen from './src/screens/PaymentsScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import SupportScreen from './src/screens/SupportScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

// Notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const Tab = createBottomTabNavigator();
const HomeStackNav = createNativeStackNavigator();
const CategoriesStackNav = createNativeStackNavigator();
const ShopStackNav = createNativeStackNavigator();
const CartStackNav = createNativeStackNavigator();
const AccountStackNav = createNativeStackNavigator();

function FontlessTabIcon({ routeName, color }) {
  if (routeName === 'HomeTab') {
    return (
      <View style={tabIconStyles.iconBox}>
        <View style={[tabIconStyles.homeRoof, { borderBottomColor: color }]} />
        <View style={[tabIconStyles.homeBody, { borderColor: color }]} />
      </View>
    );
  }

  if (routeName === 'CategoriesTab') {
    return (
      <View style={[tabIconStyles.iconBox, tabIconStyles.gridBox]}>
        {[0, 1, 2, 3].map((item) => (
          <View key={item} style={[tabIconStyles.gridDot, { backgroundColor: color }]} />
        ))}
      </View>
    );
  }

  if (routeName === 'ShopTab') {
    return (
      <View style={tabIconStyles.iconBox}>
        <View style={[tabIconStyles.bagHandle, { borderColor: color }]} />
        <View style={[tabIconStyles.bagBody, { borderColor: color }]} />
      </View>
    );
  }

  if (routeName === 'CartTab') {
    return (
      <View style={tabIconStyles.iconBox}>
        <View style={[tabIconStyles.cartBasket, { borderColor: color }]} />
        <View style={[tabIconStyles.cartHandle, { backgroundColor: color }]} />
        <View style={tabIconStyles.cartWheels}>
          <View style={[tabIconStyles.cartWheel, { backgroundColor: color }]} />
          <View style={[tabIconStyles.cartWheel, { backgroundColor: color }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={tabIconStyles.iconBox}>
      <View style={[tabIconStyles.personHead, { borderColor: color }]} />
      <View style={[tabIconStyles.personBody, { borderColor: color }]} />
    </View>
  );
}

function HomeStack() {
  return (
    <HomeStackNav.Navigator screenOptions={{ headerShown: false }}>
      <HomeStackNav.Screen name="HomeMain" component={HomeScreen} />
      <HomeStackNav.Screen name="Products" component={ProductsScreen} />
      <HomeStackNav.Screen name="ProductDetail" component={ProductDetailScreen} />
    </HomeStackNav.Navigator>
  );
}

function CategoriesStack() {
  return (
    <CategoriesStackNav.Navigator screenOptions={{ headerShown: false }}>
      <CategoriesStackNav.Screen name="CategoriesMain" component={CategoriesScreen} />
      <CategoriesStackNav.Screen name="Products" component={ProductsScreen} />
      <CategoriesStackNav.Screen name="ProductDetail" component={ProductDetailScreen} />
    </CategoriesStackNav.Navigator>
  );
}

function ShopStack() {
  return (
    <ShopStackNav.Navigator screenOptions={{ headerShown: false }}>
      <ShopStackNav.Screen name="ProductsMain" component={ProductsScreen} />
      <ShopStackNav.Screen name="ProductDetail" component={ProductDetailScreen} />
    </ShopStackNav.Navigator>
  );
}

function CartStack() {
  return (
    <CartStackNav.Navigator screenOptions={{ headerShown: false }}>
      <CartStackNav.Screen name="CartMain" component={CartScreen} />
      <CartStackNav.Screen name="Checkout" component={CheckoutScreen} />
      <CartStackNav.Screen name="OrderSuccess" component={OrderSuccessScreen} />
      <CartStackNav.Screen name="MyOrders" component={MyOrdersScreen} />
    </CartStackNav.Navigator>
  );
}

function AccountStack() {
  return (
    <AccountStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AccountStackNav.Screen name="AccountMain" component={AccountScreen} />
      <AccountStackNav.Screen name="Login" component={LoginScreen} />
      <AccountStackNav.Screen name="Register" component={RegisterScreen} />
      <AccountStackNav.Screen name="MyOrders" component={MyOrdersScreen} />
      <AccountStackNav.Screen name="Wishlist" component={WishlistScreen} />
      <AccountStackNav.Screen name="Address" component={AddressScreen} />
      <AccountStackNav.Screen name="Payments" component={PaymentsScreen} />
      <AccountStackNav.Screen name="Notifications" component={NotificationsScreen} />
      <AccountStackNav.Screen name="Support" component={SupportScreen} />
      <AccountStackNav.Screen name="Settings" component={SettingsScreen} />
    </AccountStackNav.Navigator>
  );
}

function TabNavigator() {
  const { t } = useLanguage();
  const { cartCount } = useCart();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color }) => <FontlessTabIcon routeName={route.name} color={color} />,
        tabBarActiveTintColor: COLORS.tabActive,
        tabBarInactiveTintColor: COLORS.tabInactive,
        tabBarStyle: {
          backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.border,
          height: 60, paddingBottom: 8, paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ tabBarLabel: t('tabHome') }} />
      <Tab.Screen name="CategoriesTab" component={CategoriesStack} options={{ tabBarLabel: t('tabCategories') }} />
      <Tab.Screen name="ShopTab" component={ShopStack} options={{ tabBarLabel: t('tabShop') }} />
      <Tab.Screen name="CartTab" component={CartStack} options={{
        tabBarLabel: t('tabCart'),
        tabBarBadge: cartCount > 0 ? (cartCount > 99 ? '99+' : cartCount) : undefined,
        tabBarBadgeStyle: { backgroundColor: COLORS.accent, fontSize: 10, fontWeight: '700', minWidth: 18, height: 18, lineHeight: 18 },
      }} />
      <Tab.Screen name="AccountTab" component={AccountStack} options={{ tabBarLabel: t('tabAccount') }} />
    </Tab.Navigator>
  );
}

const tabIconStyles = StyleSheet.create({
  iconBox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginBottom: -1,
  },
  homeBody: {
    width: 13,
    height: 10,
    borderWidth: 2,
    borderTopWidth: 0,
    borderRadius: 2,
  },
  gridBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    padding: 3,
  },
  gridDot: {
    width: 7,
    height: 7,
    borderRadius: 2,
  },
  bagHandle: {
    width: 10,
    height: 7,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    marginBottom: -2,
  },
  bagBody: {
    width: 17,
    height: 14,
    borderWidth: 2,
    borderRadius: 4,
  },
  cartBasket: {
    width: 17,
    height: 11,
    borderWidth: 2,
    borderTopWidth: 1,
    borderRadius: 3,
    transform: [{ skewX: '-8deg' }],
  },
  cartHandle: {
    position: 'absolute',
    top: 5,
    left: 2,
    width: 6,
    height: 2,
    borderRadius: 1,
    transform: [{ rotate: '18deg' }],
  },
  cartWheels: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 2,
  },
  cartWheel: {
    width: 3,
    height: 3,
    borderRadius: 2,
  },
  personHead: {
    width: 9,
    height: 9,
    borderWidth: 2,
    borderRadius: 5,
    marginBottom: 1,
  },
  personBody: {
    width: 16,
    height: 9,
    borderWidth: 2,
    borderRadius: 8,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
  },
});

function AppLoading() {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={COLORS.accent} />
    </View>
  );
}

const linking = {
  prefixes: ['emartbd://', 'https://e-mart.com.bd'],
  config: {
    screens: {
      HomeTab: {
        screens: {
          HomeMain: '',
          Products: 'shop',
        },
      },
      CategoriesTab: {
        screens: {
          CategoriesMain: 'categories',
          Products: 'category/:categorySlug',
        },
      },
      ShopTab: {
        screens: {
          ProductsMain: 'products',
        },
      },
      CartTab: {
        screens: {
          CartMain: 'cart',
          Checkout: 'checkout',
          OrderSuccess: 'order-success/:orderId',
        },
      },
      AccountTab: {
        screens: {
          AccountMain: 'account',
          Login: 'login',
          Register: 'register',
          MyOrders: 'account/orders',
          Wishlist: 'wishlist',
          Address: 'address',
          Payments: 'payments',
          Notifications: 'notifications',
          Support: 'support',
          Settings: 'settings',
        },
      },
    },
  },
};

const navigateFromNotification = (navigationRef, data = {}) => {
  if (!navigationRef.current?.isReady()) return;

  switch (data.screen) {
    case 'MyOrders':
      navigationRef.current.navigate('AccountTab', { screen: 'MyOrders' });
      break;
    case 'Cart':
      navigationRef.current.navigate('CartTab', { screen: 'CartMain' });
      break;
    case 'Checkout':
      navigationRef.current.navigate('CartTab', { screen: 'Checkout' });
      break;
    case 'Account':
      navigationRef.current.navigate('AccountTab', { screen: 'AccountMain' });
      break;
    default:
      navigationRef.current.navigate('HomeTab', { screen: 'HomeMain' });
      break;
  }
};

function AppContent({ navigationRef }) {
  const { loading } = useAuth();
  const notificationListener = useRef();
  const responseListener = useRef();

  // Listen for incoming notifications
  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      // Notification received while app is open
      if (__DEV__) console.log('Notification:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      // User tapped on notification
      const data = response.notification.request.content.data;
      navigateFromNotification(navigationRef, data);
    });

    return () => {
      if (notificationListener.current) Notifications.removeNotificationSubscription(notificationListener.current);
      if (responseListener.current) Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [navigationRef]);

  if (loading) return <AppLoading />;

  return (
    <>
      <StatusBar style="light" />
      <TabNavigator />
    </>
  );
}

export default function App() {
  const navigationRef = useNavigationContainerRef();

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <LanguageProvider>
            <AuthProvider>
              <CartProvider>
                <OrderProvider>
                  <NavigationContainer ref={navigationRef} linking={linking}>
                    <AppContent navigationRef={navigationRef} />
                  </NavigationContainer>
                </OrderProvider>
              </CartProvider>
            </AuthProvider>
          </LanguageProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
