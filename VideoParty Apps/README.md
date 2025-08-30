# 🤖 VideoParty Automator Apps

Easy-to-use macOS applications for managing your VideoParty system without opening Terminal!

## 📱 Available Apps

### 🚀 **Start VideoParty.app**
- **Purpose:** Launches all VideoParty services
- **What it does:**
  - Updates DNS records via Dynu
  - Starts VideoParty server (port 8080)
  - Starts Caddy HTTPS proxy (port 443)
  - Tests all endpoints
  - Shows startup status

### 🛑 **Stop VideoParty.app** 
- **Purpose:** Safely shuts down all services
- **What it does:**
  - Stops Caddy reverse proxy
  - Stops VideoParty server
  - Cleans up resources
  - Verifies shutdown completion

### 📊 **VideoParty Status.app**
- **Purpose:** Quick system status check
- **What it does:**
  - Shows running/stopped status
  - Displays uptime and process IDs
  - Tests key endpoints
  - Shows management commands

### 🏥 **VideoParty Health Check.app**
- **Purpose:** Comprehensive system diagnostics
- **What it does:**
  - Checks all services and ports
  - Tests local and public APIs
  - Verifies media directory
  - Shows recent log entries

## 💡 How to Use

### **Method 1: Double-Click**
1. Navigate to `VideoParty Apps/` folder
2. Double-click any app
3. Terminal will open and run the command
4. View the results
5. Press any key when done to close

### **Method 2: Add to Dock**
1. Drag any app from `VideoParty Apps/` to your Dock
2. Click the dock icon anytime to run
3. Perfect for quick access!

### **Method 3: Add to Applications**
1. Copy apps to `/Applications/` folder
2. Access via Spotlight or Launchpad
3. Search "VideoParty" to find them

## 🎯 Recommended Workflow

1. **Start your system:** Double-click `Start VideoParty.app`
2. **Check status anytime:** Click `VideoParty Status.app` from dock
3. **When done:** Double-click `Stop VideoParty.app`
4. **If issues:** Run `VideoParty Health Check.app` for diagnostics

## 🔧 Technical Details

- **Built with:** AppleScript and shell scripts
- **Terminal required:** Apps open Terminal to show output
- **Permissions:** May ask for Terminal access first time
- **Location:** Apps stored in `VideoParty Apps/` folder
- **Source:** Scripts located in `scripts/` directory

## ✅ Benefits

- ✅ No need to remember terminal commands
- ✅ No need to navigate to project directory
- ✅ Visual feedback in Terminal window
- ✅ Easy to add to Dock or Applications
- ✅ Safe - shows exactly what's happening
- ✅ Can still use original scripts if preferred

## 🚨 First Time Setup

1. **Security:** macOS may ask permission for Terminal access
2. **Gatekeeper:** Right-click app → "Open" if security warning appears
3. **Trust:** Apps are created locally and safe to run

---

**🎬 Enjoy your easy-to-use VideoParty management apps!**
