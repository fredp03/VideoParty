#!/bin/bash

# VideoParty Local Testing Script
# This allows testing the app locally while waiting for DNS propagation

set -e

PROJECT_DIR="/Users/fredparsons/Documents/Side Projects/Fred Av/VideoParty"
cd "$PROJECT_DIR"

echo "🚀 Starting VideoParty Local Test Environment"
echo "============================================="

# Check if VideoParty server is running
if ! curl -s "http://localhost:8080/api/health" > /dev/null 2>&1; then
    echo "❌ VideoParty server not running on port 8080"
    echo "   Start it with: npm start"
    exit 1
fi

echo "✅ VideoParty server running on port 8080"

# Start Caddy with local configuration
echo "🔒 Starting Caddy with local HTTPS (self-signed certificates)..."
sudo caddy run --config Caddyfile.local &
CADDY_PID=$!

# Wait for Caddy to start
sleep 3

# Test local HTTPS endpoint
echo "🧪 Testing local HTTPS endpoint..."
if curl -k -s "https://localhost:8443/api/health" > /dev/null 2>&1; then
    echo "✅ Local HTTPS working at https://localhost:8443"
    echo ""
    echo "📱 Local Test URLs:"
    echo "   Frontend: https://fredav.netlify.app"
    echo "   Backend:  https://localhost:8443"
    echo ""
    echo "🔧 For testing, update your frontend to use:"
    echo "   API_BASE_URL: 'https://localhost:8443'"
    echo ""
    echo "⚠️  You'll need to accept the self-signed certificate in your browser"
else
    echo "❌ Local HTTPS not responding"
fi

echo ""
echo "Press Ctrl+C to stop Caddy and exit..."

# Wait for interrupt
trap "echo 'Stopping Caddy...'; sudo kill $CADDY_PID 2>/dev/null || true; exit 0" INT
wait
