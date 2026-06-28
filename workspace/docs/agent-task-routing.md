# Agent Task Routing — Who Does What

Last updated: 2026-06-28

## System Capabilities

| System | Speed | Strength | Weakness |
|---|---|---|---|
| **Hermes ⚡** | Seconds | Direct script execution, image rendering, batch triggers, quick LLM consults | No memory, no multi-step reasoning, no code changes |
| **OpenClaw 🐾** | Minutes | Deep reasoning (DeepSeek/Gemini), memory, multi-step skills, creative copy, analysis | Slower, heavier context, overkill for simple triggers |
| **Claude Code 💻** | Minutes | Code changes, deploy, complex implementation, full codebase access | Needs human present in VS Code |
| **Codex 🤖** | Minutes | Image generation (bridge), batch code changes, autonomous content | No live site access, no deploy |
| **Owner 👤** | — | Business decisions, approvals, key rotation, content review | — |

## Open Task Assignments

### ⚡ Hermes (run from dashboard — fast, no thinking)

| Task | Action | Dashboard Engine |
|---|---|---|
| USEO-11 Humanizer ongoing | Run batches of 10-50 | Humanizer — Run Batch |
| Video pipeline builds | Queue reels, trigger builds | Video — Enqueue / Build Now |
| Blog hero backfill | Generate missing featured images | Blog Hero Generator |
| GMC sync after fixes | Trigger feed refresh | GMC — Trigger Sync |
| CWV monitoring | Weekly Lighthouse checks | CWV Monitor |
| SEO rotating checks | Run today's check | SEO — Rotating Check |
| Cache revalidation | Clear ISR after content changes | Cache — Revalidate |
| Content calendar | Daily plan + dispatch | Content Orchestrator — Plan |
| Product image generation | On-demand creative assets | Creative Engine |
| Quick content writing | Captions, short descriptions | AI Write |
| Quick quality review | GMC safety, brand voice check | AI Review |

### 🐾 OpenClaw (run from dashboard — deep reasoning)

| Task | Why OpenClaw | Dashboard Engine |
|---|---|---|
| GROW-2 Backlink/PR pipeline | Needs research, outreach planning, contact tracking | Send Task |
| GROW-3 Cross-platform syndication | Multi-step workflow across platforms | Send Task |
| GROW-4 Reddit community marketing | Needs community analysis, response drafting with context | Send Task |
| O-2 Origin editorial (19 countries) | Needs research + LLM writing per country | Send Task / Auto Publisher |
| O-3 Compare page pairs | Needs product analysis + competitive writing | Send Task |
| O-4 Best page topics | Needs GSC analysis + content strategy | Send Task |
| D6 GMC appeals (4 products) | Needs reasoning about GMC policy language | Send Task |
| Ad campaigns | Multi-platform creative copy | Ad Generator |
| SEO analysis reports | Deep ranking/gap analysis | SEO Report |
| Competitor pricing | Research + comparison + recommendations | Competitor Prices |
| Blog content strategy | Topic selection, editorial calendar | Auto Publisher |
| CO-7 Judge.me + ingredient wiring | Needs analysis of review data patterns | Send Task |

### 💻 Claude Code (needs human in VS Code)

| Task | Why Claude Code |
|---|---|
| UX-ORCH-3/4/8 Visual safety + a11y | Frontend code changes in apps/web |
| UX-ORCH-5 Frontend health monitoring | New provider integration code |
| ORCH-5 PM2 ecosystem config | PM2 restart with new config |
| ORCH-6 Disaster recovery drill | System-level operations |
| USEO-10 FAQ improvement pipeline | Woo meta write pipeline code |
| F2 emart-embed cold start | Service config/code optimization |
| Deploy any code changes | rsync → VPS build → pm2 restart |

### 🤖 Codex (autonomous, no deploy)

| Task | Why Codex |
|---|---|
| VID-8 Product-hand image generation | Image generation via bridge |
| VID-11 Batch approval pack | Excel/CSV generation + creative assets |
| X2 Impression-priority humanizer batch | Long-running JSONL generation |
| X11 Blog pilot revision | Content rewrite + QA |
| AI-8 pa_concern review queue | Batch data analysis + proposals |
| P4.skin/P4.ingr auto-assign | Rule-based batch processing |
| UX-4 CRO plan | Analysis + proposal document |

### 👤 Owner (decisions only)

| Task | Decision needed |
|---|---|
| 1a WA-G key rotation | Revoke old WP/WC keys in WordPress |
| D6 shade name titles (8) | Rename shades to codes, accept, or exclude |
| D6 GMC appeals (4) | File appeals in GMC dashboard |
| 4013 stock fix | Set in-stock or out-of-stock |
| O-15 Meta Page token | Regenerate with comment permissions |
| O-16 TikTok app | Share Client Key when approved |
| VID-4 Reel standard sign-off | Approve reel style in Telegram |
| VID-11 Batch approval | Review and approve product/schedule pack |

## Routing Rules

1. **"Generate/render/build something"** → Hermes ⚡
2. **"Analyze/research/write strategy"** → OpenClaw 🐾
3. **"Change code/deploy"** → Claude Code 💻
4. **"Generate images/batch content"** → Codex 🤖
5. **"Approve/decide/rotate keys"** → Owner 👤
6. **If unsure** → use Hermes AI Plan to break the task into steps, then route each step
