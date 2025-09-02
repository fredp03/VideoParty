#!/bin/bash

# VideoParty Master Startup Script
# Starts all services required for the live VideoParty system

set -e

PROJECT_DIR="/Users/fredparsons/Documents/Side Projects/Fred Av/VideoParty"
cd "$PROJECT_DIR"

echo "🚀 VideoParty Master Startup"
echo "============================="
echo "Starting all services for live deployment..."
echo ""

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -i :$port >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to wait for service to start
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    echo "⏳ Waiting for $service_name to start..."
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            echo "✅ $service_name is running"
            return 0
        fi
        echo "   Attempt $attempt/$max_attempts..."
        sleep 2
        ((attempt++))
    done
    
    echo "❌ $service_name failed to start after $max_attempts attempts"
    return 1
}

# Step 1: Check prerequisites
echo "1️⃣ Checking prerequisites..."

# Check if Node.js is available
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

# Check if Caddy is available
if ! command -v caddy >/dev/null 2>&1; then
    echo "❌ Caddy not found. Please install Caddy first."
    exit 1
fi

# Check if project files exist
if [ ! -f "server/package.json" ]; then
    echo "❌ server/package.json not found. Are you in the correct directory?"
    exit 1
fi

if [ ! -f "Caddyfile" ]; then
    echo "❌ Caddyfile not found. Configuration missing."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Step 2: Update DNS (if needed)
echo "2️⃣ Updating DNS record..."
if [ -f "scripts/dynu-ddns.sh" ] && [ -f ".env.ddns" ]; then
    bash scripts/dynu-ddns.sh || true
    echo "✅ DNS update attempted"
else
    echo "⚠️  DNS update script not found, skipping..."
fi
echo ""

# Step 2b: Validate DNS resolves to current public IP
echo "🔎 Validating DNS A record..."
PUBLIC_IP=$(curl -4 -fsS --max-time 10 https://ifconfig.co || true)
RESOLVED_IP=$(dig +short fredav-videoparty.freeddns.org A @1.1.1.1 | head -1 || true)
if [ -n "$PUBLIC_IP" ] && [ -n "$RESOLVED_IP" ]; then
    if [ "$PUBLIC_IP" != "$RESOLVED_IP" ]; then
        echo "⚠️  DNS mismatch: public IP is $PUBLIC_IP but DNS resolves to $RESOLVED_IP"
        echo "   Web clients may fail TLS until DNS propagates."
    else
        echo "✅ DNS A record matches current public IP ($PUBLIC_IP)"
    fi
else
    echo "⚠️  Unable to validate DNS/IP fully (PUBLIC_IP='$PUBLIC_IP', RESOLVED_IP='$RESOLVED_IP')"
fi
echo ""

# Step 3: Install/update dependencies
echo "3️⃣ Checking Node.js dependencies..."
if [ ! -d "server/node_modules" ] || [ "server/package.json" -nt "server/node_modules" ]; then
    echo "📦 Installing/updating dependencies..."
    cd server
    npm install
    cd ..
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies up to date"
fi
echo ""

# Step 4: Stop any existing services
echo "4️⃣ Stopping any existing services..."

# Stop existing VideoParty processes
if check_port 8080; then
    echo "🛑 Stopping existing VideoParty server on port 8080..."
    pkill -f "node.*server" || true
    sleep 2
fi

# Stop existing Caddy processes
if check_port 443 || check_port 80; then
    echo "🛑 Stopping existing Caddy processes..."
    sudo pkill caddy || true
    sleep 2
fi

echo "✅ Cleanup completed"
echo ""

# Step 5: Start VideoParty server
echo "5️⃣ Starting VideoParty server..."

# Check media directory
if [ ! -d "server/media" ]; then
    echo "📁 Creating media directory..."
    mkdir -p server/media
fi

media_count=$(find server/media -type f \( -name "*.mp4" -o -name "*.mkv" -o -name "*.avi" -o -name "*.mov" \) | wc -l)
echo "📽️  Found $media_count media files"

# Start server in background
echo "🎬 Starting VideoParty server on port 8080..."
cd server
nohup npm start > ../logs/server.log 2>&1 &
SERVER_PID=$!
cd ..
echo "   Server PID: $SERVER_PID"

# Wait for server to start
if wait_for_service "http://localhost:8080/api/health" "VideoParty Server"; then
    echo "✅ VideoParty server started successfully"
else
    echo "❌ VideoParty server failed to start"
    echo "   Check logs/server.log for details"
    exit 1
fi
echo ""

# Step 6: Start Caddy reverse proxy
echo "6️⃣ Starting Caddy reverse proxy..."
echo "🔒 Starting HTTPS proxy for fredav-videoparty.freeddns.org..."

# Ensure logs directory exists
mkdir -p logs

# Start Caddy in background
nohup sudo caddy run --config Caddyfile > logs/caddy.log 2>&1 &
CADDY_PID=$!
echo "   Caddy PID: $CADDY_PID"

# Wait for Caddy to start
sleep 5
if check_port 443; then
    echo "✅ Caddy HTTPS proxy started successfully"
else
    echo "❌ Caddy failed to start"
    echo "   Check logs/caddy.log for details"
    exit 1
fi
echo ""

# Step 7: Test the system
echo "7️⃣ Testing system endpoints..."

# Test local API
if curl -s "http://localhost:8080/api/health" >/dev/null; then
    echo "✅ Local API responding"
else
    echo "❌ Local API not responding"
fi

# Test public HTTPS API (with timeout)
if curl -s --max-time 10 "https://fredav-videoparty.freeddns.org/api/health" >/dev/null; then
    echo "✅ Public HTTPS API responding"
    echo "✅ SSL certificates working"
else
    echo "⚠️  Public HTTPS API not responding (may still be starting SSL certificates)"
fi

# Test media endpoint
if curl -s -I "http://localhost:8080/media/test-video.mp4" >/dev/null 2>&1; then
    echo "✅ Media endpoint responding"
else
    echo "⚠️  No test video found (add media files to server/media/)"
fi

echo ""

# Step 8: Save process information
echo "8️⃣ Saving process information..."
cat > .videoparty-pids << EOF
# VideoParty Process IDs
# Generated: $(date)
SERVER_PID=$SERVER_PID
CADDY_PID=$CADDY_PID
STARTED=$(date +%s)
EOF
echo "✅ Process information saved to .videoparty-pids"
echo ""

# Final status
echo "🎉 VideoParty System Started Successfully!"
echo "=========================================="
echo ""
echo "📊 System Status:"
echo "   🎬 VideoParty Server: Running (PID: $SERVER_PID)"
echo "   🔒 Caddy HTTPS Proxy: Running (PID: $CADDY_PID)"
echo "   📁 Media Files: $media_count files available"
echo ""
echo "🌐 Access URLs:"
echo "   Frontend:     https://fredav.netlify.app"
echo "   Backend API:  https://fredav-videoparty.freeddns.org"
echo "   Local API:    http://localhost:8080"
echo ""
echo "📋 Management:"
echo "   Status:       ./scripts/health-check.sh"
echo "   Stop All:     ./stop-videoparty.sh"
echo "   Logs:         tail -f logs/server.log"
echo "                 tail -f logs/caddy.log"
echo ""
echo "✅ System is ready for use!"

# Optional quick WebSocket check (local)
sleep 1
echo ""
echo "🧪 Quick TLS sanity:"
if curl -Iv --max-time 8 --resolve fredav-videoparty.freeddns.org:443:127.0.0.1 https://fredav-videoparty.freeddns.org/api/health >/dev/null 2>&1; then
    echo "   ✅ Local TLS/Cert OK via Caddy"
else
    echo "   ❌ Local TLS probe failed (check logs/caddy.log)"
fi

