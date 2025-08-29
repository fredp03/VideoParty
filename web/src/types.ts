export interface VideoInfo {
  id: string
  name: string
  relPath: string
  url: string
  captionsUrl?: string
}

export interface RoomState {
  currentTime: number
  paused: boolean
  videoUrl?: string
  lastUpdateMs: number
  initiatorClientId?: string
}

export interface WSMessage {
  type: 'loadVideo' | 'play' | 'pause' | 'seek' | 'timeSync'
  roomId: string
  clientId: string
  currentTime: number
  paused: boolean
  sentAtMs: number
  videoUrl?: string
}

export interface PersonalSettings {
  volume: number
  captionsEnabled: boolean
  theatreMode: boolean
}
