<script>
import StatePanel from './StatePanel.vue';
import DeviceSelector from './DeviceSelector.vue';
import { useEnhancedDeviceTest } from '../composables/useEnhancedDeviceTest.js';
import { CameraIcon, CheckIcon } from '../composables/useIcons.js';
import { computed } from 'vue';

export default {
    name: 'WebcamTest',
    components: {
        StatePanel,
        DeviceSelector,
        CameraIcon,
        CheckIcon,
    },
    emits: ['test-completed', 'test-failed', 'test-skipped', 'start-over'],

    setup(props, { emit }) {
        // Use the enhanced device test composable for all core functionality
        const deviceTest = useEnhancedDeviceTest(
            {
                deviceKind: 'videoinput',
                deviceType: 'Camera',
                permissionType: 'camera',
                testName: 'webcam',
            },
            emit
        );

        // Extract WebRTC compatibility info from the device test
        const webrtcCompat =
            deviceTest.mediaStream?.webrtcCompat || deviceTest.deviceEnumeration?.webrtcCompat;

        // Compatibility warnings and recommendations
        const compatibilityWarnings = computed(() => {
            if (!webrtcCompat) return [];
            const info = webrtcCompat.getBrowserInfo();
            return info.warnings || [];
        });

        const recommendedBrowser = computed(() => {
            if (!webrtcCompat) return null;
            const info = webrtcCompat.getBrowserInfo();
            return info.recommendedBrowser;
        });

        const showCompatibilityWarnings = computed(() => {
            return compatibilityWarnings.value.length > 0;
        });

        return {
            ...deviceTest,
            compatibilityWarnings,
            recommendedBrowser,
            showCompatibilityWarnings,
        };
    },

    data() {
        return {
            snapshotTaken: false,
            skipTimer: null,
            skipped: false,
        };
    },

    mounted() {
        if (!this.isInitialized) {
            this.initializeTest();
        }
        this.startCameraDetectTimer();
    },

    activated() {
        // Vue keep-alive hook - reinitialize if needed
        if (!this.isInitialized || this.hasError) {
            this.initializeTest();
            this.startCameraDetectTimer();
        } else if (this.hasActiveStream && this.$refs.videoElement) {
            // Reconnect existing stream to video element if available
            this.$refs.videoElement.srcObject = this.stream;
        }
    },

    deactivated() {
        // Pause video stream but don't destroy everything
        if (this.$refs.videoElement) {
            this.$refs.videoElement.pause();
        }
    },

    beforeUnmount() {
        this.cleanup();
        if (this.skipTimer) clearTimeout(this.skipTimer);
    },

    watch: {
        // Watch for when stream becomes available to setup camera
        stream: {
            handler(newStream) {
                if (newStream && this.hasPermission && this.$refs.videoElement) {
                    this.setupCamera();
                }
            },
            immediate: true,
        },
    },

    computed: {
        // All standard computed properties are provided by useEnhancedDeviceTest
    },

    methods: {
        // Most device test logic is now handled by useEnhancedDeviceTest
        // Only webcam-specific methods remain here

        takeSnapshot() {
            if (!this.$refs.videoElement || !this.$refs.snapshotCanvas) return;

            const video = this.$refs.videoElement;
            const canvas = this.$refs.snapshotCanvas;
            const ctx = canvas.getContext('2d');

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            this.snapshotTaken = true;
        },

        startCameraDetectTimer() {
            if (this.skipTimer) clearTimeout(this.skipTimer);
            this.skipTimer = setTimeout(() => {
                if (!this.hasDevices) {
                    // Timer completed and no cameras found - handled by composable
                }
            }, 3000);
        },

        // Webcam-specific setup method for video element
        setupCamera() {
            if (this.stream && this.$refs.videoElement) {
                const video = this.$refs.videoElement;
                video.srcObject = this.stream;

                const onVideoReady = () => {
                    // Video is now ready for testing - just ensure it's playing
                    video.play().catch(err => {
                        console.error('[WebcamTest] Error auto-playing video:', err);
                    });
                };

                if (this.eventListeners) {
                    this.eventListeners.addEventListener(video, 'loadedmetadata', onVideoReady);
                    this.eventListeners.addEventListener(video, 'canplay', onVideoReady);
                    this.eventListeners.addEventListener(video, 'loadeddata', onVideoReady);
                } else {
                    video.addEventListener('loadedmetadata', onVideoReady);
                    video.addEventListener('canplay', onVideoReady);
                    video.addEventListener('loadeddata', onVideoReady);
                }

                // Force play the video
                video.play().catch(err => {
                    console.error('[WebcamTest] Error playing video:', err);
                });
            }
        },

        // Test completion methods
        startOver() {
            this.snapshotTaken = false;
            this.skipped = false;
            if (this.skipTimer) clearTimeout(this.skipTimer);
            this.resetTest();
        },
    },
};
</script>

<template>
    <div class="webcam-test-container">
        <!-- Always show video wrapper with overlay states -->
        <div class="video-wrapper">
            <video
                ref="videoElement"
                autoplay
                muted
                playsinline
                class="camera-preview"
                :class="{ blurred: isLoading || hasError || needsPermission || showNoDevicesState }"
                aria-label="Camera preview for testing"
                title="Live camera feed for testing purposes"
            ></video>

            <!-- State Panel Overlays inside video -->
            <div v-if="showNoDevicesState" class="video-overlay">
                <StatePanel
                    state="error"
                    title="No Cameras Found"
                    message="No cameras were detected on your system. Please ensure your camera is properly connected."
                    :showRetryButton="true"
                    @retry="resetTest"
                />
            </div>

            <div v-else-if="isLoading" class="video-overlay">
                <StatePanel
                    state="loading"
                    title="Detecting cameras..."
                    message="Please wait while we search for available cameras"
                />
            </div>

            <div v-else-if="needsPermission" class="video-overlay">
                <StatePanel
                    state="info"
                    title="Camera Permission Required"
                    message="Please allow camera access to test your webcam."
                    :showActionButton="true"
                    actionLabel="Grant Camera Access"
                    @action-clicked="requestPermission"
                />
            </div>

            <div v-else-if="permissionBlocked" class="video-overlay">
                <StatePanel
                    state="error"
                    title="Camera Access Denied"
                    message="Please enable camera permissions in your browser settings and try again."
                    :showRetryButton="true"
                    retryLabel="Try Again"
                    @retry="requestPermission"
                />
            </div>

            <div v-else-if="hasError" class="video-overlay">
                <StatePanel
                    state="error"
                    title="Camera Error"
                    :message="currentError"
                    :showRetryButton="true"
                    @retry="resetTest"
                />
            </div>
        </div>

        <!-- Always show device selector -->
        <DeviceSelector
            :devices="availableDevices"
            :selectedDeviceId="selectedDeviceId"
            label="Camera"
            deviceType="Camera"
            :disabled="isLoading"
            @device-changed="switchDevice"
        />

        <!-- Browser Compatibility Warnings -->
        <div v-if="showCompatibilityWarnings" class="compatibility-warnings">
            <div class="warning-header">
                <h4>⚠️ Browser Compatibility Notice</h4>
            </div>
            <ul class="warning-list">
                <li v-for="warning in compatibilityWarnings" :key="warning" class="warning-item">
                    {{ warning }}
                </li>
            </ul>
            <div v-if="recommendedBrowser" class="recommendation">
                <strong>Recommendation:</strong> {{ recommendedBrowser }}
            </div>
        </div>
    </div>
</template>

<style scoped>
.webcam-test-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
}

.video-wrapper {
    width: 100%;
    aspect-ratio: 16 / 9;
    background: var(--background-dark);
    border-radius: var(--border-radius);
    overflow: hidden;
    position: relative;
    max-height: 70vh;
}

.camera-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.camera-preview.blurred {
    filter: blur(8px);
}

.video-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(4px);
    color: var(--text-primary);
    text-align: center;
}

.compatibility-warnings {
    background: var(--warning-bg, #fff8e1);
    border: 1px solid var(--warning-border, #ffb300);
    border-radius: var(--border-radius);
    padding: var(--spacing-lg);
    margin-top: var(--spacing-md);
}

.warning-header h4 {
    margin: 0 0 var(--spacing-md);
    color: var(--warning-color, #f57c00);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
}

.warning-list {
    list-style: none;
    padding: 0;
    margin: 0 0 var(--spacing-md);
}

.warning-item {
    padding: var(--spacing-sm) 0;
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    line-height: 1.4;
}

.warning-item:before {
    content: '• ';
    color: var(--warning-color, #f57c00);
    font-weight: bold;
}

.recommendation {
    background: var(--info-bg, #e3f2fd);
    border: 1px solid var(--info-border, #2196f3);
    border-radius: var(--border-radius-small);
    padding: var(--spacing-md);
    color: var(--text-primary);
    font-size: var(--font-size-sm);
}

.recommendation strong {
    color: var(--info-color, #1976d2);
}
</style>
