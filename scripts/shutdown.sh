#!/bin/bash

# VideoParty Master Shutdown Script
# Safely stops all services and cleans up resources

set -e

PROJECT_DIR="/Users/fredparsons/Documents/Side Projects/Fred Av/VideoParty"
cd "$PROJECT_DIR"

echo "🛑 VideoParty Master Shutdown"
echo "============================="
echo "Stopping all VideoParty services..."
echo ""

# Function to check if process is running
check_process() {
    local pid=$1
    if ps -p $pid >/dev/null 2>&1; then
        return 0  # Process is running
    else
        return 1  # Process not running
    fi
}

# Function to gracefully stop process
stop_process() {
    local pid=$1
    local name=$2
    local use_sudo=$3
    
    if check_process $pid; then
        echo "🛑 Stopping $name (PID: $pid)..."
        if [ "$use_sudo" = "true" ]; then
            sudo kill -TERM $pid 2>/dev/null || true
        else
            kill -TERM $pid 2>/dev/null || true
        fi
        
        # Wait for graceful shutdown
        local count=0
        while check_process $pid && [ $count -lt 10 ]; do
            sleep 1
            ((count++))
        done
        
        # Force kill if still running
        if check_process $pid; then
            echo "⚠️  Force stopping $name..."
            if [ "$use_sudo" = "true" ]; then
                sudo kill -KILL $pid 2>/dev/null || true
            else
                kill -KILL $pid 2>/dev/null || true
            fi
        fi
        
        echo "✅ $name stopped"
    else
        echo "ℹ️  $name was not running"
    fi
}

# Step 1: Load process information
echo "1️⃣ Loading process information..."
if [ -f ".videoparty-pids" ]; then
    source .videoparty-pids
    echo "✅ Found process information"
    echo "   Server PID: ${SERVER_PID:-"not found"}"
    echo "   Caddy PID: ${CADDY_PID:-"not found"}"
    if [ -n "$STARTED" ]; then
        uptime=$(($(date +%s) - $STARTED))
        echo "   Uptime: ${uptime} seconds"
    fi
else
    echo "⚠️  No process information found (.videoparty-pids missing)"
    echo "   Will attempt to find and stop processes by name/port"
fi
echo ""

# Step 2: Stop Caddy (needs sudo)
echo "2️⃣ Stopping Caddy reverse proxy..."
if [ -n "$CADDY_PID" ]; then
    stop_process $CADDY_PID "Caddy" true
else
    # Find Caddy processes by name
    CADDY_PIDS=$(pgrep caddy 2>/dev/null || true)
    if [ -n "$CADDY_PIDS" ]; then
        for pid in $CADDY_PIDS; do
            stop_process $pid "Caddy" true
        done
    else
        echo "ℹ️  No Caddy processes found"
    fi
fi

# Also stop any caddy processes on ports 80/443
if lsof -i :443 >/dev/null 2>&1; then
    echo "🛑 Stopping processes on port 443..."
    sudo lsof -ti :443 | xargs sudo kill -TERM 2>/dev/null || true
fi

if lsof -i :80 >/dev/null 2>&1; then
    echo "🛑 Stopping processes on port 80..."
    sudo lsof -ti :80 | xargs sudo kill -TERM 2>/dev/null || true
fi

echo ""

# Step 3: Stop VideoParty server
echo "3️⃣ Stopping VideoParty server..."
if [ -n "$SERVER_PID" ]; then
    stop_process $SERVER_PID "VideoParty Server" false
else
    # Find Node.js processes running the server
    NODE_PIDS=$(pgrep -f "node.*server" 2>/dev/null || true)
    if [ -n "$NODE_PIDS" ]; then
        for pid in $NODE_PIDS; do
            stop_process $pid "VideoParty Server" false
        done
    else
        echo "ℹ️  No VideoParty server processes found"
    fi
fi

# Also stop any processes on port 8080
if lsof -i :8080 >/dev/null 2>&1; then
    echo "🛑 Stopping processes on port 8080..."
    lsof -ti :8080 | xargs kill -TERM 2>/dev/null || true
fi

echo ""

# Step 4: Clean up resources
echo "4️⃣ Cleaning up resources..."

# Remove PID file
if [ -f ".videoparty-pids" ]; then
    rm .videoparty-pids
    echo "✅ Removed process information file"
fi

# Clean up any stale lock files
if [ -d "node_modules/.cache" ]; then
    echo "🧹 Cleaning Node.js cache..."
    rm -rf node_modules/.cache/* 2>/dev/null || true
fi

# Rotate logs if they're getting large
if [ -f "logs/server.log" ] && [ $(stat -f%z "logs/server.log" 2>/dev/null || echo 0) -gt 10485760 ]; then
    echo "📝 Rotating large server log..."
    mv logs/server.log logs/server.log.old
fi

if [ -f "logs/caddy.log" ] && [ $(stat -f%z "logs/caddy.log" 2>/dev/null || echo 0) -gt 10485760 ]; then
    echo "📝 Rotating large Caddy log..."
    mv logs/caddy.log logs/caddy.log.old
fi

echo "✅ Cleanup completed"
echo ""

# Step 5: Verify shutdown
echo "5️⃣ Verifying shutdown..."

# Check if ports are free
ports_clear=true

if lsof -i :8080 >/dev/null 2>&1; then
    echo "⚠️  Port 8080 still in use"
    ports_clear=false
fi

if lsof -i :80 >/dev/null 2>&1; then
    echo "⚠️  Port 80 still in use"
    ports_clear=false
fi

if lsof -i :443 >/dev/null 2>&1; then
    echo "⚠️  Port 443 still in use"
    ports_clear=false
fi

if $ports_clear; then
    echo "✅ All ports cleared"
else
    echo "⚠️  Some ports still in use (may be other services)"
fi

# Test that services are down
if curl -s --max-time 2 "http://localhost:8080/api/health" >/dev/null 2>&1; then
    echo "⚠️  VideoParty server still responding"
else
    echo "✅ VideoParty server stopped"
fi

echo ""

# Final status
echo "✅ VideoParty System Shutdown Complete!"
echo "======================================="
echo ""
echo "📊 Shutdown Summary:"
echo "   🎬 VideoParty Server: Stopped"
echo "   🔒 Caddy HTTPS Proxy: Stopped"
echo "   📁 Logs preserved in logs/ directory"
echo "   🧹 Temporary files cleaned"
echo ""
echo "🔄 To restart the system:"
echo "   ./scripts/startup.sh"
echo ""
echo "📋 To check for any remaining processes:"
echo "   ps aux | grep -E '(node|caddy)'"
echo "   lsof -i :8080,80,443"
echo ""
echo "✅ Shutdown completed successfully!"
