#!/bin/bash

echo "🎬 VideoParty Setup Script"
echo "=========================="

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "web" ] || [ ! -d "server" ]; then
    echo "❌ Please run this script from the VideoParty root directory"
    exit 1
fi

echo "📦 Installing server dependencies..."
cd server
npm install
if [ ! -f ".env" ]; then
    echo "📝 Creating server .env file..."
    cp .env.example .env
    echo "⚠️  Please edit server/.env with your media directory path"
fi
cd ..

echo "📦 Installing frontend dependencies..."
cd web
npm install
cd ..

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit server/.env with your media directory:"
echo "   MEDIA_DIR=/path/to/your/videos"
echo ""
echo "2. Start the server:"
echo "   cd server && npm start"
echo ""
echo "3. In another terminal, start the frontend:"
echo "   cd web && npm run dev"
echo ""
echo "4. For production deployment:"
echo "   - Set up Cloudflare Tunnel (see server/README.md)"
echo "   - Deploy frontend to Netlify (see web/README.md)"
