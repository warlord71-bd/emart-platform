import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

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
        tabBarIcon: ({ focused, color }) => {
          let iconName = 'home-outline';
          if (route.name === 'HomeTab') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'CategoriesTab') iconName = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'ShopTab') iconName = focused ? 'bag' : 'bag-outline';
          else if (route.name === 'CartTab') iconName = focused ? 'cart' : 'cart-outline';
          else if (route.name === 'AccountTab') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={22} color={color} />;
        },
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

function AppLoading() {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={COLORS.accent} />
    </View>
  );
}

function AppContent() {
  const { loading } = useAuth();
  const notificationListener = useRef();
  const responseListener = useRef();

  // Listen for incoming notifications
  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      // Notification received while app is open
      console.log('Notification:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      // User tapped on notification
      const data = response.notification.request.content.data;
      // Navigate based on notification data
      if (data?.screen === 'MyOrders') {
        // Handle navigation to orders
      }
    });

    return () => {
      if (notificationListener.current) Notifications.removeNotificationSubscription(notificationListener.current);
      if (responseListener.current) Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  if (loading) return <AppLoading />;

  return (
    <>
      <StatusBar style="light" />
      <TabNavigator />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <OrderProvider>
              <NavigationContainer>
                <AppContent />
              </NavigationContainer>
            </OrderProvider>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}
