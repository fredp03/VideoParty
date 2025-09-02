#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

if [ -f .videoparty-pids ]; then
	# shellcheck source=/dev/null
	source .videoparty-pids
	echo "Stopping VideoParty (server PID: ${SERVER_PID:-?}, Caddy PID: ${CADDY_PID:-?})"
else
	echo "No PID file; attempting to stop by process name"
fi

# Stop node server
pkill -f "node.*server" || true

# Stop caddy
sudo pkill caddy || true

rm -f .videoparty-pids
echo "Stopped."
