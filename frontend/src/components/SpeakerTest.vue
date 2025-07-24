<script>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import StatePanel from './StatePanel.vue';
import DeviceSelector from './DeviceSelector.vue';
import { useEnhancedDeviceTest } from '../composables/useEnhancedDeviceTest.js';

export default {
    name: 'SpeakerTest',
    components: {
        StatePanel,
        DeviceSelector,
    },
    emits: ['test-completed', 'test-failed', 'test-skipped', 'start-over'],
    setup(props, { emit }) {
        // Enhanced device test with device enumeration but no permissions needed for output
        const deviceTest = useEnhancedDeviceTest(
            {
                deviceKind: 'audiooutput',
                deviceType: 'Speaker',
                permissionType: null, // No permissions needed for audio output
                testName: 'speakers',
                autoInitialize: true,
                enableEventListeners: true,
                enableAnimations: false,
                enableLifecycle: true,
            },
            emit
        );

        // Speaker test specific state
        const isPlaying = ref(false);
        const currentTestStep = ref('');
        const audioContext = ref(null);
        const oscillator = ref(null);
        const gainNode = ref(null);
        const panNode = ref(null);
        const testTimeout = ref(null);
        const audioContextReady = ref(false);
        const firefoxRetryCount = ref(0);
        const maxFirefoxRetries = 3;

        /**
         * Initialize audio context with selected speaker
         */
        const initializeAudioContext = async () => {
            try {
                if (!audioContext.value || audioContext.value.state === 'closed') {
                    audioContext.value = new (window.AudioContext || window.webkitAudioContext)();

                    // Set the audio output device if one is selected
                    if (deviceTest.selectedDeviceId.value && audioContext.value.setSinkId) {
                        await audioContext.value.setSinkId(deviceTest.selectedDeviceId.value);
                    }

                    // Ensure audio context is ready (especially for Firefox)
                    if (audioContext.value.state === 'suspended') {
                        await audioContext.value.resume();
                    }

                    audioContextReady.value = true;
                }
            } catch (err) {
                console.error('Audio context initialization error:', err);
                deviceTest.errorHandling.setError(`Failed to initialize audio: ${err.message}`);
                audioContextReady.value = false;
            }
        };

        /**
         * Handle device change
         */
        const handleDeviceChange = async deviceId => {
            if (isPlaying.value) return;

            try {
                deviceTest.selectedDeviceId.value = deviceId;

                // Reinitialize audio context with new output device
                if (audioContext.value) {
                    await audioContext.value.close();
                    audioContext.value = null;
                }
                await initializeAudioContext();
            } catch (err) {
                console.error('Error switching speaker:', err);
                deviceTest.errorHandling.setError(`Failed to switch speaker: ${err.message}`);
            }
        };

        /**
         * Play sound for specific channel
         */
        const playSound = async channel => {
            if (isPlaying.value) return;

            // Start test timing on first interaction
            if (deviceTest.testResults && deviceTest.testResults.testStatus === 'pending') {
                deviceTest.testResults.startTest();
            }

            isPlaying.value = true;
            currentTestStep.value = channel;

            try {
                // Ensure we have devices before attempting to play
                if (deviceTest.availableDevices.value.length === 0) {
                    console.log('No devices found, attempting to re-enumerate...');
                    await deviceTest.deviceEnumeration.enumerateDevices();

                    // Give Firefox a moment to properly enumerate devices
                    await new Promise(resolve => setTimeout(resolve, 100));

                    if (deviceTest.availableDevices.value.length === 0) {
                        console.log('Still no devices found, this may be a Firefox issue');
                        // Continue anyway - Firefox might have default devices that aren't enumerated
                    }
                }

                await playChannel(channel);
            } catch (error) {
                console.error('Error playing sound:', error);
                deviceTest.errorHandling.setError(`Failed to play sound: ${error.message}`);
            } finally {
                isPlaying.value = false;
                currentTestStep.value = '';
            }
        };

        /**
         * Play musical scale for specific channel
         * Left: do re mi fa, Right: so la si do, Both: full scale
         */
        const playChannel = async channel => {
            try {
                // Ensure audio context is properly initialized
                if (!audioContext.value || audioContext.value.state === 'closed') {
                    await initializeAudioContext();
                }

                // Handle Firefox audio context suspension
                if (audioContext.value.state === 'suspended') {
                    await audioContext.value.resume();
                }

                stopSound(false); // Stop previous sound without setting isPlaying to false

                return new Promise((resolve, reject) => {
                    try {
                        // Full musical scale frequencies (C major scale)
                        const fullScaleFrequencies = [
                            261.63, // C4 - do
                            293.66, // D4 - re
                            329.63, // E4 - mi
                            349.23, // F4 - fa
                            392.0, // G4 - so
                            440.0, // A4 - la
                            493.88, // B4 - si
                            523.25, // C5 - do (octave higher)
                        ];

                        let scaleFrequencies;
                        if (channel === 'Left') {
                            // First 4 notes: do re mi fa
                            scaleFrequencies = fullScaleFrequencies.slice(0, 4);
                        } else if (channel === 'Right') {
                            // Last 4 notes: so la si do
                            scaleFrequencies = fullScaleFrequencies.slice(4, 8);
                        } else {
                            // Both: full scale
                            scaleFrequencies = fullScaleFrequencies;
                        }

                        const noteDuration = 250; // 250ms per note for better clarity
                        const totalDuration = scaleFrequencies.length * noteDuration;

                        let currentNoteIndex = 0;

                        const playNextNote = () => {
                            if (currentNoteIndex >= scaleFrequencies.length) {
                                stopSound(false);
                                resolve();
                                return;
                            }

                            // Create new oscillator for each note
                            const noteOscillator = audioContext.value.createOscillator();
                            const noteGain = audioContext.value.createGain();
                            const notePan = audioContext.value.createStereoPanner();

                            noteOscillator.type = 'sine';
                            noteOscillator.frequency.setValueAtTime(
                                scaleFrequencies[currentNoteIndex],
                                audioContext.value.currentTime
                            );

                            // Set pan based on channel
                            if (channel === 'Left') {
                                notePan.pan.setValueAtTime(-1, audioContext.value.currentTime);
                            } else if (channel === 'Right') {
                                notePan.pan.setValueAtTime(1, audioContext.value.currentTime);
                            } else {
                                notePan.pan.setValueAtTime(0, audioContext.value.currentTime);
                            }

                            // Smooth envelope to avoid clicks
                            noteGain.gain.setValueAtTime(0, audioContext.value.currentTime);
                            noteGain.gain.linearRampToValueAtTime(
                                0.3,
                                audioContext.value.currentTime + 0.05
                            );
                            noteGain.gain.linearRampToValueAtTime(
                                0.3,
                                audioContext.value.currentTime + noteDuration / 1000 - 0.05
                            );
                            noteGain.gain.linearRampToValueAtTime(
                                0,
                                audioContext.value.currentTime + noteDuration / 1000
                            );

                            // Connect and play
                            noteOscillator
                                .connect(noteGain)
                                .connect(notePan)
                                .connect(audioContext.value.destination);

                            noteOscillator.start();

                            // Stop the note
                            setTimeout(() => {
                                try {
                                    noteOscillator.stop();
                                    noteOscillator.disconnect();
                                } catch (e) {
                                    // Ignore errors when stopping
                                }
                            }, noteDuration);

                            currentNoteIndex++;

                            // Schedule next note
                            testTimeout.value = setTimeout(playNextNote, noteDuration);
                        };

                        // Start playing the scale
                        playNextNote();

                        // Fallback timeout for safety
                        testTimeout.value = setTimeout(() => {
                            stopSound(false);
                            resolve();
                        }, totalDuration + 500);
                    } catch (error) {
                        console.error('Error in playChannel:', error);
                        reject(error);
                    }
                });
            } catch (error) {
                console.error('Error preparing audio context:', error);
                throw error;
            }
        };

        /**
         * Stop current sound
         */
        const stopSound = (endTest = true) => {
            if (testTimeout.value) {
                clearTimeout(testTimeout.value);
                testTimeout.value = null;
            }

            if (oscillator.value) {
                try {
                    oscillator.value.stop();
                    oscillator.value.disconnect();
                } catch (e) {
                    // Ignore errors when stopping already stopped oscillator
                }
                oscillator.value = null;
            }

            if (endTest) {
                isPlaying.value = false;
                currentTestStep.value = '';
            }
        };

        /**
         * Request permission (not needed for speakers, but kept for consistency)
         */
        const requestPermission = async () => {
            // Speakers don't need permission, just initialize
            await initializeAudioContext();
        };

        /**
         * Retry test
         */
        const retryTest = async () => {
            stopSound();
            cleanup();
            deviceTest.resetTest();

            // Add small delay for Firefox to stabilize audio context
            await new Promise(resolve => setTimeout(resolve, 100));

            await deviceTest.initializeTest();

            // Ensure audio context is reinitialized
            if (audioContext.value && audioContext.value.state !== 'closed') {
                await audioContext.value.close();
                audioContext.value = null;
            }
            await initializeAudioContext();
        };

        /**
         * Cleanup function
         */
        const cleanup = () => {
            stopSound();
            if (audioContext.value && audioContext.value.state !== 'closed') {
                audioContext.value.close();
                audioContext.value = null;
            }
        };

        // Initialize audio context on mount
        onMounted(() => {
            initializeAudioContext();
        });

        // Watch for device changes and handle Firefox edge cases
        const handleDeviceEnumeration = async () => {
            try {
                // Check if we have devices but they're empty (Firefox edge case)
                if (
                    deviceTest.availableDevices.value.length === 0 &&
                    deviceTest.deviceEnumeration.hasDevices.value
                ) {
                    console.log('Firefox device enumeration issue detected, retrying...');
                    await new Promise(resolve => setTimeout(resolve, 200));
                    await deviceTest.deviceEnumeration.enumerateDevices();
                }
            } catch (error) {
                console.error('Error handling device enumeration:', error);
            }
        };

        // Firefox-specific workaround: always allow testing even if no devices enumerated
        // Firefox has default audio output that works even when not enumerated
        const hasFirefoxDefaultAudio = computed(() => {
            return typeof InstallTrigger !== 'undefined'; // Firefox detection
        });

        // Override showNoDevicesState for Firefox when we have default audio
        const actualShowNoDevicesState = computed(() => {
            // If we have devices, show normal state
            if (deviceTest.availableDevices.value.length > 0) {
                return false;
            }

            // Firefox workaround - allow testing with default audio
            if (hasFirefoxDefaultAudio.value) {
                return false;
            }

            // Otherwise, show no devices state
            return deviceTest.showNoDevicesState.value;
        });

        // Watch for device enumeration completion
        if (deviceTest.deviceEnumeration) {
            // Add a small delay to ensure devices are properly enumerated
            setTimeout(handleDeviceEnumeration, 100);
        }

        // Cleanup on unmount
        onUnmounted(() => {
            cleanup();
        });

        return {
            // Device test state and methods
            ...deviceTest,

            // Speaker test specific state
            isPlaying,
            currentTestStep,

            // Override showNoDevicesState with Firefox-compatible version
            showNoDevicesState: actualShowNoDevicesState,

            // Methods
            handleDeviceChange,
            playSound,
            requestPermission,
            retryTest,
        };
    },
};
</script>

<template>
    <div class="speaker-test-container">
        <!-- Always show canvas wrapper with overlay states -->
        <div class="canvas-wrapper">
            <div class="speakers-container">
                <div
                    class="speaker-box"
                    :class="{
                        active: currentTestStep === 'Left' || currentTestStep === 'Both',
                        clickable: !isPlaying,
                    }"
                    @click="!isPlaying && playSound('Left')"
                    :tabindex="!isPlaying ? 0 : -1"
                    :aria-disabled="isPlaying"
                    role="button"
                >
                    <div class="speaker-icon">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="48"
                            height="48"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                            <circle cx="12" cy="14" r="4"></circle>
                            <line x1="12" y1="6" x2="12" y2="6"></line>
                        </svg>
                    </div>
                    <span class="speaker-label">Left</span>
                </div>
                <div
                    class="speaker-box"
                    :class="{
                        active: currentTestStep === 'Both',
                        clickable: !isPlaying,
                    }"
                    @click="!isPlaying && playSound('Both')"
                    :tabindex="!isPlaying ? 0 : -1"
                    :aria-disabled="isPlaying"
                    role="button"
                >
                    <div class="speaker-icon both-speakers">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="48"
                            height="48"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                            <circle cx="12" cy="14" r="4"></circle>
                            <line x1="12" y1="6" x2="12" y2="6"></line>
                        </svg>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="48"
                            height="48"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                            <circle cx="12" cy="14" r="4"></circle>
                            <line x1="12" y1="6" x2="12" y2="6"></line>
                        </svg>
                    </div>
                    <span class="speaker-label">Both</span>
                </div>
                <div
                    class="speaker-box"
                    :class="{
                        active: currentTestStep === 'Right' || currentTestStep === 'Both',
                        clickable: !isPlaying,
                    }"
                    @click="!isPlaying && playSound('Right')"
                    :tabindex="!isPlaying ? 0 : -1"
                    :aria-disabled="isPlaying"
                    role="button"
                >
                    <div class="speaker-icon">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="48"
                            height="48"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                            <circle cx="12" cy="14" r="4"></circle>
                            <line x1="12" y1="6" x2="12" y2="6"></line>
                        </svg>
                    </div>
                    <span class="speaker-label">Right</span>
                </div>
            </div>

            <!-- State Panel Overlays inside canvas -->
            <div v-if="actualShowNoDevicesState" class="canvas-overlay">
                <StatePanel
                    state="error"
                    title="No Speakers Found"
                    message="No speakers were detected on your system. Please ensure your speakers are properly connected."
                    :showRetryButton="true"
                    @retry="retryTest"
                />
            </div>

            <div v-else-if="isLoading" class="canvas-overlay">
                <StatePanel
                    state="loading"
                    title="Detecting speakers..."
                    message="Please wait while we search for available speakers"
                />
            </div>

            <div v-else-if="hasError" class="canvas-overlay">
                <StatePanel
                    state="error"
                    title="Speaker Error"
                    :message="currentError"
                    :showRetryButton="true"
                    @retry="retryTest"
                />
            </div>
        </div>

        <!-- Always show device selector -->
        <DeviceSelector
            :devices="availableDevices"
            :selectedDeviceId="selectedDeviceId"
            label="Speaker"
            deviceType="Speaker"
            :disabled="isLoading"
            @device-changed="handleDeviceChange"
        />
    </div>
</template>

<style scoped>
.speaker-test-container {
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

.speakers-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: var(--spacing-lg);
    width: 100%;
    height: 100%;
    padding: var(--spacing-md);
}

.speaker-box {
    flex: 1;
    max-width: 200px;
    min-height: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-lg);
    padding: var(--spacing-xl);
    border-radius: var(--border-radius-large);
    border: 4px solid var(--border-color-light);
    transition: var(--transition-slow);
}

.speaker-box.active {
    border: 4px solid var(--primary-color);
    box-shadow: 0 0 15px rgba(255, 107, 0, 0.3);
}

.speaker-box.clickable {
    cursor: pointer;
    transition: var(--transition-default);
}

.speaker-box.clickable:hover {
    box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.27);
    background: var(--background-dark);
}

.speaker-box[aria-disabled='true'] {
    cursor: not-allowed;
    opacity: 0.7;
}

.speaker-icon {
    position: relative;
    color: var(--text-tertiary);
    transition: var(--transition-slow);
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 48px; /* Ensure consistent height */
}

.speaker-box.active .speaker-icon {
    color: var(--primary-color);
}

.speaker-label {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--text-secondary);
}

.speaker-box.active .speaker-label {
    color: var(--primary-color);
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

.both-speakers {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    min-height: 48px; /* Match single icon height */
}
</style>
