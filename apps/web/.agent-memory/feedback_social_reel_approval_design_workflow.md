# Social/reel approval and design workflow

Owner preference recorded 2026-06-28:

- Before generating or scheduling social/reel batches, first produce an owner-reviewable plan as an Excel/CSV-style file or a clear table in chat.
- The plan must list product, platform, creative type, selected design theme, hook/caption direction, voiceover script direction, and proposed schedule slot.
- Do not generate the final schedule or publish queue until the owner approves the list.
- Before making a new list, read Social Engine published history plus rejected history. Owner-rejected approval packs must be recorded with `social_engine.py reject` so rejected products do not repeat.
- Use one clear high-quality product image per social post/reel featured item. Avoid multi-product/collage confusion unless the owner explicitly approves a bundle or comparison creative.
- Product image source priority: (1) existing high-quality local/Woo image, (2) better exact-product image already in Emart assets, (3) fetch a trustworthy exact-product image from the web if it is missing or low-quality in our system. Record the image source in the approval/review pack.
- For reel voiceovers, avoid robotic/computer-generated tone and spelling. Use short natural Bangla/Banglish spoken lines, then owner-review the script before final render when quality is uncertain.
- For reels, the first frame should prioritize a model/persona holding the exact featured product when that image can be generated and identity-QA passed. If a trustworthy product-holding image is not available, use a product-first hero frame instead of a fake/uncertain holding shot.
- Batch size preference: prepare 10-15 items at a time, roughly enough for two days, then generate/schedule only after owner approval.
- Design consistency matters: maintain a small set of standard themes that handle bottles, jars, tubes, cushions, boxes, and sheet packs without layout drift.
- Before owner approval or scheduling, Social Engine must run Creative QA: approved theme registry checks, image resolution/aspect/detail checks, OCR text scan, product-image source metadata check, rejected visual-design hash matching, and optional strict vision/art-director QA. Do not rely on HyperFrames to fix weak frames; HyperFrames should receive already-QA-passed images.
- If the owner provides a reference design, use it as the primary direction. Otherwise propose 2-3 standard Emart themes, get approval, and regenerate through the Creative/HyperFrames pipeline.
- After a campaign is posted or closed, generated social assets should be dry-run checked with `social_engine.py cleanup-assets`; when safe, archive bulky media to `/root/.attic-YYYY-MM-DD/` instead of leaving it on server disk indefinitely.
