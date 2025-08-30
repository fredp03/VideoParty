#!/bin/bash

set -euo pipefail

# Dynu Dynamic DNS Updater
# Updates A record for hostname when public IP changes

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env.ddns"
CACHE_FILE="$SCRIPT_DIR/.last_ip"

# Load environment variables
if [[ -f "$ENV_FILE" ]]; then
    # shellcheck source=/dev/null
    source "$ENV_FILE"
fi

# Validate required configuration
if [[ -z "${DYNU_UPDATE_URL:-}" ]]; then
    echo "ERROR: DYNU_UPDATE_URL not set. Create .env.ddns with your Dynu update URL." >&2
    exit 1
fi

if [[ -z "${DYNU_USERNAME:-}" ]]; then
    echo "ERROR: DYNU_USERNAME not set. Create .env.ddns with your Dynu username." >&2
    exit 1
fi

if [[ -z "${DYNU_PASSWORD:-}" ]]; then
    echo "ERROR: DYNU_PASSWORD not set. Create .env.ddns with your Dynu password." >&2
    exit 1
fi

# Get current public IPv4 with fallbacks
get_public_ip() {
    local ip=""
    local services=(
        "ifconfig.co"
        "icanhazip.com"
        "api.ipify.org"
    )
    
    for service in "${services[@]}"; do
        if ip=$(curl -4 -fsS --max-time 10 "https://$service" 2>/dev/null); then
            # Validate IP format
            if [[ $ip =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
                echo "$ip"
                return 0
            fi
        fi
    done
    
    echo "ERROR: Failed to determine public IP from all services" >&2
    return 1
}

# Read cached IP
get_cached_ip() {
    if [[ -f "$CACHE_FILE" ]]; then
        cat "$CACHE_FILE"
    else
        echo ""
    fi
}

# Update Dynu record
update_dynu() {
    local current_ip="$1"
    local update_url="$DYNU_UPDATE_URL"
    
    # Replace {IP} placeholder if present
    if [[ "$update_url" == *"{IP}"* ]]; then
        update_url="${update_url//\{IP\}/$current_ip}"
    fi
    
    # Make update request with basic auth
    local response
    if response=$(curl -fsS --max-time 30 -u "$DYNU_USERNAME:$DYNU_PASSWORD" "$update_url" 2>&1); then
        # Check for known success/error responses
        if echo "$response" | grep -qi "good\|nochg"; then
            return 0
        elif echo "$response" | grep -qi "badauth\|badagent\|!donator\|notfqdn\|nohost\|numhost\|abuse"; then
            echo "ERROR: Dynu update failed: $response" >&2
            return 1
        else
            # Assume success if no error keywords found
            return 0
        fi
    else
        echo "ERROR: Dynu update request failed: $response" >&2
        return 1
    fi
}

# Main execution
main() {
    local current_ip
    current_ip=$(get_public_ip)
    
    local cached_ip
    cached_ip=$(get_cached_ip)
    
    if [[ "$current_ip" == "$cached_ip" ]]; then
        echo "UNCHANGED $current_ip"
        exit 0
    fi
    
    if update_dynu "$current_ip"; then
        echo "$current_ip" > "$CACHE_FILE"
        if [[ -n "$cached_ip" ]]; then
            echo "UPDATED $cached_ip -> $current_ip"
        else
            echo "UPDATED -> $current_ip"
        fi
        exit 0
    else
        exit 1
    fi
}

main "$@"
