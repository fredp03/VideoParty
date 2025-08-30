# Dynu Dynamic DNS Setup

## Overview

This project uses Dynu.com for dynamic DNS management of `fredav-videoparty.freeddns.org`. The included updater script automatically updates the A record when your public IP changes.

## Initial Setup

### 1. Dynu Configuration

1. **Create Dynu Account**: Sign up at https://www.dynu.com
2. **Add Domain**: 
   - If using a subdomain, create `fredav-videoparty.freeddns.org`
   - Or use your own domain if you have one
3. **Configure DNS Record**:
   - Type: A
   - Name: fredav-videoparty (or your preferred subdomain)
   - Value: Your current public IP
   - TTL: 300 seconds (recommended for fast updates)
4. **Enable Dynamic DNS**: In your domain settings, enable dynamic DNS
5. **Get Credentials**: Note your Dynu username and password for API access

### 2. Local Configuration

Create `.env.ddns` file:
```bash
cp .env.ddns.example .env.ddns
# Edit .env.ddns with your Dynu credentials
```

Example `.env.ddns`:
```bash
DYNU_UPDATE_URL="https://api.dynu.com/nic/update?hostname=fredav-videoparty.freeddns.org&myip={IP}"
DYNU_USERNAME="your_dynu_username"
DYNU_PASSWORD="your_dynu_password"
DYNU_HOST="fredav-videoparty.freeddns.org"
```

### 3. Test the Updater

```bash
# Test manual update
bash scripts/dynu-ddns.sh

# Expected output (first run):
# UPDATED -> 73.142.127.37

# Expected output (subsequent runs with same IP):
# UNCHANGED 73.142.127.37
```

## Production Scheduling

### Option 1: Cron (Linux/macOS)

Add to crontab (`crontab -e`):
```bash
# Update Dynu every 5 minutes
*/5 * * * * /bin/bash /Users/fredparsons/Documents/Side\ Projects/Fred\ Av/VideoParty/scripts/dynu-ddns.sh >>/var/log/dynu-ddns.log 2>&1
```

### Option 2: macOS launchd

Create `~/Library/LaunchAgents/org.videoparty.dynu.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>org.videoparty.dynu</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>/Users/fredparsons/Documents/Side Projects/Fred Av/VideoParty/scripts/dynu-ddns.sh</string>
    </array>
    <key>StartInterval</key>
    <integer>300</integer>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/dynu-ddns.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/dynu-ddns.log</string>
</dict>
</plist>
```

Load and start:
```bash
launchctl load ~/Library/LaunchAgents/org.videoparty.dynu.plist
launchctl start org.videoparty.dynu
```

### Option 3: Linux systemd

**Service file** (`/etc/systemd/system/dynu-ddns.service`):
```ini
[Unit]
Description=Dynu Dynamic DNS Updater
Wants=network-online.target
After=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/bin/bash /opt/app/scripts/dynu-ddns.sh
User=app
Group=app
```

**Timer file** (`/etc/systemd/system/dynu-ddns.timer`):
```ini
[Unit]
Description=Run Dynu DDNS every 5 minutes
Requires=dynu-ddns.service

[Timer]
OnBootSec=1min
OnUnitActiveSec=5min
Unit=dynu-ddns.service

[Install]
WantedBy=timers.target
```

Enable and start:
```bash
sudo systemctl enable dynu-ddns.timer
sudo systemctl start dynu-ddns.timer
```

## Verification

### DNS Resolution
```bash
# Check A record
dig +short A fredav-videoparty.freeddns.org

# Should match your public IP
curl -4 ifconfig.co
```

### Service Health
```bash
# Test HTTP redirect
curl -I http://fredav-videoparty.freeddns.org

# Test HTTPS API
curl -I https://fredav-videoparty.freeddns.org/api/health

# Test media streaming with Range requests
curl -I -H "Range: bytes=0-1" "https://fredav-videoparty.freeddns.org/media/test-video.mp4"
```

## Troubleshooting

### Common Issues

**Authentication Errors**
- Verify DYNU_USERNAME and DYNU_PASSWORD are correct
- Check if your Dynu account is active and in good standing
- Some accounts may require email verification

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

### Dynu API Response Codes

- `good` - Update successful
- `nochg` - IP address is current (no change needed)
- `badauth` - Invalid username or password
- `badagent` - Bad user agent
- `!donator` - Feature requires donation/payment
- `notfqdn` - Hostname is not a fully qualified domain name
- `nohost` - Hostname does not exist
- `numhost` - Too many hosts specified
- `abuse` - Hostname is blocked due to abuse

### Debug Commands

```bash
# Check current IP detection
curl -4 ifconfig.co

# Test Dynu update manually
curl -fsS -u "username:password" "https://api.dynu.com/nic/update?hostname=fredav-videoparty.freeddns.org&myip=YOUR_IP"

# Check Caddy logs
sudo journalctl -u caddy -f

# Test local services
curl -I http://localhost:8080/api/health
curl -I http://10.0.0.102/api/health
```

### Security Notes

- Keep your Dynu credentials secure
- Consider using environment variables instead of plain text files
- Monitor logs for unauthorized update attempts
- Enable two-factor authentication on your Dynu account if available
