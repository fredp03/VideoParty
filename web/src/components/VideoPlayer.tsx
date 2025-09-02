import { useRef, useState, useEffect } from 'react'
import anime from 'animejs'
import './VideoPlayer.css'

const VIDEO_BASE_WIDTH = 1840
const CHAT_BASE_WIDTH = 460
const GAP = 20
const BASE_WIDTH = VIDEO_BASE_WIDTH + GAP + CHAT_BASE_WIDTH

interface VideoInfo {
  id: string
  name: string
  url: string
  relPath: string
  captionsUrl?: string
}

function VideoPlayer() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const playbarRef = useRef<HTMLDivElement>(null)
  const elapsedRef = useRef<HTMLDivElement>(null)
  const progressAnimRef = useRef<anime.AnimeInstance | null>(null)
  const animationRef = useRef<number>()
  const [scale, setScale] = useState(1)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [hovered, setHovered] = useState(false)
  const [videos, setVideos] = useState<VideoInfo[]>([])

  useEffect(() => {
    const handleResize = () => {
      if (wrapperRef.current) {
        const width = wrapperRef.current.offsetWidth
        setScale(width / BASE_WIDTH)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    fetch(`${import.meta.env.VITE_MEDIA_BASE_URL || 'http://localhost:8080'}/api/videos`)
      .then(res => res.json())
      .then((data: VideoInfo[]) => setVideos(data))
      .catch(err => console.error('Failed to load videos', err))
  }, [])

  const loadVideo = (video: VideoInfo) => {
    const base = import.meta.env.VITE_MEDIA_BASE_URL || 'http://localhost:8080'
    if (videoRef.current) {
      videoRef.current.src = `${base}${video.url}`
      videoRef.current.load()
      setPlaying(false)
      setCurrentTime(0)
    }
  }

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
      if (progressAnimRef.current && duration) {
        const anim = progressAnimRef.current
        anim.seek((video.currentTime / duration) * anim.duration)
        anim.play()
      }
      setPlaying(true)
    } else {
      video.pause()
      video.currentTime = video.currentTime
      progressAnimRef.current?.pause()
      setPlaying(false)
    }
  }

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video) return
    setDuration(video.duration)
    if (video.paused) {
      setCurrentTime(video.currentTime)
    }
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    const hours = Math.floor(time / 3600)
    const minutes = Math.floor((time % 3600) / 60)
    const seconds = Math.floor(time % 60).toString().padStart(2, '0')
    return hours > 0
      ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds}`
      : `${minutes}:${seconds}`
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value)
    setVolume(value)
    if (videoRef.current) {
      videoRef.current.volume = value
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playbarRef.current || !videoRef.current) return
    const rect = playbarRef.current.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newTime = percent * duration
    videoRef.current.currentTime = newTime
    if (progressAnimRef.current) {
      progressAnimRef.current.seek(percent * progressAnimRef.current.duration)
    }
    setCurrentTime(newTime)
  }

  const toggleFullscreen = () => {
    const video = videoRef.current
    if (!video) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else if (video.requestFullscreen) {
      video.requestFullscreen()
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (hovered && e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hovered, playing])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const update = () => {
      setCurrentTime(video.currentTime)
      animationRef.current = requestAnimationFrame(update)
    }

    if (playing) {
      animationRef.current = requestAnimationFrame(update)
    } else {
      cancelAnimationFrame(animationRef.current!)
    }

    return () => cancelAnimationFrame(animationRef.current!)
  }, [playing])

  useEffect(() => {
    if (duration && elapsedRef.current) {
      progressAnimRef.current = anime({
        targets: elapsedRef.current,
        width: '100%',
        duration: duration * 1000,
        easing: 'linear',
        autoplay: false,
      })
    }
  }, [duration])

  return (
    <div className="video-player-wrapper" ref={wrapperRef}>
      <div className="video-player-base" style={{ transform: `scale(${scale})` }}>
        <div className="video-section">
          <div
            className="video-placeholder"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <video
              ref={videoRef}
              className="video-element"
              onLoadedMetadata={handleTimeUpdate}
              onTimeUpdate={handleTimeUpdate}
            />
            <div className="hover-controls">
              <div className="controls-top">
                <div className="controls-left">
                  <div className="time-elapsed">{formatTime(currentTime)}</div>
                  <div className="volume-slider">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={handleVolumeChange}
                    />
                  </div>
                </div>
                <div className="controls-right">
                  <div onClick={toggleFullscreen}>Fullscreen</div>
                </div>
              </div>
              <div className="playbar" ref={playbarRef} onClick={handleSeek}>
                <div className="elapsed" ref={elapsedRef}></div>
              </div>
              <button className="play-pause" onClick={togglePlay}>
                {playing ? 'Pause' : 'Play'}
              </button>
            </div>
          </div>
        </div>
        <div className="chat-section">
          <div className="media-list">
            {videos.map((v) => (
              <div key={v.id} className="media-item" onClick={() => loadVideo(v)}>
                {v.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoPlayer

