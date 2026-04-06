# eMart BD — Mobile App

Korean & Japanese Beauty E-Commerce App for Bangladesh

Built with Expo 52 + React Native 0.76 + WooCommerce REST API

---

## Theme: Midnight Blossom

- Dark luxury header (#1B1B2F)
- Soft pink accents (#E8739E)
- Gold ratings (#D4A248)
- Bilingual: English + বাংলা

---

## Quick Setup

```bash
# Install dependencies
npm install

# Start development
npx expo start --clear

# Build for Android (preview)
eas build --platform android --profile preview

# Build for Android (production)
eas build --platform android --profile production
```

---

## Project Structure

```
EmartBD/
├── App.js                         # Navigation + providers
├── app.json                       # Expo config
├── babel.config.js                # Babel + Reanimated plugin
├── eas.json                       # EAS build profiles
├── index.js                       # Entry point
├── package.json                   # Dependencies
│
├── assets/
│   ├── logo.png                   # App logo
│   ├── icon.png                   # App icon (1024x1024)
│   └── splash.png                 # Splash screen
│
└── src/
    ├── config/
    │   └── api.js                 # WooCommerce API config
    │
    ├── theme/
    │   └── colors.js              # Midnight Blossom palette
    │
    ├── i18n/
    │   ├── en.js                  # English translations
    │   └── bn.js                  # Bangla translations
    │
    ├── context/
    │   ├── AuthContext.js          # Auth + AsyncStorage persist
    │   ├── CartContext.js          # Cart + AsyncStorage persist
    │   ├── LanguageContext.js      # Language + AsyncStorage persist
    │   └── OrderContext.js         # Orders + AsyncStorage persist
    │
    ├── services/
    │   └── woocommerce.js         # WooCommerce REST API service
    │
    ├── components/
    │   ├── ProductCard.js          # Product card (grid + compact)
    │   └── SearchBar.js            # Search input (dark/light)
    │
    └── screens/
        ├── HomeScreen.js           # Animated header, banners, deals
        ├── CategoriesScreen.js     # Category grid with search
        ├── ProductsScreen.js       # Product list + sort/filter
        ├── ProductDetailScreen.js  # Full product detail + gallery
        ├── CartScreen.js           # Shopping cart
        ├── CheckoutScreen.js       # Checkout + bKash/Nagad/COD
        ├── OrderSuccessScreen.js   # Order confirmation
        ├── AccountScreen.js        # Profile + menu
        ├── MyOrdersScreen.js       # Order history
        ├── LoginScreen.js          # Sign in
        ├── RegisterScreen.js       # Create account
        ├── WishlistScreen.js       # Saved products
        ├── AddressScreen.js        # Delivery addresses
        ├── PaymentsScreen.js       # Payment methods info
        ├── NotificationsScreen.js  # Notifications
        ├── SupportScreen.js        # WhatsApp + FAQ
        └── SettingsScreen.js       # Preferences + links
```

---

## Features

### 18 Screens
- Home with collapsing animated header, skeleton loading, flash sale countdown
- Product browsing with search, sort, filter, infinite scroll
- Full product detail with image gallery, ratings, stock status
- Shopping cart with quantity management and free delivery threshold
- Checkout with bKash, Nagad, and Cash on Delivery
- Order success with animated confirmation
- Account with profile, orders, wishlist, settings
- Bilingual support (English/Bangla) with persistent preference

### Technical
- Expo 52 + React Native 0.76.9
- React Navigation 7 (5 tab stacks)
- AsyncStorage persistence for cart, auth, orders, language
- WooCommerce REST API integration (e-mart.com.bd)
- Skeleton loaders and image loading states
- Pull-to-refresh on home screen

### Bangladesh-Specific
- BDT (৳) currency throughout
- bKash and Nagad merchant payment with TrxID
- Cash on Delivery option
- Free delivery over ৳2,000
- Dhaka delivery indicator
- WhatsApp customer support integration

---

## Navigation Structure

```
Tab Navigator
├── Home Tab
│   ├── HomeScreen
│   ├── ProductsScreen
│   └── ProductDetailScreen
│
├── Categories Tab
│   ├── CategoriesScreen
│   ├── ProductsScreen
│   └── ProductDetailScreen
│
├── Shop Tab
│   ├── ProductsScreen
│   └── ProductDetailScreen
│
├── Cart Tab
│   ├── CartScreen
│   ├── CheckoutScreen
│   ├── OrderSuccessScreen
│   └── MyOrdersScreen
│
└── Account Tab
    ├── AccountScreen
    ├── LoginScreen
    ├── RegisterScreen
    ├── MyOrdersScreen
    ├── WishlistScreen
    ├── AddressScreen
    ├── PaymentsScreen
    ├── NotificationsScreen
    ├── SupportScreen
    └── SettingsScreen
```

---

## Dependencies

| Package | Purpose |
|---------|---------|
| expo ~52.0.0 | Framework |
| react-native 0.76.9 | Core |
| @react-navigation 7.x | Navigation |
| @react-native-async-storage | Persistence |
| expo-linear-gradient | Gradient backgrounds |
| react-native-reanimated | Animations |
| react-native-gesture-handler | Touch handling |
| @expo/vector-icons (Ionicons) | Icons |

---

## Configuration

### WooCommerce API
API config is in `src/config/api.js`. For production, move keys to environment variables.

### Theme
Edit `src/theme/colors.js` for the complete Midnight Blossom palette.

### Translations
Edit `src/i18n/en.js` and `src/i18n/bn.js` for all UI strings.

---

## Build Notes

- Android target SDK: 35 (meets Play Store requirement)
- Hermes JS engine enabled
- New Architecture disabled (stable mode)
- Min SDK: 24 (Android 7.0+)
