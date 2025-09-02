#!/bin/bash

# Convenience wrapper to start VideoParty
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

exec ./scripts/startup.sh
