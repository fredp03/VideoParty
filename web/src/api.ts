import type { VideoInfo } from './types'

const BASE_URL = import.meta.env.VITE_MEDIA_BASE_URL || 'http://localhost:8080'

export async function fetchVideos(): Promise<VideoInfo[]> {
  const response = await fetch(`${BASE_URL}/api/videos`)
  if (!response.ok) {
    throw new Error('Failed to fetch videos')
  }
  return response.json()
}

export function getVideoStreamUrl(relPath: string): string {
  return `${BASE_URL}/media/${encodeURIComponent(relPath)}`
}

export function getCaptionsUrl(relPath: string): string {
  return `${BASE_URL}/media/${encodeURIComponent(relPath)}`
}

export function getWebSocketUrl(): string {
  const wsBase = BASE_URL.replace('https:', 'wss:').replace('http:', 'ws:')
  return `${wsBase}/ws`
}
