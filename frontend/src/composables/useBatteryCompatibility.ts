// Battery API compatibility layer for cross-browser support
import { ref } from 'vue';

export interface BatteryManager {
    charging: boolean;
    chargingTime: number;
    dischargingTime: number;
    level: number;
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
}

export interface MockBatteryManager extends BatteryManager {
    isMock: true;
    browserSupport: 'chrome' | 'unsupported';
    compatibilityMode: string;
    _demoInterval?: number;
}

export interface BatteryCompatibilityState {
    isSupported: boolean;
    batteryInfo: BatteryManager | MockBatteryManager | null;
    compatibilityWarning: string | null;
    browserName: string;
    fallbackMode: boolean;
}

/**
 * Cross-browser battery API compatibility composable
 * Provides graceful fallbacks for browsers that don't support the Battery API
 */
export function useBatteryCompatibility() {
    const state = ref<BatteryCompatibilityState>({
        isSupported: false,
        batteryInfo: null,
        compatibilityWarning: null,
        browserName: '',
        fallbackMode: false,
    });

    const listeners = ref<Array<{ type: string; listener: EventListener }>>([]);

    /**
     * Detect browser and capabilities
     */
    const detectBrowserCapabilities = () => {
        const userAgent = navigator.userAgent;

        if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) {
            state.value.browserName = 'Chrome';
        } else if (userAgent.includes('Firefox')) {
            state.value.browserName = 'Firefox';
        } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            state.value.browserName = 'Safari';
        } else if (userAgent.includes('Edge')) {
            state.value.browserName = 'Edge';
        } else {
            state.value.browserName = 'Unknown';
        }

        // Check if Battery API is available
        state.value.isSupported = 'getBattery' in navigator;
    };

    /**
     * Initialize battery monitoring with fallbacks
     */
    const initBattery = async (): Promise<BatteryManager | MockBatteryManager> => {
        detectBrowserCapabilities();

        // Try native Battery API first
        if (state.value.isSupported) {
            try {
                const battery = await (navigator as any).getBattery();
                state.value.batteryInfo = battery;
                state.value.fallbackMode = false;

                console.log('✅ Native Battery API initialized');
                return battery;
            } catch (error) {
                console.warn('❌ Battery API failed despite detection:', error);
            }
        }

        // Create fallback battery manager
        const mockBattery = createMockBatteryManager();
        state.value.batteryInfo = mockBattery;
        state.value.fallbackMode = true;

        // Set browser-specific compatibility warnings
        switch (state.value.browserName) {
            case 'Firefox':
                state.value.compatibilityWarning =
                    'Battery testing is not supported in Firefox due to privacy restrictions. Showing demo data.';
                break;
            case 'Safari':
                state.value.compatibilityWarning =
                    'Battery testing is not supported in Safari. For full functionality, please use Chrome.';
                break;
            default:
                state.value.compatibilityWarning =
                    'Battery testing is not supported in this browser. Chrome recommended for complete functionality.';
        }

        console.log(`⚠️ Using fallback battery manager for ${state.value.browserName}`);
        return mockBattery;
    };

    /**
     * Create a mock battery manager for unsupported browsers
     */
    const createMockBatteryManager = (): MockBatteryManager => {
        const mockBattery: MockBatteryManager = {
            isMock: true,
            browserSupport: 'unsupported',
            compatibilityMode: `Fallback for ${state.value.browserName}`,

            // Demo battery values that simulate realistic behavior
            charging: Math.random() > 0.5, // Random charging state
            chargingTime: Infinity,
            dischargingTime: Math.floor(Math.random() * 10) * 3600, // 0-10 hours
            level: Math.round((0.2 + Math.random() * 0.7) * 100) / 100, // 20-90%

            // Mock event listener methods
            addEventListener: (type: string, listener: EventListener) => {
                listeners.value.push({ type, listener });

                // Simulate occasional battery events for demo purposes
                if (type === 'levelchange') {
                    const interval = setInterval(() => {
                        // Simulate small level changes
                        const currentLevel = mockBattery.level;
                        const change = (Math.random() - 0.5) * 0.02; // ±1% change
                        mockBattery.level = Math.max(0, Math.min(1, currentLevel + change));

                        // Call the listener with a mock event
                        listener({
                            type: 'levelchange',
                            target: mockBattery,
                        } as any);
                    }, 30000); // Every 30 seconds

                    // Store interval for cleanup
                    mockBattery._demoInterval = interval;
                }
            },

            removeEventListener: (type: string, listener: EventListener) => {
                const index = listeners.value.findIndex(
                    l => l.type === type && l.listener === listener
                );
                if (index !== -1) {
                    listeners.value.splice(index, 1);
                }

                // Clean up demo interval if removing level change listener
                if (type === 'levelchange' && mockBattery._demoInterval) {
                    clearInterval(mockBattery._demoInterval);
                    delete mockBattery._demoInterval;
                }
            },
        } as MockBatteryManager & { _demoInterval?: number };

        return mockBattery;
    };

    /**
     * Get user-friendly battery status
     */
    const getBatteryStatus = () => {
        if (!state.value.batteryInfo) return null;

        const battery = state.value.batteryInfo;
        const isCharging = battery.charging;
        const level = Math.round(battery.level * 100);

        let status = `${level}%`;

        if (isCharging) {
            status += ' (Charging)';
        } else if (battery.dischargingTime !== Infinity) {
            const hours = Math.floor(battery.dischargingTime / 3600);
            const minutes = Math.floor((battery.dischargingTime % 3600) / 60);
            status += ` (${hours}h ${minutes}m remaining)`;
        }

        return {
            level,
            isCharging,
            status,
            timeRemaining: battery.dischargingTime,
            timeToCharge: battery.chargingTime,
            isMockData: 'isMock' in battery,
        };
    };

    /**
     * Check if battery testing is meaningful in current browser
     */
    const isBatteryTestingSupported = () => {
        return state.value.isSupported && !state.value.fallbackMode;
    };

    /**
     * Get browser-specific recommendations
     */
    const getBrowserRecommendations = () => {
        if (state.value.isSupported && !state.value.fallbackMode) {
            return null; // No recommendations needed
        }

        return {
            primaryRecommendation: 'For complete battery testing, please use Google Chrome.',
            alternativeOptions: ['Microsoft Edge (Chromium-based)', 'Opera', 'Brave Browser'],
            explanation: 'These browsers support the native Battery API for accurate testing.',
            learnMoreUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Battery_Status_API',
        };
    };

    /**
     * Cleanup function
     */
    const cleanup = () => {
        listeners.value.forEach(({ type, listener }) => {
            if (state.value.batteryInfo) {
                state.value.batteryInfo.removeEventListener(type, listener);
            }
        });
        listeners.value = [];

        // Clean up any demo intervals
        if (state.value.batteryInfo && 'isMock' in state.value.batteryInfo) {
            const mockBattery = state.value.batteryInfo as any;
            if (mockBattery._demoInterval) {
                clearInterval(mockBattery._demoInterval);
            }
        }
    };

    return {
        // State
        state,

        // Methods
        initBattery,
        getBatteryStatus,
        isBatteryTestingSupported,
        getBrowserRecommendations,
        cleanup,

        // Computed getters
        get isSupported() {
            return state.value.isSupported;
        },
        get batteryInfo() {
            return state.value.batteryInfo;
        },
        get compatibilityWarning() {
            return state.value.compatibilityWarning;
        },
        get browserName() {
            return state.value.browserName;
        },
        get fallbackMode() {
            return state.value.fallbackMode;
        },
    };
}
