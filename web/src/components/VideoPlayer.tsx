import { useRef, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAppStore } from '../App'
import { calculateDriftAdjustedTime, shouldSeekToTime, createSyncMessage } from '../sync'
import { getVideoStreamUrl } from '../api'
import { WSMessage, VideoInfo } from '../types'

// Utility function to detect iOS devices
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function VideoPlayer() {
  const { roomId } = useParams<{ roomId: string }>()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isApplyingRemote, setIsApplyingRemote] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState(0)
  const [audioBlocked, setAudioBlocked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const {
    selectedVideo,
    clientId,
    wsClient,
    personalSettings,
    updatePersonalSettings,
    setVideo
  } = useAppStore()

  // Update video volume when personal settings change
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = personalSettings.volume
    }
  }, [personalSettings.volume])

  // Add iOS fullscreen event listeners
  useEffect(() => {
    const video = videoRef.current
    if (!video || !isIOS()) return

    const handleWebkitFullscreenChange = () => {
      const isFullscreen = 'webkitDisplayingFullscreen' in video && (video as any).webkitDisplayingFullscreen
      console.log('iOS fullscreen state changed:', isFullscreen)
    }

    // Listen for iOS fullscreen events
    video.addEventListener('webkitbeginfullscreen', () => {
      console.log('iOS fullscreen began')
    })
    
    video.addEventListener('webkitendfullscreen', () => {
      console.log('iOS fullscreen ended')
    })

    return () => {
      video.removeEventListener('webkitbeginfullscreen', handleWebkitFullscreenChange)
      video.removeEventListener('webkitendfullscreen', handleWebkitFullscreenChange)
    }
  }, [selectedVideo])

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
          // Don't ignore server messages (for room state sync)
          if (message.clientId === clientId && message.clientId !== 'server') return
          
          console.log('Received WebSocket message:', message)
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
  const handleRemoteMessage = async (message: WSMessage) => {
    const video = videoRef.current
    if (!video || isApplyingRemote) return

    const loadVideoFromUrl = async (videoUrl: string, fromRoomState = false) => {
      try {
        console.log('Loading video from URL:', videoUrl, 'fromRoomState:', fromRoomState)
        setIsLoading(true)
        const relPath = decodeURIComponent(videoUrl.replace(/^\/media\//, ''))
        
        // Try to fetch video info from server to get complete metadata
        try {
          const response = await fetch(`${import.meta.env.VITE_MEDIA_BASE_URL || 'http://localhost:8080'}/api/videos`)
          const videos = await response.json()
          const videoInfo = videos.find((v: VideoInfo) => v.relPath === relPath)
          
          if (videoInfo) {
            console.log('Found video info from server:', videoInfo)
            setVideo(videoInfo)
            if (video) {
              video.src = getVideoStreamUrl(videoInfo.relPath)
              video.load()
            }
            setIsLoading(false)
            
            // Only send sync message if not loading from room state
            if (!fromRoomState) {
              sendSyncMessage('loadVideo', 0)
            }
            return
          }
        } catch (error) {
          console.warn('Could not fetch video metadata from server, using fallback:', error)
        }
        
        // Fallback: create video info from URL
        const name = relPath.split('/').pop()?.replace(/\.[^/.]+$/, '') || relPath
        const newVideo: VideoInfo = {
          id: btoa(relPath),
          name,
          relPath,
          url: videoUrl
        }
        console.log('Using fallback video info:', newVideo)
        setVideo(newVideo)
        if (video) {
          video.src = getVideoStreamUrl(relPath)
          video.load()
        }
        setIsLoading(false)
        
        // Only send sync message if not loading from room state
        if (!fromRoomState) {
          sendSyncMessage('loadVideo', 0)
        }
      } catch (error) {
        console.error('Failed to load video from URL:', error)
        setIsLoading(false)
      }
    }

    setIsApplyingRemote(true)

    try {
      if (message.type === 'loadVideo') {
        if (message.videoUrl && (!selectedVideo || selectedVideo.url !== message.videoUrl)) {
          const isFromServer = message.clientId === 'server'
          await loadVideoFromUrl(message.videoUrl, isFromServer)
        }
      } else if (!selectedVideo && message.videoUrl) {
        const isFromServer = message.clientId === 'server'
        await loadVideoFromUrl(message.videoUrl, isFromServer)
      }

      const targetTime = calculateDriftAdjustedTime(message)

      switch (message.type) {
        case 'loadVideo':
          if (shouldSeekToTime(video.currentTime, targetTime)) {
            video.currentTime = targetTime
          }
          if (message.paused) {
            if (!video.paused) {
              video.pause()
            }
          } else {
            if (video.paused) {
              video.play().catch(console.error)
            }
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
    const video = videoRef.current
    const container = video?.parentElement
    
    if (!video || !container) return

    console.log('Fullscreen toggle requested', { 
      isIOS: isIOS(), 
      hasWebkitFullscreen: 'webkitEnterFullscreen' in video,
      currentFullscreenElement: document.fullscreenElement 
    })

    // Handle iOS devices differently
    if (isIOS()) {
      // On iOS, use the video element's native fullscreen
      try {
        if ('webkitEnterFullscreen' in video) {
          // Check if already in fullscreen mode
          if ('webkitDisplayingFullscreen' in video && (video as any).webkitDisplayingFullscreen) {
            // Exit fullscreen if supported
            if ('webkitExitFullscreen' in video) {
              console.log('Exiting iOS fullscreen')
              ;(video as any).webkitExitFullscreen()
            }
          } else {
            // Enter fullscreen
            console.log('Entering iOS fullscreen')
            ;(video as any).webkitEnterFullscreen()
          }
        } else {
          // Fallback: try standard fullscreen API
          console.log('iOS fallback to standard fullscreen')
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(console.error)
          } else {
            container.requestFullscreen().catch(console.error)
          }
        }
      } catch (error) {
        console.error('iOS fullscreen error:', error)
        // Final fallback for iOS
        console.log('Using fallback fullscreen method for iOS')
      }
    } else {
      // Desktop/Android: use standard fullscreen API
      console.log('Using standard fullscreen API')
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(console.error)
      } else {
        container.requestFullscreen().catch(console.error)
      }
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
        <div className="loading">
          {isLoading ? 'Loading video from room...' : 'No video selected. Choose a video to start watching together.'}
        </div>
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
            webkit-playsinline="true"
            x-webkit-airplay="allow"
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
