from pathlib import Path
import json
import sys
import tempfile
import unittest
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from social_engine.engine import import_ga4_scores, import_gmc_scores, import_gsc_scores, load_campaign_memory, normalize_campaign, performance_score, qa_campaign, social_metric_score  # noqa: E402
from social_engine import creative_qa, vision_qa  # noqa: E402


def base_config():
    return {
        "defaults": {
            "platforms": ["facebook", "instagram"],
            "start_time": "09:00",
            "end_time": "23:00",
            "timezone": "+06:00",
            "repeat_lookback_days": 2,
        },
        "platform_rules": {
            "facebook": {"image": [1080, 1080]},
            "instagram": {"image": [1080, 1350]},
        },
    }


def campaign_with_item(extra_item=None):
    item = {
        "product_id": 100,
        "title": "COSRX Test Serum",
        "slug": "cosrx-test-serum",
        "creative_type": "model",
        "link": "https://e-mart.com.bd/shop/cosrx-test-serum",
        "images": {"default": "https://cdn.example.com/social/test.jpg"},
        "captions": {
            "facebook": "Soft serum moment.\n\nBuy link in first comment.",
            "instagram": "Soft serum moment.\n\nDM to order or tap the link in bio.",
        },
        "visual_qa": {
            "product_match_checked": True,
            "price_clear": True,
            "no_dummy_product": True,
            "model_hand_checked": True,
        },
    }
    items = [item]
    if extra_item:
        items.append(extra_item)
    return {
        "id": "test",
        "name": "Test",
        "date": "2026-06-24",
        "items": items,
    }


class SocialEngineTests(unittest.TestCase):
    def test_plan_passes_with_required_visual_qa(self):
        campaign = normalize_campaign(campaign_with_item(), base_config())
        qa = qa_campaign(
            campaign,
            base_config(),
            {"blocked_product_ids": set(), "blocked_slugs": set(), "dates": []},
        )
        self.assertEqual(qa["status"], "pass")
        self.assertEqual(qa["errors"], [])

    def test_recent_repeat_blocks_campaign(self):
        campaign = normalize_campaign(campaign_with_item(), base_config())
        qa = qa_campaign(
            campaign,
            base_config(),
            {"blocked_product_ids": {"100"}, "blocked_slugs": set(), "dates": ["2026-06-23"]},
        )
        self.assertEqual(qa["status"], "blocked")
        self.assertTrue(any(error["code"] == "recent_product_repeat" for error in qa["errors"]))

    def test_rejected_history_blocks_campaign_memory(self):
        with tempfile.TemporaryDirectory() as tmp:
            published = Path(tmp) / "published.json"
            rejected = Path(tmp) / "rejected.json"
            published.write_text(json.dumps({"campaigns": []}))
            rejected.write_text(json.dumps({
                "campaigns": [{
                    "date": "2026-06-23",
                    "id": "owner-rejected",
                    "items": [{"product_id": 100, "slug": "cosrx-test-serum"}],
                }]
            }))
            memory = load_campaign_memory(published, rejected, "2026-06-24", 2, 14)
        self.assertIn("100", memory["blocked_product_ids"])
        self.assertIn("cosrx-test-serum", memory["blocked_slugs"])

    def test_missing_model_hand_qa_blocks_model_creative(self):
        raw = campaign_with_item()
        raw["items"][0]["visual_qa"].pop("model_hand_checked")
        campaign = normalize_campaign(raw, base_config())
        qa = qa_campaign(
            campaign,
            base_config(),
            {"blocked_product_ids": set(), "blocked_slugs": set(), "dates": []},
        )
        self.assertEqual(qa["status"], "blocked")
        self.assertTrue(any(error["code"] == "visual_qa_missing_model_hand_checked" for error in qa["errors"]))

    def test_vision_failure_blocks_campaign(self):
        campaign = normalize_campaign(campaign_with_item(), base_config())
        ref = "01 COSRX Test Serum"
        vision = {
            "items": {
                ref: {
                    "facebook": {"status": "fail", "issues": ["wrong package"], "blockers": ["product_match"]},
                    "instagram": {"status": "pass", "issues": [], "blockers": []},
                }
            }
        }
        qa = qa_campaign(
            campaign,
            base_config(),
            {"blocked_product_ids": set(), "blocked_slugs": set(), "dates": []},
            vision_report=vision,
            vision_required=True,
        )
        self.assertEqual(qa["status"], "blocked")
        self.assertTrue(any(error["code"] == "vision_qa_fail" for error in qa["errors"]))

    def test_unavailable_vision_blocks_only_when_required(self):
        campaign = normalize_campaign(campaign_with_item(), base_config())
        ref = "01 COSRX Test Serum"
        vision = {
            "items": {
                ref: {
                    platform: {"status": "unavailable", "issues": ["vision_qa_unavailable"]}
                    for platform in ("facebook", "instagram")
                }
            }
        }
        history = {"blocked_product_ids": set(), "blocked_slugs": set(), "dates": []}
        strict = qa_campaign(campaign, base_config(), history, vision_report=vision, vision_required=True)
        fallback = qa_campaign(campaign, base_config(), history)
        self.assertEqual(strict["status"], "blocked")
        self.assertEqual(fallback["status"], "pass")

    def test_incomplete_model_verdict_fails_closed(self):
        model_result = {
            "product_match": True,
            "price_clear": None,
            "no_dummy_product": True,
            "model_hand_ok": None,
            "layout_ok": True,
            "issues": [],
            "score": 90,
        }
        with tempfile.NamedTemporaryFile(suffix=".jpg") as image:
            image.write(b"test-image")
            image.flush()
            with mock.patch.object(vision_qa, "models", return_value=["free-test"]), mock.patch.object(
                vision_qa, "ask_model", return_value=model_result
            ):
                result = vision_qa.inspect_image(Path(image.name), "Test Product", "model")
        self.assertEqual(result["status"], "fail")
        self.assertIn("price_clear", result["blockers"])
        self.assertIn("model_hand_ok", result["blockers"])

    def test_local_creative_qa_blocks_low_resolution(self):
        if creative_qa.Image is None:
            self.skipTest("Pillow unavailable")
        with tempfile.NamedTemporaryFile(suffix=".png") as image:
            creative_qa.Image.new("RGB", (480, 480), "white").save(image.name)
            result = creative_qa.inspect_asset(
                Path(image.name),
                {"title": "COSRX Test Serum", "design_template": "soft_grid_concern", "product_image_source": "woocommerce-real-product-cutout"},
                "instagram",
            )
        self.assertEqual(result["status"], "fail")
        self.assertIn("image_resolution_too_low", result["blockers"])

    def test_visible_text_issues_catch_reference_brand(self):
        issues = creative_qa.visible_text_issues("NYKAA SKINTASTIC SALE lorem ipsum")
        self.assertIn("competitor_or_reference_brand_visible", issues)
        self.assertIn("reference_campaign_brand_visible", issues)
        self.assertIn("placeholder_text_visible", issues)

    def test_rejected_design_hash_blocks_repeat(self):
        if creative_qa.Image is None:
            self.skipTest("Pillow unavailable")
        with tempfile.NamedTemporaryFile(suffix=".png") as image:
            creative_qa.Image.new("RGB", (1080, 1350), "white").save(image.name)
            ahash = creative_qa.average_hash(Path(image.name))
            result = creative_qa.inspect_asset(
                Path(image.name),
                {"title": "COSRX Test Serum", "design_template": "soft_grid_concern", "product_image_source": "woocommerce-real-product-cutout"},
                "instagram",
                rejected_hashes=[{"ahash": ahash, "reason": "owner rejected same layout"}],
            )
        self.assertEqual(result["status"], "fail")
        self.assertIn("matches_rejected_design_memory", result["blockers"])

    def test_performance_score_combines_product_brand_and_category(self):
        product = {
            "id": 123,
            "name": "COSRX Daily SPF 50ml",
            "slug": "cosrx-daily-spf",
            "brands": [{"name": "COSRX"}],
            "categories": [{"name": "Sunscreen"}],
        }
        model = {
            "enabled": True,
            "products": {"123": 4, "cosrx-daily-spf": 2},
            "brands": {"cosrx": 1.5},
            "categories": {"sunscreen": 3},
        }
        self.assertEqual(performance_score(product, model), 8.5)

    def test_approval_gate_respects_campaign_status(self):
        raw = campaign_with_item()
        raw["approval_status"] = "approved_for_scheduled_run"
        campaign = normalize_campaign(raw, base_config())
        qa = qa_campaign(
            campaign,
            base_config(),
            {"blocked_product_ids": set(), "blocked_slugs": set(), "dates": []},
        )
        self.assertFalse(qa["approval_required"])
        self.assertTrue(qa["publish_allowed"])
        self.assertEqual(qa["publish_gate"], "approved_for_scheduled_run")

    def test_facebook_inline_purchase_link_policy_allows_caption_url(self):
        raw = campaign_with_item()
        raw["caption_link_policy"] = {"facebook": "inline_purchase_link"}
        raw["items"][0]["captions"]["facebook"] = (
            "Soft serum moment.\n\nShop: https://e-mart.com.bd/shop/cosrx-test-serum"
        )
        campaign = normalize_campaign(raw, base_config())
        qa = qa_campaign(
            campaign,
            base_config(),
            {"blocked_product_ids": set(), "blocked_slugs": set(), "dates": []},
        )
        self.assertEqual(qa["status"], "pass")
        self.assertFalse(any(error["code"] == "fb_caption_contains_raw_url" for error in qa["errors"]))

    def test_facebook_inline_purchase_link_policy_requires_product_link(self):
        raw = campaign_with_item()
        raw["caption_link_policy"] = {"facebook": "inline_purchase_link"}
        raw["items"][0]["captions"]["facebook"] = "Soft serum moment.\n\nShop now on Emart."
        campaign = normalize_campaign(raw, base_config())
        qa = qa_campaign(
            campaign,
            base_config(),
            {"blocked_product_ids": set(), "blocked_slugs": set(), "dates": []},
        )
        self.assertEqual(qa["status"], "blocked")
        self.assertTrue(any(error["code"] == "fb_caption_missing_inline_link" for error in qa["errors"]))

    def test_social_metric_score_weights_intent_metrics(self):
        self.assertEqual(
            social_metric_score({"reactions": 10, "comments": 2, "shares": 1, "clicks": 3, "reach": 100}),
            33.0,
        )

    def test_import_gsc_scores_adds_slug_score(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json") as handle:
            json.dump({"pages": [{"path": "/shop/test-product", "impressions": 100, "clicks": 4, "position": 8, "ctr": 0.04}]}, handle)
            handle.flush()
            model = {"products": {}}
            imported = import_gsc_scores(model, Path(handle.name))
        self.assertEqual(imported, 1)
        self.assertIn("test-product", model["products"])
        self.assertIn("gsc", model["products"]["test-product"]["sources"])

    def test_import_gmc_scores_penalizes_issue_id(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json") as handle:
            json.dump({"image_link_broken": [{"wc_id": "123", "title": "Broken Image"}]}, handle)
            handle.flush()
            model = {"products": {}}
            imported = import_gmc_scores(model, Path(handle.name))
        self.assertEqual(imported, 1)
        self.assertLess(model["products"]["123"]["score"], 0)

    def test_import_ga4_scores_accepts_landing_page_path(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json") as handle:
            json.dump([{"landing_page": "/shop/ga4-product", "sessions": 10, "views": 20, "conversions": 1}], handle)
            handle.flush()
            model = {"products": {}}
            imported = import_ga4_scores(model, Path(handle.name))
        self.assertEqual(imported, 1)
        self.assertIn("ga4-product", model["products"])


if __name__ == "__main__":
    unittest.main()
