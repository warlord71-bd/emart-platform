"""
Creative Asset Engine — single public entrypoint.

    from creative_engine.api import render, CreativeRequest
    result = render(CreativeRequest(product_id=26134, format="post_1x1"))
"""
from __future__ import annotations
import base64, os
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

from .tokens.brand import (
    GOLD, ROSE, WINE, INK, SOFT, SOFT_ROSE, FONT, FONT_SOCIAL,
    GOOGLE_FONT_IMPORT, BRAND_NAME, BRAND_TAGLINE, BRAND_FOOTER,
    BRAND_URL, COD_LABEL, CURRENCY_SYMBOL, CURRENCY_LABEL,
    KICKER_DEFAULT, KICKER_BANGLA, ORIGIN_FLAGS, FORMATS,
    VERSION, logo_data_uri,
)
from .data.product_source import fetch_product
from .data.normalize import normalize, esc, ProductData
from .data.backgrounds import (
    remove_bg, image_to_data_uri, generate_ai_image,
    is_small_product, get_bg_prompt, get_model_prompt, get_gradient_fallback,
)
from .render import screenshot


@dataclass
class CreativeRequest:
    product_id: int | None = None
    product: dict | None = None
    format: str = "post_1x1"
    variant: str = "studio"
    badge: str = "SHOP NOW"
    background: str = "studio_ai"
    background_file: str | None = None
    image_override: str | None = None  # URL or local path — replaces WC product image
    locale: str = "en"
    value_spec: dict | None = None
    qa: bool = True
    render_scale: int = 2
    out: str | None = None
    product_cutout: bool = False


@dataclass
class CreativeResult:
    asset_path: str
    width: int
    height: int
    format: str
    variant: str
    product_snapshot: dict = field(default_factory=dict)
    motion_manifest: dict | None = None
    qa_report: dict = field(default_factory=lambda: {"passed": True, "issues": []})
    render_scale: int = 2
    tokens_version: str = VERSION


DEFAULT_OUTPUT_DIR = Path("workspace/audit/active/social")


def _product_data(req: CreativeRequest) -> ProductData:
    raw = req.product or (fetch_product(req.product_id) if req.product_id is not None else {"id": 0, "name": "Emart Skincare"})
    d = normalize(raw)
    if req.image_override:
        d.image_url = req.image_override
    return d


def _price_value(value: str) -> int | None:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def _taka(value: str) -> str:
    amount = _price_value(value)
    return f"{CURRENCY_SYMBOL}{amount}" if amount is not None else esc(value)


def _product_image_data_uri(d: ProductData, cutout: bool = False) -> str:
    if not d.image_url:
        return ""
    if cutout:
        try:
            local_path = remove_bg(d.image_url)
            try:
                return image_to_data_uri(local_path)
            finally:
                Path(local_path).unlink(missing_ok=True)
        except Exception:
            pass
    return image_to_data_uri(d.image_url)


def _shape_class(d: ProductData) -> str:
    safe = "".join(ch if ch.isalnum() or ch == "_" else "_" for ch in (d.container_type or "general").lower())
    return f"shape-{safe}"


def _vertical_base_css(w: int, h: int) -> str:
    return f"""
@import url('{GOOGLE_FONT_IMPORT}');
*{{margin:0;padding:0;box-sizing:border-box;}}
html,body{{width:{w}px;height:{h}px;overflow:hidden;font-family:{FONT};color:#fff;
  background:
    radial-gradient(circle at 70% 16%, rgba(231,178,74,.35), transparent 28%),
    linear-gradient(160deg,{ROSE} 0%,{WINE} 48%,{INK} 100%);}}
"""


def _compose_hero_vertical(d: ProductData, fmt: dict, req: CreativeRequest) -> str:
    w, h = fmt["width"], fmt["height"]
    logo = logo_data_uri()
    product_img = _product_image_data_uri(d, cutout=req.product_cutout)
    shape_class = _shape_class(d)
    logo_block = f'<img class="logo-img" src="{logo}" alt="{BRAND_NAME} logo">' if logo else f'<div class="logo-text">{BRAND_NAME}</div>'
    title = d.title_line1 or d.name
    sub = d.title_line2
    badge = req.badge or "Daily Pick"
    bangla = (req.value_spec or {}).get("bangla") or ""
    if req.locale == "bn" and not bangla:
        bangla = f"অরিজিনাল {d.brand or title.split()[0] if title else 'স্কিনকেয়ার'} এখন Emart-এ"
    old_amount = _price_value(d.regular_price)
    price_amount = _price_value(d.price)
    offer = ""
    if old_amount and price_amount and old_amount > price_amount:
        offer = f'<span class="old">{CURRENCY_SYMBOL}{old_amount}</span><span class="save">{CURRENCY_SYMBOL}{old_amount - price_amount} সাশ্রয়</span>'
    price_block = f'<div class="price"><span>{_taka(d.price)}</span>{offer}<b>COD</b></div>' if d.price else ""
    size_block = f'<div class="size">{esc(d.size)}</div>' if d.size else ""
    bangla_block = f'<div class="bn">{esc(bangla)}</div>' if bangla else ""

    return f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>
{_vertical_base_css(w, h)}
.hero-bottom-fill{{position:absolute;left:0;right:0;top:1410px;bottom:0;z-index:0;
  background:
    radial-gradient(circle at 24% 18%, rgba(231,178,74,.14), transparent 25%),
    radial-gradient(circle at 78% 30%, rgba(255,255,255,.07), transparent 24%),
    linear-gradient(180deg, rgba(42,10,24,0), rgba(42,10,24,.38) 34%, rgba(25,8,13,.88) 100%);}}
.hero-bottom-fill::before{{content:"";position:absolute;left:58px;right:58px;top:80px;height:1px;
  background:linear-gradient(90deg,transparent,rgba(231,178,74,.42),transparent);}}
.wrap{{position:absolute;inset:0;padding:58px 58px 62px;z-index:1;}}
.top{{display:flex;justify-content:space-between;align-items:flex-start;gap:28px;}}
.brand{{display:flex;align-items:center;gap:14px;background:rgba(255,255,255,.12);
  border:1px solid rgba(255,255,255,.18);border-radius:22px;padding:10px 18px 10px 10px;}}
.logo-img{{width:70px;height:70px;border-radius:18px;box-shadow:0 8px 22px rgba(0,0,0,.28);}}
.logo-text{{font-size:34px;font-weight:900;}}
.brand strong{{display:block;font-size:28px;line-height:1;font-weight:900;}}
.brand span{{display:block;font-size:12px;text-transform:uppercase;color:{SOFT_ROSE};font-weight:800;margin-top:5px;}}
.badge{{background:{GOLD};color:{INK};font-size:28px;font-weight:900;border-radius:16px;
  padding:12px 22px;text-transform:uppercase;letter-spacing:.5px;}}
.copy{{position:absolute;top:176px;left:58px;right:58px;text-align:center;z-index:3;}}
.kicker{{font-size:26px;font-weight:900;color:{GOLD};letter-spacing:3px;text-transform:uppercase;margin-bottom:12px;}}
.title{{font-size:64px;line-height:1.10;font-weight:900;text-shadow:0 8px 24px rgba(0,0,0,.32);
  overflow-wrap:anywhere;word-break:break-word;}}
.sub{{font-size:38px;line-height:1.20;font-weight:800;color:{SOFT};margin-top:12px;
  overflow-wrap:anywhere;word-break:break-word;}}
.size{{display:inline-block;margin-top:20px;border:2px solid rgba(255,255,255,.72);border-radius:12px;
  padding:7px 18px;font-size:28px;font-weight:900;}}
.product-stage{{position:absolute;left:58px;right:58px;top:450px;height:700px;border-radius:36px;
  background:linear-gradient(180deg,rgba(255,255,255,.94),rgba(255,248,238,.84));
  box-shadow:0 34px 90px rgba(0,0,0,.35);overflow:hidden;}}
.product-stage::before{{content:"";position:absolute;inset:auto 70px 70px;height:112px;border-radius:50%;
  background:radial-gradient(ellipse, rgba(159,18,57,.28), rgba(159,18,57,0) 68%);filter:blur(8px);}}
.product-stage img{{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  max-width:92%;max-height:92%;object-fit:contain;filter:drop-shadow(0 26px 36px rgba(0,0,0,.24));}}
.product-stage.shape-tall_bottle img,.product-stage.shape-dropper img{{height:90%;width:auto;max-width:66%;max-height:96%;}}
.product-stage.shape-tube img{{max-width:66%;max-height:92%;}}
.product-stage.shape-jar img{{max-width:76%;max-height:66%;}}
.product-stage.shape-compact img{{max-width:78%;max-height:58%;}}
.product-stage.shape-sheet_pack img,.product-stage.shape-box img,.product-stage.shape-pouch img{{max-width:86%;max-height:74%;}}
.bn{{position:absolute;left:76px;right:76px;top:1186px;text-align:center;font-size:34px;
  font-weight:800;line-height:1.32;color:#fff;}}
.price{{position:absolute;left:76px;right:76px;top:1262px;display:flex;align-items:center;
  justify-content:center;gap:22px;flex-wrap:wrap;}}
.price span:first-child{{font-size:76px;font-weight:900;color:{GOLD};text-shadow:0 8px 24px rgba(0,0,0,.32);}}
.old{{font-size:44px!important;color:{SOFT_ROSE}!important;text-decoration:line-through;text-shadow:none!important;}}
.save{{font-size:28px!important;color:#fff!important;background:rgba(255,255,255,.14);border-radius:24px;
  padding:8px 18px;text-shadow:none!important;}}
.price b{{font-size:30px;color:{INK};background:{GOLD};border-radius:14px;padding:9px 18px;}}
.foot{{position:absolute;left:58px;right:58px;top:1370px;display:flex;align-items:center;
  justify-content:space-between;color:{SOFT_ROSE};font-size:28px;font-weight:800;}}
.url{{color:{GOLD};font-size:34px;letter-spacing:1px;}}
</style></head><body><div class="hero-bottom-fill"></div><div class="wrap">
  <div class="top"><div class="brand">{logo_block}<div><strong>{BRAND_NAME}</strong><span>{BRAND_TAGLINE}</span></div></div><div class="badge">{esc(badge)}</div></div>
  <div class="copy"><div class="kicker">{KICKER_DEFAULT}</div><div class="title">{esc(title)}</div><div class="sub">{esc(sub)}</div>{size_block}</div>
  <div class="product-stage {shape_class}">{f'<img src="{product_img}" alt="product">' if product_img else ''}</div>
  {bangla_block}
  {price_block}
  <div class="foot"><span>{BRAND_FOOTER}</span><span class="url">{BRAND_URL}</span></div>
</div></body></html>"""


def _compose_scene_value(d: ProductData, fmt: dict, req: CreativeRequest) -> str:
    w, h = fmt["width"], fmt["height"]
    spec = req.value_spec or {}
    kicker = spec.get("kicker") or KICKER_BANGLA
    title = spec.get("title") or d.name or "Skincare tips"
    bullets = [str(b) for b in (spec.get("bullets") or [])][:6]
    if not bullets:
        bullets = ["ত্বকের চাহিদা বুঝে ব্যবহার করুন", "দিনে SPF ব্যবহার করুন", "প্যাচ টেস্ট করে নিন"]
    style = spec.get("style", "numbered")
    footer = spec.get("footer") or f"{BRAND_URL} · COD"
    footer = footer.strip()
    if footer.upper().startswith(BRAND_URL.upper()):
        footer = footer[len(BRAND_URL):].strip(" ·|-")
    footer = footer or "COD"
    logo = logo_data_uri()
    logo_block = f'<img class="logoimg" src="{logo}" alt="{BRAND_NAME} logo">' if logo else f'<span class="logo">{BRAND_NAME}</span>'
    count = len(bullets)
    compact = count >= 5
    title_size = 58 if compact else 68
    title_margin = 34 if compact else 54
    row_gap = 18 if compact else 34
    row_pad_y = 20 if compact else 28
    row_pad_x = 28 if compact else 34
    mark_size = 68 if compact else 84
    mark_font = 34 if compact else 44
    text_size = 38 if compact else 46
    rows = []
    for i, bullet in enumerate(bullets, 1):
        mark = str(i) if style == "numbered" else ("✓" if style == "check" else "•")
        rows.append(f'<div class="row"><div class="mark">{mark}</div><div class="txt">{esc(bullet)}</div></div>')

    return f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>
{_vertical_base_css(w, h)}
.bottom-fill{{position:absolute;left:0;right:0;top:1410px;bottom:0;z-index:0;
  background:
    radial-gradient(circle at 18% 20%, rgba(231,178,74,.16), transparent 26%),
    radial-gradient(circle at 82% 38%, rgba(255,255,255,.08), transparent 24%),
    linear-gradient(180deg, rgba(42,10,24,0), rgba(42,10,24,.42) 32%, rgba(25,8,13,.86) 100%);}}
.bottom-fill::before{{content:"";position:absolute;left:78px;right:78px;top:88px;height:1px;
  background:linear-gradient(90deg,transparent,rgba(231,178,74,.45),transparent);}}
.wrap{{position:absolute;inset:0;padding:112px 78px 0;display:flex;flex-direction:column;z-index:1;}}
.kicker{{align-self:flex-start;font-size:32px;font-weight:800;letter-spacing:3px;color:{INK};
  background:{GOLD};border-radius:14px;padding:10px 26px;margin-bottom:30px;}}
.title{{font-size:{title_size}px;font-weight:900;line-height:1.18;margin-bottom:{title_margin}px;overflow-wrap:anywhere;word-break:break-word;}}
.rows{{display:flex;flex-direction:column;gap:{row_gap}px;}}
.row{{display:flex;align-items:center;gap:24px;
  background:rgba(255,255,255,0.11);border:1px solid rgba(255,255,255,0.22);
  border-radius:22px;padding:{row_pad_y}px {row_pad_x}px;box-shadow:0 12px 34px rgba(0,0,0,.16);}}
.mark{{flex:0 0 {mark_size}px;height:{mark_size}px;border-radius:50%;background:{GOLD};color:{INK};
  font-size:{mark_font}px;font-weight:900;display:flex;align-items:center;justify-content:center;
  box-shadow:0 10px 24px rgba(0,0,0,.24);}}
.txt{{font-size:{text_size}px;font-weight:800;line-height:1.25;overflow-wrap:anywhere;word-break:break-word;}}
.foot{{position:absolute;left:78px;right:78px;top:1248px;display:flex;align-items:center;justify-content:space-between;gap:28px;
  min-height:156px;padding:18px 26px;background:rgba(42,10,24,.72);
  border:1px solid rgba(255,255,255,.18);border-radius:32px;box-shadow:0 18px 46px rgba(0,0,0,.32);}}
.foot .logoimg{{width:132px;height:132px;border-radius:28px;box-shadow:0 14px 34px rgba(0,0,0,.36);}}
.foot .logo{{font-weight:900;letter-spacing:2px;color:#fff;font-size:42px;}}
.footcopy{{display:flex;flex-direction:column;align-items:flex-end;gap:8px;text-align:right;}}
.domain{{font-size:46px;line-height:1;font-weight:900;color:{GOLD};letter-spacing:1px;text-transform:uppercase;}}
.codline{{font-size:30px;line-height:1.2;font-weight:800;color:#fff;}}
.trust{{font-size:24px;line-height:1.2;font-weight:700;color:{SOFT_ROSE};}}
</style></head><body><div class="bottom-fill"></div><div class="wrap">
<div class="kicker">{esc(kicker)}</div>
<div class="title">{esc(title)}</div>
<div class="rows">{''.join(rows)}</div>
<div class="foot">{logo_block}<div class="footcopy"><div class="domain">{BRAND_URL}</div><div class="codline">{esc(footer)}</div><div class="trust">{BRAND_FOOTER}</div></div></div>
</div></body></html>"""


def _compose_scene_brand_end(d: ProductData, fmt: dict, req: CreativeRequest) -> str:
    w, h = fmt["width"], fmt["height"]
    spec = req.value_spec or {}
    product = spec.get("product") or d.name or "Emart Skincare"
    bangla = spec.get("bangla") or ""
    url = spec.get("url") or BRAND_URL
    logo = logo_data_uri()
    product_img = _product_image_data_uri(d, cutout=req.product_cutout)
    product_block = f'<div class="product-mini"><img src="{product_img}" alt="product"></div>' if product_img else ""
    logo_block = f'<img class="logo" src="{logo}" alt="{BRAND_NAME} logo">' if logo else f'<div class="logotext">{BRAND_NAME}</div>'
    old_amount = _price_value(d.regular_price)
    price_amount = _price_value(d.price)
    has_offer = bool(old_amount and price_amount and old_amount > price_amount)
    if d.price:
        orig = f'<span class="orig">{CURRENCY_SYMBOL}{old_amount}</span>' if has_offer else ""
        save = f'<div class="save">{CURRENCY_SYMBOL}{old_amount - price_amount} সাশ্রয়</div>' if has_offer else ""
        label = "অফার মূল্য" if has_offer else "মূল্য"
        price_block = f'<div class="offerlabel">{label}</div><div class="pricerow"><span class="offer">{_taka(d.price)}</span>{orig}<span class="cod">COD</span></div>{save}'
    else:
        price_block = ""
    bangla_block = f'<div class="bn">{esc(bangla)}</div>' if bangla else ""

    return f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>
{_vertical_base_css(w, h)}
.wrap{{position:absolute;inset:0;padding:78px 72px 96px;display:flex;flex-direction:column;}}
.top{{display:flex;align-items:center;justify-content:space-between;gap:28px;}}
.brandmark{{display:flex;align-items:center;gap:18px;background:rgba(255,255,255,.12);
  border:1px solid rgba(255,255,255,.18);border-radius:26px;padding:12px 22px 12px 12px;}}
.logo{{width:86px;height:86px;border-radius:22px;box-shadow:0 12px 34px rgba(0,0,0,0.38);}}
.logotext{{font-size:38px;font-weight:900;letter-spacing:1px;color:#fff;}}
.brandcopy strong{{display:block;font-size:36px;line-height:1;font-weight:900;color:#fff;}}
.brandcopy span{{display:block;margin-top:6px;font-size:15px;text-transform:uppercase;font-weight:800;color:{SOFT_ROSE};}}
.badge{{background:{GOLD};color:{INK};border-radius:18px;padding:12px 22px;font-size:26px;font-weight:900;letter-spacing:1px;}}
.main{{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:22px 10px 330px;}}
.rule{{width:108px;height:5px;background:{GOLD};border-radius:3px;margin:0 auto 28px;}}
.product-mini{{width:230px;height:230px;border-radius:34px;margin:0 auto 30px;
  display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,rgba(255,255,255,.92),rgba(255,248,238,.80));
  box-shadow:0 24px 58px rgba(0,0,0,.34), inset 0 0 0 1px rgba(255,255,255,.42);}}
.product-mini img{{max-width:78%;max-height:88%;object-fit:contain;filter:drop-shadow(0 18px 24px rgba(0,0,0,.25));}}
.product{{font-size:58px;font-weight:900;line-height:1.16;margin-bottom:24px;max-width:880px;}}
.bn{{font-size:38px;font-weight:700;color:{SOFT_ROSE};line-height:1.35;margin-bottom:42px;max-width:820px;}}
.offerlabel{{font-size:30px;font-weight:800;letter-spacing:4px;color:{GOLD};
  text-transform:uppercase;margin-bottom:10px;}}
.pricerow{{display:flex;align-items:center;justify-content:center;gap:24px;margin-bottom:14px;}}
.offer{{font-size:96px;font-weight:900;color:{GOLD};}}
.orig{{font-size:50px;font-weight:700;color:{SOFT_ROSE};text-decoration:line-through;opacity:.85;}}
.cod{{font-size:30px;font-weight:800;color:{INK};background:{GOLD};border-radius:14px;
  padding:8px 20px;letter-spacing:1px;}}
.save{{font-size:32px;font-weight:800;color:#fff;background:rgba(255,255,255,0.16);
  border-radius:30px;padding:8px 26px;margin-bottom:46px;display:inline-block;}}
.url{{font-size:52px;font-weight:900;letter-spacing:1px;color:{GOLD};}}
.tag{{font-size:30px;font-style:italic;color:{SOFT_ROSE};margin-top:16px;}}
.foot{{position:absolute;left:56px;right:56px;top:1352px;height:64px;box-sizing:border-box;
  display:flex;align-items:flex-start;justify-content:space-between;
  gap:18px;font-size:22px;line-height:1.2;font-weight:800;color:{SOFT_ROSE};padding-top:14px;
  border-top:1px solid rgba(255,255,255,.18);}}
.foot span{{min-width:0;flex:1;white-space:nowrap;}}
.foot span:last-child{{text-align:right;}}
</style></head><body><div class="wrap">
<div class="top"><div class="brandmark">{logo_block}<div class="brandcopy"><strong>{BRAND_NAME}</strong><span>{BRAND_TAGLINE}</span></div></div><div class="badge">ORIGINAL · COD</div></div>
<div class="main"><div class="rule"></div>
{product_block}
<div class="product">{esc(product)}</div>
{bangla_block}
{price_block}
<div class="url">{esc(url)}</div>
<div class="tag">{BRAND_FOOTER}</div>
</div></div><div class="foot"><span>Original product</span><span>Cash on Delivery</span></div></body></html>"""


def _compose_blog_og(d: ProductData, fmt: dict, req: CreativeRequest) -> str:
    w, h = fmt["width"], fmt["height"]
    spec = req.value_spec or {}
    title = spec.get("title") or d.name or "Skincare Guide"
    badge = spec.get("badge") or "SKINCARE GUIDE"
    logo = logo_data_uri()
    product_img = _product_image_data_uri(d)
    shape_class = _shape_class(d)
    logo_block = f'<img class="logo" src="{logo}" alt="{BRAND_NAME} logo">' if logo else f'<div class="logo-text">{BRAND_NAME}</div>'
    image_block = f'<img class="product" src="{product_img}" alt="product">' if product_img else ""

    return f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@import url('{GOOGLE_FONT_IMPORT}');
*{{margin:0;padding:0;box-sizing:border-box;}}
html,body{{width:{w}px;height:{h}px;overflow:hidden;font-family:{FONT};color:#fff;
  background:linear-gradient(135deg,{ROSE} 0%,{WINE} 54%,{INK} 100%);}}
.wrap{{position:absolute;inset:0;padding:58px 64px;display:grid;grid-template-columns:1.15fr .85fr;gap:34px;align-items:center;}}
.copy{{min-width:0;}}
.badge{{display:inline-block;background:{GOLD};color:{INK};font-size:24px;font-weight:900;letter-spacing:2px;border-radius:14px;padding:10px 20px;margin-bottom:26px;}}
.headline{{font-size:66px;line-height:1.08;font-weight:900;letter-spacing:0;text-shadow:0 8px 24px rgba(0,0,0,.32);}}
.sub{{font-size:29px;font-weight:700;color:{SOFT_ROSE};margin-top:24px;}}
.stage{{height:500px;border-radius:34px;background:linear-gradient(180deg,rgba(255,255,255,.94),rgba(255,248,238,.82));
  display:flex;align-items:center;justify-content:center;box-shadow:0 28px 70px rgba(0,0,0,.34);overflow:hidden;}}
.product{{max-width:88%;max-height:84%;object-fit:contain;filter:drop-shadow(0 26px 32px rgba(0,0,0,.25));}}
.stage.shape-tall_bottle .product,.stage.shape-dropper .product{{max-width:58%;max-height:88%;}}
.stage.shape-tube .product{{max-width:68%;max-height:86%;}}
.stage.shape-jar .product{{max-width:76%;max-height:66%;}}
.stage.shape-compact .product{{max-width:78%;max-height:60%;}}
.stage.shape-sheet_pack .product,.stage.shape-box .product,.stage.shape-pouch .product{{max-width:86%;max-height:76%;}}
.brand{{position:absolute;left:64px;bottom:42px;display:flex;align-items:center;gap:16px;color:{SOFT_ROSE};font-size:26px;font-weight:800;}}
.logo{{width:70px;height:70px;border-radius:18px;box-shadow:0 8px 22px rgba(0,0,0,.28);}}
.logo-text{{font-size:34px;font-weight:900;color:#fff;}}
.url{{position:absolute;right:64px;bottom:40px;color:{GOLD};font-size:28px;font-weight:900;letter-spacing:1px;
  background:rgba(42,10,24,.55);border-radius:12px;padding:8px 14px;}}
</style></head><body><div class="wrap">
<div class="copy"><div class="badge">{esc(badge)}</div><div class="headline">{esc(title)}</div><div class="sub">{BRAND_FOOTER}</div></div>
<div class="stage {shape_class}">{image_block}</div>
</div><div class="brand">{logo_block}<span>{BRAND_NAME} {BRAND_TAGLINE}</span></div><div class="url">{BRAND_URL}</div></body></html>"""


def _motion_manifest(req: CreativeRequest, d: ProductData, w: int, h: int) -> dict | None:
    if req.format not in ("hero_vertical", "scene_value", "scene_brand_end"):
        return None
    return {
        "focal_point": [w // 2, int(h * 0.55)],
        "safe_zones": {"hook": 58, "benefit": 68, "cta": 76},
        "caption_free_regions": [[0, 0, w, int(h * 0.28)], [0, int(h * 0.70), w, h]],
        "container_type": d.container_type,
        "suggested_motion": "static_card" if req.format.startswith("scene_") else "ken_burns_in",
        "duration_hint_s": 3.2 if req.format == "hero_vertical" else 2.6,
    }


def _compose_post(d: ProductData, fmt: dict, req: CreativeRequest) -> str:
    """Compose a social post (1x1 or 4x5) — same visual system, different canvas."""
    w, h = fmt["width"], fmt["height"]
    logo = logo_data_uri()
    force_composite = req.variant != "model-scene"
    is_small = not force_composite and is_small_product(d.name, d.cat_slugs)

    if is_small:
        return _compose_model_scene(d, w, h, logo, req)
    else:
        return _compose_composite(d, w, h, logo, req)


def _compose_model_scene(d: ProductData, w: int, h: int, logo: str, req: CreativeRequest) -> str:
    prompt = get_model_prompt(d.cat_slugs)
    bg_path = f"/tmp/creative_model_{d.product_id}.png"
    generate_ai_image(prompt, bg_path, seed=d.product_id)
    with open(bg_path, "rb") as f:
        bg_b64 = base64.b64encode(f.read()).decode()
    Path(bg_path).unlink(missing_ok=True)
    bg_css = f"url(data:image/png;base64,{bg_b64}) center/cover no-repeat"

    return f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@import url('{GOOGLE_FONT_IMPORT}');
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ width:{w}px; height:{h}px; font-family:{FONT_SOCIAL}; overflow:hidden; position:relative;
  background: {bg_css}; }}
.overlay {{ position:absolute; inset:0;
  background: linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.0) 30%, rgba(0,0,0,0.0) 60%, rgba(0,0,0,0.3) 80%, rgba(0,0,0,0.6) 100%); }}
.brand-logo {{ position:absolute; top:34px; left:38px;
  display:flex; align-items:center; gap:12px;
  padding:8px 14px 8px 8px; border-radius:20px;
  background:rgba(255,255,255,0.18); border:1px solid rgba(255,255,255,0.28);
  backdrop-filter:blur(8px); box-shadow:0 8px 24px rgba(0,0,0,0.26); }}
.brand-logo img {{ width:58px; height:58px; border-radius:16px; display:block;
  box-shadow:0 4px 14px rgba(0,0,0,0.24); }}
.brand-lockup {{ display:flex; flex-direction:column; gap:2px; }}
.brand-lockup strong {{ font-size:24px; line-height:1; font-weight:900; color:white;
  text-shadow:0 2px 9px rgba(0,0,0,0.78); }}
.brand-lockup span {{ font-size:10px; line-height:1.1; font-weight:800; color:rgba(255,255,255,0.84);
  text-transform:uppercase; letter-spacing:0.8px; text-shadow:0 2px 6px rgba(0,0,0,0.68); }}
.product-name {{ position:absolute; top:38px; right:42px; text-align:right; max-width:500px;
  font-size:28px; font-weight:800; color:white; line-height:1.3;
  text-shadow: 0 2px 10px rgba(0,0,0,0.8); }}
.price-area {{ position:absolute; bottom:94px; left:42px; max-width:420px; }}
.old-price {{ font-size:34px; font-weight:800; color:rgba(255,255,255,0.6);
  text-decoration:line-through; text-decoration-color:#e53e3e; text-decoration-thickness:3px; }}
.new-price {{ font-size:92px; font-weight:900; color:{GOLD}; line-height:.95;
  text-shadow: 0 4px 16px rgba(0,0,0,0.8); }}
.taka {{ font-size:42px; font-weight:800; color:{GOLD};
  text-shadow: 0 3px 10px rgba(0,0,0,0.7); }}
.save-badge {{ display:inline-block; background:{GOLD}; color:#1a1a2e;
  padding:5px 14px; font-size:18px; font-weight:800; margin-top:4px; }}
.pills {{ position:absolute; bottom:128px; right:42px;
  display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end; max-width:380px; }}
.pill {{ background:rgba(255,255,255,0.2); backdrop-filter:blur(4px);
  border:1px solid rgba(255,255,255,0.3); color:white;
  padding:5px 14px; border-radius:14px; font-size:14px; font-weight:600; }}
.origin {{ position:absolute; bottom:85px; right:42px;
  font-size:18px; color:rgba(255,255,255,0.85); font-weight:600;
  text-shadow: 0 2px 6px rgba(0,0,0,0.7); }}
.bottom-bar {{ position:absolute; bottom:0; left:0; right:0;
  background:rgba(0,0,0,0.58); backdrop-filter:blur(8px);
  padding:16px 42px; display:flex; justify-content:space-between; align-items:center;
  border-top:1px solid rgba(255,255,255,0.12); }}
.bottom-left {{ font-size:18px; color:rgba(255,255,255,0.92); font-weight:700;
  text-shadow:0 2px 8px rgba(0,0,0,0.55); }}
.bottom-right {{ display:flex; align-items:center; gap:20px; }}
.bottom-url {{ font-size:24px; font-weight:900; color:white; letter-spacing:0.6px;
  text-shadow:0 2px 8px rgba(0,0,0,0.62); }}
.bottom-cod {{ font-size:18px; color:{GOLD}; font-weight:900;
  text-shadow:0 2px 8px rgba(0,0,0,0.62); }}
</style></head><body>
<div class="overlay"></div>
<div class="brand-logo"><img src="{logo}" alt="{BRAND_NAME} logo"><span class="brand-lockup"><strong>{BRAND_NAME}</strong><span>{BRAND_TAGLINE}</span></span></div>
<div class="product-name">{esc(d.name)}</div>
<div class="price-area">
  {d.old_price_html}
  <div class="new-price">{d.price_display}</div>
  <div class="taka">{CURRENCY_LABEL}</div>
  {d.save_html}
</div>
<div class="pills">{d.chips_html}</div>
<div class="origin">{esc(d.origin or "Imported")}</div>
<div class="bottom-bar">
  <span class="bottom-left">{BRAND_FOOTER}</span>
  <span class="bottom-right"><span class="bottom-url">{BRAND_URL}</span><span class="bottom-cod">{COD_LABEL}</span></span>
</div>
</body></html>"""


def _compose_model_holding_real_product(d: ProductData, fmt: dict, req: CreativeRequest) -> str:
    w, h = fmt["width"], fmt["height"]
    spec = req.value_spec or {}
    clean_asset = bool(spec.get("clean_asset"))
    product_img = _product_image_data_uri(d, cutout=req.product_cutout)
    if not product_img:
        raise ValueError("model_holding_real_product requires a real product image")
    persona_file = spec.get("persona_image") or "workspace/content-orchestrator/video-engine/personas/emart-model/reference-holding.png"
    if not Path(str(persona_file)).exists():
        persona_file = "/root/emart-platform/workspace/content-orchestrator/video-engine/personas/emart-model/reference-holding.png"
    if not Path(str(persona_file)).exists():
        persona_file = "/var/www/emart-platform/workspace/content-orchestrator/video-engine/personas/emart-model/reference-holding.png"
    if not Path(str(persona_file)).exists():
        raise ValueError("model_holding_real_product requires a persona_image")
    persona_img = image_to_data_uri(str(persona_file))
    logo = logo_data_uri()
    brand = d.brand or BRAND_NAME
    label = spec.get("label") or f"{brand} pick"
    bangla = spec.get("bangla") or f"{brand} · {_taka(d.price)} · COD available"
    logo_block = "" if clean_asset else f"""<div class="logo">{f'<img src="{logo}">' if logo else BRAND_NAME}</div>"""
    label_block = "" if clean_asset else f"""<div class="label">{esc(label)}</div>"""
    footer_block = "" if clean_asset else f"""<div class="footer"><div class="bn">{esc(bangla)}</div><div class="price">{_taka(d.price)}</div></div>"""
    return f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>
{_vertical_base_css(w, h)}
body{{background:{INK};}}
.model{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}}
.scrim{{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 42%,rgba(25,8,13,.20) 68%,rgba(25,8,13,{'.42' if clean_asset else '.80'}) 100%);}}
.logo{{position:absolute;top:54px;left:54px;width:142px;height:74px;background:rgba(255,255,255,.88);
  border-radius:18px;display:flex;align-items:center;justify-content:center;box-shadow:0 14px 38px rgba(0,0,0,.28);}}
.logo img{{width:126px;height:auto;display:block;}}
.label{{position:absolute;top:64px;right:54px;max-width:560px;background:rgba(42,10,24,.76);border:2px solid rgba(231,178,74,.65);
  border-radius:28px;padding:14px 26px;color:#fff;font-size:34px;font-weight:900;line-height:1.2;text-align:right;}}
.veil{{position:absolute;left:670px;top:510px;width:378px;height:900px;border-radius:110px;
  background:linear-gradient(110deg,rgba(238,222,198,.78),rgba(238,222,198,.42));
  filter:blur(12px);opacity:.86;}}
.product-shadow{{position:absolute;left:742px;top:622px;width:290px;height:740px;border-radius:80px;
  background:rgba(0,0,0,.28);filter:blur(24px);transform:translate(18px,24px);}}
.product{{position:absolute;left:744px;top:596px;width:300px;height:790px;object-fit:contain;filter:drop-shadow(0 22px 28px rgba(0,0,0,.34));}}
.finger{{position:absolute;background:linear-gradient(90deg,#c98a65,#f0c0a4);border-radius:999px;
  box-shadow:inset -5px 0 9px rgba(114,60,42,.24),inset 4px 0 7px rgba(255,235,220,.28);z-index:4;opacity:.94;}}
.f1{{left:960px;top:875px;width:34px;height:220px;}}
.f2{{left:930px;top:1015px;width:34px;height:230px;}}
.f3{{left:714px;top:1128px;width:42px;height:210px;}}
.product-top{{position:absolute;left:744px;top:596px;width:300px;height:790px;object-fit:contain;z-index:5;clip-path:polygon(0 0,100% 0,100% 100%,0 100%,0 0);}}
.footer{{position:absolute;left:54px;right:54px;bottom:64px;display:flex;align-items:flex-end;justify-content:space-between;gap:28px;}}
.bn{{font-size:42px;font-weight:900;line-height:1.15;color:#fff;text-shadow:0 5px 18px rgba(0,0,0,.56);max-width:670px;}}
.price{{background:{GOLD};color:{INK};border-radius:28px;padding:16px 28px;font-size:42px;font-weight:900;box-shadow:0 16px 36px rgba(0,0,0,.28);white-space:nowrap;}}
</style></head><body>
<img class="model" src="{persona_img}">
<div class="scrim"></div>
{logo_block}
{label_block}
<div class="veil"></div>
<div class="product-shadow"></div>
<img class="product" src="{product_img}">
<div class="finger f1"></div><div class="finger f2"></div><div class="finger f3"></div>
<img class="product-top" src="{product_img}">
{footer_block}
</body></html>"""


def _compose_composite(d: ProductData, w: int, h: int, logo: str, req: CreativeRequest) -> str:
    img_b64 = ""
    if d.image_url:
        try:
            local_path = remove_bg(d.image_url)
            with open(local_path, "rb") as f:
                img_b64 = base64.b64encode(f.read()).decode()
            Path(local_path).unlink(missing_ok=True)
        except Exception:
            pass

    if req.background_file:
        with open(req.background_file, "rb") as f:
            bg_b64 = base64.b64encode(f.read()).decode()
        bg_css = f"url(data:image/png;base64,{bg_b64}) center/cover no-repeat"
    elif req.background == "gradient":
        bg_css = get_gradient_fallback(d.cat_slugs)
    else:
        bg_path = f"/tmp/creative_bg_{d.product_id}.png"
        try:
            style = "studio" if req.variant == "podium" else req.variant
            generate_ai_image(get_bg_prompt(d.cat_slugs, style), bg_path, seed=d.product_id)
            with open(bg_path, "rb") as f:
                bg_b64 = base64.b64encode(f.read()).decode()
            bg_css = f"url(data:image/png;base64,{bg_b64}) center/cover no-repeat"
            Path(bg_path).unlink(missing_ok=True)
        except Exception:
            bg_css = get_gradient_fallback(d.cat_slugs)

    highlight = d.title_line1
    if d.brand and highlight.lower().startswith(d.brand.lower()):
        highlight = highlight[len(d.brand):].strip()

    img_src = f"data:image/png;base64,{img_b64}" if img_b64 else d.image_url
    body_class = esc(req.variant) if req.variant != "studio" else ""
    shape_class = _shape_class(d)

    podium_css = ""
    if req.variant == "podium":
        body_class = "podium"
        podium_css = f"""
body.podium .podium-base {{
  display:block; position:absolute; left:146px; right:146px; bottom:134px; height:126px;
  border-radius:50%;
  background:
    radial-gradient(ellipse at 50% 24%, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.42) 38%, rgba(255,255,255,0) 68%),
    linear-gradient(180deg, rgba(248,249,247,0.76) 0%, rgba(201,212,209,0.64) 58%, rgba(115,132,133,0.30) 100%);
  border:1px solid rgba(255,255,255,0.56);
  box-shadow: inset 0 9px 18px rgba(255,255,255,0.50), inset 0 -10px 22px rgba(60,74,76,0.12), 0 30px 54px rgba(0,0,0,0.20); }}
body.podium .podium-base::before {{ content:""; position:absolute; left:12%; right:12%; top:18%; height:24%;
  border-radius:50%; background:rgba(255,255,255,0.46); filter:blur(8px); }}
body.podium .product-img {{ top:auto; bottom:176px; transform:translateX(-50%);
  width:760px; height:710px; align-items:flex-end;
  filter: drop-shadow(0 28px 30px rgba(0,0,0,0.22)) drop-shadow(0 8px 10px rgba(0,0,0,0.14)); }}
body.podium .product-img img {{ height:630px; max-width:700px; max-height:710px; }}"""

    hijabi_css = ""
    if req.variant == "hijabi-lifestyle":
        body_class = "hijabi-lifestyle"
        hijabi_css = f"""
body.hijabi-lifestyle .product-img {{ top:70%; left:67%; transform:translate(-50%,-50%) rotate(7deg);
  width:430px; height:520px; }}
body.hijabi-lifestyle .product-img img {{ height:430px; max-width:420px; max-height:500px; }}
body.hijabi-lifestyle .overlay {{
  background: linear-gradient(180deg, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.04) 28%, rgba(0,0,0,0.04) 55%, rgba(0,0,0,0.22) 78%, rgba(0,0,0,0.58) 100%); }}"""

    body_class = " ".join(part for part in (body_class, shape_class) if part)

    return f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@import url('{GOOGLE_FONT_IMPORT}');
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ width:{w}px; height:{h}px; font-family:{FONT_SOCIAL}; overflow:hidden; position:relative;
  background: {bg_css}; }}
.product-img {{ position:absolute; top:50%; left:50%; transform:translate(-50%,-48%);
  width:900px; height:860px; display:flex; align-items:center; justify-content:center;
  filter: drop-shadow(0 30px 60px rgba(0,0,0,0.45)) drop-shadow(0 10px 25px rgba(0,0,0,0.25)); }}
.product-img img {{ width:auto; height:650px; max-width:860px; max-height:830px; object-fit:contain; }}
body.shape-tall_bottle .product-img img, body.shape-dropper .product-img img {{ height:760px; max-width:520px; max-height:790px; }}
body.shape-tube .product-img img {{ height:720px; max-width:610px; max-height:760px; }}
body.shape-jar .product-img img {{ height:520px; max-width:720px; max-height:600px; }}
body.shape-compact .product-img img {{ height:470px; max-width:730px; max-height:540px; }}
body.shape-sheet_pack .product-img img, body.shape-box .product-img img, body.shape-pouch .product-img img {{ height:600px; max-width:780px; max-height:660px; }}
.podium-base {{ display:none; }}
{podium_css}
{hijabi_css}
body.shape-tall_bottle .product-img img, body.shape-dropper .product-img img {{ height:760px; max-width:520px; max-height:790px; }}
body.shape-tube .product-img img {{ height:720px; max-width:610px; max-height:760px; }}
body.shape-jar .product-img img {{ height:520px; max-width:720px; max-height:600px; }}
body.shape-compact .product-img img {{ height:470px; max-width:730px; max-height:540px; }}
body.shape-sheet_pack .product-img img, body.shape-box .product-img img, body.shape-pouch .product-img img {{ height:600px; max-width:780px; max-height:660px; }}
.overlay {{ position:absolute; inset:0;
  background: linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.0) 45%, rgba(0,0,0,0.15) 70%, rgba(0,0,0,0.55) 100%); }}
.brand-logo {{ position:absolute; top:34px; left:38px;
  display:flex; align-items:center; gap:12px;
  padding:8px 14px 8px 8px; border-radius:20px;
  background:rgba(255,255,255,0.18); border:1px solid rgba(255,255,255,0.28);
  backdrop-filter:blur(8px); box-shadow:0 8px 24px rgba(0,0,0,0.22); }}
.brand-logo img {{ width:58px; height:58px; border-radius:16px; display:block;
  box-shadow:0 4px 14px rgba(0,0,0,0.22); }}
.brand-lockup {{ display:flex; flex-direction:column; gap:2px; }}
.brand-lockup strong {{ font-size:24px; line-height:1; font-weight:900; color:white;
  text-shadow:0 2px 8px rgba(0,0,0,0.72); }}
.brand-lockup span {{ font-size:10px; line-height:1.1; font-weight:800; color:rgba(255,255,255,0.82);
  text-transform:uppercase; letter-spacing:0.8px; text-shadow:0 2px 6px rgba(0,0,0,0.65); }}
.info-right {{ position:absolute; top:38px; right:42px; text-align:right; width:480px; }}
.brand-name {{ font-size:24px; font-weight:700; color:white; letter-spacing:2px;
  text-shadow: 0 2px 6px rgba(0,0,0,0.7); margin-bottom:4px; }}
.highlight {{ font-size:66px; font-weight:900; color:{GOLD}; line-height:1.06;
  text-shadow: 0 3px 12px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.9);
  text-transform:uppercase; margin-bottom:8px; overflow-wrap:anywhere; word-break:break-word; }}
.sub-text {{ font-size:26px; font-weight:700; color:white;
  text-shadow: 0 2px 6px rgba(0,0,0,0.7); margin-bottom:10px; overflow-wrap:break-word; }}
.size-badge {{ display:inline-block; border:2px solid white; padding:3px 14px;
  font-size:18px; font-weight:700; color:white; }}
.price-area {{ position:absolute; bottom:94px; left:42px; max-width:420px; }}
.old-price {{ font-size:34px; font-weight:800; color:rgba(255,255,255,0.6);
  text-decoration:line-through; text-decoration-color:#e53e3e; text-decoration-thickness:3px; }}
.new-price {{ font-size:92px; font-weight:900; color:{GOLD}; line-height:.95;
  text-shadow: 0 4px 16px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.9); }}
.taka {{ font-size:42px; font-weight:800; color:{GOLD}; letter-spacing:2px;
  text-shadow: 0 3px 10px rgba(0,0,0,0.6); }}
.save-badge {{ display:inline-block; background:{GOLD}; color:#1a1a2e;
  padding:5px 14px; font-size:18px; font-weight:800; margin-top:4px; }}
.pills {{ position:absolute; bottom:128px; right:42px;
  display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end; max-width:380px; }}
.pill {{ background:rgba(255,255,255,0.15); backdrop-filter:blur(4px);
  border:1px solid rgba(255,255,255,0.3); color:white;
  padding:5px 14px; border-radius:14px; font-size:14px; font-weight:600; }}
.origin {{ position:absolute; bottom:85px; right:42px;
  font-size:18px; color:rgba(255,255,255,0.85); font-weight:600;
  text-shadow: 0 2px 6px rgba(0,0,0,0.6); }}
.bottom-bar {{ position:absolute; bottom:0; left:0; right:0;
  background:rgba(0,0,0,0.58); backdrop-filter:blur(8px);
  padding:16px 42px; display:flex; justify-content:space-between; align-items:center;
  border-top:1px solid rgba(255,255,255,0.12); }}
.bottom-left {{ font-size:18px; color:rgba(255,255,255,0.92); font-weight:700;
  text-shadow:0 2px 8px rgba(0,0,0,0.55); }}
.bottom-right {{ display:flex; align-items:center; gap:20px; }}
.bottom-url {{ font-size:24px; font-weight:900; color:white; letter-spacing:0.6px;
  text-shadow:0 2px 8px rgba(0,0,0,0.62); }}
.bottom-cod {{ font-size:18px; color:{GOLD}; font-weight:900;
  text-shadow:0 2px 8px rgba(0,0,0,0.62); }}
</style></head><body class="{body_class}">
<div class="overlay"></div>
<div class="podium-base"></div>
<div class="product-img"><img src="{img_src}" alt="product"></div>
<div class="brand-logo"><img src="{logo}" alt="{BRAND_NAME} logo"><span class="brand-lockup"><strong>{BRAND_NAME}</strong><span>{BRAND_TAGLINE}</span></span></div>
<div class="info-right">
  <div class="brand-name">{esc(d.brand.upper())}</div>
  <div class="highlight">{esc(highlight)}</div>
  <div class="sub-text">{esc(d.title_line2)}</div>
  <div class="size-badge">{esc(d.size)}</div>
</div>
<div class="price-area">
  {d.old_price_html}
  <div class="new-price">{d.price_display}</div>
  <div class="taka">{CURRENCY_LABEL}</div>
  {d.save_html}
</div>
<div class="pills">{d.chips_html}</div>
<div class="origin">{esc(d.origin or "Imported")}</div>
<div class="bottom-bar">
  <span class="bottom-left">{BRAND_FOOTER}</span>
  <span class="bottom-right"><span class="bottom-url">{BRAND_URL}</span><span class="bottom-cod">{COD_LABEL}</span></span>
</div>
</body></html>"""


def render(req: CreativeRequest) -> CreativeResult:
    d = _product_data(req)
    fmt = FORMATS.get(req.format)
    if not fmt:
        raise ValueError(f"Unknown format: {req.format}. Available: {list(FORMATS.keys())}")

    w, h = fmt["width"], fmt["height"]

    if req.format in ("post_1x1", "post_4x5"):
        html_content = _compose_post(d, fmt, req)
    elif req.format == "hero_vertical":
        html_content = _compose_hero_vertical(d, fmt, req)
    elif req.format == "model_holding_real_product":
        html_content = _compose_model_holding_real_product(d, fmt, req)
    elif req.format == "scene_value":
        html_content = _compose_scene_value(d, fmt, req)
    elif req.format == "scene_brand_end":
        html_content = _compose_scene_brand_end(d, fmt, req)
    elif req.format == "blog_og_1200x630":
        html_content = _compose_blog_og(d, fmt, req)
    else:
        raise ValueError(f"Format {req.format} not yet implemented")

    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    out_path = req.out or str(DEFAULT_OUTPUT_DIR / f"product-{d.product_id}-{req.format}-{ts}.png")
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)

    render_scale = max(1, min(int(req.render_scale or 1), 3))
    qa_report = screenshot(html_content, out_path, width=w, height=h, qa=req.qa, render_scale=render_scale)

    return CreativeResult(
        asset_path=out_path,
        width=w,
        height=h,
        format=req.format,
        variant=req.variant,
        render_scale=render_scale,
        product_snapshot={
            "id": d.product_id, "name": d.name, "brand": d.brand,
            "price": d.price_display, "original": d.regular_price,
            "origin": d.origin, "slug": d.slug, "image_url": d.image_url,
            "container_type": d.container_type,
            "container_confidence": d.container_confidence,
        },
        motion_manifest=_motion_manifest(req, d, w, h),
        qa_report=qa_report,
    )
