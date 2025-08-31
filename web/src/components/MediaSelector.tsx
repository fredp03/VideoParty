import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import './MediaSelector.css'
import type { VideoInfo } from '../types'

interface MediaSelectorProps {
  isVisible: boolean
  videos: VideoInfo[]
  onVideoSelect: (video: VideoInfo) => void
}

const MediaSelector = ({ isVisible, videos, onVideoSelect }: MediaSelectorProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      const el = containerRef.current
      if (isVisible) {
        el.style.display = 'flex'
        const fullHeight = el.scrollHeight
        animate(el, {
          height: [0, fullHeight],
          opacity: [0, 1],
          duration: 300,
          easing: 'easeOutQuad'
        })
      } else {
        const fullHeight = el.scrollHeight
        animate(el, {
          height: [fullHeight, 0],
          opacity: [1, 0],
          duration: 300,
          easing: 'easeInQuad',
          complete: () => {
            el.style.display = 'none'
          }
        })
      }
    }
  }, [isVisible])

  return (
    <div className="media-selector" ref={containerRef} style={{ display: 'none', overflow: 'hidden', flexDirection: 'column', gap: '8px' }}>
      {videos.map((video) => (
        <div 
          key={video.relPath} 
          className="media-item"
          onClick={() => onVideoSelect(video)}
          style={{ cursor: 'pointer' }}
        >
          <div className="media-title">{video.title}</div>
          <div className="media-info">
            {(video.size / (1024 * 1024 * 1024)).toFixed(1)} GB
            {video.hasCaptions && <span className="captions-badge">CC</span>}
          </div>
        </div>
      ))}
      {videos.length === 0 && (
        <div className="media-item">No videos available</div>
      )}
    </div>
  )
}

export default MediaSelector
