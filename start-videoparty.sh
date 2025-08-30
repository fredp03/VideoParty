#!/bin/bash

# VideoParty Complete Setup and Launch Script
# This script will start all necessary services for the VideoParty application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$SCRIPT_DIR/server"
LOG_DIR="$SCRIPT_DIR/logs"

# Create logs directory
mkdir -p "$LOG_DIR"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :"$1" >/dev/null 2>&1
}

# Function to kill process on port
kill_port() {
    local port=$1
    print_status "Checking for existing processes on port $port..."
    if port_in_use "$port"; then
        print_warning "Port $port is in use. Killing existing processes..."
        lsof -ti:"$port" | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service_name to be ready..."
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        echo -n "."
        sleep 1
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start within $max_attempts seconds"
    return 1
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command_exists caddy; then
    print_error "Caddy is not installed. Please install Caddy first."
    exit 1
fi

if [ ! -f "$SERVER_DIR/package.json" ]; then
    print_error "Server directory not found or package.json missing"
    exit 1
fi

print_success "All prerequisites met!"

# Install server dependencies
print_status "Installing server dependencies..."
cd "$SERVER_DIR"
if [ ! -d "node_modules" ]; then
    npm install
    print_success "Server dependencies installed!"
else
    print_status "Server dependencies already installed"
fi

# Clean up any existing processes
print_status "Cleaning up existing processes..."
kill_port 8080  # VideoParty server
kill_port 80    # Caddy HTTP
kill_port 443   # Caddy HTTPS

# Check if media files exist
print_status "Checking media files..."
if [ ! -d "$SERVER_DIR/media" ] || [ -z "$(ls -A "$SERVER_DIR/media" 2>/dev/null)" ]; then
    print_warning "No media files found in $SERVER_DIR/media"
    print_warning "Please add video files to the media directory for testing"
fi

# Start VideoParty server
print_status "Starting VideoParty server..."
cd "$SERVER_DIR"
nohup node index.js > "$LOG_DIR/server.log" 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > "$LOG_DIR/server.pid"
print_success "VideoParty server started (PID: $SERVER_PID)"

# Wait for server to be ready
if ! wait_for_service "http://localhost:8080/api/health" "VideoParty server"; then
    print_error "VideoParty server failed to start"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

# Start Caddy reverse proxy
print_status "Starting Caddy reverse proxy..."
cd "$SCRIPT_DIR"
if [ ! -f "Caddyfile" ]; then
    print_error "Caddyfile not found in $SCRIPT_DIR"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

nohup sudo caddy run --config Caddyfile > "$LOG_DIR/caddy.log" 2>&1 &
CADDY_PID=$!
echo $CADDY_PID > "$LOG_DIR/caddy.pid"
print_success "Caddy reverse proxy started (PID: $CADDY_PID)"

# Wait for Caddy to be ready
sleep 5
if ! wait_for_service "https://fredav-videoparty.duckdns.org/api/health" "Caddy reverse proxy"; then
    print_warning "Caddy reverse proxy might not be fully ready yet (this is normal on first run)"
    print_status "Caddy is obtaining SSL certificates, which may take a moment..."
fi

# Display status
echo
print_success "🎉 VideoParty is now running!"
echo
echo "📊 Service Status:"
echo "  • VideoParty Server: http://localhost:8080"
echo "  • Public URL: https://fredav-videoparty.duckdns.org"
echo "  • Frontend: https://fredav.netlify.app"
echo
echo "📁 Log Files:"
echo "  • Server logs: $LOG_DIR/server.log"
echo "  • Caddy logs: $LOG_DIR/caddy.log"
echo
echo "🔍 Monitoring Commands:"
echo "  • View server logs: tail -f $LOG_DIR/server.log"
echo "  • View caddy logs: tail -f $LOG_DIR/caddy.log"
echo "  • Check server status: curl http://localhost:8080/api/health"
echo "  • Check public status: curl https://fredav-videoparty.duckdns.org/api/health"
echo
echo "🛑 To stop all services, run: $SCRIPT_DIR/stop-videoparty.sh"
echo

# Test endpoints
print_status "Testing endpoints..."
sleep 2

if curl -s http://localhost:8080/api/health >/dev/null; then
    print_success "✅ Local server responding"
else
    print_error "❌ Local server not responding"
fi

if curl -s https://fredav-videoparty.duckdns.org/api/health >/dev/null 2>&1; then
    print_success "✅ Public server responding"
else
    print_warning "⚠️  Public server not yet responding (SSL certificates may still be generating)"
fi

# Final instructions
echo
print_status "🚀 Ready to use VideoParty!"
echo "1. Open https://fredav.netlify.app in your browser"
echo "2. Create or join a room"
echo "3. Start watching videos together!"
echo
print_status "Press Ctrl+C to view logs, or run the stop script to shut down all services."

# Keep script running and show live logs
trap 'echo; print_status "Use stop-videoparty.sh to stop all services"; exit 0' INT

echo
print_status "Showing live server logs (Ctrl+C to exit):"
tail -f "$LOG_DIR/server.log"
