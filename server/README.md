# VideoParty Server

Node.js backend server for the VideoParty synchronized video watching app.

## Features

- 📁 Automatic video indexing from local media directory
- 🎞️ HTTP Range streaming for efficient video delivery
- 🔄 Real-time WebSocket synchronization
- 📝 WebVTT caption support (.vtt files)
- 🔒 Optional token-based authentication
- 🌐 CORS protection

## Quick Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Set your media directory** in `.env`:
   ```
   MEDIA_DIR=/path/to/your/video/files
   ```

4. **Start the server**:
   ```bash
   npm start
   ```

## Configuration

### Environment Variables (.env)

- `MEDIA_DIR`: Path to your video files directory (required)
- `PORT`: Server port (default: 8080)
- `ORIGIN`: Allowed CORS origin (your frontend URL)
- `SHARED_TOKEN`: Optional authentication token

### Supported Video Formats

- MP4 (.mp4)
- WebM (.webm) 
- MKV (.mkv)
- MOV (.mov)
- AVI (.avi)
- M4V (.m4v)

### Caption Support

Place `.vtt` caption files next to video files with the same name:
```
/videos/
  movie.mp4
  movie.vtt        ← Will be automatically detected
  series/
    episode1.mkv
    episode1.vtt   ← Also detected
```

## Exposing Your Server

### Option 1: Cloudflare Tunnel (Recommended)

1. **Install Cloudflare Tunnel**:
   ```bash
   # macOS
   brew install cloudflared
   
   # Linux
   wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   sudo dpkg -i cloudflared-linux-amd64.deb
   ```

2. **Start the tunnel**:
   ```bash
   cloudflared tunnel --url http://localhost:8080
   ```
   
3. **Copy the generated URL** (e.g., `https://abc123.trycloudflare.com`)

4. **Update your frontend** environment variable:
   ```
   VITE_MEDIA_BASE_URL=https://abc123.trycloudflare.com
   ```

5. **Update server CORS** in `.env`:
   ```
   ORIGIN=https://your-netlify-site.netlify.app
   ```

### Option 2: Port Forwarding

1. **Find your local IP**:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Or check your router's admin panel
   ```

2. **Forward port 8080** in your router settings:
   - Log into your router (usually 192.168.1.1 or 192.168.0.1)
   - Go to Port Forwarding / Virtual Servers
   - Forward external port 8080 to your computer's IP:8080

3. **Find your public IP**:
   ```bash
   curl ifconfig.me
   ```

4. **Update frontend environment**:
   ```
   VITE_MEDIA_BASE_URL=http://YOUR_PUBLIC_IP:8080
   ```

⚠️ **Note**: Port forwarding exposes your server to the internet. Consider using `SHARED_TOKEN` for security.

## API Endpoints

### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "ok": true,
  "timestamp": 1693843200000
}
```

### GET /api/videos
List all available videos.

**Headers** (if `SHARED_TOKEN` is set):
```
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
[
  {
    "id": "base64-encoded-path",
    "name": "Movie Title",
    "relPath": "movies/movie.mp4",
    "url": "/media/movies%2Fmovie.mp4",
    "captionsUrl": "/media/movies%2Fmovie.vtt"
  }
]
```

### GET /media/:path
Stream video/caption files with Range support.

**Headers** (if `SHARED_TOKEN` is set):
```
Authorization: Bearer YOUR_TOKEN
Range: bytes=0-1023
```

**Response:**
- Status 206 (Partial Content) for Range requests
- Status 200 for full file requests
- Proper `Content-Type` and `Content-Range` headers

## WebSocket API

### Connection
```
ws://localhost:8080/ws?roomId=ROOM&clientId=CLIENT&token=TOKEN
```

### Message Format
```json
{
  "type": "play|pause|seek|loadVideo|timeSync",
  "roomId": "room123",
  "clientId": "client456", 
  "currentTime": 42.5,
  "paused": false,
  "sentAtMs": 1693843200000,
  "videoUrl": "/media/path%2Fto%2Fvideo.mp4"
}
```

## Testing

1. **Test video indexing**:
   ```bash
   curl http://localhost:8080/api/videos
   ```

2. **Test video streaming**:
   ```bash
   curl -H "Range: bytes=0-1023" http://localhost:8080/media/your-video.mp4
   ```

3. **Test WebSocket** (using a WebSocket client):
   ```
   ws://localhost:8080/ws?roomId=test&clientId=test1
   ```

## Troubleshooting

### Videos not showing up
- Check `MEDIA_DIR` path in `.env`
- Ensure video files have supported extensions
- Check file permissions

### CORS errors
- Verify `ORIGIN` matches your frontend URL exactly
- Include protocol (http/https)
- Restart server after changing `.env`

### WebSocket connection fails
- Check firewall settings
- Verify WebSocket URL format
- Test with browser developer tools

### Range requests not working
- Check that files exist and are readable
- Verify client sends proper `Range` header
- Test with `curl -H "Range: bytes=0-1023"`
