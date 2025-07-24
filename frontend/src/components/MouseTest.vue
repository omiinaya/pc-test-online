<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { useTestResults } from '../composables/useTestResults.js';
import { useComponentLifecycle } from '../composables/useComponentLifecycle.js';
import { usePointerEvents } from '../composables/useEventListeners.js';
import { useGlobalReset } from '../composables/useTestState.js';

export default {
    name: 'MouseTest',
    components: {},
    emits: ['test-completed', 'test-failed', 'test-skipped', 'start-over'],
    setup(props, { emit }) {
        // Initialize composables for normalized patterns
        const testResults = useTestResults('mouse', emit);
        const lifecycle = useComponentLifecycle();
        const pointerEvents = usePointerEvents();

        // Reactive state
        const leftPressed = ref(false);
        const rightPressed = ref(false);
        const middlePressed = ref(false);
        const scrollActive = ref(false);
        const leftTested = ref(false);
        const rightTested = ref(false);
        const middleTested = ref(false);
        const scrollTested = ref(false);
        const leftReleasing = ref(false);
        const rightReleasing = ref(false);
        const middleReleasing = ref(false);
        const scrollTimeout = ref(null);
        const testCompleted = ref(false);
        const scrollDirection = ref(null); // 'up', 'down', or null
        const middleClicked = ref(false);

        // Methods
        const handleMouseDown = e => {
            e.preventDefault();

            // Start test timing on first mouse interaction
            if (testResults && testResults.testStatus === 'pending') {
                testResults.startTest();
            }

            switch (e.button) {
                case 0: // Left click
                    leftReleasing.value = false;
                    leftPressed.value = true;
                    leftTested.value = true;
                    break;
                case 1: // Middle click
                    middleReleasing.value = false;
                    middlePressed.value = true;
                    middleTested.value = true;
                    middleClicked.value = true;
                    setTimeout(() => {
                        middleClicked.value = false;
                    }, 300);
                    break;
                case 2: // Right click
                    rightReleasing.value = false;
                    rightPressed.value = true;
                    rightTested.value = true;
                    break;
            }
        };

        const handleMouseUp = e => {
            switch (e.button) {
                case 0:
                    leftPressed.value = false;
                    leftReleasing.value = true;
                    setTimeout(() => {
                        leftReleasing.value = false;
                    }, 150);
                    break;
                case 1:
                    middlePressed.value = false;
                    middleReleasing.value = true;
                    setTimeout(() => {
                        middleReleasing.value = false;
                    }, 150);
                    break;
                case 2:
                    rightPressed.value = false;
                    rightReleasing.value = true;
                    setTimeout(() => {
                        rightReleasing.value = false;
                    }, 150);
                    break;
            }
        };

        const handleContextMenu = e => {
            e.preventDefault();
        };

        const handleWheel = e => {
            scrollActive.value = true;
            scrollTested.value = true;
            if (e.deltaY < 0) {
                scrollDirection.value = 'up';
            } else if (e.deltaY > 0) {
                scrollDirection.value = 'down';
            }
            clearTimeout(scrollTimeout.value);
            scrollTimeout.value = setTimeout(() => {
                scrollActive.value = false;
                scrollDirection.value = null;
            }, 300);
        };

        const handleAuxClick = e => {
            if (e.button === 1) {
                middleClicked.value = true;
                setTimeout(() => {
                    middleClicked.value = false;
                }, 300);
            }
        };

        const resetTest = () => {
            leftPressed.value = false;
            rightPressed.value = false;
            middlePressed.value = false;
            scrollActive.value = false;
            leftTested.value = false;
            rightTested.value = false;
            middleTested.value = false;
            scrollTested.value = false;
            testCompleted.value = false;
            testResults.resetTest();
        };

        // Watch for global resets
        useGlobalReset(resetTest);

        // Lifecycle hooks using composables
        onMounted(() => {
            lifecycle.initialize(() => {
                pointerEvents.addMouseListeners({
                    onMouseDown: handleMouseDown,
                    onMouseUp: handleMouseUp,
                    onWheel: handleWheel,
                    onContextMenu: handleContextMenu,
                    onAuxClick: handleAuxClick,
                });
            });
        });

        onUnmounted(() => {
            lifecycle.cleanup(() => {
                // Clear any active timeouts to prevent memory leaks
                if (scrollTimeout.value) {
                    clearTimeout(scrollTimeout.value);
                    scrollTimeout.value = null;
                }

                // Reset all reactive state to clean values
                leftPressed.value = false;
                rightPressed.value = false;
                middlePressed.value = false;
                scrollActive.value = false;
                leftTested.value = false;
                rightTested.value = false;
                middleTested.value = false;
                scrollTested.value = false;
                testCompleted.value = false;
                scrollDirection.value = null;
                middleClicked.value = false;

                // Event listeners are automatically cleaned up by useEventListeners
            });
        });

        return {
            // State
            leftPressed,
            rightPressed,
            middlePressed,
            scrollActive,
            leftTested,
            rightTested,
            middleTested,
            scrollTested,
            leftReleasing,
            rightReleasing,
            middleReleasing,
            testCompleted,
            scrollDirection,
            middleClicked,

            // Methods
            resetTest,
        };
    },
};
</script>

<template>
    <div class="mouse-container">
        <svg
            class="mouse-graphic"
            viewBox="0 0 120 160"
            width="260"
            xmlns="http://www.w3.org/2000/svg"
        >
            <!-- Mouse body -->
            <path
                class="mouse-body"
                d="M20,40 L20,120 Q20,145 60,145 Q100,145 100,120 L100,40 Q100,15 60,15 Q20,15 20,40"
                fill="var(--border-color-light)"
                stroke="var(--border-color-custom)"
                stroke-width="2"
            ></path>
            <!-- Left button -->
            <path
                :class="[
                    'mouse-button',
                    'left-button',
                    {
                        pressed: leftPressed,
                        tested: leftTested,
                        releasing: leftReleasing,
                    },
                ]"
                d="M20,40 L20,85 L60,85 L60,15 Q20,15 20,40"
                fill="var(--border-color-light)"
                stroke="var(--border-color-custom)"
                stroke-width="2"
            ></path>
            <!-- Right button -->
            <path
                :class="[
                    'mouse-button',
                    'right-button',
                    {
                        pressed: rightPressed,
                        tested: rightTested,
                        releasing: rightReleasing,
                    },
                ]"
                d="M60,15 L60,85 L100,85 L100,40 Q100,15 60,15"
                fill="var(--border-color-light)"
                stroke="var(--border-color-custom)"
                stroke-width="2"
            ></path>
            <!-- Scroll wheel with arrows -->
            <g>
                <rect
                    :class="[
                        'scroll-area',
                        {
                            active: scrollActive,
                            tested: scrollTested,
                            'middle-clicked': middleClicked,
                        },
                    ]"
                    x="52"
                    y="30"
                    width="16"
                    height="40"
                    rx="8"
                    fill="var(--border-color-light)"
                ></rect>
                <!-- Up arrow (smaller, slightly away from top, dark grey) -->
                <g
                    :class="['scroll-arrow', 'arrow-up', { active: scrollDirection === 'up' }]"
                    style="pointer-events: none"
                >
                    <polygon
                        points="60,36 63,39 57,39"
                        :fill="
                            scrollDirection === 'up'
                                ? 'var(--primary-color)'
                                : 'var(--border-color-custom)'
                        "
                    />
                </g>
                <!-- Down arrow -->
                <g
                    :class="['scroll-arrow', 'arrow-down', { active: scrollDirection === 'down' }]"
                    style="pointer-events: none"
                >
                    <polygon
                        points="60,64 63,61 57,61"
                        :fill="
                            scrollDirection === 'down'
                                ? 'var(--primary-color)'
                                : 'var(--border-color-custom)'
                        "
                    />
                </g>
                <!-- Middle click highlight -->
                <rect
                    v-if="middleClicked"
                    x="52"
                    y="30"
                    width="16"
                    height="40"
                    rx="8"
                    fill="var(--primary-color)"
                    fill-opacity="0.3"
                />
            </g>
            <!-- Middle click area -->
            <rect
                :class="[
                    'middle-button',
                    {
                        pressed: middlePressed,
                        tested: middleTested,
                        releasing: middleReleasing,
                    },
                ]"
                x="52"
                y="30"
                width="16"
                height="40"
                rx="8"
                fill="transparent"
                stroke="var(--border-color-custom)"
                stroke-width="2"
            ></rect>
        </svg>
    </div>
</template>

<style scoped>
@keyframes buttonPress {
    0% {
        transform: translateY(0);
        filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.2));
    }
    100% {
        transform: translateY(2px);
        filter: drop-shadow(0 0px 0px rgba(0, 0, 0, 0.2));
    }
}

@keyframes buttonRelease {
    0% {
        transform: translateY(2px);
        filter: drop-shadow(0 0px 0px rgba(0, 0, 0, 0.2));
    }
    100% {
        transform: translateY(0);
        filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.2));
    }
}

.mouse-container {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-md);
    padding: var(--spacing-sm) 0;
}

.mouse-graphic {
    width: 260px;
    max-width: 100%;
    height: auto;
    max-height: 100%;
    display: block;
    margin: 0 auto;
}

.mouse-button {
    transition: var(--transition-fast);
    transform-origin: top;
    filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.2));
}

.mouse-button.pressed {
    fill: var(--primary-color);
    animation: buttonPress var(--animation-fast) cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.mouse-button.releasing {
    animation: buttonRelease var(--animation-fast) cubic-bezier(0.2, 0, 0.4, 1) forwards;
}

.mouse-button.tested {
    fill: var(--primary-color);
}

.scroll-area {
    transition: var(--transition-fast);
}

.scroll-area.active {
    fill: var(--primary-color);
}

.scroll-area.tested {
    fill: var(--primary-color);
}

.middle-button {
    transition: var(--transition-fast);
    transform-origin: top;
    filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.2));
}

.middle-button.pressed {
    fill: var(--primary-color);
    animation: buttonPress var(--animation-fast) cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.middle-button.releasing {
    animation: buttonRelease var(--animation-fast) cubic-bezier(0.2, 0, 0.4, 1) forwards;
}

.middle-button.tested {
    fill: var(--primary-color);
}
</style>
