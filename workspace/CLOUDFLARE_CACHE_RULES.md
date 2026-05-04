# E-Mart Cloudflare Cache Rules

Cloudflare configuration is not stored in this repository. Apply these rules in
the Cloudflare dashboard or API when dashboard access is available.

## HTML Cache Rule

Cache only these frontend HTML paths:

- `https://e-mart.com.bd/`
- `https://e-mart.com.bd/shop`
- `https://e-mart.com.bd/category/*`

Recommended settings:

- Cache eligibility: Eligible for cache
- Edge TTL: 5 minutes
- Browser TTL: Respect origin
- Cache key: default

## Bypass Rule

Bypass cache for private, dynamic, backend, and auth paths:

- `https://e-mart.com.bd/checkout*`
- `https://e-mart.com.bd/cart*`
- `https://e-mart.com.bd/account*`
- `https://e-mart.com.bd/api/*`
- `https://e-mart.com.bd/graphql*`
- `https://e-mart.com.bd/wp-*`
- `https://e-mart.com.bd/wp-admin*`
- `https://e-mart.com.bd/wp-login.php*`
- `https://e-mart.com.bd/my-account*`
- `https://e-mart.com.bd/admin*`
- `https://e-mart.com.bd/auth*`
- `https://e-mart.com.bd/login*`
- `https://e-mart.com.bd/register*`
- `https://e-mart.com.bd/order-success*`
- `https://e-mart.com.bd/track-order*`
- `https://e-mart.com.bd/wishlist*`

Place the bypass rule above the cache rule.
