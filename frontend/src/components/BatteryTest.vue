<script>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import StatePanel from './StatePanel.vue';
import { useTestResults } from '../composables/useTestResults';
import { useComponentLifecycle } from '../composables/useComponentLifecycle';
import { useGlobalReset } from '../composables/useTestState';
import { useErrorHandling } from '../composables/useErrorHandling';
import { useBatteryCompatibility } from '../composables/useBatteryCompatibility';

export default {
    name: 'BatteryTest',
    components: {
        StatePanel,
    },
    emits: ['test-completed', 'test-failed', 'test-skipped', 'start-over'],
    setup(props, { emit }) {
        // Initialize composables for normalized patterns
        const testResults = useTestResults('battery', emit);
        const lifecycle = useComponentLifecycle();
        const errorHandling = useErrorHandling();
        const batteryCompat = useBatteryCompatibility();

        // Reactive state
        const batterySupported = ref(false);
        const batteryManager = ref(null);
        const isCharging = ref(false);
        const batteryLevel = ref(0);
        const testPhase = ref('initial');
        const initialDelay = ref(2);
        const testCompleted = ref(false);
        const actionsDisabled = ref(false);

        // Debug computed property
        const debugInfo = computed(() => ({
            batterySupported: batterySupported.value,
            testPhase: testPhase.value,
            shouldShowError: !batterySupported.value,
            shouldShowSuccess: batterySupported.value && testPhase.value === 'complete',
            shouldShowTest: batterySupported.value && testPhase.value !== 'complete',
        }));

        // Watch for changes in battery support
        watch(
            batterySupported,
            (_newVal, _oldVal) => {
                // Battery support status changed
            },
            { immediate: true }
        );

        watch(testPhase, (_newVal, _oldVal) => {
            // Test phase changed
        });

        // Methods
        const setupBatteryListeners = () => {
            if (!batteryManager.value) return;
            batteryManager.value.addEventListener('chargingchange', updateBatteryStatus);
            batteryManager.value.addEventListener('levelchange', updateBatteryStatus);
        };

        const updateBatteryStatus = () => {
            if (!batteryManager.value) return;
            isCharging.value = batteryManager.value.charging;
            batteryLevel.value = Math.round(batteryManager.value.level * 100);
        };

        const waitForUnplug = () => {
            if (!batteryManager.value) return;
            // Listen for unplug event
            const onUnplug = () => {
                if (!batteryManager.value.charging) {
                    batteryManager.value.removeEventListener('chargingchange', onUnplug);
                    testPhase.value = 'waitAfterUnplug';
                    // Remove automatic completion - let user manually complete
                }
            };
            batteryManager.value.addEventListener('chargingchange', onUnplug);
        };

        const clearTimer = () => {
            // Timer functionality removed - manual completion only
        };

        const completeTest = () => {
            if (testCompleted.value) {
                return;
            }
            testPhase.value = 'complete';
            testResults.completeTest();
            testCompleted.value = true;
            cleanup();
        };

        const failTest = (reason = '') => {
            console.error('Battery test failed:', reason);
            testResults.failTest(reason);
            testCompleted.value = true;
            cleanup();
        };

        const skipTest = () => {
            if (testCompleted.value) {
                return;
            }
            testResults.skipTest();
            testCompleted.value = true;
            cleanup();
        };

        const cleanup = () => {
            clearTimer();
            if (batteryManager.value) {
                batteryManager.value.removeEventListener('chargingchange', updateBatteryStatus);
                batteryManager.value.removeEventListener('levelchange', updateBatteryStatus);
            }
            // Use the composable's cleanup method
            batteryCompat.cleanup();
        };

        const initializeBatteryTest = async () => {
            try {
                // Use the compatibility layer's initBattery method
                await batteryCompat.initBattery();

                if (batteryCompat.isSupported) {
                    batterySupported.value = true;
                    batteryManager.value = batteryCompat.batteryInfo;

                    if (batteryManager.value) {
                        setupBatteryListeners();
                        updateBatteryStatus();

                        // Start test timing when battery test is ready
                        if (testResults && testResults.testStatus === 'pending') {
                            testResults.startTest();
                        }

                        isCharging.value = batteryManager.value.charging;

                        if (!isCharging.value) {
                            // Not charging: show ready state, let user manually complete
                            testPhase.value = 'ready';
                            return;
                        } else {
                            // Charging: prompt to unplug
                            testPhase.value = 'unplug';
                            waitForUnplug();
                        }
                    } else {
                        console.error('BatteryTest: Battery manager is null');
                        throw new Error('Battery manager not available');
                    }
                } else {
                    console.warn('BatteryTest: Battery API not supported in this browser');
                    batterySupported.value = false;

                    // Set a user-friendly error message based on browser detection
                    let errorMessage = 'Battery API not supported in this browser.';

                    if (batteryCompat.browserName === 'Firefox') {
                        errorMessage = 'Battery API was removed from Firefox for privacy reasons.';
                    } else if (batteryCompat.browserName === 'Safari') {
                        errorMessage = 'Battery API is not supported in Safari.';
                    } else if (batteryCompat.browserName === 'Edge') {
                        errorMessage = 'Battery API requires a newer version of Edge.';
                    }

                    // Show compatibility warning if available
                    if (batteryCompat.compatibilityWarning) {
                        errorMessage = batteryCompat.compatibilityWarning;
                    }

                    errorHandling.setError(errorMessage);
                }
            } catch (error) {
                console.error('Battery API error:', error);
                errorHandling.setError(`Battery API error: ${error.message}`);
                batterySupported.value = false;
                cleanup();
            }
        };

        const resetTest = () => {
            cleanup();
            testCompleted.value = false;
            testPhase.value = 'initializing';
            testResults.resetTest();
            // Restart the initialization
            nextTick(() => {
                initializeBatteryTest();
            });
        };

        // Watch for global resets
        useGlobalReset(resetTest);

        // Lifecycle hooks using composables
        onMounted(() => {
            lifecycle.initialize(async () => {
                await initializeBatteryTest();
            });
        });

        onUnmounted(() => {
            lifecycle.cleanup(() => {
                cleanup();
            });
        });

        return {
            // State
            batterySupported,
            isCharging,
            batteryLevel,
            testPhase,
            initialDelay,
            testCompleted,
            actionsDisabled,
            debugInfo,

            // Methods
            completeTest,
            failTest,
            skipTest,
            resetTest,

            // Compatibility info
            batteryCompat,
        };
    },
};
</script>

<template>
    <!-- Error state: Battery API not supported -->
    <StatePanel
        v-if="!batterySupported"
        state="error"
        :title="$t('errors.device.battery_not_supported')"
        :message="$t('errors.device.browser_not_support_battery')"
    />

    <!-- Battery API is supported - show test UI or completion -->
    <template v-else>
        <!-- Completion state: show StatePanel with animated icon -->
        <StatePanel
            v-if="testPhase === 'complete'"
            state="success"
            :title="$t('messages.success.testPassed')"
            :message="$t('tests.battery.completionMessage')"
        >
            <template #icon>
                <div class="animated-checkmark">
                    <svg width="48" height="48" viewBox="0 0 48 48">
                        <circle
                            cx="24"
                            cy="24"
                            r="20"
                            fill="none"
                            stroke="#4ade80"
                            stroke-width="3"
                            class="checkmark-circle"
                        />
                        <path
                            d="M14 24l8 8 16-16"
                            fill="none"
                            stroke="#4ade80"
                            stroke-width="3"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="checkmark-path"
                        />
                    </svg>
                </div>
            </template>
        </StatePanel>

        <!-- Ready state: show battery test UI -->
        <template v-else>
            <!-- Battery Status Display -->
            <div class="battery-status" :class="{ charging: isCharging }">
                <div class="battery-icon">
                    <div class="battery-level" :style="{ width: batteryLevel + '%' }"></div>
                    <div v-if="isCharging" class="charging-bolt">⚡</div>
                </div>
                <div class="battery-details">
                    <div class="battery-info-row">
                        <span class="battery-label">{{ $t('battery.chargeLabel') }}</span>
                        <span class="battery-value">{{ batteryLevel }}%</span>
                    </div>
                    <div class="battery-info-row">
                        <span class="battery-label">{{ $t('battery.statusLabel') }}</span>
                        <span class="battery-value" :class="{ 'charging-text': isCharging }">
                            {{ isCharging ? $t('battery.charging') : $t('battery.notCharging') }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Test Instructions -->
            <div class="test-instructions">
                <div v-if="testPhase === 'initial'" class="instruction-step">
                    <h3>{{ $t('battery.step1.title') }}</h3>
                    <p>{{ $t('battery.step1.description') }}</p>
                    <div class="timer" v-if="isCharging">
                        {{ $t('battery.startingTest', { seconds: initialDelay }) }}
                    </div>
                </div>
                <div v-else-if="testPhase === 'unplug'" class="instruction-step">
                    <h3>{{ $t('battery.step2.title') }}</h3>
                    <p>{{ $t('battery.step2.description') }}</p>
                </div>
                <div v-else-if="testPhase === 'waitAfterUnplug'" class="instruction-step">
                    <h3>{{ $t('battery.step3.title') }}</h3>
                    <p>{{ $t('battery.step3.description') }}</p>
                </div>
                <div v-else-if="testPhase === 'ready'" class="instruction-step">
                    <h3>{{ $t('battery.ready.title') }}</h3>
                    <p>{{ $t('battery.ready.description') }}</p>
                </div>
            </div>
        </template>
    </template>
</template>

<style scoped>
.battery-status {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: var(--spacing-3xl);
    padding: var(--spacing-xl);
    background: var(--surface-secondary);
    border-radius: var(--border-radius-medium);
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-small);
}

.battery-icon {
    width: 80px;
    height: 40px;
    border: 2px solid var(--border-color);
    border-radius: var(--border-radius-small);
    position: relative;
    padding: 3px;
    background: var(--surface-tertiary);
}

.battery-icon:after {
    content: '';
    position: absolute;
    right: -8px;
    top: 50%;
    transform: translateY(-50%);
    width: 6px;
    height: 16px;
    background: var(--border-color);
    border-radius: 0 3px 3px 0;
}

.battery-level {
    height: 100%;
    background: var(--success-color);
    border-radius: 2px;
    transition: var(--transition-default);
}

.charging .battery-level {
    background: var(--warning-color);
}

.charging-bolt {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 18px;
    color: #fff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.battery-details {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: var(--spacing-xl);
    width: 100%;
    padding-left: var(--spacing-xl);
    margin-left: var(--spacing-xl);
    border-left: 1px solid var(--border-color-light);
}

.battery-info-row {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
    text-align: center;
}

.battery-label {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.battery-value {
    color: var(--text-primary);
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
}

.battery-value.charging-text {
    color: var(--warning-color);
}

.test-instructions {
    padding: var(--spacing-lg);
    background: var(--background-light);
    border-radius: var(--border-radius);
    border: 1px solid var(--border-color);
}

.instruction-step {
    text-align: center;
}

.instruction-step h3 {
    color: var(--text-muted);
    margin: 0 0 var(--spacing-md);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
}

.instruction-step p {
    color: var(--text-tertiary);
    margin: 0 0 var(--spacing-md);
    font-size: var(--font-size-base);
}

.timer {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: #ff9800;
}

.success h3 {
    color: var(--success-color);
}

.complete-test-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background-color: var(--success-color);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-top: 1rem;
}

.complete-test-button:hover {
    background-color: var(--success-color-dark, #16a34a);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.complete-test-button:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(34, 197, 94, 0.2);
}

.animated-checkmark {
    display: flex;
    align-items: center;
    justify-content: center;
}

.animated-checkmark svg {
    width: 48px;
    height: 48px;
}

.checkmark-circle {
    stroke-dasharray: 126;
    stroke-dashoffset: 126;
    animation: circle-animation var(--animation-extra-slow) ease-in-out forwards;
}

.checkmark-path {
    stroke-dasharray: 24;
    stroke-dashoffset: 24;
    animation: checkmark-animation var(--animation-slower) ease-in-out var(--animation-extra-slow)
        forwards;
}

@keyframes circle-animation {
    to {
        stroke-dashoffset: 0;
    }
}

@keyframes checkmark-animation {
    to {
        stroke-dashoffset: 0;
    }
}
</style>
