"""
Product data normalization — one rule set for name-splitting, price formatting,
origin extraction, and category chip generation.

Extracted from social_image_gen.py._extract_product_data + split_product_name,
merged with product_hero_card.py.split_name. Uses the unified rules below.
"""
from __future__ import annotations
import html, re
from dataclasses import dataclass, field


def esc(value) -> str:
    return html.escape(html.unescape(str(value or "")), quote=True)


@dataclass
class ProductData:
    product_id: int = 0
    name: str = ""
    brand: str = ""
    origin: str = ""
    slug: str = ""
    image_url: str = ""
    price: str = ""
    regular_price: str = ""
    sale_price: str = ""
    price_display: str = ""
    old_price_html: str = ""
    save_html: str = ""
    save_amount: int = 0
    title_line1: str = ""
    title_line2: str = ""
    size: str = ""
    container_type: str = "general"
    container_confidence: float = 0.4
    cat_slugs: set = field(default_factory=set)
    chips: list = field(default_factory=list)
    chips_html: str = ""


def split_name(name: str) -> tuple[str, str, str]:
    m = re.search(r"(\d+\s*(?:ml|g|gm|oz|pcs|kg|l))\b", name, re.I)
    size = m.group(1).upper() if m else ""
    clean = name.replace(m.group(0), "").strip() if m else name
    words = clean.split()
    mid = max(2, len(words) // 2)
    return " ".join(words[:mid]).strip(), " ".join(words[mid:]).strip(), size


def classify_container(name: str, cat_slugs: set[str]) -> tuple[str, float]:
    """Classify product packaging shape for layout decisions.

    This is intentionally heuristic: product feeds rarely carry a packaging type,
    but name/category signals are strong enough to choose safer image framing.
    """
    text = f"{name} {' '.join(sorted(cat_slugs))}".lower()
    rules: list[tuple[str, float, tuple[str, ...]]] = [
        ("pouch", 0.9, ("pouch", "sachet", "refill", "refill pack", "sample pack")),
        ("sheet_pack", 0.88, ("sheet mask", "mask sheet", "sheet-mask", "patch", "pads", "pad ", "cotton pad")),
        ("compact", 0.86, ("cushion", "compact", "palette", "powder", "blush", "eyeshadow", "lipstick", "tint", "mascara", "liner", "pencil")),
        ("box", 0.82, ("set", "kit", "combo", "box", "gift", "bundle")),
        ("dropper", 0.86, ("dropper", "serum", "ampoule", "essence", "oil", "booster")),
        ("tube", 0.84, ("tube", "sunscreen", "sun cream", "sun gel", "relief sun", "spf", "pa++++", "foam", "cleanser", "gel cleanser", "hand cream", "bb cream", "cc cream")),
        ("tall_bottle", 0.86, ("bottle", "toner", "mist", "lotion", "emulsion", "shampoo", "conditioner", "body wash", "cleanser", "water", "milk")),
        ("jar", 0.86, ("jar", "cream", "moisturizer", "moisturiser", "balm", "sleeping mask", "sleeping pack", "pot", "tub", "gel cream")),
    ]
    for shape, confidence, needles in rules:
        if any(needle in text for needle in needles):
            return shape, confidence
    if any(unit in text for unit in ("150ml", "200ml", "250ml", "300ml", "400ml", "500ml")):
        return "tall_bottle", 0.65
    if any(unit in text for unit in ("10g", "15g", "20g", "25g", "30g", "40g", "50g", "60g")):
        return "jar", 0.58
    return "general", 0.4


def normalize(product: dict) -> ProductData:
    name = product.get("name", "")
    brand = ""
    if product.get("brands"):
        brand = product["brands"][0].get("name", "")

    origin = ""
    for attr in product.get("attributes", []):
        if attr.get("name", "").lower() in ("origin", "pa_origin") and attr.get("options"):
            origin = attr["options"][0]

    price = product.get("price", "")
    regular = product.get("regular_price", "")
    sale = product.get("sale_price", "")

    old_html = save_html = ""
    save_amount = 0
    if sale and regular and sale != regular:
        try:
            save_amount = int(float(regular)) - int(float(sale))
            old_html = f'<div class="old-price">{int(float(regular))}</div>'
            save_html = f'<div class="save-badge">SAVE {save_amount} TAKA</div>'
        except (ValueError, TypeError):
            pass
        price = sale

    try:
        price_display = str(int(float(price)))
    except (ValueError, TypeError):
        price_display = str(price)

    cat_slugs = set()
    chips = []
    skip_chips = {"Korean Beauty", "Japanese Beauty", "Uncategorized"}
    for cat in product.get("categories", []):
        cat_slugs.add(cat.get("slug", ""))
        if cat.get("name") not in skip_chips and len(chips) < 3:
            chips.append(cat["name"])

    chips_html = "\n".join(f'<span class="pill">{esc(c)}</span>' for c in chips)
    image_url = product["images"][0]["src"] if product.get("images") else ""
    line1, line2, size = split_name(name)
    container_type, container_confidence = classify_container(name, cat_slugs)
    if product.get("container_type"):
        container_type = str(product["container_type"]).strip().lower().replace("-", "_").replace(" ", "_")
        container_confidence = 1.0

    return ProductData(
        product_id=product.get("id", 0),
        name=name,
        brand=brand,
        origin=origin,
        slug=product.get("slug", ""),
        image_url=image_url,
        price=price,
        regular_price=regular,
        sale_price=sale,
        price_display=price_display,
        old_price_html=old_html,
        save_html=save_html,
        save_amount=save_amount,
        title_line1=line1,
        title_line2=line2,
        size=size,
        container_type=container_type,
        container_confidence=container_confidence,
        cat_slugs=cat_slugs,
        chips=chips,
        chips_html=chips_html,
    )
