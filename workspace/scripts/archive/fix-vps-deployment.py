#!/usr/bin/env python3
"""
Emart Platform VPS Fix Script
Resets to correct branch and rebuilds the application
"""

import os
import subprocess
import sys
from pathlib import Path
from datetime import datetime

class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def log(msg, level="INFO"):
    timestamp = datetime.now().strftime("%H:%M:%S")
    if level == "INFO":
        print(f"{Colors.OKBLUE}[{timestamp}] ℹ️  {msg}{Colors.ENDC}")
    elif level == "SUCCESS":
        print(f"{Colors.OKGREEN}[{timestamp}] ✅ {msg}{Colors.ENDC}")
    elif level == "WARNING":
        print(f"{Colors.WARNING}[{timestamp}] ⚠️  {msg}{Colors.ENDC}")
    elif level == "ERROR":
        print(f"{Colors.FAIL}[{timestamp}] ❌ {msg}{Colors.ENDC}")
    elif level == "STEP":
        print(f"\n{Colors.BOLD}{Colors.HEADER}{'='*60}{Colors.ENDC}")
        print(f"{Colors.BOLD}{Colors.HEADER}>>> {msg}{Colors.ENDC}")
        print(f"{Colors.BOLD}{Colors.HEADER}{'='*60}{Colors.ENDC}\n")

def run_cmd(cmd, description=""):
    """Execute shell command and return result"""
    if description:
        log(description, "INFO")
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.returncode != 0:
            log(f"Command failed: {cmd}", "ERROR")
            if result.stderr:
                print(result.stderr)
            return False
        if result.stdout:
            print(result.stdout.strip())
        return True
    except Exception as e:
        log(f"Exception running command: {e}", "ERROR")
        return False

def main():
    log("Starting Emart Platform VPS Fix", "STEP")

    # Check if running as root
    if os.geteuid() != 0:
        log("This script should be run as root", "WARNING")

    vps_path = "/var/www/emart-platform"

    # Step 1: Check current state
    log("Checking current git state", "STEP")
    os.chdir(vps_path)

    run_cmd("git branch -v", "Current branch:")
    run_cmd("git log --oneline -1", "Latest commit:")

    # Step 2: Fetch and reset
    log("Resetting to correct branch (claude/identify-recent-work-vps-bCSFy)", "STEP")

    if not run_cmd("git fetch origin claude/identify-recent-work-vps-bCSFy", "Fetching branch..."):
        log("Failed to fetch branch", "ERROR")
        sys.exit(1)

    if not run_cmd("git reset --hard origin/claude/identify-recent-work-vps-bCSFy", "Hard reset to remote branch..."):
        log("Failed to reset branch", "ERROR")
        sys.exit(1)

    log("Branch reset successful", "SUCCESS")

    # Step 3: Verify branch
    log("Verifying branch after reset", "STEP")
    run_cmd("git branch -v", "Current branch:")
    run_cmd("git log --oneline -5", "Recent commits:")

    # Step 4: Clean and rebuild
    log("Cleaning and rebuilding Next.js app", "STEP")

    os.chdir(f"{vps_path}/apps/web")

    run_cmd("rm -rf .next", "Removing .next directory...")
    run_cmd("rm -rf node_modules", "Removing node_modules...")
    log("Installing dependencies (this may take a minute)...", "INFO")
    if not run_cmd("npm install", ""):
        log("npm install failed", "ERROR")
        sys.exit(1)

    log("Building Next.js application (this may take 2-3 minutes)...", "INFO")
    if not run_cmd("npm run build", ""):
        log("npm build failed", "ERROR")
        sys.exit(1)

    log("Build completed successfully", "SUCCESS")

    # Step 5: Restart PM2
    log("Restarting application via PM2", "STEP")

    run_cmd("pm2 restart emartweb", "Restarting emartweb...")
    run_cmd("sleep 5", "Waiting for app to start...")

    # Step 6: Verify
    log("Final verification", "STEP")

    run_cmd("pm2 status", "PM2 Status:")
    run_cmd("pm2 logs emartweb --lines 20", "Recent logs:")

    log("Testing homepage...", "INFO")
    result = subprocess.run(
        "curl -s http://5.189.188.229 | head -50",
        shell=True,
        capture_output=True,
        text=True
    )

    if "<!DOCTYPE" in result.stdout or "<html" in result.stdout:
        log("Homepage is responding with HTML", "SUCCESS")
    else:
        log("Homepage might not be responding correctly", "WARNING")

    # Final summary
    log("Fix Complete! 🎉", "STEP")
    print(f"""
{Colors.OKGREEN}✅ All steps completed!{Colors.ENDC}

Next steps:
1. Open browser: http://5.189.188.229
2. Hard refresh: Ctrl+Shift+R
3. Verify: Logo, styling, and layout are back
4. Check: Product images loading

If all looks good:
5. Update Cloudflare DNS: 103.138.150.34 → 5.189.188.229
6. Go live! 🚀

Branch: {Colors.BOLD}claude/identify-recent-work-vps-bCSFy{Colors.ENDC}
Status: {Colors.OKGREEN}Ready for deployment{Colors.ENDC}
    """)

if __name__ == "__main__":
    main()
