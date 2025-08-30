#!/bin/bash

# Alternative: Create simple AppleScript apps that are more native to macOS
# These will show up with proper app icons and behavior

PROJECT_DIR="/Users/fredparsons/Documents/Side Projects/Fred Av/VideoParty"
APPS_DIR="$PROJECT_DIR/VideoParty Apps"

echo "🍎 Creating Native AppleScript Apps"
echo "==================================="

# Function to create AppleScript app
create_applescript_app() {
    local app_name="$1"
    local script_command="$2"
    local app_path="$APPS_DIR/$app_name.app"
    
    echo "📱 Creating $app_name.app..."
    
    # Create the AppleScript
    local applescript_content="
tell application \"Terminal\"
    activate
    do script \"cd '$PROJECT_DIR' && $script_command && echo '' && echo 'Operation completed! Press any key to close...' && read -n 1\"
end tell
"
    
    # Use osacompile to create the app
    echo "$applescript_content" | osacompile -o "$app_path"
    
    echo "✅ Created $app_name.app"
}

# Create AppleScript apps
create_applescript_app "Start VideoParty" "./scripts/startup.sh"
create_applescript_app "Stop VideoParty" "./scripts/shutdown.sh"
create_applescript_app "VideoParty Status" "./scripts/status.sh"
create_applescript_app "VideoParty Health Check" "./health-check.sh"

echo ""
echo "🎉 AppleScript Apps Created!"
echo "============================"
echo ""
echo "📁 Location: $APPS_DIR"
echo ""
echo "🚀 Start VideoParty.app       - Launch all services"
echo "🛑 Stop VideoParty.app        - Shutdown all services"  
echo "📊 VideoParty Status.app      - Quick status check"
echo "🏥 VideoParty Health Check.app - Full system health"
echo ""
echo "💡 These apps will:"
echo "   • Open Terminal automatically"
echo "   • Run the command"
echo "   • Show results"
echo "   • Wait for you to press a key before closing"
echo ""
echo "✅ Ready to double-click and use!"
