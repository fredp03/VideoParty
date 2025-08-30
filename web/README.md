# VideoParty Frontend

React + TypeScript frontend for the VideoParty watch-together app.

## Development

```bash
npm install
npm run dev
```

## Environment Variables

Set these in Netlify (or `.env.local` for development):

- `VITE_MEDIA_BASE_URL`: Your backend server URL (e.g., `https://watch.example.com`)

## Netlify Deployment

1. **Build the app**:
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**:
   - Connect your GitHub repo to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Set environment variable: `VITE_MEDIA_BASE_URL=https://watch.example.com`

3. **Configure your backend**:
   - Set `ORIGIN` in your server's `.env` to your Netlify URL
   - Restart your server

## Features

- Join/create rooms with custom IDs
- Browse and select videos from your media server
- Custom video player with sync controls
- Personal settings (volume, captions, fullscreen, theatre mode)
- Real-time synchronization with other participants
- Deep linking to rooms via URL

## URL Structure

- `/` - Home page with room join
- `/room/:roomId` - Video room interface
- `/room/:roomId/media` - Media selection for the room
