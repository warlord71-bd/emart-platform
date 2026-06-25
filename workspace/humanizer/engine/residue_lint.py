#!/usr/bin/env python3
"""
Opus Humanizer Engine — Output Linter & Scorer
==============================================
Scores a generated product description 0-100 across 7 categories and enforces
two HARD GATES (GMC medical-claim safety, AI-residue density). This is the
mechanism that lets the Hermes pipeline *self-improve over time*: every
generation is scored, logged to scores.jsonl, and prompt versions can be
compared by mean score.

Use as a library (engine imports `lint`) or standalone:

    python3 residue_lint.py --file out.html --focus "Goodal Green Tangerine Vita C Serum" --brand Goodal
    python3 residue_lint.py --jsonl impression-priority-2026-06-23.jsonl   # batch-score a JSONL

A result is PASS only when: total >= 80 AND gmc gate clean AND residue gate clean.
"""
from __future__ import annotations
import argparse, json, re, sys
from datetime import datetime, timezone
from pathlib import Path
from html import unescape

# ── Banned vocabulary ─────────────────────────────────────────────────────────

# HARD GMC gate — any hit = automatic FAIL (Google Merchant Center / ad policy risk)
GMC_HARD = [
    r"\bclinically proven\b", r"\bmedically proven\b", r"\bdermatologist[- ]prescribed\b",
    r"\bmiracle\b", r"\bcures?\b", r"\bcured\b", r"\bprescription\b",
    r"\breverses? (?:the )?(?:signs of )?aging\b", r"\banti[- ]aging miracle\b",
    r"\b100% effective\b", r"\bguaranteed? results?\b", r"\bfda[- ]approved\b",
    r"\bpermanent(?:ly)? (?:remove|removes|removed|results?|cure)\b",
]

# SOFT GMC — deduct + flag for review (claim-adjacent; may be legit in a product name)
GMC_SOFT = [
    r"\btreats?\b", r"\bheals?\b", r"\brepairs? damage\b", r"\beliminates?\b",
    r"\bremoves? wrinkles?\b", r"\bwhitens?\b", r"\bbleach(?:es|ing)?\b",
    r"\bfades? permanently\b", r"\bskin whitening\b",
]

# AI-residue phrases — the tells that scream "an LLM wrote this"
AI_RESIDUE = [
    r"\bdelve\b", r"\bdive (?:in|into|deep)\b", r"\bunlock\b", r"\bunleash\b",
    r"\belevate your\b", r"\bharness the power\b", r"\bembark\b", r"\brealm of\b",
    r"\btapestry\b", r"\btestament to\b", r"\bboasts?\b", r"\bnestled\b",
    r"\btreasure trove\b", r"\bgame[- ]?changer\b", r"\bcutting[- ]edge\b",
    r"\blook no further\b", r"\bsay goodbye to\b", r"\byour skin will thank you\b",
    r"\bin today'?s world\b", r"\bin the world of\b", r"\bwhen it comes to\b",
    r"\bin conclusion\b", r"\bin summary\b", r"\boverall,\b", r"\bultimately,\b",
    r"\bit'?s worth noting\b", r"\bit'?s important to note\b", r"\bthat being said\b",
    r"\brest assured\b", r"\bwhether you'?re\b", r"\bnot only\b[^.]{0,60}\bbut also\b",
    r"\bmore than just\b", r"\ba must[- ]have\b", r"\bholy grail\b",
    r"\bsecret weapon\b", r"\btransform your\b", r"\brevolution(?:ise|ize|ary)\b",
    r"\bsupercharge\b", r"\blevel up\b", r"\bto the next level\b", r"\bpacked with\b",
    r"\bbursting with\b", r"\bjam[- ]packed\b", r"\bglow[- ]?up\b",
    r"\bone of those gems?\b", r"\bonce you try\b", r"\bfall in love\b",
    r"\bsome products\b", r"\bgame saver\b", r"\bnakain bangla\b",
]

# Empty intensifiers — soft style penalty when overused
INTENSIFIERS = [r"\btruly\b", r"\bsimply\b", r"\bliterally\b", r"\bincredibly\b",
                r"\babsolutely\b", r"\butterly\b", r"\bvery very\b"]

# Vague quantifiers
VAGUE = [r"\bvarious\b", r"\bnumerous\b", r"\ba variety of\b", r"\bcountless\b"]

# Selective patterns adapted from hardikpandya/stop-slop (MIT). These are
# deliberately SOFT signals. Emart does not adopt that project's blanket bans
# on adverbs, Wh-questions, passive voice, three-item lists, or all em dashes;
# those would damage useful PDP/AEO copy and conflict with the calibrated spec.
STYLE_SLOP_VERSION = "emart-stop-slop-v1"
STYLE_SLOP = {
    "throat_clearing": [
        r"\bhere(?:'|’)s (?:the thing|what|why|the problem)\b",
        r"\b(?:the uncomfortable truth is|it turns out|let me be clear|the truth is)\b",
    ],
    "empty_emphasis": [
        r"\b(?:let that sink in|make no mistake|full stop)\b",
        r"\bhere(?:'|’)s why (?:that|this) matters\b",
    ],
    "business_jargon": [
        r"\b(?:lean into|circle back|moving forward|take a step back)\b",
        r"\bnavigate (?:the )?(?:challenge|challenges|landscape)\b",
    ],
    "meta_commentary": [
        r"\b(?:let me walk you through|the rest of this (?:article|section|guide))\b",
        r"\b(?:in this section|as (?:we|you)(?:'|’)?ll see)\b",
    ],
    "vague_declarative": [
        r"\bthe (?:reasons? (?:are|is) structural|implications? (?:are|is) significant)\b",
        r"\b(?:the stakes are high|the consequences are real|this is the deepest problem)\b",
    ],
    "formulaic_contrast": [
        r"\bnot because\b[^.]{1,120}\bbecause\b",
        r"\b(?:the answer|the question|the problem) (?:isn(?:'|’)t|is not)\b[^.]{1,120}\.\s*(?:it(?:'|’)s|it is)\b",
    ],
}


def _text(html: str) -> str:
    """Strip tags to plain text for prose-level checks."""
    t = re.sub(r"<[^>]+>", " ", html or "")
    return re.sub(r"\s+", " ", unescape(t)).strip()


def _find(patterns: list[str], hay: str) -> list[str]:
    hits = []
    for p in patterns:
        for m in re.finditer(p, hay, re.IGNORECASE):
            hits.append(m.group(0).lower())
    return hits


def _style_slop_hits(text: str) -> list[str]:
    """Return stable category labels for formulaic prose; never a hard gate."""
    hits = [label for label, patterns in STYLE_SLOP.items() if _find(patterns, text)]
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]
    short_run = 0
    for sentence in sentences:
        word_count = len(re.findall(r"[A-Za-z']+", sentence))
        short_run = short_run + 1 if word_count <= 4 else 0
        if short_run >= 3:
            hits.append("staccato_run")
            break
    return hits


def lint(html: str, focus: str = "", brand: str = "", product_type: str = "") -> dict:
    """Return {score, pass, gates, categories, issues, hits} for one description."""
    body = html or ""
    text = _text(body)
    low  = text.lower()
    words = re.findall(r"[A-Za-z']+", text)
    wc = len(words)
    issues: list[str] = []
    cat: dict[str, float] = {}

    # ── HARD GATES ────────────────────────────────────────────────────────────
    gmc_hard = _find(GMC_HARD, low)
    residue  = _find(AI_RESIDUE, low)
    style_slop = _style_slop_hits(text)
    em_dashes = body.count("—") + body.count("–")
    em_per_100 = (em_dashes / wc * 100) if wc else 0
    bangs = body.count("!")

    gates = {
        "gmc_clean": len(gmc_hard) == 0,
        # residue gate: trips on >3 distinct residue hits OR >2.2 em-dashes/100w OR any "!"
        "residue_clean": len(set(residue)) <= 3 and em_per_100 <= 2.2 and bangs == 0,
    }
    if gmc_hard:    issues.append(f"GMC HARD claim(s): {sorted(set(gmc_hard))}")
    if bangs:       issues.append(f"{bangs} exclamation mark(s) — remove all from body")
    if em_per_100 > 2.2: issues.append(f"em-dash density {em_per_100:.1f}/100w (max 2.2)")

    # ── 1. Structure (15) ─────────────────────────────────────────────────────
    s = 15.0
    h3 = len(re.findall(r"<h3[ >]", body, re.IGNORECASE))
    has_open_p = bool(re.match(r"\s*<p[ >]", body, re.IGNORECASE))
    has_ul = "<ul" in body.lower()
    has_ol = "<ol" in body.lower()
    bad_headers = re.findall(r"<h[12][ >]", body, re.IGNORECASE)
    if not (3 <= h3 <= 6): s -= 5; issues.append(f"{h3} H3s (want 3-6)")
    if not has_open_p:     s -= 3; issues.append("does not open with a <p>")
    if not (has_ul or has_ol): s -= 4; issues.append("no list (need ul 'best for' + ol 'how to use')")
    if not has_ol:         s -= 3; issues.append("no ordered list (how-to steps power HowTo snippets)")
    if bad_headers:        s -= 5; issues.append("contains H1/H2 (page owns those)")
    cat["structure"] = max(0, s)

    # ── 2. Length (10) ────────────────────────────────────────────────────────
    s = 10.0
    if   wc < 350: s = 2;  issues.append(f"{wc} words — far too short")
    elif wc < 480: s = 6;  issues.append(f"{wc} words — slightly short (aim 500-750)")
    elif wc > 820: s = 6;  issues.append(f"{wc} words — slightly long (aim 500-750)")
    elif wc > 950: s = 3;  issues.append(f"{wc} words — too long")
    cat["length"] = s

    # ── 3. AI residue (25) ────────────────────────────────────────────────────
    s = 25.0
    distinct = set(residue)
    s -= min(18, len(distinct) * 3)
    if distinct: issues.append(f"AI-residue phrases: {sorted(distinct)}")
    style_distinct = set(style_slop)
    s -= min(8, len(style_distinct) * 1.5)
    if style_distinct:
        issues.append(f"formulaic prose ({STYLE_SLOP_VERSION}): {sorted(style_distinct)}")
    if em_per_100 > 1.5: s -= 3
    if bangs: s -= 4
    # repeated sentence openers (e.g. every section starts "The <product>")
    sents = re.split(r"(?<=[.!?])\s+", text)
    openers = [re.match(r"\s*(\w+\s+\w+)", x) for x in sents if x.strip()]
    op = [m.group(1).lower() for m in openers if m]
    dup = {o for o in op if op.count(o) >= 3}
    if dup: s -= 3; issues.append(f"repetitive sentence openers: {dup}")
    cat["ai_residue"] = max(0, s)

    # ── 4. GMC safety (20) ────────────────────────────────────────────────────
    s = 20.0
    if gmc_hard: s = 0
    gmc_soft = _find(GMC_SOFT, low)
    # allow soft hits that are inside the focus keyword / product name (e.g. "Treatment Toner")
    soft_real = [h for h in gmc_soft if h not in (focus or "").lower()]
    s -= min(12, len(set(soft_real)) * 4)
    if soft_real: issues.append(f"GMC soft (review): {sorted(set(soft_real))} — prefer 'helps/supports the look of'")
    cat["gmc_safety"] = max(0, s)

    # ── 5. Keyword / on-page SEO (15) ─────────────────────────────────────────
    s = 15.0
    f = (focus or "").lower().strip()
    if f:
        # core noun phrase (drop trailing size like "40ml") for natural matching
        core = re.sub(r"\b\d+\s?(ml|g|gm|kg|pcs|ea)\b", "", f).strip()
        n = low.count(core) if core else 0
        first100 = " ".join(low.split()[:100])
        in_first = core and core in first100
        in_head = bool(re.search(re.escape(core), " ".join(re.findall(r"<h3[^>]*>(.*?)</h3>", body, re.IGNORECASE|re.DOTALL)).lower())) if core else False
        if n == 0: s -= 8; issues.append("focus keyword absent")
        elif n < 2: s -= 3; issues.append("focus keyword <2x")
        elif n > 7: s -= 4; issues.append(f"keyword stuffed ({n}x) — thin to 3-5")
        if not in_first: s -= 3; issues.append("focus keyword not in first 100 words")
        if not in_head:  s -= 2; issues.append("focus keyword not in any H3")
    if brand and brand.lower() not in low: s -= 2; issues.append("brand name absent")
    if product_type and product_type.lower() not in low: s -= 1
    cat["keyword_seo"] = max(0, s)

    # ── 6. Localization (5) ───────────────────────────────────────────────────
    s = 5.0
    loc = len(_find([r"\bbangladesh\b", r"\bdhaka\b", r"\bhumid", r"\bclimate\b", r"\buv\b", r"\bmonsoon\b"], low))
    if loc == 0: s = 1; issues.append("no Bangladesh/climate localization")
    elif loc > 8: s = 3; issues.append("over-localized (reads spammy)")
    cat["localization"] = s

    # ── 7. Snippet / AEO (10) ─────────────────────────────────────────────────
    s = 10.0
    headings = " ".join(re.findall(r"<h3[^>]*>(.*?)</h3>", body, re.IGNORECASE|re.DOTALL)).lower()
    has_q_head = bool(re.search(r"\b(why|what|how|who|when)\b", headings))
    has_howto = bool(re.search(r"how to (use|apply)", headings))
    has_bestfor = bool(re.search(r"\b(best for|who it suits|suited|made for|ideal for|works (well )?for)\b", headings))
    if not has_q_head:  s -= 3; issues.append("no question-style H3 (loses PAA/featured snippets)")
    if not has_howto:   s -= 3; issues.append("no 'How to use/apply' heading")
    if not has_bestfor: s -= 2; issues.append("no 'Best for / Who it suits' heading")
    cat["snippet_aeo"] = max(0, s)

    total = round(sum(cat.values()), 1)
    passed = total >= 80 and gates["gmc_clean"] and gates["residue_clean"]
    return {
        "score": total, "pass": passed, "word_count": wc,
        "gates": gates, "categories": cat, "issues": issues,
        "hits": {
            "ai_residue": sorted(set(residue)),
            "style_slop": sorted(set(style_slop)),
        },
    }


# ── Auto-scrubber: fixes the cheap, deterministic residue before re-linting ────

_SCRUB = [
    (r"\bin conclusion,?\s*", ""), (r"\bin summary,?\s*", ""),
    (r"\boverall,?\s*", ""), (r"\bultimately,?\s*", ""),
    (r"\bit'?s (important|worth) (?:to note|noting)(?: that)?,?\s*", ""),
    (r"\brest assured,?\s*", ""), (r"\bwhen it comes to\b", "for"),
    (r"\bin today'?s world,?\s*", ""), (r"!", "."),
    (r"\byour skin will thank you\.?", ""), (r"\blook no further\.?", ""),
]

def scrub(html: str) -> str:
    out = html
    for pat, rep in _SCRUB:
        out = re.sub(pat, rep, out, flags=re.IGNORECASE)
    out = re.sub(r"[ \t]{2,}", " ", out)
    out = re.sub(r"\s+([.,])", r"\1", out)
    return out.strip()


# ── CLI ───────────────────────────────────────────────────────────────────────

def _log(rec: dict):
    p = Path(__file__).resolve().parent / "scores.jsonl"
    rec["at"] = datetime.now(timezone.utc).isoformat()
    with open(p, "a") as f:
        f.write(json.dumps(rec, ensure_ascii=False) + "\n")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--file"); ap.add_argument("--jsonl")
    ap.add_argument("--focus", default=""); ap.add_argument("--brand", default="")
    ap.add_argument("--type", default=""); ap.add_argument("--no-log", action="store_true")
    a = ap.parse_args()

    if a.jsonl:
        with open(a.jsonl) as source:
            rows = [json.loads(l) for l in source if l.strip()]
        scores = []
        pass_flags = []
        for r in rows:
            res = lint(r.get("content_html",""), r.get("focus_kw") or r.get("title",""),
                       r.get("brand",""), r.get("product_type",""))
            scores.append(res["score"])
            pass_flags.append(res["pass"])
            flag = "PASS" if res["pass"] else "FAIL"
            print(f"  [{flag}] {res['score']:5.1f}  {str(r.get('post_id','?')):>6}  {r.get('title','')[:48]}")
            if not res["pass"]:
                for i in res["issues"][:6]: print(f"           - {i}")
        if scores:
            print(f"\nMean {sum(scores)/len(scores):.1f} | min {min(scores):.1f} | "
                  f"pass {sum(pass_flags)}/{len(scores)}")
        return

    if a.file:
        with open(a.file) as source:
            html = source.read()
    else:
        html = sys.stdin.read()
    res = lint(html, a.focus, a.brand, a.type)
    print(json.dumps(res, indent=2, ensure_ascii=False))
    if not a.no_log:
        _log({"focus": a.focus, "brand": a.brand, "score": res["score"], "pass": res["pass"]})

if __name__ == "__main__":
    main()
