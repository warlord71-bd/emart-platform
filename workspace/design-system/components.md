# Emart Components

Copy-paste markup (Tailwind classes from `tailwind.config.js`). Match these patterns.

## Buttons (pill)
```html
<!-- Primary: solid ink -->
<button class="inline-flex items-center justify-center gap-2 font-medium transition-all rounded-pill bg-ink text-white hover:bg-black px-4 py-2.5 text-sm">Add to Cart</button>

<!-- Accent (sale / secondary) -->
<button class="inline-flex items-center justify-center gap-2 font-medium transition-all rounded-pill bg-accent text-white px-4 py-2.5 text-sm">Buy Now</button>

<!-- Outline -->
<button class="inline-flex items-center justify-center gap-2 font-medium transition-all rounded-pill border border-ink text-ink hover:bg-bg-alt px-4 py-2.5 text-sm">View Details</button>

<!-- Ghost -->
<button class="inline-flex items-center justify-center gap-2 font-medium transition-all rounded-pill text-ink hover:bg-bg-alt px-4 py-2.5 text-sm">Cancel</button>
```
Sizes: small `px-3 py-1.5 text-sm` · medium `px-4 py-2.5 text-sm` · large `px-6 py-3 text-base`.

## Badges (4px radius)
```html
<span class="inline-flex items-center rounded-[4px] px-2.5 py-1 text-xs font-medium border border-[#2E7D5B40] bg-success-soft text-success">Acne</span>
<span class="inline-flex items-center rounded-[4px] px-2.5 py-1 text-xs font-medium border border-[#C88A2E40] bg-warning-soft text-warning">Dryness</span>
<span class="inline-flex items-center rounded-[4px] px-2.5 py-1 text-xs font-medium border border-[#9f123940] bg-accent-soft text-accent">Anti-Aging</span>
<!-- Promo: mono, uppercase, tracked -->
<span class="inline-flex items-center rounded-[4px] px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-[0.1em] bg-accent text-white">Sale</span>
<span class="inline-flex items-center rounded-[4px] px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-[0.1em] bg-ink text-white">New</span>
```

## Category chips (pill)
```html
<span class="rounded-pill border border-hairline bg-white px-3.5 py-1.5 text-sm font-medium text-ink shadow-sm hover:shadow-card transition-shadow cursor-pointer">Sunscreen</span>
<!-- Active -->
<span class="rounded-pill border border-accent bg-accent-soft px-3.5 py-1.5 text-sm font-medium text-accent">Moisturizer</span>
```

## Product card
```html
<div class="group relative rounded-xl border border-hairline bg-white shadow-card overflow-hidden">
  <div class="relative aspect-square bg-bg-alt overflow-hidden">
    <div class="absolute left-2 top-2 z-10 flex flex-col gap-1">
      <span class="inline-flex items-center rounded-[4px] px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-[0.1em] bg-accent text-white">Sale</span>
    </div>
    <img src="..." alt="..." class="w-full h-full object-cover">
  </div>
  <div class="p-3">
    <p class="text-[10px] font-medium text-brass uppercase tracking-wider mb-1">COSRX</p>
    <h3 class="text-sm font-medium text-ink leading-snug line-clamp-2 mb-2">Advanced Snail 96 Mucin Power Essence 100ml</h3>
    <div class="flex flex-wrap gap-1 mb-2">
      <span class="rounded-pill border border-hairline bg-bg px-2 py-0.5 text-[10px] text-muted">100ml</span>
      <span class="rounded-pill border border-hairline bg-bg px-2 py-0.5 text-[10px] text-muted">South Korea</span>
    </div>
    <div class="flex items-baseline gap-2">
      <span class="font-mono text-base font-bold text-ink">৳1,250</span>
      <span class="font-mono text-xs text-muted line-through">৳1,500</span>
    </div>
    <div class="flex items-center gap-1 mt-1.5">
      <span class="text-xs text-brass">★★★★</span><span class="text-xs text-muted">(24)</span>
    </div>
  </div>
</div>
```
Out-of-stock variant: add `opacity-75` to the card, swap the badge for
`border border-black/10 bg-white/95 text-ink` "Out of Stock".

## Stock bar
```html
<div>
  <div class="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-ink-2">
    <span>🔥 20 sold</span><span>30 left</span>
  </div>
  <div class="h-2 overflow-hidden rounded-full bg-hairline">
    <div class="h-full rounded-full" style="width:40%; background: linear-gradient(90deg,#d4a248,#F5ECD4)"></div>
  </div>
</div>
```
When stock is low (>80% sold), use solid `#B23B3B` for the fill and `text-danger` on the "N left" label.

## Breadcrumbs
```html
<nav class="text-sm text-muted">
  <ol class="flex items-center gap-1.5">
    <li><a class="hover:text-ink transition-colors" href="#">Home</a></li>
    <li class="text-hairline">/</li>
    <li class="text-ink font-medium">COSRX Aloe Soothing Sun Cream SPF50+</li>
  </ol>
</nav>
```

## Typography scale
- Display / hero: `font-display text-3xl font-semibold` (Playfair)
- Heading: `font-sans text-xl font-semibold`
- Body: `font-sans text-sm text-muted leading-relaxed`
- Price: `font-mono text-lg font-bold text-ink` + struck `text-sm text-muted line-through`
