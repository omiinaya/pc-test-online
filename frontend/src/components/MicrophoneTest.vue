<script>
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';
import StatePanel from './StatePanel.vue';
import DeviceSelector from './DeviceSelector.vue';
import { useEnhancedDeviceTest } from '../composables/useEnhancedDeviceTest.js';
import { useCanvas } from '../composables/useCanvas.js';
import { useAnimations } from '../composables/useAnimations.js';

export default {
    name: 'MicrophoneTest',
    components: {
        StatePanel,
        DeviceSelector,
    },
    emits: ['test-completed', 'test-failed', 'test-skipped', 'start-over'],
    setup(props, { emit }) {
        // Enhanced device test with all normalized patterns
        const deviceTest = useEnhancedDeviceTest(
            {
                deviceKind: 'audioinput',
                deviceType: 'Microphone',
                permissionType: 'microphone',
                testName: 'microphone',
                autoInitialize: true,
                enableEventListeners: true,
                enableAnimations: true,
                enableLifecycle: true,
            },
            emit
        );

        // Canvas for waveform visualization
        const waveformCanvas = ref(null);
        const {
            context: canvasCtx,
            initializeCanvas,
            resizeCanvas,
            clearCanvas,
        } = useCanvas(waveformCanvas);

        // Animation management
        const { requestAnimationFrame, cleanupAnimations } = useAnimations();

        // Audio analysis state
        const audioContext = ref(null);
        const analyser = ref(null);
        const dataArray = ref(null);
        const volumeLevel = ref(0);
        const isAnalyzing = ref(false);

        /**
         * Setup audio analysis for visualization
         */
        const setupAudioAnalysis = async () => {
            try {
                if (!deviceTest.stream.value) {
                    console.error('No stream available for audio analysis');
                    return false;
                }

                // Start test timing when audio analysis begins
                if (deviceTest.testResults && deviceTest.testResults.testStatus === 'pending') {
                    deviceTest.testResults.startTest();
                }

                // Initialize canvas first
                const canvasInitialized = await initializeCanvas();
                if (!canvasInitialized) {
                    console.error('Failed to initialize canvas');
                    return false;
                }

                // Setup audio context and analyser only if not already created
                if (!audioContext.value || audioContext.value.state === 'closed') {
                    audioContext.value = new (window.AudioContext || window.webkitAudioContext)();
                    
                    // Handle suspended state (common in browsers with autoplay restrictions)
                    if (audioContext.value.state === 'suspended') {
                        await audioContext.value.resume();
                    }
                }

                if (!analyser.value) {
                    analyser.value = audioContext.value.createAnalyser();
                    const source = audioContext.value.createMediaStreamSource(deviceTest.stream.value);
                    source.connect(analyser.value);
                    analyser.value.fftSize = 2048;
                    dataArray.value = new Uint8Array(analyser.value.frequencyBinCount);
                }

                // Start visualization
                startVisualization();

                return true;
            } catch (error) {
                console.error('Failed to setup audio analysis:', error);
                deviceTest.errorHandling.setError(
                    `Failed to setup audio analysis: ${error.message}`
                );
                return false;
            }
        };

        /**
         * Start audio visualization
         */
        const startVisualization = () => {
            if (!analyser.value || !canvasCtx.value || isAnalyzing.value) return;

            isAnalyzing.value = true;
            visualize();
        };

        /**
         * Stop audio visualization
         */
        const stopVisualization = () => {
            isAnalyzing.value = false;
            cleanupAnimations();
            if (canvasCtx.value) {
                clearCanvas();
            }
        };

        /**
         * Visualization loop
         */
        const visualize = () => {
            if (!isAnalyzing.value || !analyser.value || !canvasCtx.value) return;

            // Get audio data
            analyser.value.getByteTimeDomainData(dataArray.value);

            // Calculate volume level
            let sumSquares = 0.0;
            for (const amplitude of dataArray.value) {
                const val = amplitude / 128.0 - 1.0;
                sumSquares += val * val;
            }
            const rms = Math.sqrt(sumSquares / dataArray.value.length);
            volumeLevel.value = rms * 100 * 2; // Multiplier for better visualization

            // Draw waveform
            drawWaveform();

            requestAnimationFrame(visualize);
        };

        /**
         * Draw waveform visualization
         */
        const drawWaveform = () => {
            if (!canvasCtx.value || !dataArray.value || !waveformCanvas.value) return;

            const canvas = waveformCanvas.value;
            const width = canvas.offsetWidth;
            const height = canvas.offsetHeight;

            // Clear canvas
            canvasCtx.value.fillStyle = '#1a1a1a';
            canvasCtx.value.fillRect(0, 0, width, height);

            // Draw waveform
            canvasCtx.value.lineWidth = 2;
            canvasCtx.value.strokeStyle = '#ffc107';
            canvasCtx.value.beginPath();

            const sliceWidth = width / dataArray.value.length;
            let x = 0;

            for (let i = 0; i < dataArray.value.length; i++) {
                const v = dataArray.value[i] / 128.0;
                const y = (v * height) / 2;

                if (i === 0) {
                    canvasCtx.value.moveTo(x, y);
                } else {
                    canvasCtx.value.lineTo(x, y);
                }

                x += sliceWidth;
            }

            canvasCtx.value.lineTo(width, height / 2);
            canvasCtx.value.stroke();
        };

        /**
         * Handle device change
         */
        const handleDeviceChange = async deviceId => {
            stopVisualization();

            const constraints = {
                audio: {
                    deviceId: { exact: deviceId },
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                },
            };

            const stream = await deviceTest.switchDevice(deviceId);
            if (stream) {
                await nextTick();
                await setupAudioAnalysis();
            }
        };

        /**
         * Request permission with stream setup
         */
        const requestPermission = async () => {
            const granted = await deviceTest.requestPermission();

            if (granted && deviceTest.stream.value) {
                await nextTick();
                await setupAudioAnalysis();
            }
        };

        /**
         * Retry test
         */
        const retryTest = async () => {
            stopVisualization();
            cleanup();
            deviceTest.resetTest();
            await deviceTest.initializeTest();
        };

        /**
         * Cleanup function
         */
        const cleanup = () => {
            stopVisualization();

            if (audioContext.value) {
                audioContext.value.close();
                audioContext.value = null;
            }

            analyser.value = null;
            dataArray.value = null;
            volumeLevel.value = 0;
        };

        // Watch for test readiness to automatically get stream
        watch(
            () => deviceTest.showTestContent.value,
            async isReady => {
                if (isReady && !deviceTest.stream.value) {
                    // Automatically request stream when test content should be shown
                    await requestPermission();
                }
            },
            { immediate: true }
        );

        // Watch for stream changes to setup audio analysis
        watch(
            () => deviceTest.stream.value,
            async newStream => {
                if (newStream && deviceTest.showTestContent.value) {
                    await nextTick();
                    await setupAudioAnalysis();
                } else if (!newStream) {
                    stopVisualization();
                }
            },
            { immediate: false }
        );

        // Cleanup on unmount
        onUnmounted(() => {
            cleanup();
        });

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
            // Device test state and methods
            ...deviceTest,

            // Canvas ref
            waveformCanvas,

            // Audio visualization state
            volumeLevel,

            // Methods
            handleDeviceChange,
            requestPermission,
            retryTest,

            // Compatibility
            compatibilityWarnings,
            recommendedBrowser,
            showCompatibilityWarnings,
        };
    },
};
</script>

<template>
    <div class="microphone-test-container">
        <!-- Always show canvas wrapper with overlay states -->
        <div class="canvas-wrapper">
            <canvas ref="waveformCanvas" class="waveform-display"></canvas>
            <div v-if="showTestContent" class="volume-meter">
                <div class="volume-bar" :style="{ width: volumeLevel + '%' }"></div>
            </div>

            <!-- State Panel Overlays inside canvas -->
            <div v-if="showNoDevicesState" class="canvas-overlay">
                <StatePanel
                    state="error"
                    title="No Microphones Found"
                    message="No microphones were detected on your system. Please ensure your microphone is properly connected."
                    :showRetryButton="true"
                    @retry="resetTest"
                />
            </div>

            <div v-else-if="isLoading" class="canvas-overlay">
                <StatePanel
                    state="loading"
                    title="Detecting microphones..."
                    message="Please wait while we search for available microphones"
                />
            </div>

            <div v-else-if="needsPermission" class="canvas-overlay">
                <StatePanel
                    state="info"
                    title="Microphone Permission Required"
                    message="Please allow microphone access to test your microphone."
                    :showActionButton="true"
                    actionLabel="Grant Microphone Access"
                    @action-clicked="requestPermission"
                />
            </div>

            <div v-else-if="permissionBlocked" class="canvas-overlay">
                <StatePanel
                    state="error"
                    title="Microphone Access Denied"
                    message="Please enable microphone permissions in your browser settings and try again."
                    :showRetryButton="true"
                    retryLabel="Try Again"
                    @retry="requestPermission"
                />
            </div>

            <div v-else-if="hasError" class="canvas-overlay">
                <StatePanel
                    state="error"
                    title="Microphone Error"
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
            label="Microphone"
            deviceType="Microphone"
            :disabled="isLoading"
            @device-changed="handleDeviceChange"
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
.microphone-test-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
}

.canvas-wrapper {
    width: 100%;
    aspect-ratio: 16 / 9;
    background: var(--background-dark);
    border-radius: var(--border-radius);
    overflow: hidden;
    position: relative;
    max-height: 70vh;
}

.waveform-display {
    width: 100%;
    height: 100%;
    background: var(--background-dark);
    border-radius: var(--border-radius);
    overflow: hidden;
    position: relative;
}

.canvas-overlay {
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

.volume-meter {
    position: absolute;
    bottom: var(--spacing-md);
    left: var(--spacing-md);
    right: var(--spacing-md);
    height: 8px;
    background: rgba(0, 0, 0, 0.5);
    border-radius: var(--border-radius-small);
    overflow: hidden;
}

.volume-bar {
    height: 100%;
    background: var(--warning-color);
    transition: width var(--transition-fast);
    border-radius: var(--border-radius-small);
    box-shadow: 0 0 10px rgba(255, 152, 0, 0.3);
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
