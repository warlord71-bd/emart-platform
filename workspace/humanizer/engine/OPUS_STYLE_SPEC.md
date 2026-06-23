# Opus Humanizer Engine — Style Spec (the "content class")

**Purpose:** let the **Hermes agent** run any open OpenRouter model and produce
product descriptions indistinguishable from Opus-4.8 hand-written copy — ranking,
converting, GMC-safe, and free of AI residue. This doc is the *why*; the authoritative
*what* lives in `humanizer_engine.py:SYSTEM_PROMPT`, and the enforcement lives in
`residue_lint.py`.

> Prompt version: `opus-pdp-v1.0`. Bump it in `humanizer_engine.py` whenever the prompt
> changes, so `scores.jsonl` can prove each version scores higher than the last.

---

## 1. Voice (what "Opus style" means here)

An experienced Dhaka-based skincare expert explaining a product to a smart friend.
- Factual, calm, specific. Strong verbs over adjectives.
- Ingredient-led ("niacinamide helps regulate melanin transfer"), never claim-led.
- Honest: names who a product is *not* for, sets gradual-results expectations, never overpromises.
- Local without pandering: humidity, year-round UV, pollution, hard water, monsoon — used where
  it genuinely changes the advice, 1–3 times, never as filler.
- British spelling: moisturise, colour, fibre.

## 2. Required structure (vary the wording every time)

| # | Section | Form | SEO/AEO job |
|---|---------|------|-------------|
| 1 | Opening | `<p>` 60–100w | Keyword in sentence 1; first ~155 chars = meta/snippet |
| 2 | Mechanism | `<h3>` question/definition + 1–2 `<p>` | Definitional answer → FAQ rich result / answer-engine citation |
| 3 | Suitability | `<h3>` + `<ul>` (4–6) + caution line | List snippet; E-E-A-T trust (who it's *not* for) |
| 4 | How to use | `<h3>` + `<ol>` (4–5 steps) incl. sunscreen | HowTo structured-data shape; cross-sell SPF |
| 5 | Closing | `<h3>` + `<p>` | Honest expectations + climate tie-in; dwell-time |

**Only** `<p> <h3> <ul> <ol> <li>`. Never `<h1>/<h2>` — the page owns them. 500–750 words.
The disclaimer is appended by code (`DB.DISCLAIMER`) — do **not** write one.

## 3. Keyword logic

- Focus keyword: sentence 1, **exactly one** `<h3>`, 3–5× total. Never stuffed (>7× is flagged).
- 1–2 long-tail variants: `"<type> for <concern> in Bangladesh"`.
- Semantic depth: ingredient names, concerns, skin types, routine terms (AM/PM, layering).
- Brand named 1–2× as an entity.

## 4. Snippet / AEO logic

- Mechanism heading is a question; the next sentence is a 40–60w self-contained definition that
  can be quoted with zero context (`"<Product> is a <category> that <does X> using <ingredient>."`).
- `<ul>` → list snippets; `<ol>` → HowTo; question `<h3>` → People-Also-Ask.
- Every claim stands alone and factual so generative engines can cite it (GEO/AEO standing rule —
  see `SEO_MASTER.md`).

## 5. Schema compatibility

The PDP already emits **Product + FAQ JSON-LD**. The engine writes **no** schema and **no** FAQ
block — it only keeps the prose schema-*friendly* (definitional sentences, ordered steps). The first
~155 characters serve as the meta description / SERP snippet.

## 6. On-page / off-page

- **On-page:** front-load value, short paragraphs (mobile-first BD audience), scannable lists,
  descriptive keyword-aware headings, internal cross-references to complementary product types
  (toner, serum, sunscreen) that support internal linking and basket-building.
- **Off-page (earned):** copy can't build links directly, but accurate, genuinely useful, honest
  copy earns shares, citations, and answer-engine references. E-E-A-T = experience + expertise +
  trust, demonstrated through correct mechanisms, practical local tips, and honest limitations.

## 7. GMC safety (hard requirement)

**Never:** treats, cures, heals, prescription, clinically proven, medically proven, miracle
(even negated — "not a miracle" still trips scanners), anti-aging miracle, reverses aging,
repairs damage, eliminates, removes wrinkles, whitens, bleaches, 100% effective, guaranteed,
permanent results, FDA-approved.
**Use:** helps, supports, works to, the appearance/look of, brightens, evens, soothes, hydrates,
calms, may.

## 8. AI-residue ban (the human test)

Banned tells (full regex list in `residue_lint.py:AI_RESIDUE`): delve, dive into, unlock, unleash,
elevate, harness the power, realm, tapestry, testament to, boasts, nestled, game-changer,
cutting-edge, look no further, say goodbye to, "your skin will thank you", "in today's world",
"when it comes to", "in conclusion/summary", "overall", "it's worth noting", "rest assured",
"whether you're", "not only…but also", "a must-have", "holy grail", "secret weapon",
"transform your", revolutionise, supercharge, "to the next level", "packed with", "some products…",
"once you try". **No exclamation marks. Em-dashes ≤ ~2 per 100 words.** Vary sentence length and
section openers.

## 9. The scoring gate (0–100)

`residue_lint.lint()` scores 7 categories and enforces two **hard gates**. A row is `PASS` only when
**total ≥ 80 AND gmc_clean AND residue_clean**.

| Category | Pts | Category | Pts |
|----------|----:|----------|----:|
| AI residue | 25 | Localization | 5 |
| GMC safety | 20 | Length | 10 |
| Keyword/SEO | 15 | Snippet/AEO | 10 |
| Structure | 15 | | |

Calibration on Opus-4.8 hand-written copy: clean exemplars score **89–96**; the gate caught a real
live `miracle` GMC slip and several short/em-dash-heavy drafts — i.e. it holds Opus itself to account.

## 10. Self-improvement loop

1. Every generation appends `{post_id, score, pass, model, prompt_version}` to `scores.jsonl`.
2. Compare mean score across `prompt_version`s and across models — keep what wins.
3. When a recurring failure pattern appears (e.g. keyword never in `<h3>`), tighten `SYSTEM_PROMPT`,
   bump `PROMPT_VERSION`, and confirm the next batch's mean rises.
4. Promote new high scorers (≥ 92, PASS) into `exemplars.jsonl` so few-shot quality compounds.
