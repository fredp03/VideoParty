#!/bin/bash

# VideoParty Status Automator Script
# This script is designed to be run from an Automator app

# Set the project directory
PROJECT_DIR="/Users/fredparsons/Documents/Side Projects/Fred Av/VideoParty"

# Change to project directory
cd "$PROJECT_DIR"

# Run the status script and keep terminal open to show output
osascript <<EOF
tell application "Terminal"
    activate
    do script "cd '$PROJECT_DIR' && ./scripts/status.sh && echo '' && echo 'Press any key to close this window...' && read -n 1"
end tell
EOF
