import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function RoomJoin() {
  const [roomId, setRoomId] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomId.trim()) return

    setIsJoining(true)
    try {
      // Navigate to room
      navigate(`/room/${encodeURIComponent(roomId.trim())}`)
    } catch (error) {
      console.error('Failed to join room:', error)
    } finally {
      setIsJoining(false)
    }
  }

  const generateRoomId = () => {
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase()
    setRoomId(randomId)
  }

  return (
    <div className="room-join">
      <h2>Join a Watch Party</h2>
      <form className="room-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter room ID"
          value={roomId}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoomId(e.target.value)}
          disabled={isJoining}
          autoFocus
        />
        <button type="submit" disabled={!roomId.trim() || isJoining}>
          {isJoining ? 'Joining...' : 'Join Room'}
        </button>
        <button type="button" onClick={generateRoomId} disabled={isJoining}>
          Generate Random Room
        </button>
      </form>
    </div>
  )
}

export default RoomJoin
