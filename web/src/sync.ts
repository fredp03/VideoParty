import type { WSMessage } from './types'

export const SYNC_THRESHOLD = 0.35 // seconds

export function calculateDriftAdjustedTime(message: WSMessage): number {
  const drift = (Date.now() - message.sentAtMs) / 1000
  return message.currentTime + drift
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
