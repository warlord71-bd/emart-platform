# Blog Featured Image Spec (BLOG-1)

Version: 2026-06-26-v1
Status: **spec** — implementation after owner approves template style.

## Goal
Every blog post published on e-mart.com.bd should have a generated featured image relevant to the topic. This replaces the current state where blog posts either have no featured image or reuse a product image.

## Image Spec
- **Dimensions:** 1200×630px (OG image standard, works for WordPress featured image + social sharing)
- **Format:** JPEG (quality 85) or PNG
- **Template:** Emart-branded blog hero with:
  - Topic headline text (2-3 lines, large, readable)
  - Relevant product visual(s) — up to 3 products from the blog's product links
  - Emart logo (bottom-left or top-left)
  - Brand color accent (rose/gold palette from brand guide)
  - Optional category badge ("SKINCARE GUIDE", "PRODUCT REVIEW", "ROUTINE TIPS")
- **No:** price, COD badge, or sales language on blog heroes (these are editorial, not promotional)

## Implementation Plan
1. **Use Creative Asset Engine `blog_og_1200x630` format**:
   - Input: blog title + optional product IDs + category badge text
   - Output: 1200×630 branded blog hero image
   - Uses same product normalization, logo, palette, Chromium renderer, and QA as social/video frames
2. **Wire into blog generator:** `blog_generator.py --draft` includes a `featured_image` field pointing to the generated hero
3. **WordPress upload:** hero image uploaded via WP REST API as media, then set as `featured_media` on the post

## Template Variants (owner to pick)
- **Variant A:** Full-bleed muted product collage background + overlay text
- **Variant B:** Split layout — product visual left, text right, rose accent bar
- **Variant C:** Centered text over gradient, small product thumbnails below

## Dependencies
- `workspace/content-orchestrator/creative-engine/` (active shared renderer)
- `workspace/content-orchestrator/scripts/active/social_image_gen.py` compatibility shim (existing)
- `Pillow` (already installed for social image gen)
- Blog generator `--draft` mode (WA-H, ✅ done)
- WP REST API media upload (existing capability in blog generator)

## Content Lifecycle Integration
- Blog hero generation happens at **stage 3 (Draft)** of the content lifecycle contract
- Image is included in the preview/review step
- No auto-publish: hero is attached to draft post, published only after approval

## Current Blockers
- None technical. Owner needs to approve template style before implementation.
