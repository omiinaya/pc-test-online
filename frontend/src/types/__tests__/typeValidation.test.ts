import { describe, it, expect } from 'vitest';
import type {
    DeviceType,
    TestType,
    TestStatus,
    StatePanelState,
    DeviceInfo,
    TestResult,
    TestConfig,
    VueRef,
    VueComputed,
    VueReactive,
} from '../index';

/**
 * Comprehensive type validation tests for TypeScript migration
 * This ensures all types are properly defined and compatible
 */
describe('TypeScript Type Validation', () => {
    describe('Core Type Definitions', () => {
        it('should validate DeviceType enum values', () => {
            const deviceTypes: DeviceType[] = [
                'webcam',
                'microphone',
                'speakers',
                'keyboard',
                'mouse',
                'touch',
                'battery',
            ];

            expect(deviceTypes).toBeInstanceOf(Array);
            expect(deviceTypes).toHaveLength(7);
        });

        it('should validate TestType enum values', () => {
            const testTypes: TestType[] = [
                'webcam',
                'microphone',
                'speakers',
                'keyboard',
                'mouse',
                'touch',
                'battery',
            ];

            expect(testTypes).toBeInstanceOf(Array);
            expect(testTypes).toHaveLength(7);
        });

        it('should validate TestStatus enum values', () => {
            const testStatuses: TestStatus[] = [
                'pending',
                'running',
                'completed',
                'skipped',
                'failed',
            ];

            expect(testStatuses).toBeInstanceOf(Array);
            expect(testStatuses).toHaveLength(5);
        });

        it('should validate StatePanelState enum values', () => {
            const panelStates: StatePanelState[] = [
                'loading',
                'success',
                'error',
                'info',
                'warning',
            ];

            expect(panelStates).toBeInstanceOf(Array);
            expect(panelStates).toHaveLength(5);
        });
    });

    describe('Interface Structures', () => {
        it('should validate DeviceInfo interface', () => {
            const deviceInfo: DeviceInfo = {
                deviceId: 'test-device-123',
                label: 'Test Webcam',
                kind: 'videoinput',
                groupId: 'group-1',
            };

            expect(deviceInfo).toHaveProperty('deviceId');
            expect(deviceInfo).toHaveProperty('label');
            expect(deviceInfo).toHaveProperty('kind');
            expect(deviceInfo).toHaveProperty('groupId');
            expect(typeof deviceInfo.deviceId).toBe('string');
        });

        it('should validate TestResult interface', () => {
            const testResult: TestResult = {
                testType: 'webcam',
                status: 'completed',
                timestamp: Date.now(),
                success: true,
                data: { resolution: '1280x720' },
                error: null,
            };

            expect(testResult).toHaveProperty('testType');
            expect(testResult).toHaveProperty('status');
            expect(testResult).toHaveProperty('timestamp');
            expect(testResult).toHaveProperty('success');
            expect(testResult).toHaveProperty('data');
            expect(testResult).toHaveProperty('error');
        });

        it('should validate TestConfig interface', () => {
            const testConfig: TestConfig = {
                testType: 'microphone',
                timeout: 30000,
                autoStart: true,
                requirePermissions: true,
            };

            expect(testConfig).toHaveProperty('testType');
            expect(testConfig).toHaveProperty('timeout');
            expect(testConfig).toHaveProperty('autoStart');
            expect(testConfig).toHaveProperty('requirePermissions');
        });
    });

    describe('Vue Composition API Types', () => {
        it('should validate VueRef type', () => {
            const refValue: VueRef<string> = { value: 'test' };
            expect(refValue).toHaveProperty('value');
            expect(refValue.value).toBe('test');
        });

        it('should validate VueComputed type', () => {
            const computedValue: VueComputed<number> = { value: 42 };
            expect(computedValue).toHaveProperty('value');
            expect(computedValue.value).toBe(42);
        });

        it('should validate VueReactive type', () => {
            const reactiveObj: VueReactive<{ name: string }> = { name: 'test' };
            expect(reactiveObj).toHaveProperty('name');
            expect(reactiveObj.name).toBe('test');
        });
    });

    describe('Type Compatibility', () => {
        it('should ensure DeviceType and TestType are compatible', () => {
            const deviceType: DeviceType = 'webcam';
            const testType: TestType = deviceType; // This should work

            expect(testType).toBe('webcam');
        });

        it('should handle optional properties correctly', () => {
            const partialTestResult: Partial<TestResult> = {
                testType: 'keyboard',
                status: 'pending',
            };

            expect(partialTestResult.testType).toBe('keyboard');
            expect(partialTestResult.timestamp).toBeUndefined();
        });

        it('should handle union types correctly', () => {
            const status: TestStatus | StatePanelState = 'loading';
            expect(['loading', 'pending']).toContain(status);
        });
    });
});

/**
 * Test for composable function types
 */
describe('Composable Function Types', () => {
    it('should validate useBaseDeviceTest return type', async () => {
        // This is a type test - we're testing that the types exist and are compatible
        const mockReturn = {
            deviceType: 'webcam' as DeviceType,
            testStatus: { value: 'pending' as TestStatus },
            testResults: { value: [] as TestResult[] },
            startTest: async () => {},
            stopTest: () => {},
            resetTest: () => {},
        };

        expect(mockReturn.deviceType).toBe('webcam');
        expect(mockReturn.testStatus.value).toBe('pending');
        expect(mockReturn.testResults.value).toEqual([]);
        expect(typeof mockReturn.startTest).toBe('function');
    });

    it('should validate Vue component prop types', () => {
        const mockProps = {
            testType: 'microphone' as TestType,
            deviceLabel: 'Built-in Microphone',
            isActive: true,
            testConfig: {
                timeout: 30000,
                autoStart: false,
            } as Partial<TestConfig>,
        };

        expect(mockProps.testType).toBe('microphone');
        expect(mockProps.deviceLabel).toBe('Built-in Microphone');
        expect(mockProps.isActive).toBe(true);
        expect(mockProps.testConfig.timeout).toBe(30000);
    });
});

/**
 * Test for error handling types
 */
describe('Error Handling Types', () => {
    it('should handle error types in TestResult', () => {
        const errorResult: TestResult = {
            testType: 'webcam',
            status: 'failed',
            timestamp: Date.now(),
            success: false,
            data: null,
            error: new Error('Camera not found'),
        };

        expect(errorResult.error).toBeInstanceOf(Error);
        expect(errorResult.error?.message).toBe('Camera not found');
    });

    it('should handle null error values', () => {
        const successResult: TestResult = {
            testType: 'speakers',
            status: 'completed',
            timestamp: Date.now(),
            success: true,
            data: { volume: 80 },
            error: null,
        };

        expect(successResult.error).toBeNull();
        expect(successResult.success).toBe(true);
    });
});
