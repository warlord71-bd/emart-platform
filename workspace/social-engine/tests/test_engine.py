from pathlib import Path
import sys
import tempfile
import unittest
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from social_engine.engine import normalize_campaign, qa_campaign  # noqa: E402
from social_engine import vision_qa  # noqa: E402


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


if __name__ == "__main__":
    unittest.main()
