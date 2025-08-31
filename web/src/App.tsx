import './app.css'
import { useState, useEffect } from 'react'
import VideoPartyScreen from './components/VideoPartyScreen.tsx'
import LoginScreen from './components/LoginScreen.tsx'
import type { VideoInfo, PersonalSettings } from './types'
import { WSClient } from './ws'

export interface AppState {
  currentRoom: string | null
  clientId: string
  selectedVideo: VideoInfo | null
  wsClient: WSClient
  personalSettings: PersonalSettings
  isConnected: boolean
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [appState] = useState<AppState>(() => ({
    currentRoom: null,
    clientId: Math.random().toString(36).substring(7),
    selectedVideo: null,
    wsClient: new WSClient(),
    personalSettings: {
      volume: 1,
      captionsEnabled: false,
      theatreMode: false
    },
    isConnected: false
  }))

  // Auto-join a default room for 2-person setup
  useEffect(() => {
    if (isLoggedIn && !appState.currentRoom) {
      const defaultRoom = 'main-room'
      appState.currentRoom = defaultRoom
      
      // Connect to WebSocket
      appState.wsClient.connect(defaultRoom, appState.clientId)
        .then(() => {
          appState.isConnected = true
          console.log('Connected to VideoParty room:', defaultRoom)
        })
        .catch(console.error)
    }
  }, [isLoggedIn, appState])

  return (
    <div className="app">
      {isLoggedIn ? (
        <VideoPartyScreen appState={appState} />
      ) : (
        <LoginScreen onLogin={() => setIsLoggedIn(true)} />
      )}
    </div>
  )
}

export default App
