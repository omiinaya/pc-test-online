<script>
import { ref, onUnmounted, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import StatePanel from './StatePanel.vue';
import DeviceSelector from './DeviceSelector.vue';
import { useBaseDeviceTest } from '../composables/base/useBaseDeviceTest.ts';
import { useMemoryManagement } from '../composables/useMemoryManagement';

export default {
    name: 'SpeakerTest',
    components: {
        StatePanel,
        DeviceSelector,
    },
    emits: ['test-completed', 'test-failed', 'test-skipped', 'start-over'],
    setup(props, { emit }) {
        const { t } = useI18n();
        // Base device test with device enumeration but no permissions needed for output
        const deviceTest = useBaseDeviceTest(
            {
                deviceKind: 'audiooutput',
                deviceType: t('tests.speakers.name'),
                permissionType: null, // No permissions needed for audio output
                testName: 'speakers',
                autoInitialize: true,
                enableEventListeners: true,
                enableAnimations: false,
                enableLifecycle: true,
            },
            emit
        );

        // Use memory management for tracking resources
        const memoryManager = useMemoryManagement();

        // Speaker test specific state
        const isPlaying = ref(false);
        const currentTestStep = ref('');
        const audioContext = ref(null);
        const oscillator = ref(null);
        const testTimeout = ref(null);
        const audioContextReady = ref(false);
        const audioContextInitialized = ref(false);
        const audioContextResourceId = ref(null);
        const oscillatorResourceIds = ref([]);
        const timeoutResourceId = ref(null);

        /**
         * Initialize audio context with selected speaker
         * AudioContext should be created once and reused, only setting sinkId when needed
         */
        const initializeAudioContext = async () => {
            try {
                // Create AudioContext only once
                if (!audioContext.value) {
                    audioContext.value = new (window.AudioContext || window.webkitAudioContext)();
                    audioContextInitialized.value = true;

                    // Track audio context for memory management
                    audioContextResourceId.value = memoryManager.trackResource(
                        () => {
                            if (audioContext.value && audioContext.value.state !== 'closed') {
                                audioContext.value.close();
                            }
                        },
                        'connection',
                        'AudioContext for speaker test'
                    );
                }

                // Handle suspended state (browser autoplay policy)
                if (audioContext.value.state === 'suspended') {
                    await audioContext.value.resume();
                }

                // Set the audio output device if one is selected and context supports it
                if (deviceTest.selectedDeviceId.value && audioContext.value.setSinkId) {
                    try {
                        await audioContext.value.setSinkId(deviceTest.selectedDeviceId.value);
                    } catch (sinkError) {
                        console.warn('Failed to set sink ID:', sinkError);
                        // Continue without setting sink ID - most browsers will use default
                    }
                }

                audioContextReady.value = true;
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

                // Only update sink ID if audio context exists and supports it
                if (audioContext.value && audioContext.value.setSinkId) {
                    try {
                        await audioContext.value.setSinkId(deviceId);
                    } catch (sinkError) {
                        console.warn('Failed to set sink ID:', sinkError);
                        // Continue without setting sink ID - browser will use default
                    }
                }
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
                // Initialize audio context on user interaction to comply with autoplay policies
                if (!audioContext.value || audioContext.value.state === 'closed') {
                    await initializeAudioContext();
                } else if (audioContext.value.state === 'suspended') {
                    // Resume if suspended - this is the key user interaction point
                    await audioContext.value.resume();
                }

                await playChannel(channel);
            } catch (error) {
                console.error('Error playing sound:', error);
                // Handle autoplay policy violations gracefully
                if (error.name === 'NotAllowedError' || error.message.includes('user gesture')) {
                    deviceTest.errorHandling.setError(
                        'Please click the speaker buttons to start audio playback. Browser requires user interaction for audio.'
                    );
                } else {
                    deviceTest.errorHandling.setError(`Failed to play sound: ${error.message}`);
                }
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
                // Ensure audio context is properly initialized and resumed on user interaction
                if (!audioContext.value || audioContext.value.state === 'closed') {
                    await initializeAudioContext();
                } else if (audioContext.value.state === 'suspended') {
                    // This resume() call is crucial for browser autoplay policies
                    // It must be called directly in response to user interaction
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
                            const noteTimeoutId = setTimeout(() => {
                                try {
                                    noteOscillator.stop();
                                    noteOscillator.disconnect();
                                } catch (e) {
                                    // Ignore errors when stopping
                                }
                            }, noteDuration);

                            // Track the timeout for memory management
                            const noteTimeoutResourceId = memoryManager.trackResource(
                                () => clearTimeout(noteTimeoutId),
                                'timeout',
                                'Note playback timeout'
                            );
                            oscillatorResourceIds.value.push(noteTimeoutResourceId);

                            currentNoteIndex++;

                            // Schedule next note
                            testTimeout.value = setTimeout(playNextNote, noteDuration);
                            if (timeoutResourceId.value !== null) {
                                memoryManager.untrackResource(timeoutResourceId.value);
                            }
                            timeoutResourceId.value = memoryManager.trackResource(
                                () => {
                                    if (testTimeout.value) {
                                        clearTimeout(testTimeout.value);
                                        testTimeout.value = null;
                                    }
                                },
                                'timeout',
                                'Next note scheduling timeout'
                            );
                        };

                        // Start playing the scale
                        playNextNote();

                        // Fallback timeout for safety
                        const fallbackTimeoutId = setTimeout(() => {
                            stopSound(false);
                            resolve();
                        }, totalDuration + 500);
                        const fallbackResourceId = memoryManager.trackResource(
                            () => clearTimeout(fallbackTimeoutId),
                            'timeout',
                            'Fallback safety timeout'
                        );
                        oscillatorResourceIds.value.push(fallbackResourceId);
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

            // Clean up tracked timeout resource
            if (timeoutResourceId.value !== null) {
                memoryManager.untrackResource(timeoutResourceId.value);
                timeoutResourceId.value = null;
            }

            // Clean up all tracked oscillator resources
            oscillatorResourceIds.value.forEach(resourceId => {
                memoryManager.untrackResource(resourceId);
            });
            oscillatorResourceIds.value = [];

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
            deviceTest.resetTest();

            // Add small delay for Firefox to stabilize audio context
            await new Promise(resolve => setTimeout(resolve, 100));

            await deviceTest.initializeTest();

            // Reset audio context ready state but keep the instance
            audioContextReady.value = false;

            // Resume audio context if it exists
            if (audioContext.value && audioContext.value.state !== 'closed') {
                try {
                    await audioContext.value.resume();
                    audioContextReady.value = true;
                } catch (resumeError) {
                    console.warn('Failed to resume audio context:', resumeError);
                    // Continue without audio context - will be recreated on next interaction
                }
            }
        };

        /**
         * Cleanup function
         * Only close audio context when component is unmounted, not during retry
         */
        const cleanup = () => {
            stopSound();

            // Untrack and clean up audio context
            if (audioContextResourceId.value !== null) {
                memoryManager.untrackResource(audioContextResourceId.value);
                audioContextResourceId.value = null;
            }

            if (audioContext.value && audioContext.value.state !== 'closed') {
                try {
                    audioContext.value.close();
                } catch (closeError) {
                    console.warn('Error closing audio context:', closeError);
                }
                audioContext.value = null;
                audioContextInitialized.value = false;
                audioContextReady.value = false;
            }
        };

        // Don't initialize audio context automatically - wait for user interaction
        // to comply with browser autoplay policies. The AudioContext will be created
        // but left in suspended state until user clicks a speaker button.

        // Watch for device enumeration to handle audio output edge cases
        const handleDeviceEnumeration = async () => {
            try {
                // Debug logging removed for production
                // console.log('Device enumeration handler called');
                // console.log('Available devices:', deviceTest.availableDevices.value);
                // console.log('Is loading:', deviceTest.isLoading.value);
                // console.log('Show no devices state:', deviceTest.showNoDevicesState.value);
                // console.log('Has devices:', deviceTest.hasDevices.value);

                // For audio output, many systems have default devices that work
                // even when not explicitly enumerated. We should be more permissive.
                if (deviceTest.availableDevices.value.length === 0) {
                    // console.log('DEBUG: No audio output devices enumerated, but default output may still work');
                    // console.log('DEBUG: Device detection delay state:', deviceTest.deviceDetectionDelay?.shouldShowNoDevices.value);
                } else {
                    // console.log('DEBUG: Found', deviceTest.availableDevices.value.length, 'audio output devices');
                }
            } catch (error) {
                console.error('Error handling device enumeration:', error);
            }
        };

        // For audio output devices, browsers often have default output that works
        // even when no devices are enumerated. We should be very permissive.
        const actualShowNoDevicesState = computed(() => {
            // For audio output, default to allowing testing even if no devices enumerated
            // Never show "no devices" for audio output as most systems have default audio
            return false;
        });

        // Watch for device enumeration completion with safe debugging
        if (deviceTest.deviceEnumeration) {
            // console.log('SpeakerTest: Setting up device enumeration...');

            // Add a small delay to ensure devices are properly enumerated
            setTimeout(handleDeviceEnumeration, 100);

            // Watch for available devices changes to handle audio output device selection
            watch(
                () => deviceTest.availableDevices.value,
                (newDevices, _oldDevices) => {
                    // If we have audio output devices, ensure one is selected
                    if (newDevices.length > 0 && !deviceTest.selectedDeviceId.value) {
                        // Prefer a device with a proper label, otherwise select the first one
                        const deviceToSelect =
                            newDevices.find(d => d.label && !d.label.includes('...')) ||
                            newDevices[0];
                        deviceTest.selectedDeviceId.value = deviceToSelect.deviceId;
                    }
                },
                { immediate: true }
            );

            // Simple periodic check for state changes (removed for production)
            // const debugInterval = setInterval(() => {
            //     console.log('SpeakerTest State:', {
            //         availableDevices: deviceTest.availableDevices.value.length,
            //         selectedDevice: deviceTest.selectedDeviceId.value,
            //         showNoDevicesState: deviceTest.showNoDevicesState.value,
            //         isLoading: deviceTest.isLoading.value,
            //         hasError: deviceTest.hasError.value
            //     });
            // }, 3000);

            // Clean up interval on unmount
            // onUnmounted(() => {
            //     clearInterval(debugInterval);
            // });
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

            // Override showNoDevicesState with audio-output-specific logic
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
                    <span class="speaker-label">{{
                        $t('device_testing.speaker.left_channel')
                    }}</span>
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
                    <span class="speaker-label">{{
                        $t('device_testing.speaker.both_channels')
                    }}</span>
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
                    <span class="speaker-label">{{
                        $t('device_testing.speaker.right_channel')
                    }}</span>
                </div>
            </div>

            <!-- State Panel Overlays inside canvas -->
            <div v-if="showNoDevicesState" class="canvas-overlay">
                <StatePanel
                    state="error"
                    :title="$t('errors.device.speaker_not_found')"
                    :message="$t('errors.device.speaker_not_connected')"
                    :showRetryButton="true"
                    @retry="retryTest"
                />
            </div>

            <div v-else-if="isLoading" class="canvas-overlay">
                <StatePanel
                    state="loading"
                    :title="$t('device_testing.detection.detecting_speakers')"
                    :message="
                        $t('device_testing.detection.please_wait_search', {
                            deviceType: 'speakers',
                        })
                    "
                />
            </div>

            <div v-else-if="hasError" class="canvas-overlay">
                <StatePanel
                    state="error"
                    :title="$t('errors.device.speaker_error')"
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
            :label="$t('tests.speakers.shortName')"
            :deviceType="$t('tests.speakers.name')"
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
    gap: var(--spacing-lg);
    width: 100%;
    height: 100%;
    padding: var(--spacing-lg);
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
