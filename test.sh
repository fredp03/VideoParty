#!/bin/bash

echo "🎬 VideoParty Test Script"
echo "========================"

# Test server
echo "📡 Testing server..."
cd server

echo "Starting server in background..."
node index.js &
SERVER_PID=$!
sleep 2

echo "Testing health endpoint..."
HEALTH=$(curl -s http://localhost:8080/api/health 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Server health check: $HEALTH"
else
    echo "❌ Server health check failed"
fi

echo "Testing video list endpoint..."
VIDEOS=$(curl -s http://localhost:8080/api/videos 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Video list endpoint: $VIDEOS"
else
    echo "❌ Video list endpoint failed"
fi

echo "Stopping server..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

cd ..

# Test frontend build
echo "🌐 Testing frontend build..."
cd web

if [ -d "dist" ]; then
    echo "✅ Frontend build exists"
    ls -la dist/
else
    echo "❌ Frontend build not found"
fi

cd ..

echo "✅ Test complete!"
