<script lang="ts">
import { defineComponent, ref, computed, watch, nextTick } from 'vue';
import StatePanel from './StatePanel.vue';
import DeviceSelector from './DeviceSelector.vue';
import { useMediaDeviceTest } from '../composables/extensions/useMediaDeviceTest';
import { CameraIcon, CheckIcon } from '../composables/useIcons';
import { useI18n } from 'vue-i18n';
import { useMemoryManagement } from '../composables/useMemoryManagement';

export default defineComponent({
    name: 'WebcamTest',
    components: {
        StatePanel,
        DeviceSelector,
        CameraIcon,
        CheckIcon,
    },
    emits: ['test-completed', 'test-failed', 'test-skipped', 'start-over'],

    setup(props, { emit }) {
        void props;
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

        // Template refs
        const videoElement = ref<HTMLVideoElement | null>(null);
        const snapshotCanvas = ref<HTMLCanvasElement | null>(null);

        // Component state (from data)
        const snapshotTaken = ref(false);
        const skipTimer = ref<ReturnType<typeof setTimeout> | null>(null);
        const skipped = ref(false);
        const skipTimerResourceId = ref<number | null>(null);
        const videoEventResourceIds = ref<number[]>([]);
        const videoWidthDisplay = ref(0);

        // Computed (from computed: currentVideoWidth)
        const currentVideoWidth = computed(() => videoWidthDisplay.value);

        // Compatibility warnings (from existing computed)
        const webrtcCompat = computed(
            () => deviceTest.mediaStream.webrtcCompat || deviceTest.deviceEnumeration?.webrtcCompat
        );
        const compatibilityWarnings = computed(() => {
            const compat = webrtcCompat.value;
            if (!compat) return [];
            const info = compat.getBrowserInfo();
            return info.warnings || [];
        });
        const recommendedBrowser = computed(() => {
            const compat = webrtcCompat.value;
            if (!compat) return null;
            return compat.getBrowserInfo().recommendedBrowser;
        });
        const showCompatibilityWarnings = computed(() => compatibilityWarnings.value.length > 0);

        // Methods

        function logStateValues(source: string) {
            console.log(`[WebcamTest] State values from ${source}:`);
            console.log(`[WebcamTest] - isLoading: ${deviceTest.isLoading.value}`);
            console.log(`[WebcamTest] - hasError: ${deviceTest.hasError.value}`);
            console.log(`[WebcamTest] - needsPermission: ${deviceTest.needsPermission.value}`);
            console.log(
                `[WebcamTest] - showNoDevicesState: ${deviceTest.showNoDevicesState.value}`
            );
            console.log(`[WebcamTest] - hasActiveStream: ${deviceTest.hasActiveStream.value}`);
            console.log(`[WebcamTest] - hasPermission: ${deviceTest.hasPermission.value}`);
            console.log(`[WebcamTest] - hasDevices: ${deviceTest.hasDevices.value}`);
            console.log(`[WebcamTest] - currentState: ${deviceTest.currentState.value}`);
            console.log(
                `[WebcamTest] - blurred class should apply: ${(deviceTest.isLoading.value || deviceTest.hasError.value || deviceTest.needsPermission.value || deviceTest.showNoDevicesState.value) && !deviceTest.hasActiveStream.value}`
            );
            updateVideoWidth();
        }

        function updateVideoWidth() {
            if (videoElement.value) {
                videoWidthDisplay.value = videoElement.value.videoWidth;
            } else {
                videoWidthDisplay.value = 0;
            }
        }

        function takeSnapshot() {
            if (!videoElement.value || !snapshotCanvas.value) return;
            const video = videoElement.value;
            const canvas = snapshotCanvas.value;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            snapshotTaken.value = true;
        }

        function startCameraDetectTimer() {
            if (skipTimer.value) clearTimeout(skipTimer.value as any);
            if (skipTimerResourceId.value !== null) {
                memoryManager.untrackResource(skipTimerResourceId.value);
                skipTimerResourceId.value = null;
            }
            skipTimer.value = setTimeout(() => {
                if (!deviceTest.hasDevices.value) {
                    // Timer completed and no cameras found - handled by composable
                }
            }, 3000) as any;

            try {
                skipTimerResourceId.value = memoryManager.trackResource(
                    () => {
                        if (skipTimer.value) {
                            clearTimeout(skipTimer.value as any);
                            skipTimer.value = null;
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
        }

        function setupCamera() {
            console.log('[WebcamTest] setupCamera() called');
            console.log('[WebcamTest] stream:', deviceTest.stream.value);
            console.log('[WebcamTest] videoElement:', videoElement.value);

            if (deviceTest.stream.value) {
                const stream = deviceTest.stream.value as MediaStream;
                const videoTracks = stream.getVideoTracks();
                console.log('[WebcamTest] Stream video tracks count:', videoTracks.length);
                videoTracks.forEach((track: MediaStreamTrack, index: number) => {
                    console.log(`[WebcamTest] Video track ${index}:`, {
                        label: track.label,
                        enabled: track.enabled,
                        muted: track.muted,
                        readyState: track.readyState,
                        kind: track.kind,
                        id: track.id,
                    });
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

            console.log('[WebcamTest] Current state values:');
            console.log('[WebcamTest] - isLoading:', deviceTest.isLoading.value);
            console.log('[WebcamTest] - hasError:', deviceTest.hasError.value);
            console.log('[WebcamTest] - needsPermission:', deviceTest.needsPermission.value);
            console.log('[WebcamTest] - showNoDevicesState:', deviceTest.showNoDevicesState.value);
            console.log('[WebcamTest] - hasActiveStream:', deviceTest.hasActiveStream.value);
            console.log('[WebcamTest] - hasPermission:', deviceTest.hasPermission.value);
            console.log('[WebcamTest] - hasDevices:', deviceTest.hasDevices.value);

            if (!deviceTest.stream.value || !videoElement.value) {
                console.warn('[WebcamTest] setupCamera skipped - stream or videoElement missing');
                return;
            }

            const video = videoElement.value;
            console.log('[WebcamTest] Current video.srcObject:', video.srcObject);
            console.log('[WebcamTest] New stream to assign:', deviceTest.stream.value);
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

            const computedStyle = window.getComputedStyle(video);
            console.log('[WebcamTest] - computed display:', computedStyle.display);
            console.log('[WebcamTest] - computed visibility:', computedStyle.visibility);
            console.log('[WebcamTest] - computed opacity:', computedStyle.opacity);
            console.log('[WebcamTest] - computed filter:', computedStyle.filter);

            if (video.srcObject !== deviceTest.stream.value) {
                console.log('[WebcamTest] Assigning stream to video.srcObject');
                video.srcObject = deviceTest.stream.value;
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

            const onVideoReady = (eventType: string) => {
                console.log(`[WebcamTest] Video ${eventType} event fired`);
                console.log('[WebcamTest] video.readyState:', video.readyState);
                console.log('[WebcamTest] video.videoWidth:', video.videoWidth);
                console.log('[WebcamTest] video.videoHeight:', video.videoHeight);
                console.log('[WebcamTest] video.paused:', video.paused);
                console.log('[WebcamTest] video.currentTime:', video.currentTime);
                console.log('[WebcamTest] video.srcObject:', video.srcObject);

                if (video.srcObject) {
                    const mediaStream = video.srcObject as MediaStream;
                    const tracks = mediaStream.getTracks();
                    console.log('[WebcamTest] Stream tracks in onVideoReady:', tracks.length);
                    tracks.forEach((track: MediaStreamTrack, i: number) => {
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

            // Use manual event listeners with memory tracking
            const addTrackedListener = (
                element: HTMLElement,
                event: string,
                handler: EventListener
            ) => {
                console.log(`[WebcamTest] Adding ${event} listener`);
                element.addEventListener(event, handler);
                try {
                    const resourceId = memoryManager.trackResource(
                        () => element.removeEventListener(event, handler),
                        'event',
                        `Video ${event} listener`
                    );
                    videoEventResourceIds.value.push(resourceId);
                } catch (trackError) {
                    console.warn(
                        '[WebcamTest] Memory tracking failed for',
                        event,
                        '- using manual cleanup'
                    );
                    videoEventResourceIds.value.push(-1);
                }
            };
            addTrackedListener(video, 'loadedmetadata', () => onVideoReady('loadedmetadata'));
            addTrackedListener(video, 'canplay', () => onVideoReady('canplay'));
            addTrackedListener(video, 'loadeddata', () => onVideoReady('loadeddata'));

            console.log('[WebcamTest] Calling video.play()');
            video
                .play()
                .then(() => {
                    console.log('[WebcamTest] video.play() succeeded');
                    console.log('[WebcamTest] video.paused after play():', video.paused);
                    console.log('[WebcamTest] video.readyState after play():', video.readyState);
                    console.log('[WebcamTest] video.videoWidth after play():', video.videoWidth);
                    console.log('[WebcamTest] video.videoHeight after play():', video.videoHeight);
                    logStateValues('after play() success');
                    startVideoFrameCheck(video);
                })
                .catch(err => {
                    console.error('[WebcamTest] Error playing video:', err);
                });
        }

        function startVideoFrameCheck(video: HTMLVideoElement) {
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
                console.log(`[WebcamTest] - readyState:`, video.readyState);
                console.log(`[WebcamTest] - paused:`, video.paused);
                console.log(`[WebcamTest] - ended:`, video.ended);
                console.log(`[WebcamTest] - networkState:`, video.networkState);

                if (video.srcObject) {
                    const mediaStream = video.srcObject as MediaStream;
                    const tracks = mediaStream.getVideoTracks();
                    tracks.forEach((track: MediaStreamTrack, i: number) => {
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
        }

        async function forceRecreateStream() {
            console.log(
                '[WebcamTest] forceRecreateStream() called - stopping current stream and creating new one with proper constraints'
            );

            if (deviceTest.stream.value) {
                console.log('[WebcamTest] Stopping current stream');
                const stream = deviceTest.stream.value as MediaStream;
                stream.getTracks().forEach((track: MediaStreamTrack) => {
                    console.log('[WebcamTest] Stopping track:', track.label);
                    track.stop();
                });
            }

            if (videoElement.value) {
                console.log('[WebcamTest] Clearing video element srcObject');
                videoElement.value.srcObject = null;
            }

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

                const videoTracks = newStream.getVideoTracks();
                videoTracks.forEach((track, i) => {
                    const settings = track.getSettings();
                    console.log(
                        `[WebcamTest] New track ${i}: ${settings.width}x${settings.height}`
                    );
                });

                // Update the stream in the composable
                deviceTest.stream.value = newStream;

                if (videoElement.value) {
                    console.log('[WebcamTest] Assigning new stream to video element');
                    videoElement.value.srcObject = newStream;
                    await videoElement.value.play();
                    console.log('[WebcamTest] Video playing with new stream');
                    console.log(
                        '[WebcamTest] Video dimensions:',
                        videoElement.value.videoWidth,
                        'x',
                        videoElement.value.videoHeight
                    );
                }
            } catch (err) {
                console.error('[WebcamTest] Error recreating stream:', err);
            }
        }

        function startOver() {
            snapshotTaken.value = false;
            skipped.value = false;
            if (skipTimer.value) clearTimeout(skipTimer.value as any);
            if (skipTimerResourceId.value !== null) {
                memoryManager.untrackResource(skipTimerResourceId.value);
                skipTimerResourceId.value = null;
            }
            deviceTest.resetTest();
        }

        // Stream watcher
        watch(
            () => deviceTest.stream.value,
            async newStream => {
                console.log('[WebcamTest] stream watcher triggered');
                console.log('[WebcamTest] stream value:', newStream);
                console.log('[WebcamTest] hasPermission:', deviceTest.hasPermission.value);
                console.log('[WebcamTest] videoElement ref:', videoElement.value);

                await nextTick();
                updateVideoWidth();
                logStateValues('stream watcher');

                if (newStream && deviceTest.hasPermission.value) {
                    if (videoElement.value) {
                        console.log('[WebcamTest] Calling setupCamera() from stream watcher');
                        setupCamera();
                    } else {
                        console.log('[WebcamTest] Video element not ready, scheduling retry');
                        await nextTick();
                        console.log('[WebcamTest] Retry: videoElement ref:', videoElement.value);
                        if (videoElement.value) {
                            console.log('[WebcamTest] Calling setupCamera() from retry');
                            setupCamera();
                        } else {
                            console.log(
                                '[WebcamTest] Retry failed - video element still not available'
                            );
                            setTimeout(() => {
                                console.log(
                                    '[WebcamTest] Final retry: videoElement ref:',
                                    videoElement.value
                                );
                                if (videoElement.value) {
                                    console.log(
                                        '[WebcamTest] Calling setupCamera() from final retry'
                                    );
                                    setupCamera();
                                } else {
                                    console.log(
                                        '[WebcamTest] Final retry failed - video element still not available'
                                    );
                                }
                            }, 100);
                        }
                    }
                } else {
                    console.log('[WebcamTest] setupCamera() NOT called - conditions not met');
                    console.log('[WebcamTest] - stream exists:', !!newStream);
                    console.log('[WebcamTest] - hasPermission:', deviceTest.hasPermission.value);
                }
            },
            { immediate: true }
        );

        return {
            // Spread deviceTest properties and methods
            ...deviceTest,
            // Computed
            compatibilityWarnings,
            recommendedBrowser,
            showCompatibilityWarnings,
            currentVideoWidth,
            // Memory manager
            memoryManager,
            // Refs (for template)
            videoElement,
            snapshotCanvas,
            // State
            snapshotTaken,
            skipTimer,
            skipped,
            skipTimerResourceId,
            videoEventResourceIds,
            videoWidthDisplay,
            // Methods
            logStateValues,
            updateVideoWidth,
            takeSnapshot,
            startCameraDetectTimer,
            setupCamera,
            startVideoFrameCheck,
            forceRecreateStream,
            startOver,
        };
    },
});
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
                    :message="currentError || ''"
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
