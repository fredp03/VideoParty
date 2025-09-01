import { useState, useRef, useEffect, useCallback } from 'react'
import { animate } from 'animejs'
import './VideoPartyScreen.css'
import MenuBar from './MenuBar.tsx'
import VideoPlayer from './VideoPlayer.tsx'
import VideoControls from './VideoControls.tsx'
import ChatSection from './ChatSection.tsx'
import MediaSelector from './MediaSelector.tsx'
import type { AppState } from '../App.tsx'
import type { VideoInfo, WSMessage } from '../types.ts'
import { fetchVideos } from '../api.ts'
import { createSyncMessage, calculateDriftAdjustedTime, shouldSeekToTime } from '../sync.ts'

interface VideoPartyScreenProps {
  appState: AppState
}

const VideoPartyScreen = ({ appState }: VideoPartyScreenProps) => {
  const [isChatVisible, setIsChatVisible] = useState(false)
  const [shouldRenderChat, setShouldRenderChat] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [chatHeight, setChatHeight] = useState<number | undefined>(undefined)
  const [isMediaVisible, setIsMediaVisible] = useState(false)
  const [availableVideos, setAvailableVideos] = useState<VideoInfo[]>([])
  const mediaItemsRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const lastSyncRef = useRef<number>(0)

  const toggleChat = () => {
    if (isChatVisible) {
      setIsChatVisible(false)
    } else {
      setShouldRenderChat(true)
      setIsChatVisible(true)
    }
  }

  const toggleMedia = () => {
    setIsMediaVisible(!isMediaVisible)
  }

  const handleChatClosed = () => {
    setShouldRenderChat(false)
  }

  const togglePlayPause = useCallback(() => {
    const newPaused = !isPlaying
    setIsPlaying(!newPaused)
    
    if (videoRef.current && appState.currentRoom) {
      const message = createSyncMessage(
        newPaused ? 'pause' : 'play',
        appState.currentRoom,
        appState.clientId,
        videoRef.current.currentTime,
        newPaused
      )
      appState.wsClient.sendMessage(message)
    }
  }, [isPlaying, appState.currentRoom, appState.clientId, appState.wsClient])

  const handleVideoSeek = useCallback((newTime: number) => {
    if (videoRef.current && appState.currentRoom) {
      videoRef.current.currentTime = newTime
      const message = createSyncMessage(
        'seek',
        appState.currentRoom,
        appState.clientId,
        newTime,
        isPlaying
      )
      appState.wsClient.sendMessage(message)
    }
  }, [appState.currentRoom, appState.clientId, appState.wsClient, isPlaying])

  const handleVideoSelect = (video: VideoInfo) => {
    console.log('Video selected:', video)
    appState.selectedVideo = video
    const videoUrl = video.url
    
    console.log('Setting video source to:', videoUrl)
    
    // Test if the URL is accessible
    fetch(videoUrl, { method: 'HEAD' })
      .then(response => {
        console.log('Video URL test response:', response.status, response.statusText)
        if (!response.ok) {
          console.error('Video URL not accessible:', response.status)
        }
      })
      .catch(error => {
        console.error('Video URL test failed:', error)
      })
    
    if (videoRef.current) {
      videoRef.current.src = videoUrl
      videoRef.current.load()
      
      // Add event listeners to debug video loading
      const handleLoadStart = () => console.log('Video loadstart')
      const handleCanPlay = () => console.log('Video canplay')
      const handleError = (e: Event) => {
        console.error('Video error:', e)
        console.error('Video error details:', {
          error: videoRef.current?.error,
          networkState: videoRef.current?.networkState,
          readyState: videoRef.current?.readyState,
          src: videoRef.current?.src
        })
      }
      
      videoRef.current.addEventListener('loadstart', handleLoadStart)
      videoRef.current.addEventListener('canplay', handleCanPlay)
      videoRef.current.addEventListener('error', handleError)
      
      // Clean up listeners after some time to avoid memory leaks
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('loadstart', handleLoadStart)
          videoRef.current.removeEventListener('canplay', handleCanPlay)
          videoRef.current.removeEventListener('error', handleError)
        }
      }, 5000)
    }
    
    if (appState.currentRoom) {
      const message = createSyncMessage(
        'loadVideo',
        appState.currentRoom,
        appState.clientId,
        0,
        true,
        video.url
      )
      console.log('Sending loadVideo message:', message)
      appState.wsClient.sendMessage(message)
    }
    
    setIsMediaVisible(false)
  }

  // Load available videos on mount
  useEffect(() => {
    fetchVideos()
      .then(setAvailableVideos)
      .catch(console.error)
  }, [])

  // Set up WebSocket message handling
  useEffect(() => {
    const handleMessage = (message: WSMessage) => {
      // Don't process our own messages
      if (message.clientId === appState.clientId) return
      
      const now = Date.now()
      
      // Throttle rapid updates
      if (now - lastSyncRef.current < 100) return
      lastSyncRef.current = now

      if (!videoRef.current) return

      switch (message.type) {
        case 'loadVideo':
          console.log('Received loadVideo message:', message)
          console.log('Available videos:', availableVideos)
          if (message.videoUrl) {
            // Extract relative path from URL for lookup
            const relPath = decodeURIComponent(message.videoUrl.replace('/media/', ''))
            console.log('Looking for video with relPath:', relPath)
            console.log('Available video relPaths:', availableVideos.map(v => v.relPath))
            const video = availableVideos.find(v => v.relPath === relPath)
            console.log('Found video:', video)
            if (video) {
              appState.selectedVideo = video
              console.log('Setting received video source to:', video.url)
              videoRef.current.src = video.url
              videoRef.current.load()
            } else {
              console.warn('Video not found in available videos list')
            }
          }
          break

        case 'play': {
          setIsPlaying(true)
          const playTargetTime = calculateDriftAdjustedTime(message)
          if (shouldSeekToTime(videoRef.current.currentTime, playTargetTime)) {
            videoRef.current.currentTime = playTargetTime
          }
          break
        }

        case 'pause':
          setIsPlaying(false)
          break

        case 'seek': {
          const seekTargetTime = calculateDriftAdjustedTime(message)
          videoRef.current.currentTime = seekTargetTime
          break
        }

        case 'timeSync': {
          if (!isPlaying) return // Don't sync when paused
          const syncTargetTime = calculateDriftAdjustedTime(message)
          if (shouldSeekToTime(videoRef.current.currentTime, syncTargetTime)) {
            videoRef.current.currentTime = syncTargetTime
          }
          break
        }
      }
    }

    appState.wsClient.onMessage(handleMessage)
    
    return () => {
      // Note: We can't easily remove specific handlers with current WSClient design
      // This is acceptable for component lifetime
    }
  }, [appState, isPlaying, availableVideos])

  // Handle video element play/pause state
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(console.error)
      } else {
        videoRef.current.pause()
      }
    }
  }, [isPlaying])

  useEffect(() => {
    if (shouldRenderChat && mediaItemsRef.current) {
      const updateChatHeight = () => {
        if (mediaItemsRef.current) {
          const rect = mediaItemsRef.current.getBoundingClientRect()
          setChatHeight(rect.height)
        }
      }

      updateChatHeight()
      window.addEventListener('resize', updateChatHeight)

      return () => window.removeEventListener('resize', updateChatHeight)
    }
  }, [shouldRenderChat, isMediaVisible])

  useEffect(() => {
    if (mediaItemsRef.current) {
      animate(mediaItemsRef.current, {
        translateX: isChatVisible ? -20 : 0,
        scale: isChatVisible ? 0.98 : 1,
        duration: 400,
        easing: 'easeOutQuad'
      })
    }
  }, [isChatVisible])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlayPause()
      } else if (e.code === 'ArrowLeft') {
        if (videoRef.current) {
          const newTime = Math.max(0, videoRef.current.currentTime - 10)
          handleVideoSeek(newTime)
        }
      } else if (e.code === 'ArrowRight') {
        if (videoRef.current) {
          const newTime = Math.min(
            videoRef.current.duration || 0,
            videoRef.current.currentTime + 10
          )
          handleVideoSeek(newTime)
        }
      } else if (e.code === 'KeyF') {
        if (videoRef.current) {
          if (document.fullscreenElement) {
            document.exitFullscreen()
          } else {
            videoRef.current.requestFullscreen?.()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleVideoSeek, togglePlayPause])

  return (
    <div className="netflix-party-screen">
      <div className={`screen-container ${isChatVisible ? 'chat-visible' : 'chat-hidden'}`}>
        <MenuBar
          onChatToggle={toggleChat}
          isChatVisible={isChatVisible}
          onMediaToggle={toggleMedia}
          isMediaVisible={isMediaVisible}
        />

        <div className="horizontal-wrapper">
          <div
            className={`media-items ${isChatVisible ? '' : 'fullscreen'}`}
            ref={mediaItemsRef}
          >
            <VideoPlayer videoRef={videoRef} />
            <VideoControls
              isPlaying={isPlaying}
              onTogglePlayPause={togglePlayPause}
              onSeek={handleVideoSeek}
              videoRef={videoRef}
            />
            <MediaSelector 
              isVisible={isMediaVisible}
              videos={availableVideos}
              onVideoSelect={handleVideoSelect}
            />
          </div>
          {shouldRenderChat && (
            <ChatSection
              height={chatHeight}
              isVisible={isChatVisible}
              onRequestClose={() => setIsChatVisible(false)}
              onClosed={handleChatClosed}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default VideoPartyScreen
