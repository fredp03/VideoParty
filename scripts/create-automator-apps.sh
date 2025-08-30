#!/bin/bash

# Create VideoParty Automator Apps
# This script creates the .app bundles for easy launching

PROJECT_DIR="/Users/fredparsons/Documents/Side Projects/Fred Av/VideoParty"
APPS_DIR="$PROJECT_DIR/VideoParty Apps"

echo "🤖 Creating VideoParty Automator Apps"
echo "====================================="

# Create apps directory
mkdir -p "$APPS_DIR"

# Function to create an Automator app
create_app() {
    local app_name="$1"
    local script_path="$2"
    local icon_name="$3"
    
    echo "📱 Creating $app_name.app..."
    
    # Create app bundle structure
    local app_bundle="$APPS_DIR/$app_name.app"
    mkdir -p "$app_bundle/Contents/MacOS"
    mkdir -p "$app_bundle/Contents/Resources"
    
    # Create Info.plist
    cat > "$app_bundle/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>$app_name</string>
    <key>CFBundleIdentifier</key>
    <string>com.fredav.videoparty.$app_name</string>
    <key>CFBundleName</key>
    <string>$app_name</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleSignature</key>
    <string>????</string>
</dict>
</plist>
EOF
    
    # Create executable script
    cat > "$app_bundle/Contents/MacOS/$app_name" << EOF
#!/bin/bash
cd "$PROJECT_DIR"
bash "$script_path"
EOF
    
    # Make executable
    chmod +x "$app_bundle/Contents/MacOS/$app_name"
    
    echo "✅ Created $app_name.app"
}

# Create the apps
create_app "VideoParty Startup" "scripts/automator-startup.sh" "🚀"
create_app "VideoParty Shutdown" "scripts/automator-shutdown.sh" "🛑"  
create_app "VideoParty Status" "scripts/automator-status.sh" "📊"

echo ""
echo "🎉 Automator Apps Created Successfully!"
echo "======================================"
echo ""
echo "📁 Apps Location: $APPS_DIR"
echo ""
echo "🚀 VideoParty Startup.app  - Start all services"
echo "🛑 VideoParty Shutdown.app - Stop all services"
echo "📊 VideoParty Status.app   - Check system status"
echo ""
echo "💡 Usage:"
echo "   1. Double-click any app to run"
echo "   2. Drag apps to your Dock for easy access"
echo "   3. Move to Applications folder if desired"
echo ""
echo "✅ Ready to use!"
