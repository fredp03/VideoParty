import type { WSMessage } from './types'
import { getWebSocketUrl } from './api'

export class WSClient {
  private ws: WebSocket | null = null
  private reconnectTimer: number | null = null
  private messageHandlers: ((message: WSMessage) => void)[] = []

  connect(roomId: string, clientId: string, token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = new URL(getWebSocketUrl())
        url.searchParams.set('roomId', roomId)
        url.searchParams.set('clientId', clientId)
        if (token) url.searchParams.set('token', token)

        this.ws = new WebSocket(url.toString())

        this.ws.onopen = () => {
          console.log('WebSocket connected')
          resolve()
        }

        this.ws.onmessage = async (event) => {
          try {
            const raw = typeof event.data === 'string'
              ? event.data
              : await (event.data as Blob).text()
            const message: WSMessage = JSON.parse(raw)
            this.messageHandlers.forEach(handler => handler(message))
          } catch (err) {
            console.error('Failed to parse WebSocket message:', err)
          }
        }

        this.ws.onclose = () => {
          console.log('WebSocket disconnected')
          this.scheduleReconnect(roomId, clientId, token)
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          reject(error)
        }
      } catch (err) {
        reject(err)
      }
    })
  }

  private scheduleReconnect(roomId: string, clientId: string, token?: string) {
    if (this.reconnectTimer) return
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect(roomId, clientId, token).catch(console.error)
    }, 3000)
  }

  sendMessage(message: WSMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  onMessage(handler: (message: WSMessage) => void) {
    this.messageHandlers.push(handler)
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}
