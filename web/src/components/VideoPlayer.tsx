import { useRef, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAppStore } from '../App'
import { calculateDriftAdjustedTime, shouldSeekToTime, createSyncMessage } from '../sync'
import { getVideoStreamUrl } from '../api'
import { WSMessage } from '../types'

function VideoPlayer() {
  const { roomId } = useParams<{ roomId: string }>()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isApplyingRemote, setIsApplyingRemote] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState(0)
  const [audioBlocked, setAudioBlocked] = useState(false)
  
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

  // Debug: Log the video URL
  if (selectedVideo) {
    const videoUrl = getVideoStreamUrl(selectedVideo.relPath)
    console.log('Video URL:', videoUrl)
    console.log('Selected video:', selectedVideo)
  }

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
    
    // Debug audio capabilities
    console.log('Video metadata loaded:', {
      duration: video.duration,
      muted: video.muted,
      volume: video.volume,
      readyState: video.readyState,
      networkState: video.networkState
    })
    
    // Ensure audio is not muted after metadata loads
    video.muted = false
    video.volume = personalSettings.volume
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
      // Ensure audio is enabled before playing
      video.muted = false
      video.volume = personalSettings.volume
      
      video.play().catch((error) => {
        console.error('Video play failed:', error)
        console.error('Video readyState:', video.readyState)
        console.error('Video networkState:', video.networkState)
        console.error('Video error:', video.error)
        console.error('Audio setup:', {
          muted: video.muted,
          volume: video.volume
        })
        
        // If autoplay is blocked, try playing muted first then unmuting
        if (error.name === 'NotAllowedError') {
          console.log('Autoplay blocked, trying muted playback...')
          setAudioBlocked(true)
          video.muted = true
          video.play().then(() => {
            // Show user a message to click to enable audio
            console.log('Playing muted. User needs to interact to enable audio.')
          }).catch(console.error)
        }
      })
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
      // If user adjusts volume and audio was blocked, try to unmute
      if (audioBlocked && volume > 0) {
        videoRef.current.muted = false
        setAudioBlocked(false)
      }
    }
  }

  const enableAudio = () => {
    const video = videoRef.current
    if (video && audioBlocked) {
      video.muted = false
      setAudioBlocked(false)
      console.log('Audio enabled by user interaction')
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
            preload="metadata"
            playsInline
            controls={false}
            muted={false}
            onPlay={handlePlay}
            onPause={handlePause}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onError={(e) => {
              const video = e.target as HTMLVideoElement
              console.error('Video loading error:', e)
              console.error('Video src:', video.src)
              console.error('Video readyState:', video.readyState)
              console.error('Video networkState:', video.networkState)
              console.error('Video error code:', video.error?.code)
              console.error('Video error message:', video.error?.message)
            }}
            onCanPlay={() => {
              const video = videoRef.current
              if (video) {
                // Ensure audio is not muted and volume is set
                video.muted = false
                video.volume = personalSettings.volume
                console.log('Video can play - Audio setup:', {
                  muted: video.muted,
                  volume: video.volume,
                  hasAudio: video.duration > 0 ? 'Unknown' : 'Checking...'
                })
              }
            }}
          >
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
                {audioBlocked && (
                  <button 
                    className="control-button audio-blocked" 
                    onClick={enableAudio}
                    title="Click to enable audio"
                  >
                    🔇
                  </button>
                )}
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
