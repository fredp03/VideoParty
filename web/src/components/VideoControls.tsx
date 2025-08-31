import { useEffect, useRef, useState } from 'react'
import { animate } from 'animejs'
import './VideoControls.css'

interface VideoControlsProps {
  isPlaying: boolean
  onTogglePlayPause: () => void
  onSeek: (newTime: number) => void
  videoRef: React.MutableRefObject<HTMLVideoElement | null>
}

const VideoControls = ({ isPlaying, onTogglePlayPause, onSeek, videoRef }: VideoControlsProps) => {
  const progressBarRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const progressVal = useRef(0)
  const [progress, setProgress] = useState(0)
  const [isScrubbing, setIsScrubbing] = useState(false)
  const [volume, setVolume] = useState(1)
  const [boosted, setBoosted] = useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const [showVolumeIndicator, setShowVolumeIndicator] = useState(false)
  const hideVolumeTimer = useRef<number | null>(null)

  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return

    let raf: number
    const update = () => {
      if (!isScrubbing) {
        const pct = vid.duration ? vid.currentTime / vid.duration : 0
        setProgress(pct)
      }
      raf = requestAnimationFrame(update)
    }

    update()
    return () => cancelAnimationFrame(raf)
  }, [videoRef, isScrubbing])

  const handleScrub = (clientX: number) => {
    if (!progressBarRef.current || !videoRef.current) return
    const rect = progressBarRef.current.getBoundingClientRect()
    const pos = Math.min(Math.max(0, clientX - rect.left), rect.width)
    const pct = pos / rect.width
    const newTime = pct * (videoRef.current.duration || 0)
    onSeek(newTime)
    setProgress(pct)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsScrubbing(true)
    handleScrub(e.clientX)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (isScrubbing) handleScrub(e.clientX)
  }
  const endScrub = (e: React.PointerEvent) => {
    if (isScrubbing) {
      handleScrub(e.clientX)
      setIsScrubbing(false)
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value)
    setVolume(vol)
    if (videoRef.current) videoRef.current.volume = Math.min(vol, 1)
    if (gainRef.current) gainRef.current.gain.value = vol
    setShowVolumeIndicator(true)
    if (hideVolumeTimer.current) clearTimeout(hideVolumeTimer.current)
    hideVolumeTimer.current = window.setTimeout(() => setShowVolumeIndicator(false), 800)
  }

  const handleVolumePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const boost = e.metaKey
    setBoosted(boost)
    if (!boost && volume > 1) {
      const clamped = 1
      setVolume(clamped)
      if (videoRef.current) videoRef.current.volume = clamped
      if (gainRef.current) gainRef.current.gain.value = clamped
    }
  }

  const handleVolumeDoubleClick = () => {
    const vol = 0
    setVolume(vol)
    if (videoRef.current) videoRef.current.volume = vol
    if (gainRef.current) gainRef.current.gain.value = vol
    setShowVolumeIndicator(true)
    if (hideVolumeTimer.current) clearTimeout(hideVolumeTimer.current)
    hideVolumeTimer.current = window.setTimeout(() => setShowVolumeIndicator(false), 800)
  }

  const handleFullscreen = () => {
    const vid = videoRef.current
    if (!vid) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      vid.requestFullscreen?.()
    }
  }

  useEffect(() => {
    if (buttonRef.current) {
      animate(buttonRef.current, {
        scale: [0.9, 1],
        easing: 'spring(1, 80, 10, 0)',
        duration: 500
      })
    }
  }, [isPlaying])

  useEffect(() => {
    if (progressRef.current && progressBarRef.current) {
      const width = progressBarRef.current.clientWidth
      progressRef.current.style.left = `${progress * width}px`
    }
    progressVal.current = progress
  }, [progress])

  useEffect(() => {
    if (!progressBarRef.current) return
    const bar = progressBarRef.current
    const update = () => {
      if (progressRef.current) {
        const width = bar.clientWidth
        progressRef.current.style.left = `${progressVal.current * width}px`
      }
    }
    const observer = new ResizeObserver(update)
    observer.observe(bar)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!videoRef.current) return
    if (!audioCtxRef.current) {
      const ctx = new AudioContext()
      const source = ctx.createMediaElementSource(videoRef.current)
      const gain = ctx.createGain()
      source.connect(gain).connect(ctx.destination)
      gain.gain.value = volume
      audioCtxRef.current = ctx
      gainRef.current = gain
    }
  }, [videoRef, volume])

  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = volume
  }, [volume])

  return (
    <div className="video-controls">
      <div
        className="video-progress"
        ref={progressBarRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endScrub}
      >
        <svg width="100%" height="2" viewBox="0 0 1422 2" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1.70755 1H1420.96" stroke="#4D413F" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <div className="video-position" ref={progressRef} />
      </div>

      <div className="control-buttons">
        <div
          className="volume-control"
          onPointerDown={handleVolumePointerDown}
          onDoubleClick={handleVolumeDoubleClick}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#5D5D5D" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9v6h4l5 5V4L7 9H3z" />
          </svg>
          <input
            type="range"
            min="0"
            max={boosted ? 4 : 1}
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
          />
          <div className="volume-indicator" style={{ opacity: showVolumeIndicator ? 1 : 0 }}>
            {Math.round(volume * 100)}%
          </div>
        </div>

        <button className="play-pause-button" onClick={onTogglePlayPause} ref={buttonRef}>
          {isPlaying ? (
            <svg width="48" height="24" viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="18.2" y="4" width="3.6" height="16" rx="1.8" fill="#5D5D5D" />
              <rect x="26.2" y="4" width="3.6" height="16" rx="1.8" fill="#5D5D5D" />
            </svg>
          ) : (
            <svg width="48" height="24" viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16.6 4L31.4 12L16.6 20V4Z" fill="#5D5D5D" />
            </svg>
          )}
        </button>

        <button className="fullscreen-btn" onClick={handleFullscreen}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#5D5D5D"
            strokeWidth="2"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M4 4h6v2H6v4H4V4zm14 0h-6v2h4v4h2V4zM4 14h2v4h4v2H4v-6zm16 0h-2v4h-4v2h6v-6z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default VideoControls
