---
name: project_model_shot_pipeline_20260629
description: "Content Orchestrator gated real-product model-shot pipeline state as of 2026-06-29"
metadata:
  node_type: memory
  type: project
---

Content Orchestrator now has a gated real-product model-shot pipeline in commit `1c55ecf`.

Key files:
- `workspace/content-orchestrator/model_shot.py` emits/fulfills owner-review-required model-shot requests.
- `workspace/content-orchestrator/orchestrator.py` dispatches `model_holding_real_product` requests and enriches visual jobs with read-only Woo product image/brand/price/category fields.
- `workspace/content-orchestrator/video-engine/worker.py` can render `real_product_composite` holding frames and fails closed if the exact product image is missing.
- `workspace/content-orchestrator/creative-engine/api.py` supports clean model-shot assets without baked-in price/COD/Emart overlays.

Preserved verification asset:
- Source cutout: `workspace/content-orchestrator/generated-assets/model-shots/sources/medicube-pdrn-pink-peptide-serum-30ml-cutout.png`
- Fulfilled asset: `workspace/content-orchestrator/generated-assets/model-shots/holding/nusrat__medicube-pdrn-pink-peptide-serum-30ml.png`
- Request/metadata: sibling JSON files under `generated-assets/model-shots/requests/` and `metadata/`

Guardrails:
- Model-shot outputs are verification assets until owner visual approval.
- No automatic publishing, no Woo writes, no Meta scheduling.
- If a job requests `holding_generation_mode=real_product_composite`, `model_fallback` must stay false and the worker must block when the product image is missing.

Verification done:
- `python3 -m py_compile` for orchestrator/model_shot/woo/creative API/video worker/daily producer.
- `python3 workspace/content-orchestrator/model_shot.py --status` showed 1 request, 1 fulfilled, 0 pending, 0 blocked.
- Social Engine unittest file ran 16 tests OK.
- Video quality-gate pytest-style functions were invoked manually because `pytest` is not installed; all 5 passed.
- End-to-end model-shot render succeeded outside sandbox using the preserved source cutout.
