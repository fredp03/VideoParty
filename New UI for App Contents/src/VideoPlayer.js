import React, { useRef, useState, useEffect } from 'react';
import anime from 'animejs/lib/anime.es.js';
import './VideoPlayer.css';

// Base dimensions for the video area
const VIDEO_BASE_WIDTH = 1840;
const BASE_HEIGHT = 1121;

// Dimensions for the chat section that sits beside the video.
// These values roughly mirror the design files and are scaled together
// with the video so that both sections maintain their proportions.
const CHAT_BASE_WIDTH = 460;
const GAP = 20; // space between the video and chat sections
const BASE_WIDTH = VIDEO_BASE_WIDTH + GAP + CHAT_BASE_WIDTH;

const VideoPlayer = () => {
  const wrapperRef = useRef(null);
  const videoRef = useRef(null);
  const playbarRef = useRef(null);
  const animationRef = useRef(null);
  const elapsedRef = useRef(null);
  const progressAnimRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (wrapperRef.current) {
        const width = wrapperRef.current.offsetWidth;
        setScale(width / BASE_WIDTH);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      if (progressAnimRef.current && duration) {
        const anim = progressAnimRef.current;
        anim.seek((video.currentTime / duration) * anim.duration);
        anim.play();
      }
      setPlaying(true);
    } else {
      video.pause();
      // force the video element to keep displaying the last frame
      video.currentTime = video.currentTime;
      progressAnimRef.current?.pause();
      setPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
    // when paused, reflect the exact time
    if (video.paused) {
      setCurrentTime(video.currentTime);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return hours > 0
      ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds}`
      : `${minutes}:${seconds}`;
  };

  const handleVolumeChange = (e) => {
    const value = Number(e.target.value);
    setVolume(value);
    if (videoRef.current) {
      videoRef.current.volume = value;
    }
  };

  const handleSeek = (e) => {
    if (!playbarRef.current || !videoRef.current) return;
    const rect = playbarRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    videoRef.current.currentTime = newTime;
    if (progressAnimRef.current) {
      progressAnimRef.current.seek(percent * progressAnimRef.current.duration);
    }
    setCurrentTime(newTime);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (video.requestFullscreen) {
      video.requestFullscreen();
    }
  };

  const showAirplayPicker = () => {
    const video = videoRef.current;
    if (video && typeof video.webkitShowPlaybackTargetPicker === 'function') {
      video.webkitShowPlaybackTargetPicker();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (hovered && e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hovered, playing]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const update = () => {
      setCurrentTime(video.currentTime);
      animationRef.current = requestAnimationFrame(update);
    };

    if (playing) {
      animationRef.current = requestAnimationFrame(update);
    } else {
      cancelAnimationFrame(animationRef.current);
    }

    return () => cancelAnimationFrame(animationRef.current);
  }, [playing]);

  useEffect(() => {
    if (duration && elapsedRef.current) {
      progressAnimRef.current = anime({
        targets: elapsedRef.current,
        width: '100%',
        duration: duration * 1000,
        easing: 'linear',
        autoplay: false,
      });
    }
  }, [duration]);

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
              src="https://www.w3schools.com/html/mov_bbb.mp4"
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
                  <div className="airplay-icon" onClick={showAirplayPicker}>
                    <svg width="17" height="15" viewBox="0 0 17 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3.25 11.1111H2.5C2.10218 11.1111 1.72064 10.9589 1.43934 10.688C1.15804 10.4172 1 10.0498 1 9.66667V2.44444C1 2.06135 1.15804 1.69395 1.43934 1.42307C1.72064 1.15218 2.10218 1 2.5 1H14.5C14.8978 1 15.2794 1.15218 15.5607 1.42307C15.842 1.69395 16 2.06135 16 2.44444V9.66667C16 10.0498 15.842 10.4172 15.5607 10.688C15.2794 10.9589 14.8978 11.1111 14.5 11.1111H13.75M8.5 9.66667L12.25 14H4.75L8.5 9.66667Z" stroke="#E0E0E0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="captions-icon">
                    <svg width="21" height="15" viewBox="0 0 21 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12.2646 4.05425C13.308 3.53252 14.5558 3.74517 15.3803 4.56973C15.6732 4.86262 15.6732 5.3375 15.3803 5.63039C15.0874 5.92328 14.6126 5.92327 14.3197 5.63038C13.9442 5.25491 13.392 5.16759 12.9354 5.39588C12.5049 5.61115 12 6.20283 12 7.50006C12 8.79729 12.5049 9.38896 12.9354 9.60422C13.392 9.83251 13.9442 9.74518 14.3197 9.36972C14.6126 9.07683 15.0874 9.07683 15.3803 9.36972C15.6732 9.66261 15.6732 10.1375 15.3803 10.4304C14.5558 11.2549 13.308 11.4676 12.2646 10.9459C11.1951 10.4111 10.5 9.20279 10.5 7.50006C10.5 5.79733 11.1951 4.589 12.2646 4.05425ZM9.38033 4.56973C8.55579 3.74517 7.30802 3.53252 6.26458 4.05425C5.19511 4.589 4.5 5.79733 4.5 7.50006C4.5 9.20279 5.19511 10.4111 6.26459 10.9459C7.30802 11.4676 8.55579 11.2549 9.38033 10.4304C9.67322 10.1375 9.67322 9.66261 9.38033 9.36972C9.08744 9.07683 8.61256 9.07683 8.31967 9.36972C7.94421 9.74518 7.39198 9.83251 6.93541 9.60422C6.50489 9.38896 6 8.79729 6 7.50006C6 6.20283 6.50489 5.61115 6.93542 5.39588C7.39198 5.16759 7.94421 5.25491 8.31967 5.63038C8.61256 5.92327 9.08743 5.92328 9.38033 5.63039C9.67322 5.3375 9.67323 4.86262 9.38033 4.56973ZM0 3.75C0 1.67893 1.67893 0 3.75 0H17.25C19.3211 0 21 1.67893 21 3.75V11.25C21 13.3211 19.3211 15 17.25 15H3.75C1.67893 15 0 13.3211 0 11.25V3.75ZM3.75 1.5C2.50736 1.5 1.5 2.50736 1.5 3.75V11.25C1.5 12.4926 2.50736 13.5 3.75 13.5H17.25C18.4926 13.5 19.5 12.4926 19.5 11.25V3.75C19.5 2.50736 18.4926 1.5 17.25 1.5H3.75Z" fill="#E0E0E0"/>
                    </svg>
                  </div>
                  <div className="time-remaining">{formatTime(duration - currentTime)}</div>
                  <div className="expand-icon" onClick={toggleFullscreen}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4.33333 1H2.33333C1.97971 1 1.64057 1.14048 1.39052 1.39052C1.14048 1.64057 1 1.97971 1 2.33333V4.33333M13 4.33333V2.33333C13 1.97971 12.8595 1.64057 12.6095 1.39052C12.3594 1.14048 12.0203 1 11.6667 1H9.66667M9.66667 13H11.6667C12.0203 13 12.3594 12.8595 12.6095 12.6095C12.8595 12.3594 13 12.0203 13 11.6667V9.66667M1 9.66667V11.6667C1 12.0203 1.14048 12.3594 1.39052 12.6095C1.64057 12.8595 1.97971 13 2.33333 13H4.33333" stroke="#E0E0E0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="playbar" onClick={handleSeek} ref={playbarRef}>
                <div className="elapsed" ref={elapsedRef} />
              </div>
            </div>
          </div>
          <button className="play-pause" onClick={togglePlay} aria-label="play pause">
            {playing ? (
              <svg width="50" height="21" viewBox="0 0 50 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M38 2V19M49 2V19" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1 18.322V2.83726C1 2.04494 1.87753 1.56731 2.54291 1.99748L15.5827 10.4276C16.2208 10.8401 16.1839 11.7853 15.5156 12.1469L2.47584 19.2016C1.80955 19.562 1 19.0796 1 18.322Z" stroke="#333333" strokeWidth="2"/>
              </svg>
            ) : (
              <svg width="50" height="21" viewBox="0 0 50 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M38 2V19M49 2V19" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1 18.322V2.83726C1 2.04494 1.87753 1.56731 2.54291 1.99748L15.5827 10.4276C16.2208 10.8401 16.1839 11.7853 15.5156 12.1469L2.47584 19.2016C1.80955 19.562 1 19.0796 1 18.322Z" stroke="#333333" strokeWidth="2"/>
              </svg>
            )}
          </button>
        </div>
        <div className="chat-section">
          <div className="chat-header">
            <button className="chat-close" aria-label="close chat">×</button>
          </div>
          <div className="chat-messages">
            <div className="message other">Hello...</div>
            <div className="message self">Hey, what movie are we watching??</div>
            <div className="message self">How cool is this texting</div>
            <div className="message other">Ik right! did u make this?</div>
          </div>
          <div className="chat-input">Start typing your message</div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;

