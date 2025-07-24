# Electron Permission Analysis & Resolution Plan

## Problem Summary

The MMIT Testing App web version works perfectly, but the Electron version fails with media device permission errors. The key error is:

```
getUserMedia error: DOMException: Permission denied by system
```

## Root Cause Analysis

### 1. **Content Security Policy (CSP) Issue**
- Electron is warning about "unsafe-eval" in CSP
- No explicit CSP is set in `index.html`
- Electron's sandbox security model is more restrictive than browser

### 2. **Permission Request Timing**
- Electron requires explicit permission handling BEFORE getUserMedia calls
- Web browsers handle permissions automatically via prompts
- Current code assumes browser-style permission flow

### 3. **Permission Handler Configuration**
- Current Electron main process has permission handlers configured
- However, they may not be triggered at the right time
- Session permission handlers need proper setup sequence

### 4. **Media Device Access Sequence**
- Electron requires specific order: check permissions → request permissions → access devices
- Current implementation tries to access devices directly

## Current Permission Handlers in main.js

✅ **Properly Configured:**
- `setPermissionRequestHandler` - Grants camera/microphone permissions
- `setPermissionCheckHandler` - Returns true for media permissions  
- `setDevicePermissionHandler` - Handles device-specific permissions
- Command line switches for media access enabled

❌ **Missing Elements:**
- Content Security Policy
- Preload script media permission bridge
- Frontend Electron-specific permission flow

## Solution Strategy

### Phase 1: Content Security Policy Fix
1. Add secure CSP to `index.html`
2. Configure CSP for Electron environment
3. Allow necessary media access directives

### Phase 2: Enhanced Permission Bridge
1. Extend preload.js with media permission APIs
2. Create Electron-specific permission request methods
3. Bridge system-level permission checks

### Phase 3: Frontend Permission Flow Update
1. Detect Electron environment in permission composables
2. Implement Electron-specific permission request flow
3. Fallback to browser flow for web version

### Phase 4: Testing & Validation
1. Test permission flow in Electron
2. Verify web version still works
3. Test on multiple platforms (Windows/macOS/Linux)

## Implementation Priority

**High Priority (Critical):**
- Content Security Policy configuration
- Preload script permission bridge
- Electron-specific permission detection

**Medium Priority (Important):**
- Enhanced error handling for Electron
- Permission state caching
- User-friendly permission prompts

**Low Priority (Nice-to-have):**
- Permission persistence across app restarts
- Advanced permission diagnostics
- Platform-specific optimizations

## Technical Approach

### 1. CSP Configuration
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  media-src 'self' mediastream:;
  connect-src 'self' ws: wss:;
">
```

### 2. Preload Permission Bridge
```javascript
// In preload.js
contextBridge.exposeInMainWorld('electronMedia', {
  requestPermissions: () => ipcRenderer.invoke('request-media-permissions'),
  checkPermissions: () => ipcRenderer.invoke('check-media-permissions'),
  getDevices: () => ipcRenderer.invoke('enumerate-devices')
});
```

### 3. Main Process Permission Handlers
```javascript
// Enhanced permission handling with explicit requests
ipcMain.handle('request-media-permissions', async () => {
  // Trigger system permission dialogs
  // Return permission state
});
```

### 4. Frontend Permission Flow
```javascript
// In useMediaPermissions.js
if (window.electronAPI) {
  // Use Electron-specific permission flow
  await window.electronMedia.requestPermissions();
} else {
  // Use browser permission flow
  await navigator.mediaDevices.getUserMedia(constraints);
}
```

## Risk Assessment

**Low Risk:**
- CSP configuration changes
- Preload script enhancements

**Medium Risk:**
- Permission flow modifications
- Timing-dependent permission requests

**High Risk:**
- Breaking web version compatibility
- Platform-specific permission behaviors

## Success Criteria

1. ✅ Electron app successfully requests camera/microphone permissions
2. ✅ No CSP warnings in Electron console
3. ✅ Web version continues to work unchanged
4. ✅ Clear error messages for permission denials
5. ✅ Consistent behavior across platforms

## Next Steps

1. **Immediate:** Fix CSP and add permission bridge
2. **Short-term:** Update frontend permission detection
3. **Medium-term:** Comprehensive testing across platforms
4. **Long-term:** Advanced permission management features

## Files to Modify

1. `frontend/index.html` - Add CSP
2. `electron/preload.js` - Add media permission bridge
3. `electron/main.js` - Enhance permission handlers
4. `frontend/src/composables/useMediaPermissions.js` - Add Electron detection
5. `frontend/src/composables/useWebRTCCompatibility.ts` - Electron-specific flow

---

*Analysis completed: July 14, 2025*
*Next: Implement Phase 1 (CSP Fix)*
