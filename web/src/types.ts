// WebSocket message types
export interface WSMessage {
  type: 'play' | 'pause' | 'seek' | 'loadVideo' | 'timeSync'
  roomId: string
  clientId: string
  currentTime: number
  paused: boolean
  sentAtMs: number
  videoUrl?: string
}

// Video information from API
export interface VideoInfo {
  relPath: string
  title: string
  size: number
  hasCaptions: boolean
}

// Personal settings (local to each user)
export interface PersonalSettings {
  volume: number
  captionsEnabled: boolean
  theatreMode: boolean
}
