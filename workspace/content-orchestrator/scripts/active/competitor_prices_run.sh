#!/usr/bin/env bash
export NODE_PATH=/usr/lib/node_modules
exec node "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/competitor_price_checker.js"
