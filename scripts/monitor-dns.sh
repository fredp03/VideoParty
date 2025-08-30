#!/bin/bash

# DNS Propagation Monitor
# Checks multiple DNS servers until the domain resolves

DOMAIN="fredav-videoparty.freedns.org"
EXPECTED_IP="73.142.127.37"

DNS_SERVERS=(
    "8.8.8.8"      # Google
    "1.1.1.1"      # Cloudflare  
    "208.67.222.222"   # OpenDNS
    "9.9.9.9"      # Quad9
    "76.76.19.19"  # Alternate DNS
)

echo "🔍 Monitoring DNS propagation for $DOMAIN"
echo "Expected IP: $EXPECTED_IP"
echo "========================================="

check_dns() {
    local dns_server=$1
    local result=$(dig +short "$DOMAIN" @"$dns_server" 2>/dev/null | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -1)
    
    if [ -n "$result" ]; then
        if [ "$result" = "$EXPECTED_IP" ]; then
            echo "✅ $dns_server: $result (CORRECT)"
            return 0
        else
            echo "⚠️  $dns_server: $result (INCORRECT - expected $EXPECTED_IP)"
            return 1
        fi
    else
        echo "❌ $dns_server: No A record found"
        return 1
    fi
}

check_all_servers() {
    local all_good=true
    
    for dns_server in "${DNS_SERVERS[@]}"; do
        if ! check_dns "$dns_server"; then
            all_good=false
        fi
    done
    
    return $all_good
}

# Initial check
if check_all_servers; then
    echo ""
    echo "🎉 DNS propagation complete! All servers returning correct IP."
    exit 0
fi

echo ""
echo "⏳ DNS not fully propagated yet. Monitoring every 30 seconds..."
echo "   Press Ctrl+C to stop monitoring"
echo ""

# Monitor every 30 seconds
while true; do
    sleep 30
    echo "$(date '+%H:%M:%S') - Checking DNS propagation..."
    
    if check_all_servers; then
        echo ""
        echo "🎉 DNS propagation complete!"
        echo "✅ You can now test the live domain:"
        echo "   https://fredav-videoparty.freedns.org"
        break
    fi
    echo ""
done
