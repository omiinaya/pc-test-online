// Touch event unification for cross-browser compatibility
import { ref, onMounted } from 'vue';

export interface TouchPoint {
    id: number | string;
    x: number;
    y: number;
    pressure?: number;
    radiusX?: number;
    radiusY?: number;
    timestamp: number;
}

export interface TouchEventData {
    type: 'start' | 'move' | 'end' | 'cancel';
    touches: TouchPoint[];
    changedTouches: TouchPoint[];
    targetTouches: TouchPoint[];
    originalEvent: Event;
    preventDefault: () => void;
    stopPropagation: () => void;
}

export interface GestureData {
    type: 'tap' | 'doubletap' | 'press' | 'pan' | 'pinch' | 'swipe';
    startTime: number;
    endTime?: number;
    duration?: number;
    distance?: number;
    direction?: 'up' | 'down' | 'left' | 'right';
    velocity?: number;
    scale?: number;
    center?: { x: number; y: number };
}

export interface TouchCapabilities {
    touchSupported: boolean;
    pointerSupported: boolean;
    maxTouchPoints: number;
    browserName: string;
    browserVersion: number;
    isMobile: boolean;
    isTablet: boolean;
    platform: 'desktop' | 'mobile' | 'tablet';
    supportedEvents: string[];
    fallbackMode: boolean;
}

/**
 * Cross-browser touch event unification composable
 * Provides consistent touch handling across all browsers and devices
 */
export function useTouchCompatibility() {
    const capabilities = ref<TouchCapabilities>({
        touchSupported: false,
        pointerSupported: false,
        maxTouchPoints: 0,
        browserName: '',
        browserVersion: 0,
        isMobile: false,
        isTablet: false,
        platform: 'desktop',
        supportedEvents: [],
        fallbackMode: false,
    });

    const activeGestures = ref<Map<string, GestureData>>(new Map());
    const touchHistory = ref<TouchPoint[]>([]);
    const isInitialized = ref(false);

    /**
     * Detect browser and device capabilities
     */
    const detectCapabilities = (): void => {
        const userAgent = navigator.userAgent;

        // Browser detection with proper error handling
        if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) {
            capabilities.value.browserName = 'Chrome';
            const match = userAgent.match(/Chrome\/(\d+)/);
            capabilities.value.browserVersion = match && match[1] ? parseInt(match[1], 10) : 0;
        } else if (userAgent.includes('Firefox')) {
            capabilities.value.browserName = 'Firefox';
            const match = userAgent.match(/Firefox\/(\d+)/);
            capabilities.value.browserVersion = match && match[1] ? parseInt(match[1], 10) : 0;
        } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            capabilities.value.browserName = 'Safari';
            const match = userAgent.match(/Version\/(\d+)/);
            capabilities.value.browserVersion = match && match[1] ? parseInt(match[1], 10) : 0;
        } else if (userAgent.includes('Edge')) {
            capabilities.value.browserName = 'Edge';
            const match = userAgent.match(/Edge?\/(\d+)/);
            capabilities.value.browserVersion = match && match[1] ? parseInt(match[1], 10) : 0;
        } else {
            capabilities.value.browserName = 'Unknown';
            capabilities.value.browserVersion = 0;
        }

        // Device type detection
        capabilities.value.isMobile = /Mobi|Android/i.test(userAgent);
        capabilities.value.isTablet = /Tablet|iPad/i.test(userAgent);

        if (capabilities.value.isMobile) {
            capabilities.value.platform = 'mobile';
        } else if (capabilities.value.isTablet) {
            capabilities.value.platform = 'tablet';
        } else {
            capabilities.value.platform = 'desktop';
        }

        // Touch capabilities
        capabilities.value.touchSupported =
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            (window as any).DocumentTouch !== undefined;

        capabilities.value.pointerSupported = 'onpointerdown' in window;
        capabilities.value.maxTouchPoints = navigator.maxTouchPoints || 0;

        // Determine supported events
        const events: string[] = [];
        if (capabilities.value.pointerSupported) {
            events.push('pointerdown', 'pointermove', 'pointerup', 'pointercancel');
        }
        if (capabilities.value.touchSupported) {
            events.push('touchstart', 'touchmove', 'touchend', 'touchcancel');
        }
        events.push('mousedown', 'mousemove', 'mouseup');

        capabilities.value.supportedEvents = events;
        capabilities.value.fallbackMode =
            !capabilities.value.touchSupported && !capabilities.value.pointerSupported;
    };

    /**
     * Normalize touch event across different browsers
     */
    const normalizeTouchEvent = (event: TouchEvent | PointerEvent | MouseEvent): TouchEventData => {
        const touches: TouchPoint[] = [];
        const changedTouches: TouchPoint[] = [];
        const targetTouches: TouchPoint[] = [];

        const createTouchPoint = (
            touch: Touch | PointerEvent | MouseEvent,
            id: number | string = 0
        ): TouchPoint => ({
            id,
            x: 'clientX' in touch ? touch.clientX : 0,
            y: 'clientY' in touch ? touch.clientY : 0,
            pressure: 'pressure' in touch ? touch.pressure : 0.5,
            radiusX: 'radiusX' in touch ? (touch as Touch).radiusX || 10 : 10,
            radiusY: 'radiusY' in touch ? (touch as Touch).radiusY || 10 : 10,
            timestamp: Date.now(),
        });

        if (event.type.startsWith('touch')) {
            const touchEvent = event as TouchEvent;

            Array.from(touchEvent.touches).forEach(touch => {
                touches.push(createTouchPoint(touch, touch.identifier));
            });

            Array.from(touchEvent.changedTouches).forEach(touch => {
                changedTouches.push(createTouchPoint(touch, touch.identifier));
            });

            Array.from(touchEvent.targetTouches).forEach(touch => {
                targetTouches.push(createTouchPoint(touch, touch.identifier));
            });
        } else if (event.type.startsWith('pointer')) {
            const pointerEvent = event as PointerEvent;
            const point = createTouchPoint(pointerEvent, pointerEvent.pointerId);

            if (event.type === 'pointerdown') {
                touches.push(point);
                changedTouches.push(point);
                targetTouches.push(point);
            } else if (event.type === 'pointermove') {
                touches.push(point);
                changedTouches.push(point);
            } else {
                changedTouches.push(point);
            }
        } else {
            // Mouse events - use consistent ID
            const mouseEvent = event as MouseEvent;
            const mouseId = 'mouse'; // Use string ID to avoid conflicts with numeric touch/pointer IDs
            const point = createTouchPoint(mouseEvent, mouseId);

            if (event.type === 'mousedown') {
                touches.push(point);
                changedTouches.push(point);
                targetTouches.push(point);
            } else if (event.type === 'mousemove') {
                touches.push(point);
                changedTouches.push(point);
            } else {
                changedTouches.push(point);
            }
        }

        let type: 'start' | 'move' | 'end' | 'cancel';
        if (event.type.includes('start') || event.type.includes('down')) {
            type = 'start';
        } else if (event.type.includes('move')) {
            type = 'move';
        } else if (event.type.includes('cancel')) {
            type = 'cancel';
        } else {
            type = 'end';
        }

        return {
            type,
            touches,
            changedTouches,
            targetTouches,
            originalEvent: event,
            preventDefault: () => event.preventDefault(),
            stopPropagation: () => event.stopPropagation(),
        };
    };

    /**
     * Detect gestures from touch events
     */
    const detectGesture = (touchData: TouchEventData): GestureData | null => {
        const now = Date.now();

        if (touchData.type === 'start') {
            // Record touch start for gesture detection
            const touch = touchData.changedTouches[0];
            if (touch) {
                touchHistory.value.push(touch);

                // Limit history size
                if (touchHistory.value.length > 100) {
                    touchHistory.value = touchHistory.value.slice(-50);
                }
            }
            return null;
        }

        if (touchData.type === 'end') {
            const touch = touchData.changedTouches[0];
            if (!touch || touchHistory.value.length === 0) return null;

            const startTouch = touchHistory.value.find(t => t.id === touch.id);
            if (!startTouch) return null;

            const duration = now - startTouch.timestamp;
            const deltaX = touch.x - startTouch.x;
            const deltaY = touch.y - startTouch.y;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const velocity = distance / duration;

            // Tap detection
            if (duration < 300 && distance < 10) {
                return {
                    type: 'tap',
                    startTime: startTouch.timestamp,
                    endTime: now,
                    duration,
                    distance,
                    center: { x: touch.x, y: touch.y },
                };
            }

            // Swipe detection
            if (duration < 1000 && distance > 50 && velocity > 0.1) {
                let direction: 'up' | 'down' | 'left' | 'right';

                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    direction = deltaX > 0 ? 'right' : 'left';
                } else {
                    direction = deltaY > 0 ? 'down' : 'up';
                }

                return {
                    type: 'swipe',
                    startTime: startTouch.timestamp,
                    endTime: now,
                    duration,
                    distance,
                    direction,
                    velocity,
                    center: { x: touch.x, y: touch.y },
                };
            }

            // Press detection
            if (duration > 500 && distance < 10) {
                return {
                    type: 'press',
                    startTime: startTouch.timestamp,
                    endTime: now,
                    duration,
                    distance,
                    center: { x: touch.x, y: touch.y },
                };
            }
        }

        return null;
    };

    /**
     * Add unified touch event listener
     */
    const addTouchListener = (
        element: HTMLElement,
        callback: (touchData: TouchEventData, gesture?: GestureData | null) => void
    ): (() => void) => {
        if (!isInitialized.value) {
            initialize();
        }

        const handleEvent = (event: Event): void => {
            const touchData = normalizeTouchEvent(event as TouchEvent | PointerEvent | MouseEvent);
            const gesture = detectGesture(touchData);
            callback(touchData, gesture);
        };

        const events = capabilities.value.supportedEvents;
        events.forEach(eventType => {
            element.addEventListener(eventType, handleEvent, { passive: false });
        });

        // Return cleanup function
        return (): void => {
            events.forEach(eventType => {
                element.removeEventListener(eventType, handleEvent);
            });
        };
    };

    /**
     * Get touch compatibility recommendations
     */
    const getCompatibilityRecommendations = (): string[] => {
        const recommendations: string[] = [];

        if (!capabilities.value.touchSupported && capabilities.value.platform === 'mobile') {
            recommendations.push(
                'Touch events not supported - device may have limited touch capabilities'
            );
        }

        if (!capabilities.value.pointerSupported && capabilities.value.browserName === 'Safari') {
            recommendations.push(
                'Pointer events not supported in Safari - using touch event fallbacks'
            );
        }

        if (capabilities.value.maxTouchPoints === 0 && capabilities.value.platform !== 'desktop') {
            recommendations.push('Multi-touch not detected - some gestures may not work');
        }

        if (capabilities.value.browserName === 'Safari' && capabilities.value.browserVersion < 13) {
            recommendations.push('Safari 13+ recommended for better touch event support');
        }

        if (capabilities.value.fallbackMode) {
            recommendations.push('Using mouse event fallbacks - touch experience may be limited');
        }

        return recommendations;
    };

    /**
     * Initialize touch compatibility system
     */
    const initialize = (): void => {
        if (isInitialized.value) return;

        detectCapabilities();
        isInitialized.value = true;
    };

    /**
     * Get touch capability summary
     */
    const getCapabilitySummary = (): TouchCapabilities & {
        recommendations: string[];
        hasCompatibilityIssues: boolean;
    } => ({
        ...capabilities.value,
        recommendations: getCompatibilityRecommendations(),
        hasCompatibilityIssues: getCompatibilityRecommendations().length > 0,
    });

    // Auto-initialize on mount
    onMounted(() => {
        initialize();
    });

    return {
        // State
        capabilities,
        activeGestures,
        touchHistory,
        isInitialized,

        // Methods
        initialize,
        normalizeTouchEvent,
        detectGesture,
        addTouchListener,
        getCompatibilityRecommendations,
        getCapabilitySummary,

        // Computed getters
        get touchSupported() {
            return capabilities.value.touchSupported;
        },
        get pointerSupported() {
            return capabilities.value.pointerSupported;
        },
        get isMobile() {
            return capabilities.value.isMobile;
        },
        get isTablet() {
            return capabilities.value.isTablet;
        },
        get platform() {
            return capabilities.value.platform;
        },
        get browserInfo() {
            return `${capabilities.value.browserName} ${capabilities.value.browserVersion}`;
        },
        get hasCompatibilityIssues() {
            return getCompatibilityRecommendations().length > 0;
        },
    };
}
