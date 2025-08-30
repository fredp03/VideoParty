import { useRef, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAppStore } from '../App'
import { calculateDriftAdjustedTime, shouldSeekToTime, createSyncMessage } from '../sync'
import { getVideoStreamUrl, getCaptionsUrl } from '../api'
import { WSMessage } from '../types'

function VideoPlayer() {
  const { roomId } = useParams<{ roomId: string }>()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isApplyingRemote, setIsApplyingRemote] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState(0)
  
  const {
    selectedVideo,
    clientId,
    wsClient,
    personalSettings,
    updatePersonalSettings
  } = useAppStore()

  // Update video volume when personal settings change
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = personalSettings.volume
    }
  }, [personalSettings.volume])

  // Connect to WebSocket
  useEffect(() => {
    if (!roomId) return

    const connect = async () => {
      try {
        await wsClient.connect(roomId, clientId)
        
        wsClient.onMessage((message: WSMessage) => {
          if (message.clientId === clientId) return // Ignore own messages
          
          handleRemoteMessage(message)
        })
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error)
      }
    }

    connect()

    return () => {
      wsClient.disconnect()
    }
  }, [roomId, clientId, wsClient])

  // Handle remote WebSocket messages
  const handleRemoteMessage = (message: WSMessage) => {
    const video = videoRef.current
    if (!video || isApplyingRemote) return

    setIsApplyingRemote(true)

    try {
      const targetTime = calculateDriftAdjustedTime(message)

      switch (message.type) {
        case 'loadVideo':
          if (message.videoUrl && selectedVideo?.url !== message.videoUrl) {
            // Load new video - this would need to be handled by app state
            console.log('Remote video load:', message.videoUrl)
          }
          break

        case 'play':
          if (shouldSeekToTime(video.currentTime, targetTime)) {
            video.currentTime = targetTime
          }
          if (video.paused) {
            video.play().catch(console.error)
          }
          break

        case 'pause':
          if (shouldSeekToTime(video.currentTime, targetTime)) {
            video.currentTime = targetTime
          }
          if (!video.paused) {
            video.pause()
          }
          break

        case 'seek':
          video.currentTime = targetTime
          break

        case 'timeSync':
          if (shouldSeekToTime(video.currentTime, targetTime)) {
            video.currentTime = targetTime
          }
          break
      }
    } finally {
      setTimeout(() => setIsApplyingRemote(false), 100)
    }
  }

  // Send sync message
  const sendSyncMessage = (type: WSMessage['type'], time?: number) => {
    if (!roomId || isApplyingRemote) return

    const video = videoRef.current
    if (!video) return

    const message = createSyncMessage(
      type,
      roomId,
      clientId,
      time ?? video.currentTime,
      video.paused,
      selectedVideo?.url
    )

    wsClient.sendMessage(message)
  }

  // Video event handlers
  const handlePlay = () => {
    setIsPlaying(true)
    sendSyncMessage('play')
  }

  const handlePause = () => {
    setIsPlaying(false)
    sendSyncMessage('pause')
  }

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video) return

    setCurrentTime(video.currentTime)

    // Send periodic sync if playing (every 5 seconds)
    const now = Date.now()
    if (!video.paused && now - lastSyncTime > 5000) {
      setLastSyncTime(now)
      sendSyncMessage('timeSync')
    }
  }

  const handleLoadedMetadata = () => {
    const video = videoRef.current
    if (!video) return
    setDuration(video.duration)
  }

  const handleSeek = (newTime: number) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = newTime
    sendSyncMessage('seek', newTime)
  }

  // Control handlers
  const togglePlayPause = () => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      video.play().catch(console.error)
    } else {
      video.pause()
    }
  }

  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement
    if (!container) return

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.error)
    } else {
      container.requestFullscreen().catch(console.error)
    }
  }

  const toggleTheatreMode = () => {
    updatePersonalSettings({ theatreMode: !personalSettings.theatreMode })
  }

  const toggleCaptions = () => {
    updatePersonalSettings({ captionsEnabled: !personalSettings.captionsEnabled })
  }

  const handleVolumeChange = (volume: number) => {
    updatePersonalSettings({ volume })
    if (videoRef.current) {
      videoRef.current.volume = volume
    }
  }

  // Format time display
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // Progress bar interaction
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickRatio = clickX / rect.width
    const newTime = clickRatio * duration
    handleSeek(newTime)
  }

  if (!selectedVideo) {
    return (
      <div className="video-player-container">
        <div className="room-info">
          <div className="room-id">Room: {roomId}</div>
          <Link to={`/room/${roomId}/media`} className="select-media-button">
            Select Video
          </Link>
        </div>
        <div className="loading">No video selected. Choose a video to start watching together.</div>
      </div>
    )
  }

  return (
    <div className="video-player-container">
      <div className="room-info">
        <div className="room-id">Room: {roomId}</div>
        <Link to={`/room/${roomId}/media`} className="select-media-button">
          Change Video
        </Link>
      </div>

      <div className={`video-container ${personalSettings.theatreMode ? 'theatre-mode' : ''}`}>
        <div className="video-player">
          <video
            ref={videoRef}
            src={getVideoStreamUrl(selectedVideo.relPath)}
            onPlay={handlePlay}
            onPause={handlePause}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
          >
            {selectedVideo.captionsUrl && (
              <track
                kind="captions"
                src={selectedVideo.captionsUrl}
                default={personalSettings.captionsEnabled}
              />
            )}
          </video>

          <div className="video-controls">
            <div className="progress-container">
              <div className="progress-bar" onClick={handleProgressClick}>
                <div 
                  className="progress-fill" 
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
            </div>

            <div className="controls-row">
              <button className="play-button" onClick={togglePlayPause}>
                {isPlaying ? '⏸️' : '▶️'}
              </button>

              <div className="time-display">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>

              <div className="volume-container">
                <span>🔊</span>
                <input
                  type="range"
                  className="volume-slider"
                  min="0"
                  max="1"
                  step="0.1"
                  value={personalSettings.volume}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleVolumeChange(parseFloat(e.target.value))}
                />
              </div>

              <div className="controls-right">
                {selectedVideo.captionsUrl && (
                  <button
                    className={`control-button ${personalSettings.captionsEnabled ? 'active' : ''}`}
                    onClick={toggleCaptions}
                    title="Toggle captions"
                  >
                    CC
                  </button>
                )}
                
                <button
                  className={`control-button ${personalSettings.theatreMode ? 'active' : ''}`}
                  onClick={toggleTheatreMode}
                  title="Theatre mode"
                >
                  🎭
                </button>

                <button
                  className="control-button"
                  onClick={toggleFullscreen}
                  title="Fullscreen"
                >
                  ⛶
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoPlayer
