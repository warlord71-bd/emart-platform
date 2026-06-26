# Topical Authority Map Spec (GROW-1)

Version: 2026-06-26-v1
Status: **spec** — highest growth priority. Implementation after owner reviews scope.

## Goal
Build a GSC-led topical authority map that connects all content types into clusters, identifies coverage gaps, and generates internal-link proposals. This is the foundation for all content and authority growth work.

## Content Topology

```
                    Journal Articles
                    /              \
                  /                  \
         /best/*  ──── Concerns ──── Ingredients
            |            |               |
            v            v               v
        Products ←── Categories ←── Brands
            |                           |
            v                           v
        /compare/*              /origins/[country]
```

Each node type has:
- **Primary queries:** from GSC (what users search to find this page)
- **Internal link targets:** what this page should link to
- **Internal link sources:** what should link to this page

## Data Sources
- **GSC:** `gsc_tracker.py` daily data (queries + pages + positions)
- **Sitemap:** 4,205 URLs across all content types
- **GA4:** landing page sessions/conversions
- **Blog topics:** `blog-topic-candidates.json` from GSC tracker
- **Category map:** SEO-3 audit (50 categories, tier 1-4)

## Map Structure

### Cluster Definition
A topical cluster is a group of related pages around a core concern, ingredient, or category:

```json
{
  "cluster_id": "acne-care",
  "pillar": "/concerns/acne-blemish-care",
  "supporting_pages": [
    "/best/cleanser-oily-skin-bangladesh",
    "/category/face-cleansers",
    "/category/spot-treatment",
    "/ingredients/salicylic-acid",
    "/ingredients/niacinamide",
    "/shop/cosrx-salicylic-acid-gentle-cleanser",
    "/journal/acne-routine-for-bangladesh-humidity"
  ],
  "gsc_queries": ["best face wash for acne", "acne treatment bangladesh", ...],
  "total_impressions": 5000,
  "coverage_score": 0.7,
  "gap_pages": ["routine guide for acne-prone skin", "ingredient comparison for acne"]
}
```

### Coverage Score
- 1.0 = pillar + 3+ supporting pages + 3+ internal links between them + all pages indexed
- 0.7 = pillar exists, some supporting pages, weak internal linking
- 0.4 = pillar exists, few/no supporting pages
- 0.0 = no pillar page for this topic

## Implementation Plan

### Phase 1: Build the map (script)
- Script: `workspace/scripts/active/topical_authority_map.py`
- Input: sitemap URLs, GSC query data, category taxonomy, concern/ingredient page list
- Output: `workspace/seo/topical-authority-map.json` + `workspace/seo/topical-authority-report.md`
- Maps every URL to its cluster, calculates coverage scores, identifies gaps

### Phase 2: Internal link proposal workflow
- For each cluster with score <0.7, generate specific link proposals:
  - Which page should link to which other page
  - Suggested anchor text
  - Link direction (bidirectional where useful)
- Output: `workspace/seo/internal-link-proposals.json` → feeds into action ledger
- Owner reviews before any links are added

### Phase 3: Coverage reporting
- Weekly report showing:
  - Cluster coverage scores
  - New gaps from GSC queries without matching pages
  - Internal link health (broken links, orphan pages)
- Integration with measurement loop (GSC position/CTR changes after linking)

## Clusters to Map (Priority)
1. **Acne & Blemish Care** — high search volume in BD
2. **Sunscreen & UV Protection** — high commercial intent
3. **Brightening & Dark Spots** — strong concern page + products
4. **Anti-Aging** — growing segment
5. **Korean Beauty** — brand differentiator
6. **Hair Care** — large category, weak content
7. **Moisturizing & Hydration** — foundational skincare
8. **Cleansing** — strongest existing content (face-cleansers guide)

## Dependencies
- SEO-3 category map (✅ done)
- GSC daily data (✅ running)
- Concern/ingredient page list (✅ in codebase)
- Journal article index (blog posts from WordPress)

## No-Go Boundaries
- No satellite sites, doorway pages, or link networks
- No automated outreach without owner approval
- No content that duplicates existing pages
- All new content goes through content lifecycle contract
