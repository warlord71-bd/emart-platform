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

// ── Caption styling ───────────────────────────────────────────────────
const GOLD = "#e7b24a";
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

// ── Caption overlay elements ───────────────────────────────────────────

function captionElements(script, totalDuration, safeZone, benefitLimit = 3) {
  if (!script) return "";
  const zone = SAFE_ZONES[safeZone] || SAFE_ZONES.wide;
  const hook = script.hook || "";
  const benefits = (script.benefits || []).filter(Boolean).slice(0, Math.max(0, benefitLimit));
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

function buildTimeline(scenes, script, totalDuration, secondsPerScene, benefitLimit = 3) {
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
    if (s.type === "image" && !s.static) {
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

  });

  // Caption animations
  if (script) {
    const hook = script.hook;
    const benefits = (script.benefits || []).filter(Boolean).slice(0, Math.max(0, benefitLimit));
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
  const listCards = job.list_cards || [];

  // Build scene metadata + HTML
  const scenesMeta = [];
  const scenesHtml = [];

  images.forEach((img, i) => {
    const start =
      i === 0 ? 0 : secondsPerScene * i - CROSSFADE * i;
    const dur = secondsPerScene;
    const id = `scene-${i}`;

    const base = path.basename(img);
    const isStaticFrame =
      base.startsWith("producthero-") ||
      base.startsWith("listcard-") ||
      base.startsWith("card-");
    const isFit = (job.images || []).map(p => path.resolve(p)).includes(path.resolve(img));
    const dataUri = imgToDataUri(img);
    scenesMeta.push({
      id,
      start,
      duration: dur,
      type: "image",
      static: isStaticFrame,
    });
    scenesHtml.push(sceneImage(id, dataUri, start, dur, i, isFit || isStaticFrame));
  });

  // Confine captions to photo frames only; Creative Engine card frames already carry their own text.
  const cardFrames = listCards.length + (job.brand_card ? 1 : 0);
  const photoFrames = Math.max(1, nScenes - cardFrames);
  const captionWindow = cardFrames ? secondsPerScene * photoFrames : totalDuration;

  const benefitLimit = Number(job.caption_benefit_limit ?? (job.product_card ? 1 : 3));
  const visualCaptions = job.visual_captions !== false && !(job.product_card && job.visual_captions !== true);
  const captions = visualCaptions ? captionElements(script, captionWindow, safeZone, benefitLimit) : "";
  const timeline = buildTimeline(
    scenesMeta,
    visualCaptions ? script : null,
    captionWindow,
    secondsPerScene,
    benefitLimit,
  );

  // Audio: copy files into project dir and use relative paths
  let audioHtml = "";
  const audioFiles = [];
  if (audioPath && fs.existsSync(audioPath)) {
    audioFiles.push({ src: audioPath, dest: "voiceover" + path.extname(audioPath) });
    audioHtml += `\n    <audio id="voiceover" src="voiceover${path.extname(audioPath)}"
      data-start="0" data-duration="${totalDuration}" data-track-index="5" data-volume="1"></audio>`;
  }
  if (musicPath && fs.existsSync(musicPath)) {
    const musicVol = Number(job.music_volume ?? (audioPath ? 0.14 : 0.42));
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
  const preset = getArg("--render-preset") || job.render_preset || job.hyperframes_preset || "standard";
  const qualityArg = getArg("--quality") || job.hyperframes_quality || (preset === "premium" ? "high" : "standard");
  const quality = ["draft", "standard", "high"].includes(qualityArg) ? qualityArg : "standard";
  const lowMemoryFlag = preset === "premium" ? "--no-low-memory-mode" : "--low-memory-mode";
  const videoBitrate = getArg("--video-bitrate") || job.video_bitrate || (preset === "premium" ? "8M" : null);

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
  const cmdParts = [
    hyperframesCmd,
    "render",
    tmpDir,
    "--fps", "24",
    "--quality", quality,
    "--output", output,
    lowMemoryFlag,
    "--quiet",
  ];
  if (videoBitrate) {
    cmdParts.push("--video-bitrate", videoBitrate);
  }
  const cmd = cmdParts.join(" ");

  console.error(`[hyperframes] rendering ${jid} (${images.length} scenes, preset=${preset}, quality=${quality})...`);
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
