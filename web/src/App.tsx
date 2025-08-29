import { Routes, Route, Navigate } from 'react-router-dom'
import { create } from 'zustand'
import RoomJoin from './components/RoomJoin'
import VideoPlayer from './components/VideoPlayer'
import MediaPicker from './components/MediaPicker'
import { VideoInfo, PersonalSettings } from './types'
import { WSClient } from './ws'

interface AppState {
  currentRoom: string | null
  clientId: string
  selectedVideo: VideoInfo | null
  wsClient: WSClient
  personalSettings: PersonalSettings
  setRoom: (roomId: string) => void
  setVideo: (video: VideoInfo | null) => void
  updatePersonalSettings: (settings: Partial<PersonalSettings>) => void
}

const useAppStore = create<AppState>((set) => ({
  currentRoom: null,
  clientId: Math.random().toString(36).substring(7),
  selectedVideo: null,
  wsClient: new WSClient(),
  personalSettings: {
    volume: 1,
    captionsEnabled: false,
    theatreMode: false
  },
  setRoom: (roomId: string) => set({ currentRoom: roomId }),
  setVideo: (video: VideoInfo | null) => set({ selectedVideo: video }),
  updatePersonalSettings: (settings: Partial<PersonalSettings>) =>
    set((state: AppState) => ({
      personalSettings: { ...state.personalSettings, ...settings }
    }))
}))

function App() {
  return (
    <div className="app">
      <header>
        <h1>VideoParty</h1>
      </header>
      
      <main>
        <Routes>
          <Route path="/" element={<RoomJoin />} />
          <Route path="/room/:roomId" element={<VideoPlayer />} />
          <Route path="/room/:roomId/media" element={<MediaPicker />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
export { useAppStore }
