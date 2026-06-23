---
name: feedback-social-image-sizes
description: Future social campaigns should generate separate FB (1:1) and IG (4:5) image sizes
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 3d7541ad-0328-4ebb-8407-6a92ccf96760
---

Future Meta social campaigns should generate two image sizes per post: 4:5 (1080×1350) for Instagram and 1:1 (1200×1200) for Facebook. The scheduler should support separate `fbImage` and `igImage` fields.

**Why:** 4:5 images get letterboxed on Facebook feed; 1:1 or 1.91:1 fills the FB feed better. First campaign (2026-06-23) shipped with single 4:5 images for both — acceptable but not ideal.

**How to apply:** when building the next social campaign scheduler or image gen script, generate both sizes and wire the scheduler to use the correct one per platform.
