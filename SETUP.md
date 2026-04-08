# Emart Platform - Setup Guide

Before launching the site and apps, you need to configure WooCommerce API credentials.

## 🔐 API Configuration

### Step 1: Generate WooCommerce API Keys

1. Log in to your WordPress Admin Dashboard at `https://e-mart.com.bd/wp-admin`
2. Navigate to **WooCommerce > Settings > Advanced > REST API**
3. Click **Create an API key**
4. Fill in the description (e.g., "Emart Mobile & Web App")
5. Set **User** to your admin account
6. Set **Permissions** to **Read and Write**
7. Click **Generate API Key**
8. Copy the **Consumer Key** and **Consumer Secret**

### Step 2: Configure Web App

1. Go to `apps/web/` directory
2. Create a `.env.local` file (copy from `.env.example`)
3. Set these variables:
   ```
   NEXT_PUBLIC_WOO_URL=https://e-mart.com.bd
   WOO_CONSUMER_KEY=your_consumer_key_here
   WOO_CONSUMER_SECRET=your_consumer_secret_here
   ```

### Step 3: Configure Mobile App

1. Go to `apps/mobile/` directory
2. Create a `.env` file (copy from `.env.example`)
3. Set these variables:
   ```
   REACT_APP_WOO_URL=https://e-mart.com.bd/wp-json/wc/v3
   REACT_APP_WOO_CONSUMER_KEY=your_consumer_key_here
   REACT_APP_WOO_CONSUMER_SECRET=your_consumer_secret_here
   ```

## 🚀 Deployment Checklist

Before going live:

- [ ] API credentials configured in both apps
- [ ] Environment variables set on production servers
- [ ] Checkout functionality tested with test orders
- [ ] Payment methods (COD, bKash, Nagad) working correctly
- [ ] Mobile app rebuilt and signed with API keys
- [ ] Web app deployed with correct environment variables
- [ ] HTTPS enabled on all endpoints
- [ ] Rate limiting configured on WooCommerce API

## ⚠️ Security Notes

- **Never commit `.env.local` or `.env` files** - they contain sensitive credentials
- Always use environment variables for production deployments
- Regenerate API keys if they're ever exposed
- Use HTTPS for all API communications
- Restrict API key permissions to minimum required

## 🧪 Testing

Test these critical flows before launch:

1. **Checkout Flow**: Add product to cart → Proceed to checkout → Fill details → Place order
2. **Payment Methods**: Test each payment method (COD, bKash, Nagad)
3. **Order Confirmation**: Verify orders appear in WooCommerce admin
4. **Mobile App**: Run through same flows on mobile app

## 📞 Support

If you encounter "Something went wrong. Please try again or call us" errors:

1. Check that API credentials are correctly set
2. Verify WooCommerce is accessible at `https://e-mart.com.bd`
3. Check browser console for error details
4. Review server logs for API errors
5. Ensure API key has "Read and Write" permissions
