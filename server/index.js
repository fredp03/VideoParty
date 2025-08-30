require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { WebSocketServer } = require('ws')
const http = require('http')
const path = require('path')
const fs = require('fs')
const mime = require('mime')
const { glob } = require('glob')

const app = express()
const server = http.createServer(app)

// Configuration
const PORT = process.env.PORT || 8080
const MEDIA_DIR = process.env.MEDIA_DIR || './media'
const ORIGIN = process.env.ORIGIN || 'http://localhost:5173'
const SHARED_TOKEN = process.env.SHARED_TOKEN

// CORS middleware with preflight handling
app.use((req, res, next) => {
  const origin = req.headers.origin
  
  // Only allow configured origin
  if (origin === ORIGIN) {
    res.header('Access-Control-Allow-Origin', ORIGIN)
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Authorization, Range, Content-Type')
  res.header('Access-Control-Expose-Headers', 'Accept-Ranges, Content-Length, Content-Range')
  res.header('Access-Control-Allow-Credentials', 'true')
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }
  
  next()
})

app.use(express.json())

// Auth middleware for API routes
const authMiddleware = (req, res, next) => {
  if (SHARED_TOKEN) {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' })
    }
    
    const token = authHeader.substring(7)
    if (token !== SHARED_TOKEN) {
      return res.status(401).json({ error: 'Invalid token' })
    }
  }
  next()
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: Date.now() })
})

app.get('/api/videos', authMiddleware, async (req, res) => {
  try {
    if (!fs.existsSync(MEDIA_DIR)) {
      return res.status(404).json({ error: 'Media directory not found' })
    }

    // Find video files recursively
    const videoExtensions = ['mp4', 'mkv', 'webm', 'mov', 'avi', 'm4v']
    const pattern = `**/*.{${videoExtensions.join(',')}}`
    const files = await glob(pattern, { cwd: MEDIA_DIR, nodir: true })

    const videos = files.map(relPath => {
      const fullPath = path.join(MEDIA_DIR, relPath)
      const parsedPath = path.parse(relPath)
      const captionsPath = path.join(parsedPath.dir, parsedPath.name + '.vtt')
      const captionsFullPath = path.join(MEDIA_DIR, captionsPath)
      
      return {
        id: Buffer.from(relPath).toString('base64'),
        name: parsedPath.name,
        relPath: relPath,
        url: `/media/${encodeURIComponent(relPath)}`,
        captionsUrl: fs.existsSync(captionsFullPath) ? `/media/${encodeURIComponent(captionsPath)}` : undefined
      }
    })

    res.json(videos)
  } catch (error) {
    console.error('Error scanning media directory:', error)
    res.status(500).json({ error: 'Failed to scan media directory' })
  }
})

// Media streaming with Range support
app.get('/media/*', authMiddleware, (req, res) => {
  try {
    const encodedPath = req.params[0]
    const relPath = decodeURIComponent(encodedPath)
    const fullPath = path.join(MEDIA_DIR, relPath)

    // Security check - ensure path is within media directory
    const resolvedPath = path.resolve(fullPath)
    const resolvedMediaDir = path.resolve(MEDIA_DIR)
    if (!resolvedPath.startsWith(resolvedMediaDir)) {
      return res.status(403).json({ error: 'Access denied' })
    }

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' })
    }

    const stat = fs.statSync(fullPath)
    const fileSize = stat.size
    const mimeType = mime.getType(fullPath) || 'application/octet-stream'

    res.set({
      'Content-Type': mimeType,
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': ORIGIN,
      'Access-Control-Allow-Headers': 'Range'
    })

    // Handle Range requests for video streaming
    const range = req.headers.range
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
      
      if (start >= fileSize) {
        res.status(416).set({
          'Content-Range': `bytes */${fileSize}`
        })
        return res.end()
      }

      const chunkSize = (end - start) + 1
      const stream = fs.createReadStream(fullPath, { start, end })

      res.status(206).set({
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Content-Length': chunkSize
      })

      stream.pipe(res)
    } else {
      // Send entire file
      res.set('Content-Length', fileSize)
      const stream = fs.createReadStream(fullPath)
      stream.pipe(res)
    }
  } catch (error) {
    console.error('Error serving media file:', error)
    res.status(500).json({ error: 'Failed to serve file' })
  }
})

// WebSocket server for real-time sync
const wss = new WebSocketServer({ 
  server,
  path: '/ws'
})

// Room management
const rooms = new Map() // roomId -> Set of client websockets

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const roomId = url.searchParams.get('roomId')
  const clientId = url.searchParams.get('clientId')
  const token = url.searchParams.get('token')

  // Auth check for WebSocket
  if (SHARED_TOKEN && token !== SHARED_TOKEN) {
    ws.close(1008, 'Invalid token')
    return
  }

  if (!roomId || !clientId) {
    ws.close(1008, 'Missing roomId or clientId')
    return
  }

  // Add client to room
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set())
  }
  
  const room = rooms.get(roomId)
  room.add(ws)

  // Store client info on websocket
  ws.roomId = roomId
  ws.clientId = clientId

  console.log(`Client ${clientId} joined room ${roomId}. Room size: ${room.size}`)

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString())
      
      // Validate message structure
      if (!message.type || !message.roomId || !message.clientId) {
        return
      }

      // Broadcast to all other clients in the same room
      const room = rooms.get(message.roomId)
      if (room) {
        room.forEach(client => {
          if (client !== ws && client.readyState === client.OPEN) {
            client.send(data)
          }
        })
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error)
    }
  })

  ws.on('close', () => {
    const room = rooms.get(roomId)
    if (room) {
      room.delete(ws)
      console.log(`Client ${clientId} left room ${roomId}. Room size: ${room.size}`)
      
      // Clean up empty rooms
      if (room.size === 0) {
        rooms.delete(roomId)
        console.log(`Room ${roomId} deleted (empty)`)
      }
    }
  })

  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
  })
})

// Error handling
app.use((err, req, res, next) => {
  console.error('Express error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// Start server
server.listen(PORT, () => {
  console.log(`VideoParty server running on port ${PORT}`)
  console.log(`Media directory: ${path.resolve(MEDIA_DIR)}`)
  console.log(`CORS origin: ${ORIGIN}`)
  console.log(`Authentication: ${SHARED_TOKEN ? 'Enabled' : 'Disabled'}`)
})
