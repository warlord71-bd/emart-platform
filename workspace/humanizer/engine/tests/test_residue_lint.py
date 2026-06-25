import sys
import unittest
from contextlib import redirect_stdout
from io import StringIO
from pathlib import Path
from unittest.mock import patch


ENGINE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ENGINE_DIR))

from residue_lint import STYLE_SLOP_VERSION, lint, main  # noqa: E402


class SelectiveStopSlopTests(unittest.TestCase):
    def test_formulaic_patterns_are_soft_scoring_signals(self):
        clean = lint("<p>Use this cream after serum. Apply it to damp skin each evening.</p>")
        formulaic = lint(
            "<p>Here's the thing: the stakes are high. Let me walk you through the routine.</p>"
        )

        self.assertEqual(STYLE_SLOP_VERSION, "emart-stop-slop-v1")
        self.assertTrue(formulaic["gates"]["residue_clean"])
        self.assertGreater(len(formulaic["hits"]["style_slop"]), 0)
        self.assertLess(
            formulaic["categories"]["ai_residue"],
            clean["categories"]["ai_residue"],
        )

    def test_staccato_run_is_detected(self):
        result = lint("<p>Speed. Clear skin. No fuss. Apply the toner after cleansing.</p>")
        self.assertIn("staccato_run", result["hits"]["style_slop"])

    def test_useful_emart_style_is_not_blanket_banned(self):
        result = lint(
            "<p>How does it work? Apply gently each evening — then increase use gradually.</p>"
        )
        self.assertEqual(result["hits"]["style_slop"], [])

    def test_jsonl_summary_respects_hard_gates(self):
        fixture = ENGINE_DIR / "tests" / "fixtures" / "gate-failure.jsonl"
        output = StringIO()
        with patch.object(sys, "argv", ["residue_lint.py", "--jsonl", str(fixture)]):
            with redirect_stdout(output):
                main()
        self.assertIn("[FAIL]", output.getvalue())
        self.assertIn("pass 0/1", output.getvalue())


if __name__ == "__main__":
    unittest.main()
