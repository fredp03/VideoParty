#!/bin/bash

# VideoParty Health Check Script
# This script checks the status of all VideoParty services

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to check service
check_service() {
    local url=$1
    local service_name=$2
    
    if curl -s --max-time 5 "$url" >/dev/null 2>&1; then
        print_success "✅ $service_name is running"
        return 0
    else
        print_error "❌ $service_name is not responding"
        return 1
    fi
}

# Function to check port
check_port() {
    local port=$1
    local service_name=$2
    
    if lsof -i :"$port" >/dev/null 2>&1; then
        local pid=$(lsof -ti:"$port" 2>/dev/null | head -1)
        print_success "✅ $service_name is listening on port $port (PID: $pid)"
        return 0
    else
        print_error "❌ No service listening on port $port ($service_name)"
        return 1
    fi
}

echo "🔍 VideoParty Health Check"
echo "=========================="
echo

# Check local services
print_status "Checking local services..."
check_port 8080 "VideoParty Server"
check_service "http://localhost:8080/api/health" "VideoParty API"

echo

# Check Caddy
print_status "Checking Caddy reverse proxy..."
check_port 80 "Caddy HTTP"
check_port 443 "Caddy HTTPS"

echo

# Check public endpoints
print_status "Checking public endpoints..."
check_service "https://fredav-videoparty.freeddns.org/api/health" "Public API"

echo

# Check frontend
print_status "Checking frontend..."
if curl -s --max-time 5 "https://fredav.netlify.app" >/dev/null 2>&1; then
    print_success "✅ Frontend is accessible"
else
    print_warning "⚠️  Frontend check failed (might be temporary)"
fi

echo

# Check media directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MEDIA_DIR="$SCRIPT_DIR/server/media"

print_status "Checking media directory..."
if [ -d "$MEDIA_DIR" ]; then
    file_count=$(ls -1 "$MEDIA_DIR" 2>/dev/null | wc -l)
    if [ "$file_count" -gt 0 ]; then
        print_success "✅ Media directory contains $file_count files"
        echo "   📁 Media files:"
        ls -la "$MEDIA_DIR" | grep -v "^total" | grep -v "^d" | awk '{print "      " $9}' | grep -v "^\s*$"
    else
        print_warning "⚠️  Media directory is empty"
    fi
else
    print_error "❌ Media directory not found"
fi

echo

# Check log files
LOG_DIR="$SCRIPT_DIR/logs"
if [ -d "$LOG_DIR" ]; then
    print_status "Recent log entries:"
    
    if [ -f "$LOG_DIR/server.log" ]; then
        echo "   📋 Server log (last 3 lines):"
        tail -3 "$LOG_DIR/server.log" 2>/dev/null | sed 's/^/      /' || echo "      (empty)"
    fi
    
    if [ -f "$LOG_DIR/caddy.log" ]; then
        echo "   📋 Caddy log (last 3 lines):"
        tail -3 "$LOG_DIR/caddy.log" 2>/dev/null | sed 's/^/      /' || echo "      (empty)"
    fi
else
    print_warning "⚠️  No log directory found"
fi

echo
print_status "Health check complete!"
