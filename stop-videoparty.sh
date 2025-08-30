#!/bin/bash

# VideoParty Stop Script
# This script will stop all VideoParty services

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Function to stop process by PID file
stop_service() {
    local service_name=$1
    local pid_file=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            print_status "Stopping $service_name (PID: $pid)..."
            if [ "$service_name" = "Caddy" ]; then
                sudo kill "$pid" 2>/dev/null || true
            else
                kill "$pid" 2>/dev/null || true
            fi
            sleep 2
            
            # Force kill if still running
            if kill -0 "$pid" 2>/dev/null; then
                print_warning "Force killing $service_name..."
                if [ "$service_name" = "Caddy" ]; then
                    sudo kill -9 "$pid" 2>/dev/null || true
                else
                    kill -9 "$pid" 2>/dev/null || true
                fi
            fi
            print_success "$service_name stopped"
        else
            print_warning "$service_name PID file exists but process not running"
        fi
        rm -f "$pid_file"
    else
        print_warning "No PID file found for $service_name"
    fi
}

# Function to kill processes on port
kill_port() {
    local port=$1
    local service_name=$2
    
    if lsof -i :"$port" >/dev/null 2>&1; then
        print_status "Killing processes on port $port ($service_name)..."
        if [ "$port" = "80" ] || [ "$port" = "443" ]; then
            sudo lsof -ti:"$port" | xargs sudo kill -9 2>/dev/null || true
        else
            lsof -ti:"$port" | xargs kill -9 2>/dev/null || true
        fi
        print_success "Processes on port $port stopped"
    fi
}

print_status "🛑 Stopping VideoParty services..."

# Stop services by PID files
if [ -d "$LOG_DIR" ]; then
    stop_service "VideoParty Server" "$LOG_DIR/server.pid"
    stop_service "Caddy" "$LOG_DIR/caddy.pid"
fi

# Kill any remaining processes on the ports
kill_port 8080 "VideoParty Server"
kill_port 80 "Caddy HTTP"
kill_port 443 "Caddy HTTPS"

# Clean up log directory
if [ -d "$LOG_DIR" ]; then
    print_status "Cleaning up log files..."
    rm -f "$LOG_DIR"/*.pid
fi

print_success "🎉 All VideoParty services stopped!"
echo
print_status "Log files preserved in: $LOG_DIR"
print_status "To restart, run: $SCRIPT_DIR/start-videoparty.sh"
