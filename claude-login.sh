#!/bin/bash
# Claude Code Auto-Login Script
# Run this on your VPS when auth fails

echo "=== Claude Code Login Helper ==="
echo ""

# Step 1: Clear any broken config
echo "[1/3] Clearing old auth..."
unset ANTHROPIC_BASE_URL
unset ANTHROPIC_API_KEY

# Remove OpenRouter config if present
if grep -q "openrouter" ~/.bashrc 2>/dev/null; then
  sed -i '/openrouter/Id' ~/.bashrc
  sed -i '/ANTHROPIC_BASE_URL/d' ~/.bashrc
  echo "    Removed OpenRouter config from .bashrc"
fi

# Step 2: Logout cleanly
echo "[2/3] Logging out old session..."
claude auth logout 2>/dev/null || true

# Step 3: Login
echo "[3/3] Starting fresh login..."
echo ""
echo ">>> A URL will appear below. Open it in your browser."
echo ">>> Log in with your Claude.ai account."
echo ">>> Copy the code shown on the page."
echo ">>> Paste it here and press Enter."
echo ""
claude auth login

echo ""
echo "=== Verifying login ==="
claude --version && echo "Login successful! Run: claude" || echo "Login failed, try again."
