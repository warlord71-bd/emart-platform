# E-Mart BD SEO Implementation - Claude Code Package

This package contains everything you need to implement Phase 1 of the E-Mart BD SEO roadmap using Claude Code.

## Package Contents

1. **emart-preflight-checklist.md** - Run this FIRST to verify your environment
2. **CLAUDE.md** - Project configuration file (place in `/var/www/emart-platform/apps/web/`)
3. **phase1-seo-foundation.md** - The actual implementation prompt for Claude Code
4. **emart-seo-implementation-prompt.md** - Full 4-phase roadmap (reference only, use phases separately)

## Quick Start Instructions

### Step 1: Pre-Flight Check (10 minutes)
```bash
# SSH into your server
ssh root@5.189.188.229

# Navigate to project
cd /var/www/emart-platform/apps/web

# Run all checks from emart-preflight-checklist.md
# Fix any RED FLAGS before proceeding
```

### Step 2: Install CLAUDE.md
```bash
# Still on server, in /var/www/emart-platform/apps/web/
# Upload or create CLAUDE.md in this directory

# Verify it's there
ls -la CLAUDE.md
```

### Step 3: Start Claude Code
```bash
# On your local machine or server (where Claude Code is installed)
cd /var/www/emart-platform/apps/web

# Start with auto mode for efficiency
claude --enable-auto-mode

# Or if you prefer manual approvals first
claude
```

### Step 4: Paste Phase 1 Prompt
- Copy the ENTIRE content of `phase1-seo-foundation.md`
- Paste it into Claude Code
- Let Claude work through the tasks
- Monitor with `/context` command

### Step 5: Verify Success
After Claude completes Phase 1, run the verification checklist at the end of the prompt.

All checks must pass before proceeding to Phase 2.

## Expected Results

**Phase 1 Completion:**
- ✅ Schema markup added (Organization, WebSite, Product)
- ✅ Sitemap generated (220+ URLs)
- ✅ Robots.txt created
- ✅ Meta tags on all pages
- ✅ Lighthouse SEO score: 80-82
- ✅ Build succeeds without errors

**Timeline:** 2-3 hours

## Troubleshooting

### If build fails:
```bash
rm -rf .next node_modules/.cache
npm install
npm run build
```

### If context fills up (>50%):
```bash
/compact
```

### If you need to rollback:
```bash
/rewind
# Select checkpoint to restore
```

### If Claude gets stuck:
1. Use `/clear` to reset context
2. Re-paste the current task only
3. Reference previous work with `@file.tsx`

## Claude Code Commands Reference

- `/context` - Check context usage
- `/compact` - Reduce context size
- `/checkpoint "message"` - Create restore point
- `/rewind` - View and restore checkpoints
- `/clear` - Reset conversation (keeps files)
- `@filename` - Reference file in prompt
- `!command` - Run bash command immediately

## Support

If you encounter issues:
1. Check the pre-flight checklist again
2. Review CLAUDE.md for project-specific rules
3. Consult the full roadmap in emart-seo-implementation-prompt.md
4. Create checkpoint before trying fixes

## Next Steps After Phase 1

Once Phase 1 verification passes:
1. Commit: `git commit -m "feat: Phase 1 SEO foundation complete"`
2. Deploy: `pm2 restart emartweb`
3. Verify on live IP: `curl http://5.189.188.229/sitemap.xml`
4. Request Phase 2 prompt (UI Enhancement)

---

**Good luck! The pre-flight checklist will catch 90% of potential issues.**
