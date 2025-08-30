#!/bin/bash

# VideoParty Pre-Flight Verification Script
# This script ensures a clean slate before starting VideoParty

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"

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

print_action() {
    echo -e "${CYAN}[ACTION]${NC} $1"
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
    local service_name=$2
    
    if port_in_use "$port"; then
        print_warning "Port $port is in use by $service_name"
        local pids=$(lsof -ti:"$port" 2>/dev/null)
        if [ -n "$pids" ]; then
            print_action "Killing processes on port $port: $pids"
            if [ "$port" = "80" ] || [ "$port" = "443" ]; then
                echo "$pids" | xargs sudo kill -9 2>/dev/null || true
            else
                echo "$pids" | xargs kill -9 2>/dev/null || true
            fi
            sleep 1
            
            # Verify port is free
            if port_in_use "$port"; then
                print_error "Failed to free port $port"
                return 1
            else
                print_success "Port $port is now free"
            fi
        fi
    else
        print_success "Port $port is already free"
    fi
    return 0
}

# Function to check and kill specific processes
kill_process_by_name() {
    local process_name=$1
    local pids=$(pgrep -f "$process_name" 2>/dev/null || true)
    
    if [ -n "$pids" ]; then
        print_warning "Found $process_name processes: $pids"
        print_action "Killing $process_name processes..."
        echo "$pids" | xargs sudo kill -9 2>/dev/null || true
        sleep 1
        
        # Verify processes are gone
        local remaining=$(pgrep -f "$process_name" 2>/dev/null || true)
        if [ -n "$remaining" ]; then
            print_error "Failed to kill all $process_name processes: $remaining"
            return 1
        else
            print_success "All $process_name processes terminated"
        fi
    else
        print_success "No $process_name processes running"
    fi
    return 0
}

echo "🧹 VideoParty Pre-Flight Verification"
echo "======================================"
echo

# 1. Check prerequisites
print_status "1. Checking prerequisites..."
all_good=true

if ! command_exists node; then
    print_error "Node.js is not installed"
    all_good=false
else
    node_version=$(node --version)
    print_success "Node.js installed: $node_version"
fi

if ! command_exists caddy; then
    print_error "Caddy is not installed"
    all_good=false
else
    caddy_version=$(caddy version | head -1)
    print_success "Caddy installed: $caddy_version"
fi

if [ "$all_good" = false ]; then
    print_error "Prerequisites not met. Please install missing software."
    exit 1
fi

echo

# 2. Check network configuration
print_status "2. Verifying network configuration..."

# Check local IP
local_ip=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
if [ "$local_ip" = "10.0.0.103" ]; then
    print_success "Local IP is correct: $local_ip"
else
    print_warning "Local IP changed: $local_ip (expected: 10.0.0.103)"
    print_warning "You may need to update port forwarding rules"
fi

# Check external IP
external_ip=$(curl -s --max-time 5 https://ipinfo.io/ip 2>/dev/null || echo "unknown")
print_status "External IP: $external_ip"

# Check DNS resolution
dns_ip=$(nslookup fredav-videoparty.duckdns.org 2>/dev/null | grep "Address:" | tail -1 | awk '{print $2}' || echo "unknown")
if [ "$dns_ip" = "$external_ip" ]; then
    print_success "DNS resolution correct: fredav-videoparty.duckdns.org → $dns_ip"
else
    print_warning "DNS mismatch: Domain points to $dns_ip, but external IP is $external_ip"
fi

echo

# 3. Clean up existing processes
print_status "3. Cleaning up existing processes..."

# Kill specific VideoParty and Caddy processes
kill_process_by_name "node index.js"
kill_process_by_name "caddy run"

# Clean up ports
kill_port 8080 "VideoParty Server"
kill_port 80 "HTTP"
kill_port 443 "HTTPS"

echo

# 4. Clean up PID files and logs
print_status "4. Cleaning up log files and PID tracking..."

if [ -d "$LOG_DIR" ]; then
    if [ -f "$LOG_DIR/server.pid" ]; then
        print_action "Removing old server PID file"
        rm -f "$LOG_DIR/server.pid"
    fi
    
    if [ -f "$LOG_DIR/caddy.pid" ]; then
        print_action "Removing old Caddy PID file"
        rm -f "$LOG_DIR/caddy.pid"
    fi
    
    # Archive old logs
    if [ -f "$LOG_DIR/server.log" ] || [ -f "$LOG_DIR/caddy.log" ]; then
        timestamp=$(date +"%Y%m%d_%H%M%S")
        archive_dir="$LOG_DIR/archive_$timestamp"
        mkdir -p "$archive_dir"
        
        if [ -f "$LOG_DIR/server.log" ]; then
            mv "$LOG_DIR/server.log" "$archive_dir/"
            print_action "Archived old server log to $archive_dir/"
        fi
        
        if [ -f "$LOG_DIR/caddy.log" ]; then
            mv "$LOG_DIR/caddy.log" "$archive_dir/"
            print_action "Archived old Caddy log to $archive_dir/"
        fi
    fi
    
    print_success "Log cleanup complete"
else
    print_status "No existing log directory found"
fi

echo

# 5. Verify project structure
print_status "5. Verifying project structure..."

required_files=(
    "server/package.json"
    "server/index.js"
    "Caddyfile"
    "start-videoparty.sh"
    "stop-videoparty.sh"
)

for file in "${required_files[@]}"; do
    if [ -f "$SCRIPT_DIR/$file" ]; then
        print_success "✓ $file exists"
    else
        print_error "✗ $file missing"
        all_good=false
    fi
done

if [ "$all_good" = false ]; then
    print_error "Project structure incomplete"
    exit 1
fi

echo

# 6. Check server dependencies
print_status "6. Checking server dependencies..."

cd "$SCRIPT_DIR/server"
if [ -f "package.json" ]; then
    if [ -d "node_modules" ]; then
        print_success "Server dependencies installed"
    else
        print_warning "Server dependencies not installed"
        print_action "Installing dependencies..."
        npm install
        print_success "Dependencies installed"
    fi
else
    print_error "package.json not found in server directory"
    exit 1
fi

echo

# 7. Check media directory
print_status "7. Checking media directory..."

media_dir="$SCRIPT_DIR/server/media"
if [ -d "$media_dir" ]; then
    file_count=$(ls -1 "$media_dir" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$file_count" -gt 0 ]; then
        print_success "Media directory contains $file_count files"
        echo "   📁 Available media files:"
        ls -la "$media_dir" | grep -v "^total" | grep -v "^d" | awk '{print "      " $9}' | grep -v "^\s*$"
    else
        print_warning "Media directory is empty"
        print_status "You can add video files to $media_dir for testing"
    fi
else
    print_action "Creating media directory..."
    mkdir -p "$media_dir"
    print_success "Media directory created: $media_dir"
fi

echo

# 8. Final verification
print_status "8. Final system verification..."

# Check if ports are truly free
ports_clear=true
for port in 8080 80 443; do
    if port_in_use "$port"; then
        print_error "Port $port is still in use!"
        lsof -i :"$port"
        ports_clear=false
    fi
done

if [ "$ports_clear" = true ]; then
    print_success "All required ports (8080, 80, 443) are free"
else
    print_error "Some ports are still in use. Manual intervention may be required."
    exit 1
fi

echo
print_success "🎉 Pre-flight verification complete!"
echo
echo "📋 Summary:"
echo "  ✅ Prerequisites installed"
echo "  ✅ Network configuration verified"
echo "  ✅ All processes cleaned up"
echo "  ✅ Ports 8080, 80, 443 are free"
echo "  ✅ Project structure complete"
echo "  ✅ Dependencies installed"
echo "  ✅ System ready for clean start"
echo
print_status "🚀 You can now run: ./start-videoparty.sh"
echo
