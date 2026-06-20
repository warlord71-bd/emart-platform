Run an SEO health check on the live site.

1. Read `workspace/SEO_MASTER.md` header for current state
2. Check live responses in parallel:
   - `curl -sI https://e-mart.com.bd/` (homepage headers)
   - `curl -s https://e-mart.com.bd/robots.txt` (robots)
   - `curl -s https://e-mart.com.bd/sitemap.xml | head -50` (sitemap)
   - `curl -sI https://e-mart.com.bd/shop/cosrx-advanced-snail-96-mucin-power-essence-100ml` (sample PDP)
   - `curl -sI "https://e-mart.com.bd/product/test-redirect"` (legacy redirect check)
3. Check for SEO regressions: canonical headers, robots directives, cache headers, redirect chains
4. Report findings concisely — flag any issues that need fixing
