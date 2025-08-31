import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import './VideoPlayer.css'

interface VideoPlayerProps {
  videoRef: React.MutableRefObject<HTMLVideoElement | null>
}

const VideoPlayer = ({ videoRef }: VideoPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      animate(containerRef.current, {
        opacity: [0, 1],
        scale: [0.96, 1],
        easing: 'easeOutQuad',
        duration: 600
      })
    }
  }, [])

  return (
    <div className="video-player" ref={containerRef}>
      <video
        ref={videoRef}
        className="video-element"
        controls={false}
        crossOrigin="anonymous"
      />
    </div>
  )
}

export default VideoPlayer
