<script>
import StatePanel from './StatePanel.vue';
import DeviceSelector from './DeviceSelector.vue';
import { useMediaDeviceTest } from '../composables/extensions/useMediaDeviceTest.ts';
import { CameraIcon, CheckIcon } from '../composables/useIcons';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMemoryManagement } from '../composables/useMemoryManagement';

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
        const { t } = useI18n();
        // Use the media device test composable for all core functionality
        const deviceTest = useMediaDeviceTest(
            {
                deviceKind: 'videoinput',
                deviceType: t('tests.webcam.name'),
                permissionType: 'camera',
                testName: 'webcam',
                autoInitialize: true,
                enableEventListeners: true,
                enableAnimations: true,
                enableLifecycle: true,
            },
            emit
        );

        // Use memory management for tracking resources
        const memoryManager = useMemoryManagement();

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
            memoryManager,
        };
    },

    data() {
        return {
            snapshotTaken: false,
            skipTimer: null,
            skipped: false,
            skipTimerResourceId: null,
            videoEventResourceIds: [],
        };
    },

    computed: {
        currentVideoWidth() {
            if (this.$refs.videoElement) {
                return this.$refs.videoElement.videoWidth;
            }
            return 0;
        },
    },

    mounted() {
        console.log('[WebcamTest] mounted() called');
        console.log('[WebcamTest] isInitialized:', this.isInitialized);
        console.log('[WebcamTest] hasActiveStream:', this.hasActiveStream);
        console.log('[WebcamTest] stream:', this.stream);
        console.log('[WebcamTest] videoElement ref:', this.$refs.videoElement);

        if (!this.isInitialized) {
            console.log('[WebcamTest] Initializing test in mounted()');
            this.initializeTest();
        } else if (this.hasActiveStream && this.stream) {
            // Stream exists from previous session, need to recreate it
            console.log('[WebcamTest] Stream exists from previous session, recreating...');
            this.getDeviceStream(null, true)
                .then(() => {
                    console.log('[WebcamTest] Stream recreated after mount');
                })
                .catch(err => {
                    console.error('[WebcamTest] Error recreating stream:', err);
                });
        }
        this.startCameraDetectTimer();

        // Log all state values for debugging
        this.logStateValues('mounted');
    },

    activated() {
        console.log('[WebcamTest] activated() called');
        console.log('[WebcamTest] isInitialized:', this.isInitialized);
        console.log('[WebcamTest] hasError:', this.hasError);
        console.log('[WebcamTest] hasActiveStream:', this.hasActiveStream);
        console.log('[WebcamTest] stream:', this.stream);
        console.log('[WebcamTest] videoElement ref:', this.$refs.videoElement);
        this.logStateValues('activated');

        // Vue keep-alive hook - reinitialize if needed
        if (!this.isInitialized || this.hasError) {
            console.log('[WebcamTest] Reinitializing test in activated()');
            this.initializeTest();
            this.startCameraDetectTimer();
        } else if (this.hasActiveStream && this.stream) {
            // Check if current stream has proper resolution
            const videoTracks = this.stream.getVideoTracks();
            let hasBadResolution = false;
            videoTracks.forEach(track => {
                const settings = track.getSettings();
                console.log(
                    `[WebcamTest] Checking track resolution in activated: ${settings.width}x${settings.height}`
                );
                if (!settings.width || settings.width < 100) {
                    hasBadResolution = true;
                    console.log('[WebcamTest] Bad resolution detected, will recreate stream');
                }
            });

            if (hasBadResolution) {
                console.log('[WebcamTest] Recreating stream with proper resolution...');
                this.getDeviceStream(null, true)
                    .then(() => {
                        console.log('[WebcamTest] Stream recreated in activated()');
                    })
                    .catch(err => {
                        console.error('[WebcamTest] Error recreating stream in activated():', err);
                    });
            } else {
                console.log('[WebcamTest] Stream exists from previous session, reconnecting...');
                if (this.$refs.videoElement) {
                    this.$refs.videoElement.srcObject = this.stream;
                    this.$refs.videoElement.play().catch(err => {
                        console.log('[WebcamTest] Error resuming video in activated():', err);
                    });
                }
            }
        } else if (this.hasActiveStream && this.$refs.videoElement) {
            // Reconnect existing stream to video element if available
            console.log('[WebcamTest] Reconnecting existing stream to video element');
            this.$refs.videoElement.srcObject = this.stream;
            // Ensure video is playing
            this.$refs.videoElement.play().catch(err => {
                console.log('[WebcamTest] Error resuming video in activated():', err);
            });
        } else if (this.hasActiveStream && !this.$refs.videoElement) {
            // Stream exists but video element not ready - wait for it
            console.log(
                '[WebcamTest] Stream exists but video element not ready, will retry via watcher'
            );
        }
    },

    deactivated() {
        console.log('[WebcamTest] deactivated() called');
        // Pause video stream but don't destroy everything
        if (this.$refs.videoElement) {
            console.log('[WebcamTest] Pausing video in deactivated()');
            this.$refs.videoElement.pause();
        }
    },

    beforeUnmount() {
        console.log('[WebcamTest] beforeUnmount() called');
        this.cleanup();
        if (this.skipTimer) clearTimeout(this.skipTimer);
        if (this.skipTimerResourceId !== null) {
            this.memoryManager.untrackResource(this.skipTimerResourceId);
            this.skipTimerResourceId = null;
        }
        // Clean up tracked video event listeners
        this.videoEventResourceIds.forEach(resourceId => {
            if (resourceId !== -1) {
                this.memoryManager.untrackResource(resourceId);
            }
        });
        this.videoEventResourceIds = [];
    },

    watch: {
        // Watch for when stream becomes available to setup camera
        stream: {
            handler(newStream) {
                console.log('[WebcamTest] stream watcher triggered');
                console.log('[WebcamTest] stream value:', newStream);
                console.log('[WebcamTest] hasPermission:', this.hasPermission);
                console.log('[WebcamTest] videoElement ref:', this.$refs.videoElement);

                // Log all state values
                this.logStateValues('stream watcher');

                if (newStream && this.hasPermission) {
                    if (this.$refs.videoElement) {
                        console.log('[WebcamTest] Calling setupCamera() from stream watcher');
                        this.setupCamera();
                    } else {
                        console.log('[WebcamTest] Video element not ready, scheduling retry');
                        // Retry after a short delay to allow DOM to update
                        this.$nextTick(() => {
                            console.log(
                                '[WebcamTest] Retry: videoElement ref:',
                                this.$refs.videoElement
                            );
                            if (this.$refs.videoElement) {
                                console.log('[WebcamTest] Calling setupCamera() from retry');
                                this.setupCamera();
                            } else {
                                console.log(
                                    '[WebcamTest] Retry failed - video element still not available'
                                );
                                // One more retry with longer delay
                                setTimeout(() => {
                                    console.log(
                                        '[WebcamTest] Final retry: videoElement ref:',
                                        this.$refs.videoElement
                                    );
                                    if (this.$refs.videoElement) {
                                        console.log(
                                            '[WebcamTest] Calling setupCamera() from final retry'
                                        );
                                        this.setupCamera();
                                    } else {
                                        console.log(
                                            '[WebcamTest] Final retry failed - video element still not available'
                                        );
                                    }
                                }, 100);
                            }
                        });
                    }
                } else {
                    console.log('[WebcamTest] setupCamera() NOT called - conditions not met');
                    console.log('[WebcamTest] - stream exists:', !!newStream);
                    console.log('[WebcamTest] - hasPermission:', this.hasPermission);
                }
            },
            immediate: true,
        },
    },

    computed: {
        // All standard computed properties are provided by useEnhancedDeviceTest
    },

    methods: {
        // Helper method to log all state values
        logStateValues(source) {
            console.log(`[WebcamTest] State values from ${source}:`);
            console.log(`[WebcamTest] - isLoading: ${this.isLoading}`);
            console.log(`[WebcamTest] - hasError: ${this.hasError}`);
            console.log(`[WebcamTest] - needsPermission: ${this.needsPermission}`);
            console.log(`[WebcamTest] - showNoDevicesState: ${this.showNoDevicesState}`);
            console.log(`[WebcamTest] - hasActiveStream: ${this.hasActiveStream}`);
            console.log(`[WebcamTest] - hasPermission: ${this.hasPermission}`);
            console.log(`[WebcamTest] - hasDevices: ${this.hasDevices}`);
            console.log(`[WebcamTest] - currentState: ${this.currentState}`);
            console.log(
                `[WebcamTest] - blurred class should apply: ${(this.isLoading || this.hasError || this.needsPermission || this.showNoDevicesState) && !this.hasActiveStream}`
            );
        },

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
            if (this.skipTimerResourceId !== null) {
                this.memoryManager.untrackResource(this.skipTimerResourceId);
                this.skipTimerResourceId = null;
            }
            this.skipTimer = setTimeout(() => {
                if (!this.hasDevices) {
                    // Timer completed and no cameras found - handled by composable
                }
            }, 3000);

            // Track the timer with memory management
            try {
                this.skipTimerResourceId = this.memoryManager.trackResource(
                    () => {
                        if (this.skipTimer) {
                            clearTimeout(this.skipTimer);
                            this.skipTimer = null;
                        }
                    },
                    'timeout',
                    'Camera detection timer'
                );
            } catch (error) {
                console.warn(
                    '[WebcamTest] Memory tracking failed for timer - using manual cleanup'
                );
            }
        },

        // Webcam-specific setup method for video element
        setupCamera() {
            console.log('[WebcamTest] setupCamera() called');
            console.log('[WebcamTest] stream:', this.stream);
            console.log('[WebcamTest] videoElement:', this.$refs.videoElement);

            // Log stream track details
            if (this.stream) {
                const videoTracks = this.stream.getVideoTracks();
                console.log('[WebcamTest] Stream video tracks count:', videoTracks.length);
                videoTracks.forEach((track, index) => {
                    console.log(`[WebcamTest] Video track ${index}:`, {
                        label: track.label,
                        enabled: track.enabled,
                        muted: track.muted,
                        readyState: track.readyState,
                        kind: track.kind,
                        id: track.id,
                    });

                    // Log track constraints and settings
                    try {
                        const constraints = track.getConstraints();
                        const settings = track.getSettings();
                        console.log(`[WebcamTest] Video track ${index} constraints:`, constraints);
                        console.log(`[WebcamTest] Video track ${index} settings:`, settings);
                        console.log(`[WebcamTest] Video track ${index} width:`, settings.width);
                        console.log(`[WebcamTest] Video track ${index} height:`, settings.height);
                        console.log(
                            `[WebcamTest] Video track ${index} frameRate:`,
                            settings.frameRate
                        );
                    } catch (e) {
                        console.warn('[WebcamTest] Could not get track constraints/settings:', e);
                    }
                });
            } else {
                console.log('[WebcamTest] No stream available');
            }

            // Log current state values that affect the blurred class
            console.log('[WebcamTest] Current state values:');
            console.log('[WebcamTest] - isLoading:', this.isLoading);
            console.log('[WebcamTest] - hasError:', this.hasError);
            console.log('[WebcamTest] - needsPermission:', this.needsPermission);
            console.log('[WebcamTest] - showNoDevicesState:', this.showNoDevicesState);
            console.log('[WebcamTest] - hasActiveStream:', this.hasActiveStream);
            console.log('[WebcamTest] - hasPermission:', this.hasPermission);
            console.log('[WebcamTest] - hasDevices:', this.hasDevices);

            if (!this.stream || !this.$refs.videoElement) {
                console.warn('[WebcamTest] setupCamera skipped - stream or videoElement missing');
                return;
            }

            const video = this.$refs.videoElement;
            console.log('[WebcamTest] Current video.srcObject:', video.srcObject);
            console.log('[WebcamTest] New stream to assign:', this.stream);
            console.log('[WebcamTest] Video element properties before assignment:');
            console.log('[WebcamTest] - video.width:', video.width);
            console.log('[WebcamTest] - video.height:', video.height);
            console.log('[WebcamTest] - video.videoWidth:', video.videoWidth);
            console.log('[WebcamTest] - video.videoHeight:', video.videoHeight);
            console.log('[WebcamTest] - video.readyState:', video.readyState);
            console.log('[WebcamTest] - video.paused:', video.paused);
            console.log('[WebcamTest] - video.muted:', video.muted);
            console.log('[WebcamTest] - video.autoplay:', video.autoplay);
            console.log('[WebcamTest] - video.playsInline:', video.playsInline);
            console.log('[WebcamTest] - video.classList:', video.classList.toString());
            console.log('[WebcamTest] - video.style.display:', video.style.display);
            console.log('[WebcamTest] - video.style.visibility:', video.style.visibility);
            console.log('[WebcamTest] - video.offsetWidth:', video.offsetWidth);
            console.log('[WebcamTest] - video.offsetHeight:', video.offsetHeight);

            // Check computed styles
            const computedStyle = window.getComputedStyle(video);
            console.log('[WebcamTest] - computed display:', computedStyle.display);
            console.log('[WebcamTest] - computed visibility:', computedStyle.visibility);
            console.log('[WebcamTest] - computed opacity:', computedStyle.opacity);
            console.log('[WebcamTest] - computed filter:', computedStyle.filter);

            // Only set srcObject if it's not already set to this stream
            if (video.srcObject !== this.stream) {
                console.log('[WebcamTest] Assigning stream to video.srcObject');
                video.srcObject = this.stream;
                console.log('[WebcamTest] video.srcObject after assignment:', video.srcObject);
                console.log('[WebcamTest] Video element properties after assignment:');
                console.log('[WebcamTest] - video.videoWidth:', video.videoWidth);
                console.log('[WebcamTest] - video.videoHeight:', video.videoHeight);
                console.log('[WebcamTest] - video.readyState:', video.readyState);
            } else {
                console.log(
                    '[WebcamTest] Stream already assigned to video.srcObject, skipping assignment'
                );
            }

            const onVideoReady = eventType => {
                console.log(`[WebcamTest] Video ${eventType} event fired`);
                console.log('[WebcamTest] video.readyState:', video.readyState);
                console.log('[WebcamTest] video.videoWidth:', video.videoWidth);
                console.log('[WebcamTest] video.videoHeight:', video.videoHeight);
                console.log('[WebcamTest] video.paused:', video.paused);
                console.log('[WebcamTest] video.currentTime:', video.currentTime);
                console.log('[WebcamTest] video.srcObject:', video.srcObject);

                // Check if stream is still valid
                if (video.srcObject) {
                    const tracks = video.srcObject.getTracks();
                    console.log('[WebcamTest] Stream tracks in onVideoReady:', tracks.length);
                    tracks.forEach((track, i) => {
                        console.log(
                            `[WebcamTest] Track ${i}:`,
                            track.kind,
                            'enabled:',
                            track.enabled,
                            'readyState:',
                            track.readyState,
                            'muted:',
                            track.muted
                        );
                    });
                }

                video.play().catch(err => {
                    console.error('[WebcamTest] Error auto-playing video:', err);
                });
            };

            // Use event listeners from composable if available
            if (this.eventListeners) {
                console.log('[WebcamTest] Using composable eventListeners');
                this.eventListeners.addEventListener(video, 'loadedmetadata', () =>
                    onVideoReady('loadedmetadata')
                );
                this.eventListeners.addEventListener(video, 'canplay', () =>
                    onVideoReady('canplay')
                );
                this.eventListeners.addEventListener(video, 'loadeddata', () =>
                    onVideoReady('loadeddata')
                );
            } else {
                console.log('[WebcamTest] Using manual event listeners');
                // Track event listeners for memory management with robust error handling
                const addTrackedListener = (element, event, handler) => {
                    console.log(`[WebcamTest] Adding ${event} listener`);
                    element.addEventListener(event, handler);

                    // Track the resource with memory management
                    try {
                        const resourceId = this.memoryManager.trackResource(
                            () => element.removeEventListener(event, handler),
                            'event',
                            `Video ${event} listener`
                        );
                        this.videoEventResourceIds.push(resourceId);
                    } catch (trackError) {
                        console.warn(
                            '[WebcamTest] Memory tracking failed for',
                            event,
                            '- using manual cleanup'
                        );
                        // Fallback: still add the listener but track manually
                        this.videoEventResourceIds.push(-1);
                    }
                };

                addTrackedListener(video, 'loadedmetadata', () => onVideoReady('loadedmetadata'));
                addTrackedListener(video, 'canplay', () => onVideoReady('canplay'));
                addTrackedListener(video, 'loadeddata', () => onVideoReady('loadeddata'));
            }

            // Force play the video
            console.log('[WebcamTest] Calling video.play()');
            video
                .play()
                .then(() => {
                    console.log('[WebcamTest] video.play() succeeded');
                    console.log('[WebcamTest] video.paused after play():', video.paused);
                    console.log('[WebcamTest] video.readyState after play():', video.readyState);
                    console.log('[WebcamTest] video.videoWidth after play():', video.videoWidth);
                    console.log('[WebcamTest] video.videoHeight after play():', video.videoHeight);
                    this.logStateValues('after play() success');

                    // Start monitoring video frames
                    this.startVideoFrameCheck(video);
                })
                .catch(err => {
                    console.error('[WebcamTest] Error playing video:', err);
                });
        },

        // New method to periodically check if video is actually showing frames
        startVideoFrameCheck(video) {
            console.log('[WebcamTest] Starting video frame check');
            let lastCurrentTime = video.currentTime;
            let checkCount = 0;

            const checkFrame = () => {
                checkCount++;
                const currentTime = video.currentTime;
                const timeDiff = currentTime - lastCurrentTime;

                console.log(`[WebcamTest] Frame check #${checkCount}:`);
                console.log(`[WebcamTest] - currentTime: ${currentTime}`);
                console.log(`[WebcamTest] - timeDiff: ${timeDiff}`);
                console.log(`[WebcamTest] - videoWidth: ${video.videoWidth}`);
                console.log(`[WebcamTest] - videoHeight: ${video.videoHeight}`);
                console.log(`[WebcamTest] - readyState: ${video.readyState}`);
                console.log(`[WebcamTest] - paused: ${video.paused}`);
                console.log(`[WebcamTest] - ended: ${video.ended}`);
                console.log(`[WebcamTest] - networkState: ${video.networkState}`);

                if (video.srcObject) {
                    const tracks = video.srcObject.getVideoTracks();
                    tracks.forEach((track, i) => {
                        console.log(
                            `[WebcamTest] Track ${i} - enabled: ${track.enabled}, muted: ${track.muted}, readyState: ${track.readyState}`
                        );
                    });
                }

                if (timeDiff > 0) {
                    console.log('[WebcamTest] ✓ Video is playing - time is advancing');
                } else if (checkCount > 3) {
                    console.log('[WebcamTest] ✗ Video appears stuck - time not advancing');
                }

                lastCurrentTime = currentTime;

                if (checkCount < 10) {
                    setTimeout(checkFrame, 1000);
                }
            };

            setTimeout(checkFrame, 1000);
        },

        // Force recreate stream with proper resolution constraints
        async forceRecreateStream() {
            console.log(
                '[WebcamTest] forceRecreateStream() called - stopping current stream and creating new one with proper constraints'
            );

            // Stop current stream
            if (this.stream) {
                console.log('[WebcamTest] Stopping current stream');
                this.stream.getTracks().forEach(track => {
                    console.log('[WebcamTest] Stopping track:', track.label);
                    track.stop();
                });
            }

            // Clear video element
            if (this.$refs.videoElement) {
                console.log('[WebcamTest] Clearing video element srcObject');
                this.$refs.videoElement.srcObject = null;
            }

            // Force recreate with high resolution constraints
            console.log('[WebcamTest] Creating new stream with high resolution constraints');
            try {
                const constraints = {
                    video: {
                        width: { min: 640, ideal: 1920 },
                        height: { min: 480, ideal: 1080 },
                    },
                };
                console.log('[WebcamTest] Using constraints:', constraints);

                const newStream = await navigator.mediaDevices.getUserMedia(constraints);
                console.log('[WebcamTest] Got new stream:', newStream);

                // Log track details
                const videoTracks = newStream.getVideoTracks();
                videoTracks.forEach((track, i) => {
                    const settings = track.getSettings();
                    console.log(
                        `[WebcamTest] New track ${i}: ${settings.width}x${settings.height}`
                    );
                });

                // Update the stream in the composable
                this.stream = newStream;

                // Assign to video element
                if (this.$refs.videoElement) {
                    console.log('[WebcamTest] Assigning new stream to video element');
                    this.$refs.videoElement.srcObject = newStream;
                    await this.$refs.videoElement.play();
                    console.log('[WebcamTest] Video playing with new stream');
                    console.log(
                        '[WebcamTest] Video dimensions:',
                        this.$refs.videoElement.videoWidth,
                        'x',
                        this.$refs.videoElement.videoHeight
                    );
                }
            } catch (err) {
                console.error('[WebcamTest] Error recreating stream:', err);
            }
        },

        // Test completion methods
        startOver() {
            this.snapshotTaken = false;
            this.skipped = false;
            if (this.skipTimer) clearTimeout(this.skipTimer);
            if (this.skipTimerResourceId !== null) {
                this.memoryManager.untrackResource(this.skipTimerResourceId);
                this.skipTimerResourceId = null;
            }
            this.resetTest();
        },
    },
};
</script>

<template>
    <div class="webcam-test-container">
        <!-- Debug state info (visible for debugging) -->
        <div
            class="debug-info"
            style="
                position: absolute;
                top: 0;
                left: 0;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 10px;
                z-index: 9999;
                font-size: 12px;
            "
        >
            <p><strong>Debug Info:</strong></p>
            <p>isLoading: {{ isLoading }}</p>
            <p>hasError: {{ hasError }}</p>
            <p>needsPermission: {{ needsPermission }}</p>
            <p>showNoDevicesState: {{ showNoDevicesState }}</p>
            <p>hasPermission: {{ hasPermission }}</p>
            <p>hasActiveStream: {{ hasActiveStream }}</p>
            <p>stream: {{ !!stream }}</p>
            <p>
                blurred:
                {{
                    (isLoading || hasError || needsPermission || showNoDevicesState) &&
                    !hasActiveStream
                }}
            </p>
        </div>

        <!-- Always show video wrapper with overlay states -->
        <div class="video-wrapper">
            <video
                ref="videoElement"
                autoplay
                muted
                playsinline
                class="camera-preview"
                :class="{
                    blurred:
                        (isLoading || hasError || needsPermission || showNoDevicesState) &&
                        !hasActiveStream,
                }"
                :aria-label="$t('device_testing.webcam.camera_preview')"
                :title="$t('device_testing.webcam.live_feed')"
                @loadedmetadata="console.log('[WebcamTest] Video loadedmetadata event fired')"
                @canplay="console.log('[WebcamTest] Video canplay event fired')"
                @loadeddata="console.log('[WebcamTest] Video loadeddata event fired')"
                @play="console.log('[WebcamTest] Video play event fired')"
                @error="console.log('[WebcamTest] Video error event fired', $event)"
            ></video>

            <!-- State Panel Overlays inside video -->
            <div v-if="showNoDevicesState" class="video-overlay">
                <StatePanel
                    state="error"
                    :title="$t('errors.device.camera_not_found')"
                    :message="$t('errors.device.camera_not_connected')"
                    :showRetryButton="true"
                    @retry="resetTest"
                />
            </div>

            <div v-else-if="isLoading" class="video-overlay">
                <StatePanel
                    state="loading"
                    :title="$t('device_testing.detection.detecting_cameras')"
                    :message="
                        $t('device_testing.detection.please_wait_search', { deviceType: 'cameras' })
                    "
                />
            </div>

            <div v-else-if="needsPermission" class="video-overlay">
                <StatePanel
                    state="info"
                    :title="$t('device_testing.permission.camera_required')"
                    :message="$t('device_testing.permission.camera_grant_access')"
                    :showActionButton="true"
                    :actionLabel="$t('device_testing.permission.camera_grant_button')"
                    @action-clicked="requestPermission"
                />
            </div>

            <div v-else-if="permissionBlocked" class="video-overlay">
                <StatePanel
                    state="error"
                    :title="$t('errors.permission.camera_denied')"
                    :message="$t('errors.permission.camera_enable_settings')"
                    :showRetryButton="true"
                    :retryLabel="$t('buttons.retry')"
                    @retry="requestPermission"
                />
            </div>

            <div v-else-if="hasError" class="video-overlay">
                <StatePanel
                    state="error"
                    :title="$t('errors.device.camera_error')"
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
            :label="$t('tests.webcam.shortName')"
            :deviceType="$t('tests.webcam.name')"
            :disabled="isLoading"
            @device-changed="switchDevice"
        />

        <!-- Force recreate stream button for debugging -->
        <div style="margin-top: 10px; padding: 10px; background: #f0f0f0; border-radius: 4px">
            <button
                @click="forceRecreateStream"
                style="
                    padding: 8px 16px;
                    background: #2196f3;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                "
            >
                Force Recreate Stream (Fix Low Resolution)
            </button>
            <p style="margin-top: 8px; font-size: 12px; color: #666">
                Current videoWidth: <strong>{{ currentVideoWidth }}</strong
                >px (should be > 300)
            </p>
        </div>

        <!-- Browser Compatibility Warnings -->
        <div v-if="showCompatibilityWarnings" class="compatibility-warnings">
            <div class="warning-header">
                <h4>{{ $t('errors.browser.compatibility_notice') }}</h4>
            </div>
            <ul class="warning-list">
                <li v-for="warning in compatibilityWarnings" :key="warning" class="warning-item">
                    {{ warning }}
                </li>
            </ul>
            <div v-if="recommendedBrowser" class="recommendation">
                <strong>{{
                    $t('errors.browser.recommendation', { browser: recommendedBrowser })
                }}</strong>
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
