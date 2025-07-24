const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
    isElectron: true,
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
    showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
    saveFile: (path, data) => ipcRenderer.invoke('save-file', path, data),
    getVersion: () => ipcRenderer.invoke('get-version'),
    quit: () => ipcRenderer.invoke('quit-app'),
    minimize: () => ipcRenderer.invoke('minimize-window'),
    maximize: () => ipcRenderer.invoke('maximize-window'),
    unmaximize: () => ipcRenderer.invoke('unmaximize-window'),
    close: () => ipcRenderer.invoke('close-window'),
    isMaximized: () => ipcRenderer.invoke('is-maximized'),
    onWindowStateChange: (callback) => {
        ipcRenderer.on('window-state-changed', callback);
        return () => ipcRenderer.removeListener('window-state-changed', callback);
    }
});

// Expose environment information
contextBridge.exposeInMainWorld('electronEnv', {
    NODE_ENV: process.env.NODE_ENV,
    platform: process.platform,
    arch: process.arch
});

// Expose media device permission APIs for Electron
contextBridge.exposeInMainWorld('electronMedia', {
    requestPermissions: (constraints) => ipcRenderer.invoke('request-media-permissions', constraints),
    checkPermissions: (type) => ipcRenderer.invoke('check-media-permissions', type),
    enumerateDevices: () => ipcRenderer.invoke('enumerate-devices'),
    hasMediaSupport: () => ipcRenderer.invoke('has-media-support'),
    requestCameraPermission: () => ipcRenderer.invoke('request-camera-permission'),
    requestMicrophonePermission: () => ipcRenderer.invoke('request-microphone-permission'),
    requestSystemMediaPermissions: () => ipcRenderer.invoke('request-system-media-permissions'),
    openWindowsCameraSettings: () => ipcRenderer.invoke('open-windows-camera-settings'),
    enableFakeMediaForTesting: () => ipcRenderer.invoke('enable-fake-media-for-testing')
});
