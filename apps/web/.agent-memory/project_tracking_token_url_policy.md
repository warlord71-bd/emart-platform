# Tracking-token broken-path URL policy

Recorded: 2026-05-10

This came from a Meta/fbclid URL diagnosis around a broken Celimax path.

- `fbclid` is a tracking query parameter. A valid public URL such as `/?fbclid=...` or `/shop/real-product?fbclid=...` may return 200, and canonical URL logic strips `fbclid`.
- A tracking-looking value requested as a path, such as `/IwY2x...`, is not a product/category/page and should remain a real 404 unless a precise intended destination is proven.
- A broken external/ad/share path such as `/.../celimax-poredark-spot?fbclid=...` is ambiguous. Do not redirect it to the homepage, because that risks soft-404 behavior.
- Fix the source ad/feed/share URL to the exact canonical product URL. Add an exact 301 only after the intended product is confirmed.
- 2026-05-10 live spot check: `/?fbclid=IwY2xtest` returned 200, `/IwY2xtest` returned 404, and `/.../celimax-poredark-spot?fbclid=IwY2xtest` returned 404.

Likely Celimax canonical candidates found in current data:

- `/shop/celimax-poredark-spot-brightening-serum-30ml`
- `/shop/celimax-poredark-spot-brightening-cream-35ml`
- `/shop/celimax-pore-dark-spot-brightening-kit`
