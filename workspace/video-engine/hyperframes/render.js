#!/usr/bin/env node
/**
 * HyperFrames reel renderer for Emart video engine.
 *
 * Takes a video-engine job JSON, generates a 1080×1920 HTML composition with
 * GSAP-animated scenes (Ken Burns, crossfades, staggered reveals), and renders
 * it to MP4 via HyperFrames.
 *
 * Usage:
 *   node render.js --job ../jobs/queue/example.json --out ../output/example.mp4
 *                  [--audio ../output/vo.mp3] [--music ../assets/music/ambient-soft.mp3]
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const os = require("os");

// ── Brand palette (source: apps/web/tailwind.config.js) ────────────────
const ROSE = "#9f1239",
  WINE = "#5e1130",
  INK = "#2a0a18";
const GOLD = "#e7b24a",
  SOFT_ROSE = "#f3c9d6";
const FONT_STACK =
  "'Noto Sans Bengali','Inter','Segoe UI',sans-serif";

// ── Platform-safe caption zones (% from top) ───────────────────────────
const SAFE_ZONES = {
  wide: { hook: 62, benefit: 72, cta: 80 },
  fb: { hook: 62, benefit: 72, cta: 80 },
  ig: { hook: 58, benefit: 68, cta: 76 },
  youtube: { hook: 60, benefit: 70, cta: 78 },
  tiktok: { hook: 58, benefit: 68, cta: 76 },
};

function esc(t) {
  return (t || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function imgToDataUri(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return "";
  const ext = path.extname(filePath).toLowerCase();
  const mime =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
        ? "image/webp"
        : "image/jpeg";
  return `data:${mime};base64,${fs.readFileSync(filePath).toString("base64")}`;
}

function logoDataUri() {
  const candidates = [
    path.resolve(__dirname, "../../../apps/web/public/logo.png"),
    "/root/emart-platform/apps/web/public/logo.png",
    "/var/www/emart-platform/apps/web/public/logo.png",
  ];
  for (const p of candidates) {
    if (fs.existsSync(p))
      return `data:image/png;base64,${fs.readFileSync(p).toString("base64")}`;
  }
  return "";
}

// ── Scene HTML generators ──────────────────────────────────────────────

function sceneImage(id, imgSrc, start, duration, trackIndex, fit = false) {
  const objectFit = fit ? "contain" : "cover";
  const bg = fit
    ? `background:url('${imgSrc}') center/cover no-repeat;filter:blur(20px) brightness(0.85);`
    : "";
  const fitWrapper = fit
    ? `<div style="position:absolute;inset:0;${bg}"></div>`
    : "";
  return `
    <div id="${id}" class="clip scene" data-start="${start}" data-duration="${duration}" data-track-index="${trackIndex}"
         style="position:absolute;inset:0;width:1080px;height:1920px;overflow:hidden;opacity:0;">
      ${fitWrapper}
      <img id="${id}-img" src="${imgSrc}" data-layout-allow-overflow
           style="position:absolute;inset:0;width:100%;height:100%;object-fit:${objectFit};${fit ? "z-index:1;" : ""}" />
      <div class="scrim" style="position:absolute;inset:0;background:linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.55) 100%);z-index:2;"></div>
    </div>`;
}

function sceneValueCard(id, spec, start, duration, trackIndex, logo) {
  const style = spec.style || "numbered";
  const bullets = (spec.bullets || [])
    .slice(0, 6)
    .map((b, i) => {
      const mark =
        style === "numbered"
          ? `${i + 1}`
          : style === "check"
            ? "✓"
            : "•";
      return `
      <div class="bullet-row" id="${id}-bullet-${i}" style="display:flex;align-items:center;gap:24px;margin-bottom:18px;
        background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.16);
        border-radius:20px;padding:18px 26px;opacity:0;">
        <div style="flex:0 0 64px;height:64px;border-radius:50%;background:${GOLD};color:${INK};
          font-size:34px;font-weight:900;display:flex;align-items:center;justify-content:center;">${mark}</div>
        <div style="font-size:38px;font-weight:700;line-height:1.25;">${esc(b)}</div>
      </div>`;
    })
    .join("");

  const logoImg = logo
    ? `<img src="${logo}" style="width:100px;height:100px;border-radius:20px;" />`
    : "";

  return `
    <div id="${id}" class="clip scene" data-start="${start}" data-duration="${duration}" data-track-index="${trackIndex}"
         style="position:absolute;inset:0;width:1080px;height:1920px;overflow:hidden;opacity:0;
         background:linear-gradient(160deg,${ROSE} 0%,${WINE} 52%,${INK} 100%);
         font-family:${FONT_STACK};color:#fff;">
      <div style="position:absolute;inset:0;padding:80px 68px;display:flex;flex-direction:column;justify-content:center;">
        <div id="${id}-kicker" style="align-self:flex-start;font-size:28px;font-weight:800;letter-spacing:3px;
          color:${INK};background:${GOLD};border-radius:14px;padding:10px 22px;margin-bottom:24px;
          opacity:0;">${esc(spec.kicker || "জেনে নিন")}</div>
        <div id="${id}-title" style="font-size:60px;font-weight:900;line-height:1.2;margin-bottom:30px;
          opacity:0;">${esc(spec.title || "")}</div>
        ${bullets}
        <div style="margin-top:40px;display:flex;align-items:center;justify-content:space-between;
          font-size:28px;color:${SOFT_ROSE};">
          ${logoImg}
          <span style="text-transform:uppercase;letter-spacing:1px;">${esc((spec.footer || "E-MART.COM.BD · COD").toUpperCase())}</span>
        </div>
      </div>
    </div>`;
}

function sceneBrandCard(id, job, start, duration, trackIndex, logo) {
  const product = job.product || job.headline || "Emart Skincare";
  const price = job.price || "";
  const original = job.original_price || "";
  const bangla = job.brand_card_bangla || "";

  let hasOffer = false;
  try {
    hasOffer =
      original && price && parseInt(original) > parseInt(price);
  } catch (e) {}

  const priceLabel = hasOffer ? "অফার মূল্য" : "মূল্য";
  const origBlock = hasOffer
    ? `<span id="${id}-orig" style="font-size:46px;font-weight:700;color:${SOFT_ROSE};text-decoration:line-through;opacity:0;">৳${esc(original)}</span>`
    : "";
  const saveBlock = hasOffer
    ? `<div id="${id}-save" style="font-size:30px;font-weight:800;color:#fff;background:rgba(255,255,255,0.16);
        border-radius:30px;padding:8px 24px;margin-bottom:40px;display:inline-block;opacity:0;">
        ৳${parseInt(original) - parseInt(price)} সাশ্রয়</div>`
    : "";
  const banglaBlock = bangla
    ? `<div style="font-size:38px;font-weight:600;color:${SOFT_ROSE};line-height:1.4;margin-bottom:34px;">${esc(bangla)}</div>`
    : "";

  const logoImg = logo
    ? `<img id="${id}-logo" src="${logo}" style="width:260px;height:260px;border-radius:44px;margin-bottom:30px;
        box-shadow:0 20px 60px rgba(0,0,0,0.5);opacity:0;" />`
    : "";
  const priceBlock = price
    ? `<div id="${id}-pricelabel" style="font-size:28px;font-weight:800;letter-spacing:4px;color:${GOLD};
        text-transform:uppercase;margin-bottom:8px;opacity:0;">${priceLabel}</div>
       <div style="display:flex;align-items:center;justify-content:center;gap:22px;margin-bottom:12px;">
         <span id="${id}-price" style="font-size:88px;font-weight:900;color:${GOLD};opacity:0;">৳${esc(price)}</span>
         ${origBlock}
         <span id="${id}-cod" style="font-size:28px;font-weight:800;color:${INK};background:${GOLD};
           border-radius:14px;padding:8px 18px;letter-spacing:1px;opacity:0;">COD</span>
       </div>
       ${saveBlock}`
    : "";

  return `
    <div id="${id}" class="clip scene" data-start="${start}" data-duration="${duration}" data-track-index="${trackIndex}"
         style="position:absolute;inset:0;width:1080px;height:1920px;overflow:hidden;opacity:0;
         background:linear-gradient(160deg,${ROSE} 0%,${WINE} 55%,${INK} 100%);
         font-family:${FONT_STACK};color:#fff;">
      <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;
        justify-content:center;text-align:center;padding:0 80px;">
        ${logoImg}
        <div style="width:120px;height:4px;background:${GOLD};border-radius:2px;margin:0 auto 30px;"></div>
        <div id="${id}-product" style="font-size:62px;font-weight:900;line-height:1.2;margin-bottom:14px;opacity:0;
          background:linear-gradient(135deg,#fff 60%,${GOLD});-webkit-background-clip:text;-webkit-text-fill-color:transparent;
          filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">${esc(product)}</div>
        ${banglaBlock}
        ${priceBlock}
        <div id="${id}-url" style="font-size:44px;font-weight:800;letter-spacing:2px;margin:10px 0 12px;opacity:0;
          color:${GOLD};text-transform:uppercase;">E-MART.COM.BD</div>
        <div style="font-size:26px;font-style:italic;color:${SOFT_ROSE};">Global Beauty. Local Trust.</div>
      </div>
      <div style="position:absolute;bottom:54px;left:0;right:0;font-size:24px;color:${SOFT_ROSE};text-align:center;
        letter-spacing:0.5px;">
        সারা বাংলাদেশে ক্যাশ অন ডেলিভারি · অরিজিনাল প্রোডাক্ট
      </div>
    </div>`;
}

// ── Caption overlay elements ───────────────────────────────────────────

function captionElements(script, totalDuration, safeZone) {
  if (!script) return "";
  const zone = SAFE_ZONES[safeZone] || SAFE_ZONES.wide;
  const hook = script.hook || "";
  const benefits = (script.benefits || []).filter(Boolean).slice(0, 3);
  const cta = script.cta || "";

  const els = [];
  let capTrack = 10;
  if (hook) {
    els.push(`
      <div id="cap-hook" class="clip" data-start="0.3" data-duration="${totalDuration * 0.45}"
           data-track-index="${capTrack++}"
           style="position:absolute;top:${zone.hook}%;left:50%;transform:translateX(-50%);
           z-index:10;opacity:0;text-align:center;">
        <span style="font-size:68px;font-weight:800;color:#fff;
          background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);
          padding:14px 36px;border-radius:18px;display:inline-block;
          text-shadow:0 2px 8px rgba(0,0,0,0.7);max-width:920px;line-height:1.3;">${esc(hook)}</span>
      </div>`);
  }

  const n = Math.max(1, benefits.length);
  const seg = (totalDuration * 0.88 - totalDuration * 0.3) / n;
  benefits.forEach((b, i) => {
    const t0 = totalDuration * 0.3 + i * seg;
    els.push(`
      <div id="cap-benefit-${i}" class="clip" data-start="${t0.toFixed(2)}" data-duration="${seg.toFixed(2)}"
           data-track-index="${capTrack++}"
           style="position:absolute;top:${zone.benefit}%;left:50%;transform:translateX(-50%);
           z-index:10;opacity:0;text-align:center;">
        <span style="font-size:56px;font-weight:700;color:${GOLD};
          background:rgba(0,0,0,0.45);backdrop-filter:blur(8px);
          padding:12px 30px;border-radius:16px;display:inline-block;
          text-shadow:0 2px 6px rgba(0,0,0,0.6);max-width:920px;line-height:1.3;">${esc(b)}</span>
      </div>`);
  });

  if (cta) {
    els.push(`
      <div id="cap-cta" class="clip" data-start="${(totalDuration * 0.72).toFixed(2)}"
           data-duration="${(totalDuration * 0.28).toFixed(2)}"
           data-track-index="${capTrack++}"
           style="position:absolute;top:${zone.cta}%;left:50%;transform:translateX(-50%);
           z-index:10;opacity:0;text-align:center;">
        <span style="font-size:46px;font-weight:800;color:#fff;
          border:3px solid ${GOLD};background:rgba(0,0,0,0.55);backdrop-filter:blur(8px);
          padding:14px 40px;border-radius:18px;display:inline-block;
          text-shadow:0 2px 6px rgba(0,0,0,0.6);white-space:nowrap;">${esc(cta)}</span>
      </div>`);
  }

  return els.join("\n");
}

// ── GSAP timeline generator ────────────────────────────────────────────

function buildTimeline(scenes, script, totalDuration, secondsPerScene) {
  const lines = [];
  const FADE = 0.6;
  const KEN_BURNS_SCALE = 1.12;

  scenes.forEach((s, i) => {
    const id = s.id;

    // fade in/out
    if (i === 0) {
      lines.push(
        `tl.set("#${id}", {opacity: 1}, 0);`,
      );
    } else {
      lines.push(
        `tl.to("#${id}", {opacity: 1, duration: ${FADE}, ease: "power2.inOut"}, ${s.start.toFixed(2)});`,
      );
    }
    // fade out (not last scene)
    if (i < scenes.length - 1) {
      const fadeOutStart = s.start + s.duration - FADE;
      lines.push(
        `tl.to("#${id}", {opacity: 0, duration: ${FADE}, ease: "power2.inOut"}, ${fadeOutStart.toFixed(2)});`,
      );
    }

    // Ken Burns on image scenes
    if (s.type === "image") {
      const directions = [
        { x: -3, y: 0 }, // pan right
        { x: 0, y: -3 }, // pan down
        { x: 3, y: 0 }, // pan left
        { x: 0, y: 3 }, // pan up
      ];
      const d = directions[i % 4];
      lines.push(
        `gsap.set("#${id}-img", {scale: ${KEN_BURNS_SCALE}, x: "${-d.x}%", y: "${-d.y}%"});`,
      );
      lines.push(
        `tl.to("#${id}-img", {x: "${d.x}%", y: "${d.y}%", duration: ${s.duration.toFixed(2)}, ease: "none"}, ${s.start.toFixed(2)});`,
      );
    }

    // Value card animated reveals
    if (s.type === "value") {
      const revealStart = s.start + 0.3;
      lines.push(`gsap.set("#${id}-kicker", {y: -20});`);
      lines.push(
        `tl.to("#${id}-kicker", {opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.4)"}, ${revealStart.toFixed(2)});`,
      );
      lines.push(
        `tl.to("#${id}-title", {opacity: 1, duration: 0.5, ease: "power2.out"}, ${(revealStart + 0.2).toFixed(2)});`,
      );
      const bulletCount = s.bulletCount || 0;
      for (let b = 0; b < bulletCount; b++) {
        const bt = revealStart + 0.6 + b * 0.25;
        lines.push(
          `tl.to("#${id}-bullet-${b}", {opacity: 1, x: 0, duration: 0.45, ease: "power3.out"}, ${bt.toFixed(2)});`,
        );
      }
    }

    // Brand card animated reveals
    if (s.type === "brand") {
      const rs = s.start + 0.3;
      if (s.hasLogo) {
        lines.push(
          `tl.to("#${id}-logo", {opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)"}, ${rs.toFixed(2)});`,
        );
      }
      lines.push(
        `tl.to("#${id}-product", {opacity: 1, duration: 0.5, ease: "power2.out"}, ${(rs + 0.3).toFixed(2)});`,
      );
      if (s.hasPrice) {
        lines.push(
          `tl.to("#${id}-pricelabel", {opacity: 1, duration: 0.3}, ${(rs + 0.6).toFixed(2)});`,
        );
        lines.push(
          `tl.to("#${id}-price", {opacity: 1, duration: 0.5, ease: "power2.out"}, ${(rs + 0.7).toFixed(2)});`,
        );
        if (s.hasOriginal) {
          lines.push(
            `tl.to("#${id}-orig", {opacity: 1, duration: 0.3}, ${(rs + 0.9).toFixed(2)});`,
          );
        }
        lines.push(
          `tl.to("#${id}-cod", {opacity: 1, duration: 0.3, ease: "back.out(2)"}, ${(rs + 1.0).toFixed(2)});`,
        );
        if (s.hasSave) {
          lines.push(
            `tl.to("#${id}-save", {opacity: 1, duration: 0.4}, ${(rs + 1.2).toFixed(2)});`,
          );
        }
      }
      lines.push(
        `tl.to("#${id}-url", {opacity: 1, duration: 0.4}, ${(rs + 1.4).toFixed(2)});`,
      );
    }
  });

  // Caption animations
  if (script) {
    const hook = script.hook;
    const benefits = (script.benefits || []).filter(Boolean).slice(0, 3);
    const cta = script.cta;

    if (hook) {
      lines.push(
        `tl.to("#cap-hook", {opacity: 1, duration: 0.35, ease: "power2.out"}, 0.3);`,
      );
      lines.push(
        `tl.to("#cap-hook", {opacity: 0, duration: 0.35}, ${(totalDuration * 0.45).toFixed(2)});`,
      );
    }

    const n = Math.max(1, benefits.length);
    const seg = (totalDuration * 0.88 - totalDuration * 0.3) / n;
    benefits.forEach((b, i) => {
      const t0 = totalDuration * 0.3 + i * seg;
      const fadeEnd = t0 + seg;
      lines.push(
        `tl.to("#cap-benefit-${i}", {opacity: 1, duration: 0.35, ease: "power2.out"}, ${t0.toFixed(2)});`,
      );
      lines.push(
        `tl.to("#cap-benefit-${i}", {opacity: 0, duration: 0.35}, ${(fadeEnd - 0.35).toFixed(2)});`,
      );
      lines.push(
        `tl.set("#cap-benefit-${i}", {opacity: 0}, ${fadeEnd.toFixed(2)});`,
      );
    });

    if (cta) {
      lines.push(
        `tl.to("#cap-cta", {opacity: 1, duration: 0.4, ease: "back.out(1.5)"}, ${(totalDuration * 0.72).toFixed(2)});`,
      );
    }
  }

  return lines.join("\n      ");
}

// ── Composition builder ────────────────────────────────────────────────

function buildComposition(job, images, script, audioPath, musicPath) {
  const secondsPerScene = parseFloat(job.seconds || 5);
  const nScenes = images.length;
  const CROSSFADE = 0.5;
  const totalDuration =
    nScenes > 1
      ? secondsPerScene * nScenes - CROSSFADE * (nScenes - 1)
      : secondsPerScene;

  const safeZone = job.safe_zone || "wide";
  const logo = logoDataUri();
  const listCards = job.list_cards || [];

  // Build scene metadata + HTML
  const scenesMeta = [];
  const scenesHtml = [];

  images.forEach((img, i) => {
    const start =
      i === 0 ? 0 : secondsPerScene * i - CROSSFADE * i;
    const dur = secondsPerScene;
    const id = `scene-${i}`;

    // Determine scene type: last image = brand card, value cards, or regular image
    const isLastImage = i === images.length - 1;
    const isValueCard = i >= images.length - listCards.length - (job.brand_card ? 1 : 0)
      && i < images.length - (job.brand_card ? 1 : 0)
      && listCards[i - (images.length - listCards.length - (job.brand_card ? 1 : 0))];
    const isBrandCard = job.brand_card && isLastImage;

    if (isBrandCard) {
      scenesMeta.push({
        id,
        start,
        duration: dur,
        type: "brand",
        hasLogo: !!logo,
        hasPrice: !!job.price,
        hasOriginal: !!(job.original_price && job.price && parseInt(job.original_price) > parseInt(job.price)),
        hasSave: !!(job.original_price && job.price && parseInt(job.original_price) > parseInt(job.price)),
      });
      scenesHtml.push(sceneBrandCard(id, job, start, dur, i, logo));
    } else if (isValueCard) {
      const vcIdx = i - (images.length - listCards.length - (job.brand_card ? 1 : 0));
      const spec = listCards[vcIdx];
      scenesMeta.push({
        id,
        start,
        duration: dur,
        type: "value",
        bulletCount: (spec.bullets || []).length,
      });
      scenesHtml.push(sceneValueCard(id, spec, start, dur, i, logo));
    } else {
      const isFit = (job.images || []).map(p => path.resolve(p)).includes(path.resolve(img));
      const dataUri = imgToDataUri(img);
      scenesMeta.push({
        id,
        start,
        duration: dur,
        type: "image",
      });
      scenesHtml.push(sceneImage(id, dataUri, start, dur, i, isFit));
    }
  });

  // Confine captions to photo frames only (value/brand cards have their own text)
  const cardFrames = listCards.length + (job.brand_card ? 1 : 0);
  const photoFrames = Math.max(1, nScenes - cardFrames);
  const captionWindow = cardFrames ? secondsPerScene * photoFrames : totalDuration;

  const captions = captionElements(script, captionWindow, safeZone);
  const timeline = buildTimeline(scenesMeta, script, captionWindow, secondsPerScene);

  // Audio: copy files into project dir and use relative paths
  let audioHtml = "";
  const audioFiles = [];
  if (audioPath && fs.existsSync(audioPath)) {
    audioFiles.push({ src: audioPath, dest: "voiceover" + path.extname(audioPath) });
    audioHtml += `\n    <audio id="voiceover" src="voiceover${path.extname(audioPath)}"
      data-start="0" data-duration="${totalDuration}" data-track-index="5" data-volume="1"></audio>`;
  }
  if (musicPath && fs.existsSync(musicPath)) {
    const musicVol = audioPath ? 0.22 : 0.5;
    audioFiles.push({ src: musicPath, dest: "music" + path.extname(musicPath) });
    audioHtml += `\n    <audio id="music" src="music${path.extname(musicPath)}"
      data-start="0" data-duration="${totalDuration}" data-track-index="6" data-volume="${musicVol}"></audio>`;
  }

  const html = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1080, height=1920" />
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
  <style>
    @font-face { font-family: 'Noto Sans Bengali'; font-weight: 400; src: local('Noto Sans Bengali'), local('NotoSansBengali-Regular'); }
    @font-face { font-family: 'Noto Sans Bengali'; font-weight: 700; src: local('Noto Sans Bengali Bold'), local('NotoSansBengali-Bold'); }
    @font-face { font-family: 'Noto Sans Bengali'; font-weight: 800; src: local('Noto Sans Bengali Bold'), local('NotoSansBengali-Bold'); }
    @font-face { font-family: 'Noto Sans Bengali'; font-weight: 900; src: local('Noto Sans Bengali Bold'), local('NotoSansBengali-Bold'); }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 1080px; height: 1920px; overflow: hidden;
      background: #000; color: #fff;
      font-family: ${FONT_STACK};
    }
  </style>
</head>
<body>
  <div id="root" data-composition-id="emart-reel"
       data-start="0" data-duration="${totalDuration.toFixed(2)}"
       data-width="1080" data-height="1920">

    ${scenesHtml.join("\n    ")}

    ${captions}

    ${audioHtml}
  </div>

  <script>
    window.__timelines = window.__timelines || {};
    const tl = gsap.timeline({ paused: true });

    ${timeline}

    window.__timelines["emart-reel"] = tl;
  </script>
</body>
</html>`;

  return { html, audioFiles };
}

// ── Main ───────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const getArg = (flag) => {
    const idx = args.indexOf(flag);
    return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : null;
  };

  const jobPath = getArg("--job");
  const outPath = getArg("--out");
  if (!jobPath) {
    console.error("Usage: node render.js --job <path> --out <path>");
    process.exit(1);
  }

  const job = JSON.parse(fs.readFileSync(jobPath, "utf-8"));
  const jid = job.id || "reel";

  // Resolve images from job stages (worker already resolved them)
  const images = (job.stages && job.stages.images && job.stages.images.images) || job.images || [];
  if (!images.length) {
    console.error("No images in job");
    process.exit(1);
  }

  // Script (for captions)
  let script = null;
  const scriptPath =
    job.stages && job.stages.script && job.stages.script.path;
  if (scriptPath && fs.existsSync(scriptPath)) {
    script = JSON.parse(fs.readFileSync(scriptPath, "utf-8"));
  } else if (job.script) {
    script = job.script;
  }

  // Audio
  const audioPath =
    getArg("--audio") ||
    (job.stages && job.stages.voice && job.stages.voice.audio) ||
    null;
  const musicDefault = path.resolve(
    __dirname,
    "../assets/music/ambient-soft.mp3",
  );
  let musicPath = getArg("--music");
  if (musicPath === undefined || musicPath === null) {
    musicPath = job.music !== false ? musicDefault : null;
  }

  // Generate composition HTML + audio file list
  const { html, audioFiles } = buildComposition(job, images, script, audioPath, musicPath);

  // Write to project dir (user-specified or temp) and copy audio assets
  const projectDir = getArg("--project-dir");
  const tmpDir = projectDir || fs.mkdtempSync(path.join(os.tmpdir(), `hf-${jid}-`));
  if (projectDir && !fs.existsSync(projectDir)) fs.mkdirSync(projectDir, { recursive: true });
  const htmlPath = path.join(tmpDir, "index.html");
  fs.writeFileSync(htmlPath, html, "utf-8");
  for (const af of audioFiles) {
    fs.copyFileSync(af.src, path.join(tmpDir, af.dest));
  }
  if (args.includes("--html-only")) {
    console.log(tmpDir);
    return;
  }

  // Determine output path
  const output = outPath || path.resolve(__dirname, `../output/${jid}.mp4`);
  const outputDir = path.dirname(output);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // Render via HyperFrames CLI
  const hyperframesCmd = path.resolve(
    __dirname,
    "node_modules/.bin/hyperframes",
  );
  const cmd = [
    hyperframesCmd,
    "render",
    tmpDir,
    "--fps", "24",
    "--quality", "standard",
    "--output", output,
    "--low-memory-mode",
    "--quiet",
  ].join(" ");

  console.error(`[hyperframes] rendering ${jid} (${images.length} scenes)...`);
  try {
    execSync(cmd, {
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 600_000,
      env: { ...process.env, HYPERFRAMES_BROWSER_PATH: "/usr/bin/chromium-browser" },
    });
  } catch (e) {
    const stderr = e.stderr ? e.stderr.toString().slice(-1000) : "";
    console.error(`[hyperframes] render failed: ${stderr}`);
    // Save HTML for debugging
    const debugHtml = path.resolve(__dirname, `../output/debug-${jid}.html`);
    fs.copyFileSync(htmlPath, debugHtml);
    console.error(`[hyperframes] debug HTML saved to ${debugHtml}`);
    if (!projectDir) fs.rmSync(tmpDir, { recursive: true, force: true });
    process.exit(1);
  }

  // Clean up temp dir (only if auto-created)
  if (!projectDir) fs.rmSync(tmpDir, { recursive: true, force: true });

  if (!fs.existsSync(output)) {
    console.error("[hyperframes] render produced no output");
    process.exit(1);
  }

  // Post-render: normalize audio loudness to -14 LUFS (IG/YT/TikTok standard)
  if (audioFiles.length > 0) {
    const normOutput = output.replace(/\.mp4$/, ".norm.mp4");
    const normCmd = [
      "ffmpeg", "-y", "-i", output,
      "-c:v", "copy",
      "-af", "loudnorm=I=-14:TP=-1.5:LRA=11",
      "-c:a", "aac", "-b:a", "128k",
      "-movflags", "+faststart",
      normOutput,
    ].join(" ");
    try {
      execSync(normCmd, { stdio: ["pipe", "pipe", "pipe"], timeout: 120_000 });
      fs.renameSync(normOutput, output);
      console.error("[hyperframes] audio normalized to -14 LUFS");
    } catch (e) {
      console.error("[hyperframes] loudness normalization failed, keeping original");
      if (fs.existsSync(normOutput)) fs.unlinkSync(normOutput);
    }
  }

  console.log(output);
}

main();
