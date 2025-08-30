# FreeDNS Dynamic DNS Setup

## Overview

This project uses FreeDNS (afraid.org) for dynamic DNS management of `fredav-videoparty.freedns.org`. The included updater script automatically updates the A record when your public IP changes.

## Initial Setup

### 1. FreeDNS Configuration

1. **Create FreeDNS Account**: Sign up at https://freedns.afraid.org
2. **Add Subdomain**: Create `fredav-videoparty` under `freedns.org`
3. **Configure Record**:
   - Type: A
   - Subdomain: fredav-videoparty
   - Domain: freedns.org
   - Destination: Your current public IP
   - TTL: 120 seconds (recommended for fast updates)
4. **Disable IPv6**: Unless your network is fully IPv6-reachable, disable AAAA records
5. **Get Update URL**: Copy the "Direct URL" from your subdomain management page

### 2. Local Configuration

Create `.env.ddns` file:
```bash
cp .env.ddns.example .env.ddns
# Edit .env.ddns and paste your FreeDNS update URL
```

Example `.env.ddns`:
```bash
FREEDNS_UPDATE_URL="https://freedns.afraid.org/dynamic/update.php?YourUniqueHashHere"
FREEDNS_HOST="fredav-videoparty.freedns.org"
```

### 3. Test the Updater

```bash
# Test manual update
bash scripts/freedns-ddns.sh

# Expected output (first run):
# UPDATED -> 73.142.127.37

# Expected output (subsequent runs with same IP):
# UNCHANGED 73.142.127.37
```

## Production Scheduling

### Option 1: Cron (Linux/macOS)

Add to crontab (`crontab -e`):
```bash
# Update FreeDNS every 5 minutes
*/5 * * * * /bin/bash /Users/fredparsons/Documents/Side\ Projects/Fred\ Av/VideoParty/scripts/freedns-ddns.sh >>/var/log/freedns-ddns.log 2>&1
```

### Option 2: macOS launchd

Create `~/Library/LaunchAgents/org.videoparty.freedns.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>org.videoparty.freedns</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>/Users/fredparsons/Documents/Side Projects/Fred Av/VideoParty/scripts/freedns-ddns.sh</string>
    </array>
    <key>StartInterval</key>
    <integer>300</integer>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/freedns-ddns.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/freedns-ddns.log</string>
</dict>
</plist>
```

Load and start:
```bash
launchctl load ~/Library/LaunchAgents/org.videoparty.freedns.plist
launchctl start org.videoparty.freedns
```

### Option 3: Linux systemd

**Service file** (`/etc/systemd/system/freedns-ddns.service`):
```ini
[Unit]
Description=FreeDNS Dynamic DNS Updater
Wants=network-online.target
After=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/bin/bash /opt/app/scripts/freedns-ddns.sh
User=app
Group=app
```

**Timer file** (`/etc/systemd/system/freedns-ddns.timer`):
```ini
[Unit]
Description=Run FreeDNS DDNS every 5 minutes
Requires=freedns-ddns.service

[Timer]
OnBootSec=1min
OnUnitActiveSec=5min
Unit=freedns-ddns.service

[Install]
WantedBy=timers.target
```

Enable and start:
```bash
sudo systemctl enable freedns-ddns.timer
sudo systemctl start freedns-ddns.timer
```

## Verification

### DNS Resolution
```bash
# Check A record
dig +short A fredav-videoparty.freedns.org

# Should match your public IP
curl -4 ifconfig.co
```

### Service Health
```bash
# Test HTTP redirect
curl -I http://fredav-videoparty.freedns.org

# Test HTTPS API
curl -I https://fredav-videoparty.freedns.org/api/health

# Test media streaming with Range requests
curl -I -H "Range: bytes=0-1" "https://fredav-videoparty.freedns.org/media/test-video.mp4"
```

## Troubleshooting

### Common Issues

**CGNAT/Double NAT**
- Your ISP uses Carrier-Grade NAT
- Solution: Contact ISP for static IP or use VPN/tunnel service

**ISP Blocking Ports 80/443**
- Residential ISPs often block server ports
- Test: `telnet your-external-ip 443` from outside network
- Solution: Use alternative ports (8080, 8443) or VPS

**Missing NAT Loopback**
- Router doesn't route external requests back to internal IP
- Test from outside network or use VPN
- Some routers have "NAT loopback" or "hairpin NAT" setting

**macOS Firewall**
- System Preferences → Security & Privacy → Firewall
- Allow Caddy through firewall or disable for testing

**FreeDNS Update Failures**
- Verify update URL is correct and not expired
- Check FreeDNS account for suspended domains
- Rotate update hash if compromised

### Debug Commands

```bash
# Check current IP detection
curl -4 ifconfig.co

# Test FreeDNS update manually
curl -fsS "https://freedns.afraid.org/dynamic/update.php?YourHashHere"

# Check Caddy logs
sudo journalctl -u caddy -f

# Test local services
curl -I http://localhost:8080/api/health
curl -I http://10.0.0.102/api/health
```

### Security Notes

- Keep your FreeDNS update URL secret (contains authentication hash)
- Rotate the hash periodically or if compromised
- Monitor logs for unauthorized update attempts
- Consider IP restrictions on FreeDNS if available
