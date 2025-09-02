import { WSMessage } from './types'

export const SYNC_THRESHOLD = 0.5 // seconds - increased for better stability
export const PERIODIC_SYNC_INTERVAL = 10000 // 10 seconds instead of 5
export const SYNC_THROTTLE_MS = 500 // minimum time between sync messages

// Track last sync times to prevent spam
const lastSyncTimes = new Map<string, number>()

export function calculateDriftAdjustedTime(message: WSMessage): number {
  const now = Date.now()
  const networkDelay = (now - message.sentAtMs) / 1000
  
  // For paused videos, don't add drift compensation
  if (message.paused) {
    return message.currentTime
  }
  
  // For playing videos, add half the network delay as compensation
  // (assumes symmetric network delay)
  return message.currentTime + (networkDelay * 0.5)
}

export function shouldSeekToTime(currentTime: number, targetTime: number): boolean {
  const diff = Math.abs(currentTime - targetTime)
  return diff > SYNC_THRESHOLD
}

export function canSendSyncMessage(roomId: string, clientId: string): boolean {
  const key = `${roomId}:${clientId}`
  const now = Date.now()
  const lastSync = lastSyncTimes.get(key) || 0
  
  if (now - lastSync < SYNC_THROTTLE_MS) {
    return false
  }
  
  lastSyncTimes.set(key, now)
  return true
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
