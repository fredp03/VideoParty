import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchVideos } from '../api'
import { VideoInfo } from '../types'
import { useAppStore } from '../App'

function MediaPicker() {
  const { roomId } = useParams<{ roomId: string }>()
  const [videos, setVideos] = useState<VideoInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { setVideo, wsClient, clientId } = useAppStore()

  useEffect(() => {
    const loadVideos = async () => {
      try {
        setLoading(true)
        const videoList = await fetchVideos()
        setVideos(videoList)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load videos')
      } finally {
        setLoading(false)
      }
    }

    loadVideos()
  }, [])

  const handleVideoSelect = (video: VideoInfo) => {
    if (!roomId) return

    // Set the video in the app store
    setVideo(video)

    // Send loadVideo message to other clients
    wsClient.sendMessage({
      type: 'loadVideo',
      roomId,
      clientId,
      currentTime: 0,
      paused: true,
      sentAtMs: Date.now(),
      videoUrl: video.url
    })

    // Navigate back to room
    window.history.back()
  }

  if (loading) {
    return <div className="loading">Loading videos...</div>
  }

  if (error) {
    return <div className="error">Error: {error}</div>
  }

  return (
    <div className="media-picker">
      <h2>Select a Video for Room {roomId}</h2>
      
      {videos.length === 0 ? (
        <div className="error">No videos found in the media directory</div>
      ) : (
        <div className="media-grid">
          {videos.map((video: VideoInfo) => (
            <div
              key={video.id}
              className="media-item"
              onClick={() => handleVideoSelect(video)}
            >
              <h3>{video.name}</h3>
              <p>{video.relPath}</p>
              {video.captionsUrl && (
                <div className="captions-indicator">📝 Captions available</div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <Link to={`/room/${roomId}`} className="select-media-button">
          ← Back to Room
        </Link>
      </div>
    </div>
  )
}

export default MediaPicker
