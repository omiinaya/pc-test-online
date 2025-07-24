// Global type definitions for the MMIT Testing Suite
// This file contains all shared types used across the application

import type { Ref, ComputedRef } from 'vue';

// ==================== DEVICE TYPES ====================

export type DeviceKind = 'videoinput' | 'audioinput' | 'audiooutput';
export type DeviceType = 'Camera' | 'Microphone' | 'Speaker';
export type PermissionName = 'camera' | 'microphone';

export interface DeviceInfo {
    deviceId: string;
    kind: DeviceKind;
    label: string;
    groupId?: string;
}

export interface DeviceConstraints {
    video?: MediaTrackConstraints | boolean;
    audio?: MediaTrackConstraints | boolean;
}

// ==================== TEST TYPES ====================

export type TestStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
export type TestType =
    | 'webcam'
    | 'microphone'
    | 'speakers'
    | 'keyboard'
    | 'mouse'
    | 'touch'
    | 'battery';

export interface TestResult {
    testType: TestType;
    status: TestStatus;
    duration: number | null;
    attempts: number;
    timestamp: string;
    error?: string;
    reason?: string;
    [key: string]: unknown;
}

export interface TestEmitData {
    type: TestType;
    status: TestStatus;
    timestamp: number;
    error?: string;
    [key: string]: unknown;
}

// ==================== STATE TYPES ====================

export type ComponentState =
    | 'initializing'
    | 'ready'
    | 'streaming'
    | 'testing'
    | 'completed'
    | 'error'
    | 'permission-required'
    | 'no-devices'
    | 'skipped'
    | 'failed';

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

export interface PermissionState {
    state: PermissionStatus['state'] | null;
    lastChecked: number | null;
    isChecking: boolean;
}

// ==================== ERROR TYPES ====================

export type ErrorType =
    | 'PERMISSION_DENIED'
    | 'PERMISSION_TIMEOUT'
    | 'DEVICE_NOT_FOUND'
    | 'DEVICE_BUSY'
    | 'DEVICE_TIMEOUT'
    | 'DEVICE_SWITCH_FAILED'
    | 'BROWSER_NOT_SUPPORTED'
    | 'HTTPS_REQUIRED'
    | 'INITIALIZATION_FAILED'
    | 'UNEXPECTED_ERROR';

export interface ErrorInfo {
    type: ErrorType;
    message: string;
    context?: string;
    originalError?: Error;
}

// ==================== COMPONENT PROPS ====================

export interface BaseTestProps {
    deviceKind?: DeviceKind;
    deviceType?: DeviceType;
    initialDeviceId?: string;
    autoStart?: boolean;
    timeoutMs?: number;
}

export interface DeviceTestBaseProps {
    deviceKind: DeviceKind;
    deviceType: string;
    initialDeviceId?: string;
}

export interface StatePanelProps {
    state: 'loading' | 'error' | 'success' | 'info' | 'warning';
    title: string;
    message: string;
    showRetry?: boolean;
    showSkip?: boolean;
    retryText?: string;
    skipText?: string;
}

// ==================== COMPONENT EMITS ====================

export interface BaseTestEmits {
    'test-completed': [testType: TestType, data: TestResult];
    'test-failed': [testType: TestType, data: TestResult];
    'test-skipped': [testType: TestType, data: TestResult];
    'start-over': [];
}

export interface DeviceTestEmits extends BaseTestEmits {
    'devices-ready': [data: { devices: DeviceInfo[]; selectedDeviceId: string }];
    'devices-error': [error: Error];
    'device-changed': [data: { deviceId: string; device: DeviceInfo }];
    'device-change-error': [error: Error];
}

// ==================== COMPOSABLE OPTIONS ====================

export interface UseDeviceTestOptions {
    deviceKind?: DeviceKind;
    deviceType?: DeviceType;
    permissionType?: PermissionName;
    testName?: string;
    autoInitialize?: boolean;
    enableEventListeners?: boolean;
    enableAnimations?: boolean;
    enableLifecycle?: boolean;
}

export interface UseErrorHandlingOptions {
    componentName?: string;
    logErrors?: boolean;
    rethrowErrors?: boolean;
}

export interface UseMediaStreamOptions {
    autoCleanup?: boolean;
    constraints?: DeviceConstraints;
}

// ==================== ANIMATION TYPES ====================

export interface AnimationConfig {
    duration: number;
    easing: string;
    delay?: number;
    fill?: FillMode;
}

export interface TransitionConfig {
    enter: AnimationConfig;
    leave: AnimationConfig;
}

// ==================== PERFORMANCE TYPES ====================

export interface PerformanceMetrics {
    fcp?: number; // First Contentful Paint
    lcp?: number; // Largest Contentful Paint
    fid?: number; // First Input Delay
    cls?: number; // Cumulative Layout Shift
    ttfb?: number; // Time to First Byte
    tti?: number; // Time to Interactive
}

export interface PerformanceBudget {
    maxBundleSize: number;
    maxChunkSize: number;
    maxImageSize: number;
    maxLCP: number;
    maxFID: number;
    maxCLS: number;
}

// ==================== I18N TYPES ====================

export type SupportedLocale = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh';

export interface LocaleConfig {
    code: SupportedLocale;
    name: string;
    dir: 'ltr' | 'rtl';
    dateFormat: string;
    numberFormat: Intl.NumberFormatOptions;
}

export interface TranslationKeys {
    // Common
    'common.loading': string;
    'common.error': string;
    'common.retry': string;
    'common.skip': string;
    'common.continue': string;
    'common.cancel': string;

    // Test-specific
    'test.webcam.title': string;
    'test.webcam.description': string;
    'test.microphone.title': string;
    'test.microphone.description': string;
    // ... other test translations

    // Errors
    'error.permission_denied': string;
    'error.device_not_found': string;
    'error.browser_not_supported': string;
    // ... other error translations
}

// ==================== UTILITY TYPES ====================

export type MaybeRef<T> = T | Ref<T>;
export type MaybeComputedRef<T> = T | Ref<T> | ComputedRef<T>;

export interface Fn<T = void> {
    (): T;
}

export interface AsyncFn<T = void> {
    (): Promise<T>;
}

// ==================== EVENT TYPES ====================

export interface PointerEventData {
    x: number;
    y: number;
    pressure?: number;
    pointerType: 'mouse' | 'pen' | 'touch';
    timestamp: number;
}

export interface KeyboardEventData {
    key: string;
    code: string;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    metaKey: boolean;
    timestamp: number;
}

// ==================== ACCESSIBILITY TYPES ====================

export interface A11yConfig {
    enableHighContrast: boolean;
    enableScreenReader: boolean;
    enableKeyboardNavigation: boolean;
    announceStateChanges: boolean;
    respectReducedMotion: boolean;
}

export interface ARIAAttributes {
    role?: string;
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
    'aria-expanded'?: boolean;
    'aria-selected'?: boolean;
    'aria-checked'?: boolean;
    'aria-disabled'?: boolean;
    'aria-hidden'?: boolean;
    'aria-live'?: 'polite' | 'assertive' | 'off';
    'aria-atomic'?: boolean;
}

// ==================== TYPE GUARDS ====================

export function isDeviceKind(value: string): value is DeviceKind {
    return ['videoinput', 'audioinput', 'audiooutput'].includes(value);
}

export function isTestStatus(value: string): value is TestStatus {
    return ['pending', 'running', 'completed', 'failed', 'skipped'].includes(value);
}

export function isTestType(value: string): value is TestType {
    return ['webcam', 'microphone', 'speakers', 'keyboard', 'mouse', 'touch', 'battery'].includes(
        value
    );
}

// ==================== CONSTANTS ====================

export const DEVICE_KINDS: DeviceKind[] = ['videoinput', 'audioinput', 'audiooutput'];
export const TEST_TYPES: TestType[] = [
    'webcam',
    'microphone',
    'speakers',
    'keyboard',
    'mouse',
    'touch',
    'battery',
];
export const TEST_STATUSES: TestStatus[] = ['pending', 'running', 'completed', 'failed', 'skipped'];

// Default timeouts and limits
export const DEFAULT_TIMEOUTS = {
    DEVICE_ENUMERATION: 5000,
    PERMISSION_REQUEST: 10000,
    STREAM_CREATION: 8000,
    TEST_COMPLETION: 30000,
} as const;

export const PERFORMANCE_BUDGETS: PerformanceBudget = {
    maxBundleSize: 2000000, // 2MB
    maxChunkSize: 500000, // 500KB
    maxImageSize: 1000000, // 1MB
    maxLCP: 2500, // 2.5s
    maxFID: 100, // 100ms
    maxCLS: 0.1, // 0.1
} as const;
