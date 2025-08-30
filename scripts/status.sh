#!/bin/bash

# VideoParty Quick Status Check
# Shows current system status and process information

PROJECT_DIR="/Users/fredparsons/Documents/Side Projects/Fred Av/VideoParty"
cd "$PROJECT_DIR"

echo "📊 VideoParty System Status"
echo "==========================="
echo ""

# Check if system is running
if [ -f ".videoparty-pids" ]; then
    source .videoparty-pids
    uptime=$(($(date +%s) - $STARTED))
    hours=$((uptime / 3600))
    minutes=$(((uptime % 3600) / 60))
    echo "🟢 System Status: RUNNING"
    echo "   Started: $(date -r $STARTED)"
    echo "   Uptime: ${hours}h ${minutes}m"
    echo "   Server PID: $SERVER_PID"
    echo "   Caddy PID: $CADDY_PID"
else
    echo "🔴 System Status: STOPPED"
    echo "   No active VideoParty processes found"
fi

echo ""
echo "🌐 Quick Tests:"

# Test local API
if curl -s --max-time 3 "http://localhost:8080/api/health" >/dev/null 2>&1; then
    echo "   ✅ Local API (port 8080)"
else
    echo "   ❌ Local API (port 8080)"
fi

# Test public API
if curl -s --max-time 5 "https://fredav-videoparty.freeddns.org/api/health" >/dev/null 2>&1; then
    echo "   ✅ Public HTTPS API"
else
    echo "   ❌ Public HTTPS API"
fi

# Test frontend
if curl -s --max-time 3 "https://fredav.netlify.app" >/dev/null 2>&1; then
    echo "   ✅ Frontend (Netlify)"
else
    echo "   ❌ Frontend (Netlify)"
fi

echo ""
echo "🔧 Management Commands:"
echo "   Start:    ./scripts/startup.sh"
echo "   Stop:     ./scripts/shutdown.sh"
echo "   Health:   ./health-check.sh"
