#!/usr/bin/env node

/**
 * Simple test script to verify room synchronization is working
 * Run this while the VideoParty server is running
 */

const WebSocket = require('ws')

const BASE_URL = 'http://localhost:8080'
const WS_URL = 'ws://localhost:8080/ws'

async function testRoomSync() {
  console.log('🧪 Testing VideoParty room synchronization...')
  
  const roomId = 'test-room-' + Math.random().toString(36).substr(2, 9)
  console.log(`📍 Using room: ${roomId}`)
  
  // Create first client (will select video)
  const client1Id = 'client1-' + Math.random().toString(36).substr(2, 5)
  const ws1 = new WebSocket(`${WS_URL}?roomId=${roomId}&clientId=${client1Id}`)
  
  await new Promise((resolve, reject) => {
    ws1.on('open', resolve)
    ws1.on('error', reject)
  })
  
  console.log('✅ Client 1 connected')
  
  // Simulate video selection
  const testVideoMessage = {
    type: 'loadVideo',
    roomId,
    clientId: client1Id,
    currentTime: 0,
    paused: true,
    sentAtMs: Date.now(),
    videoUrl: '/media/Episode%201.mp4'
  }
  
  ws1.send(JSON.stringify(testVideoMessage))
  console.log('📹 Client 1 selected video')
  
  // Wait a bit for server to process
  await new Promise(resolve => setTimeout(resolve, 200))
  
  // Create second client (should receive room state)
  const client2Id = 'client2-' + Math.random().toString(36).substr(2, 5)
  const ws2 = new WebSocket(`${WS_URL}?roomId=${roomId}&clientId=${client2Id}`)
  
  let receivedLoadVideo = false
  
  ws2.on('message', (data) => {
    const message = JSON.parse(data.toString())
    console.log('📨 Client 2 received:', message.type, message.videoUrl ? '(with video)' : '(no video)')
    
    if (message.type === 'loadVideo' && message.videoUrl) {
      receivedLoadVideo = true
      console.log('✅ Client 2 received room state with video!')
    }
  })
  
  await new Promise((resolve, reject) => {
    ws2.on('open', resolve)
    ws2.on('error', reject)
  })
  
  console.log('✅ Client 2 connected')
  
  // Wait for room state message
  await new Promise(resolve => setTimeout(resolve, 500))
  
  if (receivedLoadVideo) {
    console.log('🎉 SUCCESS: Room synchronization is working!')
  } else {
    console.log('❌ FAILED: Client 2 did not receive room state')
  }
  
  // Cleanup
  ws1.close()
  ws2.close()
  
  console.log('🧹 Test completed')
}

testRoomSync().catch(console.error)
