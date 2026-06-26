# Creative Use-Case Sample Pack — 2026-06-26

Product used: `COSRX Advanced Snail Mucin 96 Power Essence 100ml` (`product_id=2591`).
Real product reference: `workspace/social-calendar/2026-06-23/references/02-cosrx-snail-real-product-reference.png`.

No WooCommerce writes, no public storage copy, no Meta publish, no PM2 restart, no deploy.

## What This Pack Shows

| File | Use case | Engine path | Size |
|---|---|---|---|
| `00-contact-sheet-all-usecases.jpg` | Owner review sheet for all surfaces | generated contact sheet | 1700x770 |
| `00-contact-sheet-static-usecases.jpg` | Static-only review sheet | generated contact sheet | 1140x860 |
| `01-blog-og-1200x630.png` | Blog featured image / Open Graph share image | Creative Engine `blog_og_1200x630` | 1200x630 |
| `02-facebook-post-1x1.png` | Facebook feed post | Creative Engine `post_1x1` | 1080x1080 |
| `03-instagram-post-4x5.png` | Instagram feed portrait | Creative Engine `post_4x5` | 1080x1350 |
| `04-reel-product-hero.png` | Reel opening product truth frame | Creative Engine `hero_vertical` | 1080x1920 |
| `05-reel-value-card.png` | Reel education/value frame | Creative Engine `scene_value` | 1080x1920 |
| `06-reel-brand-end.png` | Reel CTA/brand end card | Creative Engine `scene_brand_end` | 1080x1920 |
| `07-persona-product-photo-card.png` | Rejected experiment: persona + product tile overlay | Video `presenter_card.py` | 1080x1920 |
| `08-local-reel-sample.mp4` | Local reel sample: product hero -> value card -> brand card | Video worker + HyperFrames | 1080x1920 |
| `08-local-reel-qa.json` | Local media QA for reel sample | ffprobe QA | score 96/pass |

## Real Production Use Cases

- Blog: generated featured image for a skincare guide, e.g. "How to Use Snail Mucin in a Simple Routine".
- Facebook: square product promo with price, COD, origin/category chips.
- Instagram: native 4:5 product promo, separate from Facebook.
- Reel product hero: first frame should usually be product-first, not persona-first.
- Reel value card: 3 concise reasons, routine order, ingredient education, or safe usage reminder.
- Reel brand end: price, COD, Emart URL, final trust line.
- Persona frame: prefer approved Codex asset showing the exact real product in hand or beside the face; model-only frame is allowed only as fallback when that generated asset is pending/unavailable.
- Full reel: HyperFrames animates pre-rendered Creative Engine frames plus captions/audio.

## Persona Standard Applied Here

The earlier `07-persona-product-photo-card.png` is now explicitly rejected for production use because it is only a product tile over a model portrait. It is kept here as a negative example of what not to standardize.

Final rule: best output is model with exact real product in hand or beside the face. If Codex has not returned that generated image, a model-only reel frame is acceptable as a fallback. Do not use the white/tile product overlay as the standard.

For true "model holding the exact product" realism, use a Codex-reviewed premium image asset and save it in the campaign/reel manifest as `holding_images`.
