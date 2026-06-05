#!/usr/bin/env bash
# EAS Build + Submit to Google Play
# Usage: ./scripts/eas-submit.sh [--build-only | --submit-only <build-id>]
set -e

MOBILE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TOKEN_FILE="/root/.config/expo-token"

if [ -f "$TOKEN_FILE" ]; then
  export EXPO_TOKEN="$(cat "$TOKEN_FILE")"
fi

if [ -z "$EXPO_TOKEN" ]; then
  echo "ERROR: EXPO_TOKEN not set."
  echo "Get token from: expo.dev → Account → Access Tokens → Create"
  echo "Then run: echo 'YOUR_TOKEN' > /root/.config/expo-token"
  exit 1
fi

if [ ! -f "/root/.config/emart-play-service-account.json" ]; then
  echo "ERROR: Play Store service account not found."
  echo "Get it from: Play Console → Setup → API access → Service accounts → JSON key"
  echo "Save to: /root/.config/emart-play-service-account.json"
  exit 1
fi

cd "$MOBILE_DIR"

if [ "$1" = "--submit-only" ] && [ -n "$2" ]; then
  eas submit --platform android --id "$2" --non-interactive
elif [ "$1" = "--build-only" ]; then
  eas build --platform android --profile production --non-interactive
else
  eas build --platform android --profile production --non-interactive --auto-submit
fi
