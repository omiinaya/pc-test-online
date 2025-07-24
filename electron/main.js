const { app, BrowserWindow, Menu, shell, dialog, protocol, ipcMain, systemPreferences } = require('electron');
const path = require('path');
const { readFile, writeFile } = require('fs/promises');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

// Enable media access command line switches (must be before app ready)
if (process.platform === 'win32') {
    app.commandLine.appendSwitch('enable-media-stream');
    app.commandLine.appendSwitch('enable-usermedia-screen-capturing');
    app.commandLine.appendSwitch('disable-web-security'); // Temporary for media access
    app.commandLine.appendSwitch('allow-running-insecure-content');
    app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor');
    app.commandLine.appendSwitch('enable-features', 'SharedArrayBuffer');
    // Force enable media device access
    app.commandLine.appendSwitch('enable-logging');
    app.commandLine.appendSwitch('log-level', '0');
    app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
    // This should trigger Windows permission dialogs
    app.commandLine.appendSwitch('enable-media-stream-permission-request');
    app.commandLine.appendSwitch('enable-system-media-stream-permission-request');
    // Additional Windows permission handling for real devices
    app.commandLine.appendSwitch('enable-experimental-web-platform-features');
    app.commandLine.appendSwitch('ignore-certificate-errors');
    app.commandLine.appendSwitch('allow-file-access-from-files');
    // Force real device access (not fake)
    app.commandLine.appendSwitch('disable-extensions-file-access-check');
    // THIS IS THE KEY FLAG for Windows camera access in Electron
    app.commandLine.appendSwitch('disable-features', 'MediaFoundationClearKeyDecryptOnly');
    app.commandLine.appendSwitch('enable-features', 'GetUserMediaCaptureFailureFixerUpper');
}

// Register file protocol for serving files properly
function setupProtocol() {
    protocol.registerFileProtocol('app', (request, callback) => {
        const url = request.url.replace('app://', '');
        try {
            return callback(path.normalize(path.join(__dirname, '../frontend/dist', url)));
        } catch (error) {
            console.error('Failed to register protocol', error);
            return callback(path.normalize(path.join(__dirname, '../frontend/dist/index.html')));
        }
    });
}

// Setup IPC handlers
function setupIpcHandlers() {
    ipcMain.handle('open-external', async (event, url) => {
        return shell.openExternal(url);
    });

    ipcMain.handle('show-save-dialog', async (event, options) => {
        const result = await dialog.showSaveDialog(mainWindow, options);
        return result;
    });

    ipcMain.handle('save-file', async (event, filePath, data) => {
        try {
            await writeFile(filePath, data);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('get-version', () => {
        return app.getVersion();
    });

    ipcMain.handle('quit-app', () => {
        app.quit();
    });

    ipcMain.handle('minimize-window', () => {
        if (mainWindow) mainWindow.minimize();
    });

    ipcMain.handle('maximize-window', () => {
        if (mainWindow) mainWindow.maximize();
    });

    ipcMain.handle('unmaximize-window', () => {
        if (mainWindow) mainWindow.unmaximize();
    });

    ipcMain.handle('close-window', () => {
        if (mainWindow) mainWindow.close();
    });

    ipcMain.handle('is-maximized', () => {
        return mainWindow ? mainWindow.isMaximized() : false;
    });

    // Enhanced media permission handlers for Electron
    ipcMain.handle('request-media-permissions', async (event, constraints) => {
        try {
            console.log('Requesting media permissions for:', constraints);
            
            // For Windows, we need to ensure camera permissions are properly handled
            if (process.platform === 'win32' && constraints?.video) {
                console.log('Windows: Ensuring camera permissions are granted');
                
                // Set additional permission flags for Windows
                mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback, details) => {
                    console.log(`Windows permission request: ${permission}`, details);
                    
                    if (permission === 'camera' || permission === 'media' || permission === 'videoCapture') {
                        console.log(`Granting Windows ${permission} permission`);
                        callback(true);
                    } else if (permission === 'microphone' || permission === 'audioCapture') {
                        console.log(`Granting Windows ${permission} permission`);
                        callback(true);
                    } else {
                        callback(false);
                    }
                });
            }
            
            // In Electron, we need to return true to indicate permissions are granted
            // The actual permission handling is done by the session handlers below
            return { granted: true, constraints };
        } catch (error) {
            console.error('Error requesting media permissions:', error);
            return { granted: false, error: error.message };
        }
    });

    ipcMain.handle('check-media-permissions', async (event, type) => {
        try {
            console.log('Checking media permissions for:', type);
            // In Electron, assume permissions are available if handlers are set
            return { state: 'granted', type };
        } catch (error) {
            console.error('Error checking media permissions:', error);
            return { state: 'denied', type, error: error.message };
        }
    });

    ipcMain.handle('enumerate-devices', async () => {
        try {
            // This will be handled by the renderer process
            // We just need to confirm Electron supports it
            return { supported: true };
        } catch (error) {
            console.error('Error enumerating devices:', error);
            return { supported: false, error: error.message };
        }
    });

    ipcMain.handle('has-media-support', async () => {
        return { supported: true, platform: process.platform };
    });

    // Specific camera permission handler for Windows
    ipcMain.handle('request-camera-permission', async () => {
        try {
            console.log('Explicitly requesting camera permission');
            
            if (process.platform === 'win32') {
                // On Windows, we need to ensure all permission handlers are set up
                console.log('Windows: Setting up camera permission handlers');
                
                // Force permission grant for camera
                mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
                    console.log(`Force granting permission: ${permission}`);
                    callback(true); // Grant all permissions
                });
                
                // Try to trigger the actual system permission request by testing getUserMedia
                try {
                    const result = await mainWindow.webContents.executeJavaScript(`
                        (async () => {
                            try {
                                console.log('Testing camera access from main process...');
                                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                                console.log('Camera access successful from main process');
                                if (stream) {
                                    stream.getTracks().forEach(track => track.stop());
                                }
                                return { success: true };
                            } catch (error) {
                                console.log('Camera access failed from main process:', error.message);
                                return { success: false, error: error.message };
                            }
                        })()
                    `);
                    
                    console.log('Camera permission test result:', result);
                    return { granted: result.success, platform: process.platform, test: result };
                } catch (testError) {
                    console.log('Camera permission test failed:', testError);
                    return { granted: false, platform: process.platform, error: testError.message };
                }
            }
            
            return { granted: true, platform: process.platform };
        } catch (error) {
            console.error('Error requesting camera permission:', error);
            return { granted: false, error: error.message };
        }
    });

    ipcMain.handle('request-microphone-permission', async () => {
        try {
            console.log('Explicitly requesting microphone permission');
            
            if (process.platform === 'win32') {
                // Try to trigger the actual system permission request by testing getUserMedia
                try {
                    const result = await mainWindow.webContents.executeJavaScript(`
                        (async () => {
                            try {
                                console.log('Testing microphone access from main process...');
                                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                                console.log('Microphone access successful from main process');
                                if (stream) {
                                    stream.getTracks().forEach(track => track.stop());
                                }
                                return { success: true };
                            } catch (error) {
                                console.log('Microphone access failed from main process:', error.message);
                                return { success: false, error: error.message };
                            }
                        })()
                    `);
                    
                    console.log('Microphone permission test result:', result);
                    return { granted: result.success, platform: process.platform, test: result };
                } catch (testError) {
                    console.log('Microphone permission test failed:', testError);
                    return { granted: false, platform: process.platform, error: testError.message };
                }
            }
            
            return { granted: true, platform: process.platform };
        } catch (error) {
            console.error('Error requesting microphone permission:', error);
            return { granted: false, error: error.message };
        }
    });

    // Add a handler to request both camera and microphone at once
    ipcMain.handle('request-system-media-permissions', async () => {
        try {
            console.log('Requesting system-level media permissions');
            
            // First, ensure all permission handlers are set to auto-grant
            mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
                console.log(`Auto-granting all permissions: ${permission}`);
                callback(true);
            });
            
            if (process.platform === 'win32') {
                console.log('Windows: Attempting to trigger system permission dialog...');
                
                // Try to request permissions by directly calling getUserMedia
                // This should trigger the Windows system dialog
                const result = await mainWindow.webContents.executeJavaScript(`
                    (async () => {
                        try {
                            console.log('Directly requesting media access to trigger Windows dialog...');
                            
                            // Try the most basic request first - this should show Windows dialog
                            const stream = await navigator.mediaDevices.getUserMedia({ 
                                video: { 
                                    width: { min: 640, ideal: 1280, max: 1920 },
                                    height: { min: 480, ideal: 720, max: 1080 }
                                }, 
                                audio: true 
                            });
                            
                            console.log('SUCCESS: Got media stream!', stream);
                            
                            // Check what we actually got
                            const videoTracks = stream.getVideoTracks();
                            const audioTracks = stream.getAudioTracks();
                            
                            console.log('Video tracks:', videoTracks.length);
                            console.log('Audio tracks:', audioTracks.length);
                            
                            // Clean up the stream
                            stream.getTracks().forEach(track => {
                                console.log('Stopping track:', track.kind);
                                track.stop();
                            });
                            
                            return { 
                                success: true, 
                                hasVideo: videoTracks.length > 0, 
                                hasAudio: audioTracks.length > 0,
                                videoTracks: videoTracks.length,
                                audioTracks: audioTracks.length
                            };
                        } catch (error) {
                            console.log('FAILED: Media access error:', error.name, error.message);
                            
                            // Try just video
                            try {
                                console.log('Trying video only...');
                                const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                                console.log('Video-only success!');
                                videoStream.getTracks().forEach(track => track.stop());
                                
                                // Try just audio
                                try {
                                    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                                    console.log('Audio also works!');
                                    audioStream.getTracks().forEach(track => track.stop());
                                    return { success: true, hasVideo: true, hasAudio: true };
                                } catch (audioError) {
                                    console.log('Audio failed:', audioError.message);
                                    return { success: true, hasVideo: true, hasAudio: false };
                                }
                            } catch (videoError) {
                                console.log('Video also failed:', videoError.message);
                                
                                // Last resort: try just audio
                                try {
                                    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                                    console.log('Audio-only success!');
                                    audioStream.getTracks().forEach(track => track.stop());
                                    return { success: true, hasVideo: false, hasAudio: true };
                                } catch (audioOnlyError) {
                                    console.log('Everything failed:', audioOnlyError.message);
                                    return { 
                                        success: false, 
                                        hasVideo: false, 
                                        hasAudio: false, 
                                        error: error.message,
                                        errorName: error.name
                                    };
                                }
                            }
                        }
                    })()
                `);
                
                console.log('System media permission test result:', result);
                return result;
            }
            
            return { success: true, hasVideo: true, hasAudio: true };
        } catch (error) {
            console.error('Error requesting system media permissions:', error);
            return { success: false, error: error.message };
        }
    });

    // Guide user to Windows camera settings if permission fails
    ipcMain.handle('open-windows-camera-settings', async () => {
        try {
            if (process.platform === 'win32') {
                console.log('Opening Windows camera privacy settings...');
                
                // Try to open Windows camera settings directly
                const { exec } = require('child_process');
                
                // Open Windows 10/11 camera privacy settings
                exec('start ms-settings:privacy-webcam', (error, stdout, stderr) => {
                    if (error) {
                        console.log('Could not open camera settings automatically:', error);
                        // Fallback: open general privacy settings
                        exec('start ms-settings:privacy', (fallbackError) => {
                            if (fallbackError) {
                                console.log('Could not open privacy settings:', fallbackError);
                            }
                        });
                    } else {
                        console.log('Opened Windows camera settings successfully');
                    }
                });
                
                return { 
                    success: true, 
                    message: 'Windows camera settings should open. Please allow camera access for this app.' 
                };
            }
            
            return { success: false, message: 'Not supported on this platform' };
        } catch (error) {
            console.error('Error opening Windows settings:', error);
            return { success: false, error: error.message };
        }
    });

    // Add a fallback that uses fake devices for testing
    ipcMain.handle('enable-fake-media-for-testing', async () => {
        try {
            console.log('Enabling fake media devices for testing...');
            
            // Restart with fake device flags
            app.relaunch({
                args: [
                    '--use-fake-ui-for-media-stream',
                    '--use-fake-device-for-media-stream'
                ]
            });
            app.exit();
            
            return { success: true, message: 'Restarting with fake media devices...' };
        } catch (error) {
            console.error('Error enabling fake media:', error);
            return { success: false, error: error.message };
        }
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 768,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: false, // Temporarily disable for media access
            allowRunningInsecureContent: false,
            experimentalFeatures: true, // Enable for better media support
            spellcheck: false,
            preload: path.join(__dirname, 'preload.js')
        },
        title: 'MMIT Lab Testing App',
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
        backgroundColor: '#0d0d0d', // Match app background
        show: false,
        center: true,
        resizable: true,
        maximizable: true,
        fullscreenable: true,
        autoHideMenuBar: false, // Keep menu bar visible
        vibrancy: process.platform === 'darwin' ? 'dark' : undefined,
        darkTheme: true
    });

    // Load the app
    if (isDev) {
        // Development server runs on port 5173 or 5174
        const devUrls = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];
        let devUrl = devUrls[0];
        
        // Try to detect which port is actually being used
        try {
            // Default to 5173, but the wait-on should handle this
            devUrl = 'http://localhost:5173';
        } catch (error) {
            console.log('Using fallback dev URL');
        }
        
        console.log(`Loading dev server from: ${devUrl}`);
        mainWindow.loadURL(devUrl);
        mainWindow.webContents.openDevTools();
    } else {
        // Use file:// protocol with absolute path
        const indexPath = path.join(__dirname, '../frontend/dist/index.html');
        mainWindow.loadFile(indexPath, { 
            search: '?electron=true' // Add parameter to detect Electron environment
        });
    }

    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Enhanced ready-to-show handling
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        
        // Focus the window
        if (isDev) {
            mainWindow.focus();
        }
    });

    // Handle window events
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Prevent navigation away from the app
    mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);
        
        if (parsedUrl.origin !== 'http://localhost:5173' && 
            parsedUrl.origin !== 'http://localhost:5174' && 
            parsedUrl.origin !== 'http://localhost:5175' && 
            parsedUrl.origin !== 'http://localhost:5176' && 
            parsedUrl.origin !== 'file://') {
            event.preventDefault();
        }
    });

    // Handle permission requests for camera/microphone
    mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback, details) => {
        console.log(`Permission requested: ${permission}`, details);
        console.log(`Auto-granting permission: ${permission}`);
        callback(true); // Grant ALL permissions by default
    });

    // Handle permission checks for camera/microphone
    mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
        console.log(`Permission check: ${permission} from ${requestingOrigin}`, details);
        console.log(`Auto-allowing permission check: ${permission}`);
        return true; // Allow ALL permission checks
    });

    // Handle device permission requests (newer Electron API)
    mainWindow.webContents.session.setDevicePermissionHandler((details) => {
        console.log(`Device permission requested:`, details);
        console.log(`Auto-granting device permission: ${details.deviceType}`);
        return true; // Grant ALL device permissions
    });

    // Set up proper media stream handling
    mainWindow.webContents.session.setDisplayMediaRequestHandler((request, callback) => {
        console.log('Display media request:', request);
        // Allow screen sharing if requested
        callback({ video: request.video, audio: request.audio });
    });

    // Additional: Set media device access handler for Windows
    if (process.platform === 'win32') {
        mainWindow.webContents.session.on('select-usb-device', (event, details, callback) => {
            console.log('USB device selection requested:', details);
            // Allow all USB devices for media
            callback(details.deviceList[0]?.deviceId);
        });
    }

    // Additional: Handle media device access requests
    mainWindow.webContents.on('media-started-playing', () => {
        console.log('Media started playing');
    });

    mainWindow.webContents.on('media-paused', () => {
        console.log('Media paused');
    });
}

app.whenReady()
    .then(() => {
        setupIpcHandlers();
        if (!isDev) {
            setupProtocol();
        }
        
        // Request media permissions on macOS
        if (process.platform === 'darwin') {
            console.log('Requesting macOS media permissions...');
            systemPreferences.askForMediaAccess('microphone')
                .then((granted) => {
                    console.log('Microphone permission:', granted ? 'granted' : 'denied');
                })
                .catch((error) => {
                    console.error('Error requesting microphone permission:', error);
                });
                
            systemPreferences.askForMediaAccess('camera')
                .then((granted) => {
                    console.log('Camera permission:', granted ? 'granted' : 'denied');
                })
                .catch((error) => {
                    console.error('Error requesting camera permission:', error);
                });
        }
        
        // For Windows, the command line switches and permission handlers should handle it
        if (process.platform === 'win32') {
            console.log('Windows: Media permission handling via command line switches and session handlers');
        }
        
        createWindow();

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            }
        });
        
        return undefined;
    })
    .catch(error => {
        console.error('Failed to initialize app:', error);
    });

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Set application menu with enhanced functionality
const template = [
    {
        label: 'File',
        submenu: [
            {
                label: 'New Test Session',
                accelerator: 'CmdOrCtrl+N',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.reload();
                    }
                }
            },
            { type: 'separator' },
            {
                label: 'Export Results...',
                accelerator: 'CmdOrCtrl+E',
                click: async () => {
                    if (mainWindow) {
                        // Trigger export functionality in the web app
                        mainWindow.webContents.executeJavaScript(`
                            if (window.app && window.app.exportResults) {
                                window.app.exportResults();
                            }
                        `);
                    }
                }
            },
            { type: 'separator' },
            {
                label: 'Quit',
                accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                click: () => {
                    app.quit();
                }
            }
        ]
    },
    {
        label: 'Edit',
        submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            { role: 'selectall' }
        ]
    },
    {
        label: 'View',
        submenu: [
            { role: 'reload' },
            { role: 'forceReload' },
            { role: 'toggleDevTools' },
            { type: 'separator' },
            { role: 'resetZoom' },
            { role: 'zoomIn' },
            { role: 'zoomOut' },
            { type: 'separator' },
            { role: 'togglefullscreen' }
        ]
    },
    {
        label: 'Tests',
        submenu: [
            {
                label: 'Camera Test',
                accelerator: 'CmdOrCtrl+1',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.executeJavaScript(`
                            if (window.app && window.app.setActiveTest) {
                                window.app.setActiveTest('webcam');
                            }
                        `);
                    }
                }
            },
            {
                label: 'Microphone Test',
                accelerator: 'CmdOrCtrl+2',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.executeJavaScript(`
                            if (window.app && window.app.setActiveTest) {
                                window.app.setActiveTest('microphone');
                            }
                        `);
                    }
                }
            },
            {
                label: 'Speaker Test',
                accelerator: 'CmdOrCtrl+3',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.executeJavaScript(`
                            if (window.app && window.app.setActiveTest) {
                                window.app.setActiveTest('speakers');
                            }
                        `);
                    }
                }
            },
            {
                label: 'Keyboard Test',
                accelerator: 'CmdOrCtrl+4',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.executeJavaScript(`
                            if (window.app && window.app.setActiveTest) {
                                window.app.setActiveTest('keyboard');
                            }
                        `);
                    }
                }
            },
            {
                label: 'Mouse Test',
                accelerator: 'CmdOrCtrl+5',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.executeJavaScript(`
                            if (window.app && window.app.setActiveTest) {
                                window.app.setActiveTest('mouse');
                            }
                        `);
                    }
                }
            },
            {
                label: 'Touch Test',
                accelerator: 'CmdOrCtrl+6',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.executeJavaScript(`
                            if (window.app && window.app.setActiveTest) {
                                window.app.setActiveTest('touch');
                            }
                        `);
                    }
                }
            },
            {
                label: 'Battery Test',
                accelerator: 'CmdOrCtrl+7',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.executeJavaScript(`
                            if (window.app && window.app.setActiveTest) {
                                window.app.setActiveTest('battery');
                            }
                        `);
                    }
                }
            },
            { type: 'separator' },
            {
                label: 'Reset All Tests',
                accelerator: 'CmdOrCtrl+R',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.executeJavaScript(`
                            if (window.app && window.app.resetTests) {
                                window.app.resetTests();
                            }
                        `);
                    }
                }
            }
        ]
    },
    {
        label: 'Window',
        submenu: [
            { role: 'minimize' },
            { role: 'close' },
            ...(process.platform === 'darwin' ? [
                { type: 'separator' },
                { role: 'front' },
                { type: 'separator' },
                { role: 'window' }
            ] : [])
        ]
    },
    {
        label: 'Help',
        submenu: [
            {
                label: 'About MMIT Lab Testing App',
                click: () => {
                    dialog.showMessageBox(mainWindow, {
                        type: 'info',
                        title: 'About MMIT Lab Testing App',
                        message: 'MMIT Lab Testing App',
                        detail: 'A comprehensive hardware testing application for computer repair professionals.\n\nVersion: 1.0.0\nAuthor: OmarM',
                        buttons: ['OK']
                    });
                }
            },
            { type: 'separator' },
            {
                label: 'Visit Website',
                click: () => {
                    shell.openExternal('https://github.com');
                }
            }
        ]
    }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

// macOS specific app menu adjustments
if (process.platform === 'darwin') {
    const darwinTemplate = [
        {
            label: app.getName(),
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideothers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        },
        ...template.slice(1) // Add the rest of the template
    ];
    
    const darwinMenu = Menu.buildFromTemplate(darwinTemplate);
    Menu.setApplicationMenu(darwinMenu);
}

// Additional app event handlers
app.on('web-contents-created', (event, contents) => {
    // Security: prevent new window creation
    contents.on('new-window', (navigationEvent, navigationURL) => {
        navigationEvent.preventDefault();
        shell.openExternal(navigationURL);
    });
});

// Handle app activation on macOS
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    } else if (mainWindow) {
        mainWindow.show();
    }
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        // Someone tried to run a second instance, focus our window instead
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
}

// Auto-updater placeholder (for future implementation)
// app.on('ready', () => {
//     if (!isDev) {
//         // Check for updates
//     }
// });

// Set app user model ID for Windows
if (process.platform === 'win32') {
    app.setAppUserModelId('com.mmit.testing-app');
}

// Handle certificate errors (for development)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    if (isDev) {
        // In development, ignore certificate errors
        event.preventDefault();
        callback(true);
    } else {
        // In production, use default behavior
        callback(false);
    }
});

// Cleanup and error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    if (!isDev) {
        app.quit();
    }
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
