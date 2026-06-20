Run the session start protocol for emart-platform. Read these in parallel and give me a concise summary:

1. `cat /root/emart-platform/apps/web/.agent-memory/AGENT_BUS.md` — check active work / conflicts
2. `cat /root/emart-platform/apps/web/.agent-memory/MEMORY.md` — durable facts
3. `tail -50 /root/emart-platform/apps/web/SESSION-LOG.md` — recent session history
4. `cat /root/emart-platform/workspace/TASKS.md | head -80` — open tasks
5. `git -C /root/emart-platform log --oneline -15` — recent commits
6. `git -C /root/emart-platform status --short` — uncommitted changes
7. `pm2 status` — running processes
8. `curl -fsS -o /dev/null -w "live: %{http_code}\n" https://e-mart.com.bd/` — site health

Summarize in a short briefing: what's running, what changed recently, any active work conflicts, site status, and top open tasks. Keep it under 15 lines.
