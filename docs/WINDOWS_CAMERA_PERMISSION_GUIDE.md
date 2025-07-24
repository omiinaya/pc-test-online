# Windows Camera Permission Guide

## The Issue

Windows requires explicit permission for desktop applications to access your camera. Unlike web browsers, Electron apps need special system-level permissions.

## Quick Fix - Manual Permission Setup

### Option 1: Automatic Settings (Recommended)
1. The app should automatically open Windows Camera settings
2. Find your app in the list (may be listed as "Electron" or "mmit-testing-app")
3. Toggle the switch to **ON** to allow camera access

### Option 2: Manual Settings
If automatic opening doesn't work:

1. **Open Windows Settings**: Press `Windows + I`
2. **Navigate to Privacy**: Click on "Privacy & security"
3. **Camera Settings**: Click on "Camera" in the left sidebar
4. **Enable Camera Access**: 
   - Make sure "Camera access for this device" is **ON**
   - Make sure "Let apps access your camera" is **ON**
5. **Find Your App**: Scroll down to find the app in the list
6. **Enable Permission**: Toggle the switch to **ON**

### Option 3: Alternative Path
1. **Windows Search**: Press `Windows` key and type "camera settings"
2. **Select**: Click on "Camera privacy settings"
3. **Follow steps 4-6** from Option 2 above

## Why This Happens

- Electron apps are treated as desktop applications, not web browsers
- Windows requires explicit user consent for camera access
- The app cannot automatically request permissions like browsers do
- This is a Windows security feature to protect user privacy

## Testing Mode (Fallback)

If you can't get real camera permissions working, you can enable testing mode with fake camera devices:
- This will restart the app with simulated camera and microphone
- Useful for testing the app functionality without real hardware permissions

## After Setting Permissions

1. **Restart the app** completely (close and reopen)
2. **Try camera test** again
3. **Check for Windows permission dialog** (may appear on first use)

---

**Note**: These steps are only needed once. Windows will remember your permission choice for future app launches.
