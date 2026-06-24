from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from social_engine.engine import normalize_campaign, qa_campaign  # noqa: E402


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


if __name__ == "__main__":
    unittest.main()
