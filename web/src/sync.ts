import { WSMessage } from './types'

// Detect mobile devices for tighter sync
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// Tighter sync threshold for mobile devices
export const SYNC_THRESHOLD = isMobile() ? 0.15 : 0.35 // seconds

// More frequent sync for mobile
export const SYNC_INTERVAL = isMobile() ? 2000 : 5000 // milliseconds

export function calculateDriftAdjustedTime(message: WSMessage): number {
  const networkDelay = (Date.now() - message.sentAtMs) / 1000
  
  // Apply mobile-specific compensation
  const mobileOffset = isMobile() ? 0.05 : 0 // 50ms compensation for mobile processing delay
  
  return message.currentTime + networkDelay - mobileOffset
}

export function shouldSeekToTime(currentTime: number, targetTime: number): boolean {
  return Math.abs(currentTime - targetTime) > SYNC_THRESHOLD
}

export function createSyncMessage(
  type: WSMessage['type'],
  roomId: string,
  clientId: string,
  currentTime: number,
  paused: boolean,
  videoUrl?: string
): WSMessage {
  return {
    type,
    roomId,
    clientId,
    currentTime,
    paused,
    sentAtMs: Date.now(),
    videoUrl
  }
}
