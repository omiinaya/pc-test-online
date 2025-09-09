<script>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import StatePanel from './StatePanel.vue';
import { useTestResults } from '../composables/useTestResults.js';
import { useComponentLifecycle } from '../composables/useComponentLifecycle.js';
import { useEventListeners, usePointerEvents } from '../composables/useEventListeners.js';
import { useGlobalReset } from '../composables/useTestState.js';
import { useTouchCompatibility } from '../composables/useTouchCompatibility.ts';
import { useI18n } from 'vue-i18n';

export default {
    name: 'TouchTest',
    components: {
        StatePanel,
    },
    emits: ['test-completed', 'test-failed', 'test-skipped', 'start-over'],
    setup(props, { emit }) {
        const { t } = useI18n();
        // Initialize composables for normalized patterns
        const testResults = useTestResults('touch', emit);
        const lifecycle = useComponentLifecycle();
        const eventListeners = useEventListeners();
        const pointerEvents = usePointerEvents();
        const touchCompatibility = useTouchCompatibility();

        // Touch test constants
        const targetSize = 60;
        const padding = 20;

        // Event throttling to prevent excessive processing
        const lastPointerMoveTime = ref(0);
        const pointerMoveThrottle = 16; // ~60fps throttling for pointer move events

        // Reactive state
        const stage = ref('idle');
        const feedbackText = ref(t('touchTest.startPrompt'));
        const completedChallenges = ref(0);
        const currentChallenge = ref({ type: null, complete: false });
        const transitionsEnabled = ref(false); // Disable transitions during initial container animation

        const tapTarget = ref({ x: null, y: null, size: targetSize });
        const dragSource = ref({
            x: null,
            y: null,
            size: targetSize,
            isDragging: false,
            touchId: null,
        });
        const dragTarget = ref({ x: null, y: null, size: targetSize * 1.5 });

        const successTimer = ref(null);
        const dragTimeoutTimer = ref(null); // Add timeout for stuck drags

        const safeAreaMargin = ref({
            top: 100, // Increased from 40 to 100 to prevent overlap with text
            bottom: 40,
            left: 40,
            right: 40,
        });
        const safeAreaRect = ref(null); // Calculated safe area bounds
        const testCompleted = ref(false);
        const resizeTimeout = ref(null); // For debouncing resize events
        const challengeAreaRef = ref(null); // Cache DOM reference to avoid repeated queries

        // Cached calculations for performance optimization
        const cachedStyleObjects = ref(new Map());
        const cachedDistanceCalculations = ref(new Map());
        const dragIndicatorAngleCache = ref({
            sourceX: null,
            sourceY: null,
            targetX: null,
            targetY: null,
            angle: 0,
        });

        // Computed properties with optimized calculations
        const tapTargetStyle = computed(() => {
            return getOptimizedStyle(tapTarget.value);
        });

        const dragSourceStyle = computed(() => {
            const baseStyle = getOptimizedStyle(dragSource.value);
            const hasTransition = transitionsEnabled.value && !dragSource.value.isDragging;
            return {
                ...baseStyle,
                // Use cached transition property to avoid repeated string concatenation
                transition: hasTransition ? 'all var(--animation-slow) ease' : 'none',
            };
        });

        const dragTargetStyle = computed(() => {
            return getOptimizedStyle(dragTarget.value);
        });

        const dragIndicatorStyle = computed(() => {
            // Only calculate if we're in drag stage and targets exist
            if (
                stage.value !== 'drag' ||
                dragSource.value.x === null ||
                dragTarget.value.x === null ||
                currentChallenge.value.complete
            ) {
                return { display: 'none' };
            }

            // Use cached angle calculation for better performance
            const sourceX = dragSource.value.x + dragSource.value.size / 2;
            const sourceY = dragSource.value.y + dragSource.value.size / 2;
            const targetX = dragTarget.value.x + dragTarget.value.size / 2;
            const targetY = dragTarget.value.y + dragTarget.value.size / 2;

            const cache = dragIndicatorAngleCache.value;
            if (
                cache.sourceX !== sourceX ||
                cache.sourceY !== sourceY ||
                cache.targetX !== targetX ||
                cache.targetY !== targetY
            ) {
                cache.sourceX = sourceX;
                cache.sourceY = sourceY;
                cache.targetX = targetX;
                cache.targetY = targetY;
                cache.angle = (Math.atan2(targetY - sourceY, targetX - sourceX) * 180) / Math.PI;
            }

            const midX = (sourceX + targetX) / 2;
            const midY = (sourceY + targetY) / 2;

            return {
                left: `${midX - 20}px`,
                top: `${midY - 20}px`,
                transform: `rotate(${cache.angle}deg)`,
            };
        });

        // Optimized methods with caching and reduced calculations
        const getOptimizedStyle = target => {
            // Create a cache key based on target properties
            const cacheKey = `${target.x}-${target.y}-${target.size}`;

            // Check if we already have this style object cached
            if (cachedStyleObjects.value.has(cacheKey)) {
                return cachedStyleObjects.value.get(cacheKey);
            }

            // Create new style object
            const style = {
                position: 'absolute',
                left: `${target.x}px`,
                top: `${target.y}px`,
                width: `${target.size}px`,
                height: `${target.size}px`,
            };

            // Cache for future use (limit cache size to prevent memory leaks)
            if (cachedStyleObjects.value.size > 50) {
                cachedStyleObjects.value.clear();
            }
            cachedStyleObjects.value.set(cacheKey, style);

            return style;
        };

        // Optimized distance calculation with caching
        const calculateDistance = (x1, y1, x2, y2) => {
            const cacheKey = `${x1}-${y1}-${x2}-${y2}`;

            if (cachedDistanceCalculations.value.has(cacheKey)) {
                return cachedDistanceCalculations.value.get(cacheKey);
            }

            const distance = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));

            // Cache for future use (limit cache size)
            if (cachedDistanceCalculations.value.size > 30) {
                cachedDistanceCalculations.value.clear();
            }
            cachedDistanceCalculations.value.set(cacheKey, distance);

            return distance;
        };

        // Keep original method for backward compatibility
        const getStyle = target => {
            return getOptimizedStyle(target);
        };

        // Add retry counter for safe area calculation
        const safeAreaCalculationAttempts = ref(0);
        const maxSafeAreaCalculationAttempts = 10;

        const calculateGridPositions = () => {
            // Cache DOM reference to avoid repeated queries
            if (!challengeAreaRef.value) {
                challengeAreaRef.value = document.querySelector('.challenge-area');
            }

            if (!challengeAreaRef.value) {
                // If called before mount, defer calculation
                console.log('Challenge area not found, element does not exist yet');
                return false;
            }

            const rect = challengeAreaRef.value.getBoundingClientRect();

            // Ensure we have valid dimensions
            if (rect.width === 0 || rect.height === 0) {
                safeAreaCalculationAttempts.value++;
                console.log(
                    `Challenge area has no dimensions yet (attempt ${safeAreaCalculationAttempts.value}/${maxSafeAreaCalculationAttempts}):`,
                    rect
                );

                // If we've tried too many times, use fallback dimensions
                if (safeAreaCalculationAttempts.value >= maxSafeAreaCalculationAttempts) {
                    console.log(
                        'Too many attempts to calculate safe area, using fallback dimensions'
                    );
                    safeAreaRect.value = {
                        left: safeAreaMargin.value.left,
                        top: safeAreaMargin.value.top,
                        width: 400, // Fallback width
                        height: 300, // Fallback height
                    };
                    return true;
                }
                return false;
            }

            // Reset attempts counter on success
            safeAreaCalculationAttempts.value = 0;

            safeAreaRect.value = {
                left: safeAreaMargin.value.left,
                top: safeAreaMargin.value.top,
                width: rect.width - safeAreaMargin.value.left - safeAreaMargin.value.right,
                height: rect.height - safeAreaMargin.value.top - safeAreaMargin.value.bottom,
            };

            console.log(
                'Successfully calculated safe area:',
                safeAreaRect.value,
                'from challenge area:',
                { width: rect.width, height: rect.height }
            );
            return true;
        };

        // Optimized position calculation with better boundary checking
        const getRandomPosition = (size = targetSize) => {
            // First ensure we have calculated safe area
            if (!safeAreaRect.value) {
                console.log('Safe area not calculated yet, calculating now');
                const success = calculateGridPositions();
                // If still no safe area after calculation, use fallback
                if (!success || !safeAreaRect.value) {
                    console.log('Using fallback position due to no safe area');
                    return { x: 100, y: 200 };
                }
            }

            const safeArea = safeAreaRect.value;
            const minX = safeArea.left;
            const maxX = safeArea.left + safeArea.width - size;
            const minY = safeArea.top;
            const maxY = safeArea.top + safeArea.height - size;

            console.log('Safe area bounds:', { minX, maxX, minY, maxY, safeArea, size });

            // Optimized boundary checks - combine conditions for better performance
            const isValidArea =
                maxX >= minX && maxY >= minY && safeArea.width > size && safeArea.height > size;

            if (!isValidArea) {
                console.log('Safe area too small or invalid, using centered position');
                const centerX = Math.max(50, safeArea.left + (safeArea.width - size) * 0.5);
                const centerY = Math.max(100, safeArea.top + (safeArea.height - size) * 0.5);
                return { x: centerX, y: centerY };
            }

            // Use optimized random calculation (avoid repeated Math.random() calls)
            const randomX = Math.random();
            const randomY = Math.random();

            const position = {
                x: minX + randomX * (maxX - minX),
                y: minY + randomY * (maxY - minY),
            };

            console.log(
                'Generated position:',
                position,
                'for size:',
                size,
                'within safe area:',
                safeArea
            );
            return position;
        };

        const handleResize = () => {
            // Debounce resize events to avoid excessive recalculations
            if (resizeTimeout.value) {
                clearTimeout(resizeTimeout.value);
            }
            resizeTimeout.value = setTimeout(() => {
                // Clear cached reference on resize as layout may have changed
                challengeAreaRef.value = null;
                calculateGridPositions();
                if (stage.value !== 'idle') {
                    setupCurrentChallenge();
                }
            }, 100); // Small delay to debounce resize events
        };

        const startTest = () => {
            // Start test timing
            if (testResults && testResults.testStatus === 'pending') {
                testResults.startTest();
            }

            completedChallenges.value = 0;
            stage.value = 'tap'; // Start with the first stage so .challenge-area is rendered

            // Give the DOM time to render the challenge area
            setTimeout(() => {
                console.log('Starting test - DOM should be ready now');
                calculateGridPositions();
                setupNextChallenge();
            }, 200); // Increased delay to ensure DOM rendering
        };

        const setupNextChallenge = () => {
            clearSuccessTimer();
            currentChallenge.value.complete = false;

            const challengeTypes = ['tap', 'drag'];
            const randomType = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];

            currentChallenge.value.type = randomType;
            stage.value = randomType;

            nextTick(() => {
                setupCurrentChallenge();
            });
        };

        const setupCurrentChallenge = () => {
            switch (currentChallenge.value.type) {
                case 'tap':
                    setupTapChallenge();
                    break;
                case 'drag':
                    setupDragChallenge();
                    break;
            }
        };

        const setupTapChallenge = () => {
            feedbackText.value = t('touchTest.tapChallenge');
            tapTarget.value.x = null;
            tapTarget.value.y = null;

            // Simple delay approach - ensure DOM has time to update
            setTimeout(() => {
                const success = calculateGridPositions();
                if (
                    !success &&
                    safeAreaCalculationAttempts.value >= maxSafeAreaCalculationAttempts
                ) {
                    console.log('Using fallback for tap challenge due to calculation failure');
                }

                const position = getRandomPosition(targetSize);
                tapTarget.value = { ...tapTarget.value, x: position.x, y: position.y };
                console.log('Set tap target position:', position, 'tapTarget:', tapTarget.value);

                // Verify the target is now visible
                setTimeout(() => {
                    const targetElement = document.querySelector('.tap-target');
                    if (targetElement) {
                        console.log('Tap target is now visible in DOM');
                    } else {
                        console.error('Tap target is still not visible in DOM');
                        console.log(
                            'Stage:',
                            stage.value,
                            'tapTarget.x:',
                            tapTarget.value.x,
                            'tapTarget.y:',
                            tapTarget.value.y
                        );
                    }
                }, 50);
            }, 100);
        };

        const setupDragChallenge = () => {
            feedbackText.value = t('touchTest.dragChallenge');
            dragSource.value.x = null;
            dragSource.value.y = null;
            dragTarget.value.x = null;
            dragTarget.value.y = null;

            // Simple delay approach - ensure DOM has time to update
            setTimeout(() => {
                const success = calculateGridPositions();
                if (
                    !success &&
                    safeAreaCalculationAttempts.value >= maxSafeAreaCalculationAttempts
                ) {
                    console.log('Using fallback for drag challenge due to calculation failure');
                }

                const sourcePos = getRandomPosition(dragSource.value.size);
                let targetPos;
                let distance;
                const minDistance = 150; // Minimum drag distance
                const maxDistance = 300; // Maximum drag distance to keep it reasonable
                let attempts = 0;

                // Optimized position generation - calculate multiple positions at once
                do {
                    targetPos = getRandomPosition(dragTarget.value.size);
                    // Use optimized distance calculation
                    distance = calculateDistance(
                        sourcePos.x,
                        sourcePos.y,
                        targetPos.x,
                        targetPos.y
                    );
                    attempts++;
                } while ((distance < minDistance || distance > maxDistance) && attempts < 10);

                // If we can't find a good position after 10 attempts, use what we have
                dragSource.value = {
                    ...dragSource.value,
                    x: sourcePos.x,
                    y: sourcePos.y,
                    originalX: sourcePos.x,
                    originalY: sourcePos.y,
                };
                dragTarget.value = { ...dragTarget.value, x: targetPos.x, y: targetPos.y };

                console.log(
                    'Set drag positions - source:',
                    sourcePos,
                    'target:',
                    targetPos,
                    'distance:',
                    distance
                );
                console.log('dragSource:', dragSource.value, 'dragTarget:', dragTarget.value);

                // Verify the targets are now visible
                setTimeout(() => {
                    const sourceElement = document.querySelector('.drag-source');
                    const targetElement = document.querySelector('.drag-target-area');
                    if (sourceElement && targetElement) {
                        console.log('Drag targets are now visible in DOM');
                    } else {
                        console.error('Drag targets are still not visible in DOM');
                        console.log(
                            'Stage:',
                            stage.value,
                            'dragSource:',
                            dragSource.value,
                            'dragTarget:',
                            dragTarget.value
                        );
                    }
                }, 50);
            }, 100);
        };

        const showSuccessAndContinue = () => {
            currentChallenge.value.complete = true;
            completedChallenges.value++;
            clearSuccessTimer();

            // Always continue to next challenge instead of auto-completing
            successTimer.value = setTimeout(() => {
                setupNextChallenge();
            }, 400);
        };

        const clearSuccessTimer = () => {
            if (successTimer.value) {
                clearTimeout(successTimer.value);
                successTimer.value = null;
            }
        };

        const clearDragTimeout = () => {
            if (dragTimeoutTimer.value) {
                clearTimeout(dragTimeoutTimer.value);
                dragTimeoutTimer.value = null;
            }
        };

        const resetDragState = () => {
            if (dragSource.value.isDragging) {
                console.log('Resetting stuck drag state');
                dragSource.value.isDragging = false;
                dragSource.value.touchId = null;
                dragSource.value.x = dragSource.value.originalX;
                dragSource.value.y = dragSource.value.originalY;
            }
            clearDragTimeout();
        };

        const restartTest = () => {
            // Clear timers first to prevent any ongoing operations
            clearSuccessTimer();
            clearDragTimeout();

            // Reset all test state to initial values
            stage.value = 'idle';
            completedChallenges.value = 0;
            currentChallenge.value = { type: null, complete: false };
            feedbackText.value = t('touchTest.startPrompt');
            transitionsEnabled.value = false; // Reset transitions

            // Reset target positions to exact initial state
            tapTarget.value = { x: null, y: null, size: targetSize };

            // Create a fresh dragSource object to avoid any lingering properties
            dragSource.value = {
                x: null,
                y: null,
                size: targetSize,
                isDragging: false,
                touchId: null,
            };

            dragTarget.value = { x: null, y: null, size: targetSize * 1.5 };

            // Clear cached DOM references to force recalculation
            challengeAreaRef.value = null;
            safeAreaRect.value = null;
            safeAreaCalculationAttempts.value = 0; // Reset attempts counter

            // Clear performance caches to free memory
            cachedStyleObjects.value.clear();
            cachedDistanceCalculations.value.clear();
            dragIndicatorAngleCache.value = {
                sourceX: null,
                sourceY: null,
                targetX: null,
                targetY: null,
                angle: 0,
            };

            // Reset test results timing
            testResults.resetTest();

            // Force a DOM update to ensure the idle state is properly rendered
            nextTick(() => {
                // Recalculate grid positions after DOM updates
                calculateGridPositions();
            });
        };

        // Watch for global resets
        useGlobalReset(restartTest);

        const handlePointerDown = (touchData, gesture) => {
            if (stage.value === 'idle') {
                startTest();
                return;
            }

            const challengeArea = document.querySelector('.challenge-area');
            if (!challengeArea) return;

            const rect = challengeArea.getBoundingClientRect();

            if (currentChallenge.value.complete) return;

            for (const touch of touchData.changedTouches) {
                const touchPoint = {
                    x: touch.x - rect.left,
                    y: touch.y - rect.top,
                };

                if (stage.value === 'tap' && isInsideCircle(touchPoint, tapTarget.value)) {
                    showSuccessAndContinue();
                } else if (
                    stage.value === 'drag' &&
                    isInsideCircle(touchPoint, dragSource.value) &&
                    !dragSource.value.isDragging // Prevent multiple simultaneous drags
                ) {
                    dragSource.value.isDragging = true;
                    dragSource.value.touchId = touch.id;
                    console.log('Drag started with touch ID:', touch.id); // Debug logging

                    // Set a timeout to reset drag state if it gets stuck
                    clearDragTimeout();
                    dragTimeoutTimer.value = setTimeout(() => {
                        console.log('Drag timeout - resetting stuck drag');
                        resetDragState();
                    }, 10000); // 10 second timeout
                }
            }
        };

        const handlePointerMove = (touchData, gesture) => {
            if (stage.value !== 'drag' || !dragSource.value.isDragging) return;

            // Throttle pointer move events for better performance
            const now = performance.now();
            if (now - lastPointerMoveTime.value < pointerMoveThrottle) {
                return;
            }
            lastPointerMoveTime.value = now;

            const challengeArea = document.querySelector('.challenge-area');
            if (!challengeArea) return;

            const rect = challengeArea.getBoundingClientRect();
            const halfTargetSize = targetSize * 0.5; // Precompute to avoid repeated division

            for (const touch of touchData.changedTouches) {
                if (touch.id === dragSource.value.touchId) {
                    // Optimized position calculation - avoid repeated arithmetic
                    dragSource.value.x = touch.x - rect.left - halfTargetSize;
                    dragSource.value.y = touch.y - rect.top - halfTargetSize;
                    return; // Found the right touch, no need to continue
                }
            }

            // If we get here, the touch ID wasn't found - this might indicate a problem
            // Check if there's only one touch and we should use it anyway
            if (touchData.changedTouches.length === 1 && dragSource.value.isDragging) {
                const touch = touchData.changedTouches[0];
                console.log(
                    'Touch ID mismatch detected, using available touch:',
                    touch.id,
                    'expected:',
                    dragSource.value.touchId
                );
                dragSource.value.touchId = touch.id; // Update to the correct ID
                dragSource.value.x = touch.x - rect.left - halfTargetSize;
                dragSource.value.y = touch.y - rect.top - halfTargetSize;
            }
        };

        const handlePointerUp = (touchData, gesture) => {
            const challengeArea = document.querySelector('.challenge-area');
            if (!challengeArea) return;

            for (const touch of touchData.changedTouches) {
                if (stage.value === 'drag' && touch.id === dragSource.value.touchId) {
                    dragSource.value.isDragging = false;
                    dragSource.value.touchId = null;
                    clearDragTimeout(); // Clear the timeout since drag ended normally
                    console.log('Drag ended with touch ID:', touch.id); // Debug logging

                    // Optimized hit detection - precompute center and use optimized distance check
                    const sourceCenterX = dragSource.value.x + targetSize * 0.5;
                    const sourceCenterY = dragSource.value.y + targetSize * 0.5;
                    const sourceCenter = { x: sourceCenterX, y: sourceCenterY };

                    if (isInsideCircle(sourceCenter, dragTarget.value)) {
                        showSuccessAndContinue();
                    } else {
                        dragSource.value.x = dragSource.value.originalX;
                        dragSource.value.y = dragSource.value.originalY;
                    }
                    return; // Found the right touch, exit
                }
            }

            // If we get here and we're still dragging, something went wrong
            // Force reset the drag state to prevent getting stuck
            if (dragSource.value.isDragging && touchData.type === 'end') {
                console.log('Force resetting drag state due to unmatched touch up event');
                resetDragState();
            }
        };

        const handleMouseLeave = () => {
            if (stage.value === 'drag' && dragSource.value.isDragging) {
                dragSource.value.isDragging = false;
                dragSource.value.touchId = null;
                dragSource.value.x = dragSource.value.originalX;
                dragSource.value.y = dragSource.value.originalY;
            }
        };

        const isInsideCircle = (point, circle) => {
            const radius = circle.size * 0.5; // Use multiplication instead of division
            const circleCenterX = circle.x + radius;
            const circleCenterY = circle.y + radius;
            const deltaX = point.x - circleCenterX;
            const deltaY = point.y - circleCenterY;

            // Use squared distance comparison to avoid expensive Math.sqrt
            const distanceSquared = deltaX * deltaX + deltaY * deltaY;
            const radiusSquared = radius * radius;

            return distanceSquared <= radiusSquared;
        };

        // Lifecycle hooks using composables
        onMounted(() => {
            lifecycle.initialize(() => {
                // Add unified touch event listeners using touch compatibility
                const challengeArea = document.querySelector('.touch-container');
                if (challengeArea) {
                    const unifiedTouchHandler = (touchData, gesture) => {
                        // Prevent default for touch events to avoid scrolling
                        if (touchData.originalEvent.type.startsWith('touch')) {
                            touchData.preventDefault();
                        }

                        // Route to appropriate handler based on touch event type
                        if (touchData.type === 'start') {
                            handlePointerDown(touchData, gesture);
                        } else if (touchData.type === 'move') {
                            handlePointerMove(touchData, gesture);
                        } else if (touchData.type === 'end') {
                            handlePointerUp(touchData, gesture);
                        }
                    };

                    // Add the unified touch listener
                    const removeListener = touchCompatibility.addTouchListener(
                        challengeArea,
                        unifiedTouchHandler
                    );

                    // Store cleanup function for later use
                    challengeArea._touchCleanup = removeListener;
                }

                // Add mouse leave handler for drag reset
                const handleMouseLeave = () => {
                    if (stage.value === 'drag' && dragSource.value.isDragging) {
                        console.log('Mouse left area during drag - resetting');
                        resetDragState();
                    }
                };

                if (challengeArea) {
                    challengeArea.addEventListener('mouseleave', handleMouseLeave);
                }

                // Delay heavy initialization to avoid interfering with container animations
                setTimeout(() => {
                    transitionsEnabled.value = true; // Enable transitions after container animation
                    eventListeners.addEventListener('resize', handleResize);
                    calculateGridPositions();
                }, 200);
            });
        });

        onUnmounted(() => {
            lifecycle.cleanup(() => {
                // Clean up unified touch listeners
                const challengeArea = document.querySelector('.touch-container');
                if (challengeArea && challengeArea._touchCleanup) {
                    challengeArea._touchCleanup();
                    delete challengeArea._touchCleanup;
                }

                // Clean up all timers to prevent memory leaks
                clearSuccessTimer();
                clearDragTimeout();
                if (resizeTimeout.value) {
                    clearTimeout(resizeTimeout.value);
                    resizeTimeout.value = null;
                }

                // Clear DOM references to prevent memory leaks
                challengeAreaRef.value = null;
                safeAreaRect.value = null;

                // Clear performance caches to free memory
                cachedStyleObjects.value.clear();
                cachedDistanceCalculations.value.clear();

                // Reset all reactive state to clean values
                stage.value = 'idle';
                completedChallenges.value = 0;
                currentChallenge.value = { type: null, complete: false };
                feedbackText.value = t('touchTest.startPrompt');
                transitionsEnabled.value = false;
                tapTarget.value = { x: null, y: null, size: targetSize };
                dragSource.value = {
                    x: null,
                    y: null,
                    size: targetSize,
                    isDragging: false,
                    touchId: null,
                };
                dragTarget.value = { x: null, y: null, size: targetSize * 1.5 };
                testCompleted.value = false;

                // Reset throttling timers
                lastPointerMoveTime.value = 0;

                // Event listeners are automatically cleaned up by useEventListeners composables
                eventListeners.removeEventListener('resize', handleResize);
            });
        });

        return {
            // State
            stage,
            feedbackText,
            completedChallenges,
            currentChallenge,
            transitionsEnabled,
            tapTarget,
            dragSource,
            dragTarget,
            targetSize,
            padding,
            safeAreaRect,
            safeAreaCalculationAttempts,
            maxSafeAreaCalculationAttempts,

            // Computed styles
            tapTargetStyle,
            dragSourceStyle,
            dragTargetStyle,
            dragIndicatorStyle,

            // Touch compatibility
            touchCapabilities: touchCompatibility.capabilities,
            touchCompatibilityRecommendations: touchCompatibility.getCompatibilityRecommendations,
            hasTouchCompatibilityIssues: touchCompatibility.hasCompatibilityIssues,

            // Translation function
            t,

            // Methods
            handlePointerDown,
            handlePointerMove,
            handlePointerUp,
            restartTest,
            resetTest: restartTest,
            resetDragState, // Expose for debugging
        };
    },
};
</script>

<template>
    <div class="touch-container" :class="{ 'transitions-enabled': transitionsEnabled }">
        <!-- Completion state -->
        <StatePanel
            v-if="stage === 'complete'"
            state="success"
            :full-height="false"
            :show-icon="true"
            :title="t('touchTest.completeTitle')"
            :message="t('touchTest.completeMessage')"
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
            <template #actions>
                <button @click="restartTest" class="test-again-button">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                        <path d="M21 3v5h-5" />
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                        <path d="M3 21v-5h5" />
                    </svg>
                    {{ t('buttons.testAgain') }}
                </button>
            </template>
        </StatePanel>

        <!-- Active test states -->
        <template v-else>
            <!-- Touch Compatibility Warnings -->
            <div v-if="hasTouchCompatibilityIssues" class="compatibility-warning">
                <div class="warning-header">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <path
                            d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"
                        />
                        <path d="M12 9v4" />
                        <path d="m12 17 .01 0" />
                    </svg>
                    {{ t('compatibility.warnings.limited_support') }}
                </div>
                <div class="warning-content">
                    <p>
                        <strong>Platform:</strong> {{ touchCapabilities.platform }} ({{
                            touchCapabilities.browserName
                        }}
                        {{ touchCapabilities.browserVersion }})
                    </p>
                    <ul class="recommendation-list">
                        <li
                            v-for="recommendation in touchCompatibilityRecommendations()"
                            :key="recommendation"
                        >
                            {{ recommendation }}
                        </li>
                    </ul>
                </div>
            </div>

            <div v-if="stage === 'idle'" class="start-prompt">
                <div class="tap-instruction">{{ t('touchTest.tapToBegin') }}</div>
            </div>

            <div v-show="stage !== 'idle'" class="interactive-area">
                <div class="progress-indicator">
                    <div class="progress-text">
                        {{
                            completedChallenges >= 4
                                ? t('touchTest.allChallengesCompleted')
                                : t('touchTest.challengesProgress', { completed: completedChallenges, total: 4 })
                        }}
                    </div>
                    <div class="progress-bar">
                        <div
                            class="progress-fill"
                            :class="{ success: completedChallenges >= 4 }"
                            :style="{
                                width: `${Math.min(completedChallenges * (100 / 4), 100)}%`,
                            }"
                        ></div>
                    </div>
                </div>

                <div class="feedback-text" :class="{ success: currentChallenge.complete }">
                    {{ feedbackText }}
                </div>

                <div class="challenge-area">
                    <!-- Tap Challenge -->
                    <div
                        v-if="stage === 'tap' && tapTarget.x !== null && tapTarget.y !== null"
                        class="target-container"
                    >
                        <div
                            class="target tap-target"
                            :class="{ success: currentChallenge.complete }"
                            :style="tapTargetStyle"
                        >
                            <svg
                                v-if="currentChallenge.complete"
                                class="target-checkmark"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    class="checkmark-check"
                                    fill="none"
                                    stroke="white"
                                    stroke-width="3"
                                    d="M4 12l5 5L20 7"
                                />
                            </svg>
                        </div>
                    </div>

                    <!-- Drag Challenge -->
                    <div
                        v-if="
                            stage === 'drag' &&
                            dragSource.x !== null &&
                            dragSource.y !== null &&
                            dragTarget.x !== null &&
                            dragTarget.y !== null
                        "
                        class="target-container"
                    >
                        <div class="target drag-target-area" :style="dragTargetStyle">
                            <svg
                                v-if="currentChallenge.complete"
                                class="target-checkmark"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    class="checkmark-check"
                                    fill="none"
                                    stroke="white"
                                    stroke-width="3"
                                    d="M4 12l5 5L20 7"
                                />
                            </svg>
                        </div>
                        <div
                            class="target drag-source"
                            :class="{ success: currentChallenge.complete }"
                            :style="dragSourceStyle"
                        >
                            <svg
                                v-if="currentChallenge.complete"
                                class="target-checkmark"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    class="checkmark-check"
                                    fill="none"
                                    stroke="white"
                                    stroke-width="3"
                                    d="M4 12l5 5L20 7"
                                />
                            </svg>
                        </div>
                        <div class="drag-indicator" :style="dragIndicatorStyle">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<style scoped>
/* Touch Container Styles */
.touch-container {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 100%;
    min-height: 380px;
    height: 100%;
    cursor: pointer;
    background: transparent;
}

.interactive-area {
    flex: 1 1 auto;
    position: relative;
    min-height: 350px;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: none;
}

.challenge-area {
    position: relative;
    width: 100%;
    flex: 1;
    min-height: 300px;
    overflow: hidden;
    background: none;
    margin-top: 0;
}

.target,
.drag-source,
.drag-target-area {
    position: absolute;
}

/* Progress Indicator */
.progress-indicator {
    position: absolute;
    top: 0.75rem;
    left: 50%;
    transform: translateX(-50%);
    width: 80%;
    z-index: 30;
    text-align: center;
}

.progress-text {
    color: var(--text-tertiary);
    font-size: var(--font-size-sm);
    margin-bottom: var(--spacing-xs);
}

.progress-bar {
    height: 6px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background-color: var(--primary-color);
    border-radius: 3px;
    transition: none; /* Disable by default */
}

.progress-fill.success {
    background-color: var(--success-color);
}

.touch-container.transitions-enabled .progress-fill {
    transition: var(--transition-slow); /* Enable only after container animation */
}

/* Start Prompt */
.start-prompt {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    z-index: 15;
    pointer-events: none;
}

.tap-instruction {
    color: var(--text-primary);
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-semibold);
    animation: pulse var(--animation-celebration) infinite;
    text-align: center;
    padding: var(--spacing-xl);
    border-radius: var(--border-radius-large);
    background: rgba(var(--surface-secondary-rgb, 45, 45, 45), 0.9);
    border: 2px solid var(--primary-color);
    box-shadow: var(--shadow-large);
    backdrop-filter: blur(10px);
}

/* Feedback Text */
.feedback-text {
    position: absolute;
    top: 3.5rem;
    left: 50%;
    transform: translateX(-50%);
    color: var(--text-muted);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-medium);
    transition: none; /* Disable by default */
    z-index: 20;
    text-align: center;
    padding: 0 var(--spacing-md);
    width: 80%;
}

.transitions-enabled .feedback-text {
    transition: var(--transition-slow); /* Enable only after container animation */
}

.feedback-text.success {
    color: var(--success-color);
}

/* Target Elements */
.target-container {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
}

.target {
    position: absolute;
    border-radius: 50%;
    cursor: pointer;
    transition: none; /* Disable by default */
    display: flex;
    align-items: center;
    justify-content: center;
}

.transitions-enabled .target {
    transition: var(--transition-slow); /* Enable only after container animation */
}

.tap-target {
    background: var(--primary-color);
    border: 2px solid var(--primary-color);
}

.tap-target.success {
    background: var(--success-color);
    border-color: var(--success-color);
    transform: scale(1.1);
}

.drag-target-area {
    border: 2px dashed var(--primary-color);
    background: transparent;
}

.drag-source {
    background: var(--primary-color);
    z-index: 2;
}

.drag-source.success {
    background: var(--success-color);
    border: 2px solid var(--success-color);
    transform: scale(1.1);
}

.drag-indicator {
    position: absolute;
    width: 40px;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--primary-color);
    z-index: 5;
    animation: fadeInOut var(--animation-celebration) infinite;
}

.drag-indicator svg {
    width: 100%;
    height: 100%;
    stroke: currentColor;
}

/* Target Checkmark */
.target-checkmark {
    width: 24px;
    height: 24px;
    animation: checkmark-pop var(--animation-normal) ease-out forwards;
}

.checkmark-check {
    stroke-dasharray: 48;
    stroke-dashoffset: 48;
    animation: checkmark-stroke var(--animation-normal) cubic-bezier(0.65, 0, 0.45, 1)
        var(--animation-fast) forwards;
}

.tap-target.success {
    transition: none; /* Disable by default */
}

.transitions-enabled .tap-target.success {
    transition: var(--transition-default); /* Enable only after container animation */
}

/* Completion Animation */
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

/* Animations */
@keyframes checkmark-pop {
    0% {
        transform: scale(0);
        opacity: 0;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}

@keyframes checkmark-stroke {
    100% {
        stroke-dashoffset: 0;
    }
}

@keyframes pulse {
    0% {
        transform: scale(0.95);
    }
    70% {
        transform: scale(1);
    }
    100% {
        transform: scale(0.95);
    }
}

@keyframes fadeInOut {
    0%,
    100% {
        opacity: 0.4;
    }
    50% {
        opacity: 1;
    }
}

.test-again-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background-color: #ff6b00;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-top: 1rem;
}

.test-again-button:hover {
    background-color: #e55c00;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3);
}

.test-again-button:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(255, 107, 0, 0.2);
}

.test-again-button svg {
    width: 20px;
    height: 20px;
}

/* Touch Compatibility Warning Styles */
.compatibility-warning {
    background: rgba(249, 115, 22, 0.1);
    border: 1px solid rgba(249, 115, 22, 0.3);
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 16px;
    color: rgb(194, 65, 12);
    font-size: 14px;
}

.warning-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    margin-bottom: 8px;
}

.warning-header svg {
    color: rgb(249, 115, 22);
    flex-shrink: 0;
}

.warning-content p {
    margin: 0 0 8px 0;
    font-size: 13px;
}

.recommendation-list {
    margin: 0;
    padding-left: 16px;
    font-size: 13px;
}

.recommendation-list li {
    margin-bottom: 4px;
}

.recommendation-list li:last-child {
    margin-bottom: 0;
}
</style>
