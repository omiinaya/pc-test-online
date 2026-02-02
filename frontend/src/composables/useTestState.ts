import { ref, reactive, computed, watch, type Ref, type ComputedRef, type WatchStopHandle } from 'vue';
import type { TestType, DeviceInfo, PermissionState as PermissionStatus } from '../types';

// Shared state interfaces
export interface TestState {
  isActive: boolean;
  hasBeenInitialized: boolean;
  lastError: string | null;
  isLoading: boolean;
  retryCount: number;
}

export interface DeviceCache {
  devices: DeviceInfo[];
  lastUpdated: number | null;
  isEnumerating: boolean;
}

export interface PermissionCache {
  state: PermissionStatus | null;
  lastChecked: number | null;
  isChecking: boolean;
}

// Shared state for common test functionality
const testStates = reactive<Record<string, TestState>>({});
const deviceCaches = reactive<Record<string, DeviceCache>>({});
const permissionStates = reactive<Record<string, PermissionCache>>({});

// Global reset trigger
const globalResetTrigger: Ref<number> = ref(0);

export interface UseTestStateReturn {
  isActive: ComputedRef<boolean>;
  hasBeenInitialized: ComputedRef<boolean>;
  lastError: ComputedRef<string | null>;
  isLoading: ComputedRef<boolean>;
  retryCount: ComputedRef<number>;
  setActive: (active: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  incrementRetry: () => void;
  resetState: () => void;
}

export function useTestState(testType: TestType): UseTestStateReturn {
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
  const isActive: ComputedRef<boolean> = computed(() => state?.isActive ?? false);
  const hasBeenInitialized: ComputedRef<boolean> = computed(() => state?.hasBeenInitialized ?? false);
  const lastError: ComputedRef<string | null> = computed(() => state?.lastError ?? null);
  const isLoading: ComputedRef<boolean> = computed(() => state?.isLoading ?? false);
  const retryCount: ComputedRef<number> = computed(() => state?.retryCount ?? 0);

  // Methods
  const setActive = (active: boolean): void => {
    if (state) state.isActive = active;
  };

  const setInitialized = (initialized: boolean): void => {
    if (state) state.hasBeenInitialized = initialized;
  };

  const setError = (error: string | null): void => {
    if (state) state.lastError = error;
  };

  const setLoading = (loading: boolean): void => {
    if (state) state.isLoading = loading;
  };

  const incrementRetry = (): void => {
    if (state) state.retryCount++;
  };

  const resetState = (): void => {
    if (state) {
      state.isActive = false;
      state.hasBeenInitialized = false;
      state.lastError = null;
      state.isLoading = false;
      state.retryCount = 0;
    }
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
export interface UseDeviceCacheReturn {
  getCachedDevices: () => DeviceInfo[] | null;
  setCachedDevices: (devices: DeviceInfo[]) => void;
  setEnumerating: (enumerating: boolean) => void;
  clearCache: () => void;
  isCacheValid: ComputedRef<boolean>;
  isEnumerating: ComputedRef<boolean>;
}

export function useDeviceCache(deviceType: string): UseDeviceCacheReturn {
  if (!deviceCaches[deviceType]) {
    deviceCaches[deviceType] = {
      devices: [],
      lastUpdated: null,
      isEnumerating: false,
    };
  }

  const cache = deviceCaches[deviceType];
  const CACHE_DURATION = 30000; // 30 seconds

  const isCacheValid: ComputedRef<boolean> = computed(() => {
    return cache?.lastUpdated !== null && Date.now() - (cache?.lastUpdated ?? 0) < CACHE_DURATION;
  });

  const getCachedDevices = (): DeviceInfo[] | null => {
    if (isCacheValid.value && cache) {
      return cache.devices;
    }
    return null;
  };

  const setCachedDevices = (devices: DeviceInfo[]): void => {
    if (cache) {
      cache.devices = devices;
      cache.lastUpdated = Date.now();
    }
  };

  const setEnumerating = (enumerating: boolean): void => {
    if (cache) {
      cache.isEnumerating = enumerating;
    }
  };

  const clearCache = (): void => {
    if (cache) {
      cache.devices = [];
      cache.lastUpdated = null;
      cache.isEnumerating = false;
    }
  };

  return {
    getCachedDevices,
    setCachedDevices,
    setEnumerating,
    clearCache,
    isCacheValid,
    isEnumerating: computed(() => cache?.isEnumerating ?? false),
  };
}

// Permission state management to prevent redundant permission requests
export interface UsePermissionStateReturn {
  getCachedPermission: () => PermissionStatus | null;
  setCachedPermission: (state: PermissionStatus) => void;
  setChecking: (checking: boolean) => void;
  clearPermissionCache: () => void;
  isPermissionCacheValid: ComputedRef<boolean>;
  isChecking: ComputedRef<boolean>;
}

export function usePermissionState(permissionType: string): UsePermissionStateReturn {
  if (!permissionStates[permissionType]) {
    permissionStates[permissionType] = {
      state: null,
      lastChecked: null,
      isChecking: false,
    };
  }

  const permission = permissionStates[permissionType];
  const PERMISSION_CACHE_DURATION = 60000; // 1 minute

  const isPermissionCacheValid: ComputedRef<boolean> = computed(() => {
    return (
      permission?.lastChecked !== null &&
      Date.now() - (permission?.lastChecked ?? 0) < PERMISSION_CACHE_DURATION
    );
  });

  const getCachedPermission = (): PermissionStatus | null => {
    if (isPermissionCacheValid.value && permission) {
      return permission.state;
    }
    return null;
  };

  const setCachedPermission = (state: PermissionStatus): void => {
    if (permission) {
      permission.state = state;
      permission.lastChecked = Date.now();
    }
  };

  const setChecking = (checking: boolean): void => {
    if (permission) {
      permission.isChecking = checking;
    }
  };

  const clearPermissionCache = (): void => {
    if (permission) {
      permission.state = null;
      permission.lastChecked = null;
      permission.isChecking = false;
    }
  };

  return {
    getCachedPermission,
    setCachedPermission,
    setChecking,
    clearPermissionCache,
    isPermissionCacheValid,
    isChecking: computed(() => permission?.isChecking ?? false),
  };
}

// Global reset function for all test states
export function resetAllTestStates(): void {
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
export interface UseGlobalResetReturn {
  stopWatching: WatchStopHandle;
}

export function useGlobalReset(resetCallback: () => void): UseGlobalResetReturn {
  const previousResetCount = ref(globalResetTrigger.value);

  const stopWatching = watch(
    globalResetTrigger,
    (newValue: number) => {
      if (newValue > previousResetCount.value) {
        previousResetCount.value = newValue;
        resetCallback();
      }
    },
    { immediate: false }
  );

  return {
    stopWatching,
  };
}