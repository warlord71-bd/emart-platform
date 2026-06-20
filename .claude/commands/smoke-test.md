Quick smoke test of the live site. Run all checks in parallel:

1. `curl -fsS -o /dev/null -w "homepage: %{http_code}\n" https://e-mart.com.bd/`
2. `curl -fsS -o /dev/null -w "shop: %{http_code}\n" https://e-mart.com.bd/shop`
3. `curl -fsS -o /dev/null -w "PDP: %{http_code}\n" https://e-mart.com.bd/shop/cosrx-advanced-snail-96-mucin-power-essence-100ml`
4. `curl -fsS -o /dev/null -w "category: %{http_code}\n" https://e-mart.com.bd/category/sunscreen`
5. `curl -fsS -o /dev/null -w "sitemap: %{http_code}\n" https://e-mart.com.bd/sitemap.xml`
6. `curl -fsS -o /dev/null -w "robots: %{http_code}\n" https://e-mart.com.bd/robots.txt`
7. `curl -fsS -o /dev/null -w "API health: %{http_code}\n" https://e-mart.com.bd/api/newsletter/subscribe`
8. `pm2 status` — check emartweb is online
9. `pm2 logs emartweb --lines 5 --nostream` — check for recent errors

Report pass/fail for each. Flag anything non-200 or erroring.
