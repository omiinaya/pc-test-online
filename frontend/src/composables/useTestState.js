import { ref, reactive, computed, watch } from 'vue';

// Shared state for common test functionality
const testStates = reactive({});
const deviceCaches = reactive({});
const permissionStates = reactive({});

// Global reset trigger
const globalResetTrigger = ref(0);

export function useTestState(testType) {
    // Initialize state for this test type if it doesn't exist
    if (!testStates[testType]) {
        testStates[testType] = {
            isActive: false,
            hasBeenInitialized: false,
            lastError: null,
            isLoading: false,
            retryCount: 0,
        };
    }

    const state = testStates[testType];

    // Computed properties
    const isActive = computed(() => state.isActive);
    const hasBeenInitialized = computed(() => state.hasBeenInitialized);
    const lastError = computed(() => state.lastError);
    const isLoading = computed(() => state.isLoading);
    const retryCount = computed(() => state.retryCount);

    // Methods
    const setActive = active => {
        state.isActive = active;
    };

    const setInitialized = initialized => {
        state.hasBeenInitialized = initialized;
    };

    const setError = error => {
        state.lastError = error;
    };

    const setLoading = loading => {
        state.isLoading = loading;
    };

    const incrementRetry = () => {
        state.retryCount++;
    };

    const resetState = () => {
        state.isActive = false;
        state.hasBeenInitialized = false;
        state.lastError = null;
        state.isLoading = false;
        state.retryCount = 0;
    };

    return {
        // State
        isActive,
        hasBeenInitialized,
        lastError,
        isLoading,
        retryCount,

        // Methods
        setActive,
        setInitialized,
        setError,
        setLoading,
        incrementRetry,
        resetState,
    };
}

// Device enumeration cache to prevent redundant API calls
export function useDeviceCache(deviceType) {
    if (!deviceCaches[deviceType]) {
        deviceCaches[deviceType] = {
            devices: [],
            lastUpdated: null,
            isEnumerating: false,
        };
    }

    const cache = deviceCaches[deviceType];
    const CACHE_DURATION = 30000; // 30 seconds

    const isCacheValid = computed(() => {
        return cache.lastUpdated && Date.now() - cache.lastUpdated < CACHE_DURATION;
    });

    const getCachedDevices = () => {
        if (isCacheValid.value) {
            return cache.devices;
        }
        return null;
    };

    const setCachedDevices = devices => {
        cache.devices = devices;
        cache.lastUpdated = Date.now();
    };

    const setEnumerating = enumerating => {
        cache.isEnumerating = enumerating;
    };

    const clearCache = () => {
        cache.devices = [];
        cache.lastUpdated = null;
        cache.isEnumerating = false;
    };

    return {
        getCachedDevices,
        setCachedDevices,
        setEnumerating,
        clearCache,
        isCacheValid,
        isEnumerating: computed(() => cache.isEnumerating),
    };
}

// Permission state management to prevent redundant permission requests
export function usePermissionState(permissionType) {
    if (!permissionStates[permissionType]) {
        permissionStates[permissionType] = {
            state: null, // null, 'granted', 'denied', 'prompt'
            lastChecked: null,
            isChecking: false,
        };
    }

    const permission = permissionStates[permissionType];
    const PERMISSION_CACHE_DURATION = 60000; // 1 minute

    const isPermissionCacheValid = computed(() => {
        return (
            permission.lastChecked &&
            Date.now() - permission.lastChecked < PERMISSION_CACHE_DURATION
        );
    });

    const getCachedPermission = () => {
        if (isPermissionCacheValid.value) {
            return permission.state;
        }
        return null;
    };

    const setCachedPermission = state => {
        permission.state = state;
        permission.lastChecked = Date.now();
    };

    const setChecking = checking => {
        permission.isChecking = checking;
    };

    const clearPermissionCache = () => {
        permission.state = null;
        permission.lastChecked = null;
        permission.isChecking = false;
    };

    return {
        getCachedPermission,
        setCachedPermission,
        setChecking,
        clearPermissionCache,
        isPermissionCacheValid,
        isChecking: computed(() => permission.isChecking),
    };
}

// Global reset function for all test states
export function resetAllTestStates() {
    Object.keys(testStates).forEach(testType => {
        testStates[testType] = {
            isActive: false,
            hasBeenInitialized: false,
            lastError: null,
            isLoading: false,
            retryCount: 0,
        };
    });

    Object.keys(deviceCaches).forEach(deviceType => {
        deviceCaches[deviceType] = {
            devices: [],
            lastUpdated: null,
            isEnumerating: false,
        };
    });

    Object.keys(permissionStates).forEach(permissionType => {
        permissionStates[permissionType] = {
            state: null,
            lastChecked: null,
            isChecking: false,
        };
    });

    // Trigger global reset for all components
    globalResetTrigger.value += 1;
}

// Composable to watch for global resets
export function useGlobalReset(resetCallback) {
    const previousResetCount = ref(globalResetTrigger.value);

    const stopWatching = watch(
        globalResetTrigger,
        newValue => {
            if (newValue > previousResetCount.value) {
                previousResetCount.value = newValue;
                if (typeof resetCallback === 'function') {
                    resetCallback();
                }
            }
        },
        { immediate: false }
    );

    return {
        stopWatching,
    };
}
