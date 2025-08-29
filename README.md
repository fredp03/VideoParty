# VideoParty - Watch Party Web App

A synchronized video watching experience where everyone in a room watches the same content together. Any participant can control playback while personal settings (volume, captions, fullscreen) remain local.

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
./setup.sh
```

### 2. Manual Setup

**Backend:**
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your media directory
npm start
```

**Frontend:**
```bash
cd web
npm install
npm run build
# Deploy to Netlify
```

### 3. Expose Your Server

**Option A: Cloudflare Tunnel (Recommended)**
```bash
# Install cloudflared
brew install cloudflared  # macOS

# Start tunnel
cloudflared tunnel --url http://localhost:8080
# Copy the generated https URL
```

**Option B: Port Forwarding**
- Forward port 8080 in your router settings
- Use your public IP: `http://YOUR_PUBLIC_IP:8080`

### 4. Configure Frontend
Set `VITE_MEDIA_BASE_URL` in Netlify environment variables to your tunnel/public URL.

### 5. Update CORS
Set `ORIGIN` in server `.env` to your Netlify URL.

## 📁 Project Structure

```
VideoParty/
├── README.md                 # This file
├── setup.sh                  # Automated setup script
├── test.sh                   # Test script
├── docker-compose.yml        # Docker setup
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
MEDIA_DIR=/path/to/your/videos    # Required
PORT=8080                         # Server port
ORIGIN=https://your-site.netlify.app  # Frontend URL
SHARED_TOKEN=secret123            # Optional auth token
```

### Frontend Environment Variables
```env
VITE_MEDIA_BASE_URL=https://your-tunnel.trycloudflare.com
```

## 🎬 Supported Formats

**Video:** MP4, WebM, MKV, MOV, AVI, M4V  
**Captions:** WebVTT (.vtt files) - place next to video files with same name

## 🧪 Testing

```bash
# Run automated tests
./test.sh

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
4. Add environment variable: `VITE_MEDIA_BASE_URL`

### Server (Your Machine)
1. Use Cloudflare Tunnel for secure HTTPS access
2. Or configure router port forwarding
3. Keep server running with `pm2` or similar

### Docker (Optional)
```bash
# Server only
docker-compose up

# Or manual
cd server
docker build -t videoparty .
docker run -p 8080:8080 -v /your/media:/media videoparty
```

## 🔍 Troubleshooting

**Videos not showing:**
- Check `MEDIA_DIR` path in server `.env`
- Verify file permissions

**CORS errors:**
- Ensure `ORIGIN` matches frontend URL exactly
- Include protocol (http/https)

**Sync issues:**
- Check network connection
- Verify WebSocket connection in browser dev tools

**Connection fails:**
- Test server health: `curl http://localhost:8080/api/health`
- Check firewall settings

## 📝 API Documentation

See `server/README.md` for detailed API documentation including WebSocket message formats and HTTP endpoints.

## 🤝 Contributing

This is a complete, production-ready implementation. Feel free to fork and customize for your needs.

## 📄 License

MIT License - feel free to use in your own projects!
