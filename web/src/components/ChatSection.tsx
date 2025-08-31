import { useEffect, useRef, useState } from 'react'
import { animate } from 'animejs'
import './ChatSection.css'

interface Message {
  id: number
  text: string
  isOwn: boolean
}

interface ChatSectionProps {
  height?: number
  isVisible: boolean
  onRequestClose: () => void
  onClosed: () => void
}

const ChatSection = ({ height, isVisible, onRequestClose, onClosed }: ChatSectionProps) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      animate(containerRef.current, {
        translateX: [40, 0],
        opacity: [0, 1],
        easing: 'easeOutQuad',
        duration: 400
      })
    }
  }, [])

  useEffect(() => {
    if (!isVisible && containerRef.current) {
      animate(containerRef.current, {
        translateX: [0, 40],
        opacity: [1, 0],
        easing: 'easeInQuad',
        duration: 300,
        complete: onClosed
      })
    }
  }, [isVisible, onClosed])

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      const newMessage: Message = {
        id: Date.now(),
        text: inputValue.trim(),
        isOwn: true
      }
      setMessages(prev => [...prev, newMessage])
      setInputValue('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  const chatStyle = height ? { height: `${height}px` } : {}
  
  useEffect(() => {
    if (messagesRef.current) {
      const last = messagesRef.current.lastElementChild
      if (last) {
        animate(last as Element, {
          translateX: [50, 0],
          opacity: [0, 1],
          easing: 'easeOutQuad'
        })
      }
    }
  }, [messages])

  return (
    <div className="chat-section" style={chatStyle} ref={containerRef}>
      {/* Close button */}
      <div className="close-button-wrapper">
        <div className="close-button" onClick={onRequestClose}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 1L1 13M1 1L13 13" stroke="#999" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* Messages container */}
      <div className="messages-container" ref={messagesRef}>
        {messages.map((message) => (
          <div key={message.id} className={`chat-message ${message.isOwn ? 'right' : 'left'}`}>
            <div className={`message-bubble ${message.isOwn ? 'green' : 'blue'}`}>
              {message.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input field */}
      <div className="user-chat-input">
        <input 
          type="text" 
          placeholder="Start typing your message"
          className="chat-input-field"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
        />
      </div>
    </div>
  )
}

export default ChatSection
