"""
Chromium screenshot + layout QA — one renderer for all formats.

Extracted from social_image_gen.py.screenshot_html. Every format (social posts,
video hero cards, value cards, brand cards) now passes the same QA before shipping.
"""
from __future__ import annotations
import json, os, subprocess, tempfile
from pathlib import Path
from .tokens.brand import find_chromium


def _finalize_image(src_path: Path, output_path: Path, width: int, height: int, render_scale: int) -> None:
    from PIL import Image

    with Image.open(src_path) as img:
        if render_scale > 1 or img.size != (width, height):
            img = img.resize((width, height), Image.Resampling.LANCZOS)
        suffix = output_path.suffix.lower()
        output_path.parent.mkdir(parents=True, exist_ok=True)
        if suffix in (".jpg", ".jpeg"):
            img.convert("RGB").save(output_path, "JPEG", quality=94, optimize=True)
        else:
            img.save(output_path, "PNG", optimize=True)


def screenshot(
    html_content: str,
    output_path: str,
    width: int = 1080,
    height: int = 1080,
    qa: bool = True,
    render_scale: int = 2,
) -> dict:
    render_scale = max(1, min(int(render_scale or 1), 3))
    final_output = Path(output_path)
    temp_id = f"{os.getpid()}_{Path(output_path).stem}"
    temp_html = Path(tempfile.mktemp(suffix=f"_{temp_id}.html"))
    temp_png = Path(tempfile.mktemp(suffix=f"_rendered_{temp_id}.png"))
    temp_html.write_text(html_content, encoding="utf-8")

    chromium = find_chromium()
    qa_block = ""
    if qa:
        qa_block = """
    const problems = await page.evaluate(() => {
        const selectors = ['.brand-logo', '.info-right', '.product-name', '.price-area', '.pills', '.origin', '.bottom-bar',
                           '.copy', '.product-stage', '.top', '.foot', '.badge', '.bn', '.price',
                           '.stage', '.brand', '.url', '.row'];
        const rects = selectors.map((selector) => {
            const el = document.querySelector(selector);
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return {
                selector,
                left: r.left, top: r.top, right: r.right, bottom: r.bottom,
                width: r.width, height: r.height,
                scrollWidth: el.scrollWidth, scrollHeight: el.scrollHeight,
                clientWidth: el.clientWidth, clientHeight: el.clientHeight
            };
        }).filter(Boolean);
        const by = Object.fromEntries(rects.map((r) => [r.selector, r]));
        const overlap = (a, b, pad = 8) => a && b && a.left < b.right - pad && a.right > b.left + pad && a.top < b.bottom - pad && a.bottom > b.top + pad;
        const issues = [];
        const bottomBar = by['.bottom-bar'] || by['.foot'];
        for (const selector of ['.price-area', '.pills', '.origin', '.price', '.bn']) {
            if (bottomBar && overlap(by[selector], bottomBar, 0)) issues.push(`${selector} overlaps bottom bar`);
        }
        if (overlap(by['.product-name'], by['.price-area'], 24)) issues.push('.product-name overlaps price area');
        if (overlap(by['.copy'], by['.product-stage'], 24)) issues.push('.copy overlaps product stage');
        const W = document.body.clientWidth || 1080;
        const H = document.body.clientHeight || 1920;
        for (const r of rects) {
            if (r.right > W || r.left < 0 || r.bottom > H || r.top < 0) issues.push(`${r.selector} escapes canvas`);
            if (r.scrollWidth > r.clientWidth + 2 || r.scrollHeight > r.clientHeight + 2) issues.push(`${r.selector} clips text`);
        }
        if (H === 1920) {
            const maxImportantBottom = Math.round(H * 0.74);
            for (const selector of ['.bn', '.price', '.foot', '.brand', '.url']) {
                const r = by[selector];
                if (r && r.bottom > maxImportantBottom) {
                    issues.push(`${selector} below mobile reel safe zone (${Math.round(r.bottom)} > ${maxImportantBottom})`);
                }
            }
        }
        if (document.body.innerText.includes('&amp;')) issues.push('escaped entity visible in rendered text');
        return issues;
    });
    if (problems.length) {
        throw new Error('Layout QA failed: ' + problems.join('; '));
    }"""

    script = f"""
const pw = require('/usr/lib/node_modules/playwright');
const fs = require('fs');
(async () => {{
    const browser = await pw.chromium.launch({{
        executablePath: {json.dumps(chromium)},
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }});
    const page = await browser.newPage({{
        viewport: {{ width: {width}, height: {height} }},
        deviceScaleFactor: {render_scale}
    }});
    await page.setContent(fs.readFileSync({json.dumps(str(temp_html.absolute()))}, 'utf-8'), {{ waitUntil: 'networkidle', timeout: 10000 }});
    await page.waitForTimeout(1500);
    {qa_block}
    await page.screenshot({{ path: {json.dumps(str(temp_png.absolute()))}, type: 'png' }});
    await browser.close();
}})().catch(e => {{ console.error(e); process.exit(1); }});
"""
    sf = Path(tempfile.mktemp(suffix=f"_render_{temp_id}.js"))
    sf.write_text(script)
    result = subprocess.run(["node", str(sf)], capture_output=True, text=True, timeout=30)
    for f in (sf, temp_html):
        f.unlink(missing_ok=True)
    qa_report = {"passed": True, "issues": []}
    if result.returncode != 0:
        temp_png.unlink(missing_ok=True)
        err = result.stderr[:400]
        if "Layout QA failed:" in err:
            issues = err.split("Layout QA failed:")[1].strip().split("; ")
            qa_report = {"passed": False, "issues": issues}
            raise RuntimeError(f"Layout QA failed: {'; '.join(issues)}")
        raise RuntimeError(err)
    _finalize_image(temp_png, final_output, width, height, render_scale)
    temp_png.unlink(missing_ok=True)
    qa_report["render_scale"] = render_scale
    return qa_report
