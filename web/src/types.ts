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
  id: string
  name: string
  relPath: string
  url: string
  captionsUrl?: string
  audioCompatible: boolean
  audioInfo?: {
    codec: string
    channels: number
    channelLayout: string
    sampleRate: string
  }
}

// Personal settings (local to each user)
export interface PersonalSettings {
  volume: number
  captionsEnabled: boolean
  theatreMode: boolean
}
