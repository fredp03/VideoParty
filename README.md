# VideoParty - Watch Party Web App

A synchronized video watching experience where everyone in a room watches the same content together. Any participant can control playbook while personal settings (volume, captions, fullscreen) remain local.

## ✨ Features

- 🎞️ **Real-time video synchronization** (≤300ms drift)
- 🎮 **Shared controls** - anyone can play/pause/seek
- 👤 **Personal settings** - volume, captions, fullscreen, theatre mode stay local
- 📝 **WebVTT caption support** (.vtt files)
- 🌐 **HTTP Range streaming** for efficient video delivery
- 🔗 **Deep linking** to rooms via URL
- 🔒 **Optional authentication** with shared tokens
- 📱 **Responsive design** for mobile and desktop

## 🚀 Quick Start

### 1. Automatic Setup
```bash
./start-videoparty.sh
```

### 2. Manual Setup

**Backend:**
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your media directory and CORS origin
npm start
```

**Frontend:**
```bash
cd web
npm install
npm run build
# Deploy to Netlify with VITE_MEDIA_BASE_URL=https://fredav-videoparty.freeddns.org
```

### 3. Dynu + Caddy Setup

**Production-ready deployment with automatic HTTPS:**

1. **Configure Dynu**:
   - Sign up at https://www.dynu.com
   - Create A record: `fredav-videoparty.freeddns.org` → your public IP
   - Enable dynamic DNS and note your credentials
   - See [docs/DYNU_DDNS.md](docs/DYNU_DDNS.md) for detailed setup

2. **Configure Router**:
   - Port forward TCP 80 and 443 to your server machine (10.0.0.102)
   - Enable NAT loopback/hairpin if testing from same network

3. **Install Caddy**:
   ```bash
   # macOS
   brew install caddy
   
   # Linux
   sudo apt install caddy
   ```

4. **Start Services**:
   ```bash
   # Start Node server
   npm --prefix server start
   
   # Start Caddy reverse proxy
   sudo caddy run --config ./Caddyfile
   
   # Setup Dynu auto-updater
   bash scripts/dynu-ddns.sh
   ```

## 📁 Project Structure

```
VideoParty/
├── README.md                 # This file
├── start-videoparty.sh       # Automated startup script
├── stop-videoparty.sh        # Service shutdown script
├── health-check.sh           # System health check
├── Caddyfile                 # Caddy reverse proxy config
├── scripts/
│   └── dynu-ddns.sh          # Dynu dynamic DNS updater
├── docs/
│   └── DYNU_DDNS.md          # Dynu setup guide
├── web/                      # React frontend
│   ├── src/components/       # React components
│   ├── package.json          
│   ├── vite.config.ts        
│   └── netlify.toml          # Netlify deployment config
└── server/                   # Node.js backend
    ├── index.js              # Main server file
    ├── package.json          
    ├── .env.example          
    └── README.md             # Server documentation
```

## 🎯 How It Works

1. **Join a Room**: Enter a room ID or generate one
2. **Select Media**: Choose from your video library
3. **Watch Together**: All participants stay synchronized
4. **Personal Controls**: Volume, captions, fullscreen don't affect others
5. **Drift Correction**: Automatic sync keeps everyone within 300ms

## 🔧 Configuration

### Backend Environment Variables
```env
MEDIA_DIR=/path/to/your/videos           # Required: path to video files
PORT=8080                                # Server port (default: 8080)
ORIGIN=https://fredav.netlify.app        # Frontend URL for CORS
SHARED_TOKEN=supersecrettoken            # Optional auth token
```

### Frontend Environment Variables
```env
VITE_MEDIA_BASE_URL=https://fredav-videoparty.freeddns.org
```

### Dynu Configuration
```env
# .env.ddns
DYNU_UPDATE_URL="https://api.dynu.com/nic/update?hostname=fredav-videoparty.freeddns.org&myip={IP}"
DYNU_USERNAME="your_dynu_username"
DYNU_PASSWORD="your_dynu_password"
DYNU_HOST="fredav-videoparty.freeddns.org"
```

## 🎬 Supported Formats

**Video:** MP4, WebM, MKV, MOV, AVI, M4V  
**Captions:** WebVTT (.vtt files) - place next to video files with same name

## 🧪 Testing

```bash
# Check system health
./health-check.sh

# Manual test with two browser tabs:
# 1. Join same room in both tabs
# 2. Select video in one tab
# 3. Test play/pause/seek from either tab
# 4. Verify both stay synchronized
```

## 🚀 Deployment

### Netlify (Frontend)
1. Connect your GitHub repo to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variable: `VITE_MEDIA_BASE_URL=https://fredav-videoparty.freeddns.org`

### Server (Your Machine)
1. Use Dynu + Caddy for secure HTTPS access
2. Configure router port forwarding (80/443 → 10.0.0.102)
3. Keep server running with automated startup scripts

## 🔍 Troubleshooting

**Videos not showing:**
- Check `MEDIA_DIR` path in server `.env`
- Verify file permissions
- Test: `curl -I https://fredav-videoparty.freeddns.org/media/test-video.mp4`

**CORS errors:**
- Ensure `ORIGIN` matches Netlify URL exactly
- Include protocol (https://)
- Check browser console for specific errors

**Sync issues:**
- Check network connection
- Verify WebSocket connection: `wss://fredav-videoparty.freeddns.org/ws`
- Test with two browser tabs

**Connection fails:**
- Test server health: `curl https://fredav-videoparty.freeddns.org/api/health`
- Check FreeDNS DNS resolution: `dig +short A fredav-videoparty.freeddns.org`
- Verify router port forwarding and firewall settings

## 📝 API Documentation

See `server/README.md` for detailed API documentation including WebSocket message formats and HTTP endpoints.

## 📋 Go Live Checklist

Before going live, verify these steps:

### 1. DNS & Network
```bash
# A record resolves to current WAN IPv4
dig +short A fredav-videoparty.freeddns.org
curl -4 ifconfig.co  # Should match

# IPv6 disabled unless used
dig +short AAAA fredav-videoparty.freeddns.org  # Should be empty
```

### 2. Router Configuration
- [ ] Port 80 (TCP) forwards to 10.0.0.102:80
- [ ] Port 443 (TCP) forwards to 10.0.0.102:443
- [ ] Firewall allows inbound connections on these ports

### 3. Services Running
```bash
# Caddy running with valid certificate
curl -I https://fredav-videoparty.freeddns.org/api/health
# Expected: 200 OK with CORS headers

# HTTP redirects to HTTPS
curl -I http://fredav-videoparty.freeddns.org
# Expected: 301/308 redirect to https://
```

### 4. Frontend Configuration
- [ ] Netlify env `VITE_MEDIA_BASE_URL=https://fredav-videoparty.freeddns.org`
- [ ] Build and deploy successful

### 5. Backend Configuration
- [ ] Server env `ORIGIN=https://fredav.netlify.app`
- [ ] `SHARED_TOKEN` configured if using authentication
- [ ] Media directory accessible and populated

### 6. Acceptance Tests
```bash
# Range request returns 206 Partial Content
curl -I -H "Range: bytes=0-1" "https://fredav-videoparty.freeddns.org/media/test-video.mp4"

# WebSocket connection works
# Test in browser: new WebSocket('wss://fredav-videoparty.freeddns.org/ws?roomId=test')

# Two-tab sync test passes
# 1. Open https://fredav.netlify.app in two tabs
# 2. Join same room in both
# 3. Play video in one tab
# 4. Verify sync in other tab within 300ms
```

**✅ If all tests pass, your VideoParty is ready for production use!**

## 🤝 Contributing

This is a complete, production-ready implementation. Feel free to fork and customize for your needs.

## 📄 License

MIT License - feel free to use in your own projects!
