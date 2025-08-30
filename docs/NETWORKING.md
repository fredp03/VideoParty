# Networking Setup Guide

This guide walks you through exposing your VideoParty server to the internet using port forwarding, Dynamic DNS, and Caddy.

## Prerequisites

- Public WAN IP (not behind CGNAT)
- Router with port forwarding capabilities
- Domain name or Dynamic DNS service

## Step-by-Step Setup

### A) Confirm Public IP

Check if you have a public IP (not CGNAT):
```bash
curl ifconfig.me
# Compare with your router's WAN IP in admin panel
```

If they don't match, contact your ISP about CGNAT or business internet.

### B) Set up Domain/DDNS

**Option 1: Own Domain**
- Point A record to your public IP
- Update when IP changes

**Option 2: Dynamic DNS (Free)**
- Sign up for DuckDNS or No-IP
- Install their update client
- Get hostname like `yourname.duckdns.org`

### C) Router Port Forwarding

Forward these ports to your server machine:
- TCP 80 → Your Server IP:80
- TCP 443 → Your Server IP:443

**Common Router Steps:**
1. Find "Port Forwarding" or "Virtual Servers"
2. Add rule: External 80 → Internal [Server IP]:80
3. Add rule: External 443 → Internal [Server IP]:443
4. Save and restart router

### D) Install and Configure Caddy

**Linux:**
```bash
sudo apt update && sudo apt install caddy
sudo systemctl enable caddy
```

**macOS:**
```bash
brew install caddy
```

**Configuration:**
1. Edit `Caddyfile` in project root
2. Replace `watch.example.com` with your domain
3. Replace `https://<your-netlify-site>.netlify.app` with your Netlify URL

### E) Start Services

```bash
# Terminal 1: Start Node server
cd server
npm start

# Terminal 2: Start Caddy
cd .. # back to project root
sudo caddy run --config ./Caddyfile  # Linux
caddy run --config ./Caddyfile       # macOS
```

### F) Verify Setup

```bash
# Health check
curl -I https://yourdomain.com/api/health

# CORS check
curl -I -H "Origin: https://yourapp.netlify.app" https://yourdomain.com/api/videos

# Range request check
curl -I -H "Range: bytes=0-1000" https://yourdomain.com/media/video.mp4
```

Expected responses:
- 200 OK with CORS headers
- 206 Partial Content for range requests

## Troubleshooting

### Port 80/443 Blocked by ISP
- Some ISPs block these ports on residential connections
- Try ports 8080/8443 instead and update Caddyfile
- Consider business internet or VPS

### Double NAT
- Check if router has a "Router Mode" vs "Bridge Mode"
- Some ISP modems need bridge mode enabled

### No NAT Loopback/Hairpin
- Can't access your domain from inside your network
- Add local DNS override or use local IP for testing
- Test from mobile data or external network

### Certificate Issues
- Ensure domain resolves to your IP: `nslookup yourdomain.com`
- Check Caddy logs: `sudo journalctl -u caddy -f`
- Let's Encrypt rate limits: wait or use staging

### WebSocket Connection Fails
- Verify Caddy is proxying WebSocket connections
- Check browser dev tools for connection errors
- Ensure no proxy/firewall blocking WSS

## Production Considerations

1. **Firewall**: Only open ports 80, 443, and 22 (SSH)
2. **Updates**: Keep Caddy and Node.js updated
3. **Monitoring**: Set up uptime monitoring
4. **Backup**: Backup server configuration and media
5. **Rate Limiting**: Consider adding rate limits to Caddyfile
