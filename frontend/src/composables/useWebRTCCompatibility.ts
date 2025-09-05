// WebRTC and Media API compatibility layer for cross-browser support
import { ref, onMounted } from 'vue';

export interface MediaDeviceInfo {
    deviceId: string;
    kind: string;
    label: string;
    groupId: string;
}

export interface WebRTCCapabilities {
    getUserMedia: boolean;
    getDisplayMedia: boolean;
    enumerateDevices: boolean;
    mediaRecorder: boolean;
    webRTC: boolean;
    audioContext: boolean;
}

export interface WebRTCCompatibilityState {
    isSupported: boolean;
    capabilities: WebRTCCapabilities;
    compatibilityWarnings: string[];
    browserName: string;
    browserVersion: number;
    fallbackMode: boolean;
    recommendedBrowser: string | null;
}

/**
 * Cross-browser WebRTC and Media API compatibility composable
 * Provides graceful fallbacks and compatibility warnings for media APIs
 */
export function useWebRTCCompatibility() {
    const state = ref<WebRTCCompatibilityState>({
        isSupported: false,
        capabilities: {
            getUserMedia: false,
            getDisplayMedia: false,
            enumerateDevices: false,
            mediaRecorder: false,
            webRTC: false,
            audioContext: false,
        },
        compatibilityWarnings: [],
        browserName: '',
        browserVersion: 0,
        fallbackMode: false,
        recommendedBrowser: null,
    });

    /**
     * Detect browser and version
     */
    const detectBrowser = () => {
        const userAgent = navigator.userAgent;

        if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) {
            state.value.browserName = 'Chrome';
            const match = userAgent.match(/Chrome\/(\d+)/);
            state.value.browserVersion = match ? parseInt(match[1] || '0') : 0;
        } else if (userAgent.includes('Firefox')) {
            state.value.browserName = 'Firefox';
            const match = userAgent.match(/Firefox\/(\d+)/);
            state.value.browserVersion = match ? parseInt(match[1] || '0') : 0;
        } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            state.value.browserName = 'Safari';
            const match = userAgent.match(/Version\/(\d+)/);
            state.value.browserVersion = match ? parseInt(match[1] || '0') : 0;
        } else if (userAgent.includes('Edge')) {
            state.value.browserName = 'Edge';
            const match = userAgent.match(/Edge?\/(\d+)/);
            state.value.browserVersion = match ? parseInt(match[1] || '0') : 0;
        } else {
            state.value.browserName = 'Unknown';
        }
    };

    /**
     * Check WebRTC and Media API capabilities
     */
    const checkCapabilities = () => {
        const capabilities = state.value.capabilities;
        const warnings = state.value.compatibilityWarnings;

        // Check getUserMedia support
        capabilities.getUserMedia = !!(
            navigator.mediaDevices?.getUserMedia ||
            (navigator as any).webkitGetUserMedia ||
            (navigator as any).mozGetUserMedia ||
            (navigator as any).msGetUserMedia
        );

        // Check getDisplayMedia support (screen sharing)
        capabilities.getDisplayMedia = !!navigator.mediaDevices?.getDisplayMedia;

        // Check enumerateDevices support
        capabilities.enumerateDevices = !!navigator.mediaDevices?.enumerateDevices;

        // Check MediaRecorder support
        capabilities.mediaRecorder = !!(window as any).MediaRecorder;

        // Check RTCPeerConnection support
        capabilities.webRTC = !!(
            (window as any).RTCPeerConnection ||
            (window as any).webkitRTCPeerConnection ||
            (window as any).mozRTCPeerConnection
        );

        // Check AudioContext support
        capabilities.audioContext = !!(
            (window as any).AudioContext || (window as any).webkitAudioContext
        );

        // Generate compatibility warnings
        if (!capabilities.getUserMedia) {
            warnings.push('Camera and microphone access not supported in this browser');
            state.value.recommendedBrowser = 'Chrome or Firefox';
        }

        if (!capabilities.enumerateDevices) {
            warnings.push(
                'Device enumeration not supported - cannot list available cameras/microphones'
            );
        }

        if (!capabilities.getDisplayMedia && state.value.browserName === 'Safari') {
            warnings.push('Screen sharing not supported in Safari');
        }

        if (!capabilities.mediaRecorder) {
            warnings.push('Media recording not supported in this browser');
        }

        if (!capabilities.webRTC) {
            warnings.push('Real-time communication features not supported');
        }

        // Browser-specific warnings
        if (state.value.browserName === 'Safari') {
            if (state.value.browserVersion < 11) {
                warnings.push('Safari 11+ required for reliable media API support');
            }
            warnings.push(
                'Some media features may be limited in Safari - Chrome or Firefox recommended'
            );
        }

        if (state.value.browserName === 'Firefox' && state.value.browserVersion < 60) {
            warnings.push('Firefox 60+ recommended for full WebRTC support');
        }

        if (state.value.browserName === 'Edge' && state.value.browserVersion < 79) {
            warnings.push('Edge 79+ (Chromium-based) recommended for full media API support');
        }

        // Determine overall support
        state.value.isSupported = capabilities.getUserMedia && capabilities.enumerateDevices;
        state.value.fallbackMode = !state.value.isSupported;
    };

    /**
     * Get user media with cross-browser compatibility
     */
    const getUserMedia = async (constraints: MediaStreamConstraints): Promise<MediaStream> => {
        if (!state.value.capabilities.getUserMedia) {
            throw new Error('getUserMedia not supported in this browser');
        }

        try {
            // Check if running in Electron
            const isElectron = !!(window as any).electronAPI && !!(window as any).electronMedia;

            if (isElectron) {
                console.log('Using Electron getUserMedia flow');

                // For Electron, add a small delay to ensure permissions are set up
                await new Promise(resolve => setTimeout(resolve, 100));

                // For Electron, we still use the standard API but with better error handling
                if (navigator.mediaDevices?.getUserMedia) {
                    return await navigator.mediaDevices.getUserMedia(constraints);
                } else {
                    throw new Error('Electron: navigator.mediaDevices.getUserMedia not available');
                }
            }

            // Modern API for browsers
            if (navigator.mediaDevices?.getUserMedia) {
                return await navigator.mediaDevices.getUserMedia(constraints);
            }

            // Legacy APIs with Promise wrapper
            const legacyGetUserMedia =
                (navigator as any).webkitGetUserMedia ||
                (navigator as any).mozGetUserMedia ||
                (navigator as any).msGetUserMedia;

            if (legacyGetUserMedia) {
                return new Promise((resolve, reject) => {
                    legacyGetUserMedia.call(navigator, constraints, resolve, reject);
                });
            }

            throw new Error('No getUserMedia implementation found');
        } catch (error) {
            console.error('getUserMedia error:', error);

            // Provide helpful error messages based on browser/Electron
            if (error instanceof Error) {
                const isElectron = !!(window as any).electronAPI;
                const errorPrefix = isElectron ? 'Electron: ' : '';

                if (error.name === 'NotAllowedError') {
                    throw new Error(
                        `${errorPrefix}Camera/microphone permission denied. Please allow access and try again.`
                    );
                } else if (error.name === 'NotFoundError') {
                    throw new Error(
                        `${errorPrefix}No camera or microphone found. Please connect a device and try again.`
                    );
                } else if (error.name === 'NotSupportedError') {
                    throw new Error('Media constraints not supported by this browser.');
                }
            }

            throw error;
        }
    };

    /**
     * Enumerate devices with cross-browser compatibility
     * Enhanced to handle audio output device enumeration limitations
     */
    const enumerateDevices = async (): Promise<MediaDeviceInfo[]> => {
        if (!state.value.capabilities.enumerateDevices) {
            // Return mock device list for unsupported browsers
            return [
                {
                    deviceId: 'default',
                    kind: 'videoinput',
                    label: 'Default Camera',
                    groupId: 'default',
                },
                {
                    deviceId: 'default',
                    kind: 'audioinput',
                    label: 'Default Microphone',
                    groupId: 'default',
                },
            ];
        }

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            
            // Debug log to see what devices are actually enumerated
            console.log('DEBUG: Enumerated devices:', devices.map(d => ({
                kind: d.kind,
                label: d.label,
                deviceId: d.deviceId
            })));
            
            // Additional handling for audio output devices
            // Many browsers don't enumerate audio output devices via standard API
            const processedDevices = devices.map(device => ({
                deviceId: device.deviceId,
                kind: device.kind,
                label: device.label || `${device.kind} ${device.deviceId.slice(0, 8)}`,
                groupId: device.groupId,
            }));
            
            // Check if we have any audio output devices and log for debugging
            const audioOutputDevices = processedDevices.filter(d => d.kind === 'audiooutput');
            console.log('DEBUG: Audio output devices found:', audioOutputDevices.length, audioOutputDevices);
            
            // Fallback for audio output: if no audio output devices are found but we have audio input,
            // assume there's a default audio output available (most systems have this)
            if (audioOutputDevices.length === 0) {
                const hasAudioInput = processedDevices.some(d => d.kind === 'audioinput');
                if (hasAudioInput) {
                    console.log('DEBUG: No audio output devices enumerated, but audio input exists. Adding default audio output device.');
                    processedDevices.push({
                        deviceId: 'default',
                        kind: 'audiooutput',
                        label: 'Default Speaker',
                        groupId: 'default-output',
                    });
                }
            }
            
            return processedDevices;
        } catch (error) {
            console.error('enumerateDevices error:', error);
            throw new Error('Failed to enumerate media devices');
        }
    };

    /**
     * Get display media with fallback
     */
    const getDisplayMedia = async (constraints?: MediaStreamConstraints): Promise<MediaStream> => {
        if (!state.value.capabilities.getDisplayMedia) {
            throw new Error(
                'Screen sharing not supported in this browser. Please use Chrome, Firefox, or Edge.'
            );
        }

        try {
            return await navigator.mediaDevices.getDisplayMedia(constraints);
        } catch (error) {
            console.error('getDisplayMedia error:', error);
            throw error;
        }
    };

    /**
     * Create MediaRecorder with fallback
     */
    const createMediaRecorder = (
        stream: MediaStream,
        options?: MediaRecorderOptions
    ): MediaRecorder => {
        if (!state.value.capabilities.mediaRecorder) {
            throw new Error('Media recording not supported in this browser');
        }

        try {
            return new MediaRecorder(stream, options);
        } catch (error) {
            console.error('MediaRecorder creation error:', error);
            throw error;
        }
    };

    /**
     * Get browser compatibility information
     */
    const getBrowserInfo = () => ({
        name: state.value.browserName,
        version: state.value.browserVersion,
        isSupported: state.value.isSupported,
        capabilities: { ...state.value.capabilities },
        warnings: [...state.value.compatibilityWarnings],
        recommendedBrowser: state.value.recommendedBrowser,
    });

    /**
     * Get recommendations for improving compatibility
     */
    const getCompatibilityRecommendations = () => {
        const recommendations: string[] = [];

        if (!state.value.isSupported) {
            recommendations.push(
                'Use a modern browser like Chrome, Firefox, or Edge for full media API support'
            );
        }

        if (state.value.browserName === 'Safari') {
            recommendations.push(
                'For best results, consider using Chrome or Firefox for media testing'
            );
        }

        if (state.value.browserName === 'Edge' && state.value.browserVersion < 79) {
            recommendations.push(
                'Update to the latest version of Edge for improved media API support'
            );
        }

        if (!state.value.capabilities.getDisplayMedia) {
            recommendations.push('Screen sharing requires Chrome 72+, Firefox 66+, or Edge 79+');
        }

        return recommendations;
    };

    // Initialize on mount
    onMounted(() => {
        detectBrowser();
        checkCapabilities();
    });

    return {
        // State
        state: state.value,

        // Methods
        getUserMedia,
        enumerateDevices,
        getDisplayMedia,
        createMediaRecorder,
        getBrowserInfo,
        getCompatibilityRecommendations,

        // Utilities
        detectBrowser,
        checkCapabilities,
    };
}
