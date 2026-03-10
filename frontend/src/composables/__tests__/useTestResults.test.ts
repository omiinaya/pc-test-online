import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTestResults } from '../useTestResults';
import type { TestType } from '../../types';

describe('useTestResults', () => {
    const mockEmit = vi.fn();
    let testType: TestType;

    beforeEach(() => {
        mockEmit.mockClear();
        testType = 'webcam' as TestType;
    });

    describe('initial state', () => {
        it('should initialize with pending status', () => {
            const { testStatus } = useTestResults(testType, mockEmit);
            expect(testStatus.value).toBe('pending');
        });

        it('should initialize with null timestamps', () => {
            const { testStartTime, testEndTime } = useTestResults(testType, mockEmit);
            expect(testStartTime.value).toBeNull();
            expect(testEndTime.value).toBeNull();
        });

        it('should initialize with zero attempts', () => {
            const { testAttempts } = useTestResults(testType, mockEmit);
            expect(testAttempts.value).toBe(0);
        });

        it('should initialize with null lastError', () => {
            const { lastError } = useTestResults(testType, mockEmit);
            expect(lastError.value).toBeNull();
        });

        it('should have isTestRunning as false initially', () => {
            const { isTestRunning } = useTestResults(testType, mockEmit);
            expect(isTestRunning.value).toBe(false);
        });

        it('should have isTestCompleted as false initially', () => {
            const { isTestCompleted } = useTestResults(testType, mockEmit);
            expect(isTestCompleted.value).toBe(false);
        });

        it('should have isTestFailed as false initially', () => {
            const { isTestFailed } = useTestResults(testType, mockEmit);
            expect(isTestFailed.value).toBe(false);
        });

        it('should have isTestSkipped as false initially', () => {
            const { isTestSkipped } = useTestResults(testType, mockEmit);
            expect(isTestSkipped.value).toBe(false);
        });

        it('should have testDuration as null initially', () => {
            const { testDuration } = useTestResults(testType, mockEmit);
            expect(testDuration.value).toBeNull();
        });
    });

    describe('startTest', () => {
        it('should set status to running', () => {
            const { testStatus, startTest } = useTestResults(testType, mockEmit);
            startTest();
            expect(testStatus.value).toBe('running');
        });

        it('should set start time', () => {
            const { testStartTime, startTest } = useTestResults(testType, mockEmit);
            const before = Date.now();
            startTest();
            const after = Date.now();
            expect(testStartTime.value).toBeGreaterThanOrEqual(before);
            expect(testStartTime.value).toBeLessThanOrEqual(after);
        });

        it('should clear end time', () => {
            const { testEndTime, startTest } = useTestResults(testType, mockEmit);
            testEndTime.value = 1000;
            startTest();
            expect(testEndTime.value).toBeNull();
        });

        it('should increment attempts', () => {
            const { testAttempts, startTest } = useTestResults(testType, mockEmit);
            startTest();
            startTest();
            expect(testAttempts.value).toBe(2);
        });

        it('should clear lastError', () => {
            const { lastError, startTest } = useTestResults(testType, mockEmit);
            lastError.value = 'Some error';
            startTest();
            expect(lastError.value).toBeNull();
        });

        it('should not emit any event on start', () => {
            const { startTest } = useTestResults(testType, mockEmit);
            startTest();
            expect(mockEmit).not.toHaveBeenCalled();
        });
    });

    describe('completeTest', () => {
        it('should set status to completed', () => {
            const { testStatus, completeTest } = useTestResults(testType, mockEmit);
            completeTest();
            expect(testStatus.value).toBe('completed');
        });

        it('should set end time', () => {
            const { testEndTime, completeTest } = useTestResults(testType, mockEmit);
            const before = Date.now();
            completeTest();
            const after = Date.now();
            expect(testEndTime.value).toBeGreaterThanOrEqual(before);
            expect(testEndTime.value).toBeLessThanOrEqual(after);
        });

        it('should calculate testDuration', () => {
            const { testDuration, completeTest, testStartTime, startTest } = useTestResults(
                testType,
                mockEmit
            );
            // Start the test first to set status to running
            startTest();
            // Manually set start time to control duration
            const start = Date.now() - 1000;
            testStartTime.value = start;
            completeTest();
            expect(testDuration.value).toBeGreaterThanOrEqual(1000);
        });

        it('should emit test-completed event with correct arguments', () => {
            const { completeTest } = useTestResults(testType, mockEmit);
            const additionalData = { score: 95 };
            completeTest(additionalData);

            expect(mockEmit).toHaveBeenCalledTimes(1);
            expect(mockEmit).toHaveBeenCalledWith(
                'test-completed',
                testType,
                expect.objectContaining({
                    status: 'completed',
                    attempts: expect.any(Number),
                    timestamp: expect.any(String),
                    duration: expect.any(Number),
                    score: 95,
                })
            );
        });

        it('should auto-start if called without startTest', () => {
            const { testStatus, completeTest } = useTestResults(testType, mockEmit);
            completeTest();
            expect(testStatus.value).toBe('completed');
        });

        it('should not emit multiple times if called twice', () => {
            const { completeTest } = useTestResults(testType, mockEmit);
            completeTest();
            completeTest();
            expect(mockEmit).toHaveBeenCalledTimes(1);
        });
    });

    describe('failTest', () => {
        it('should set status to failed', () => {
            const { testStatus, failTest } = useTestResults(testType, mockEmit);
            failTest('Something went wrong');
            expect(testStatus.value).toBe('failed');
        });

        it('should set lastError', () => {
            const { lastError, failTest } = useTestResults(testType, mockEmit);
            failTest('Error message');
            expect(lastError.value).toBe('Error message');
        });

        it('should set end time', () => {
            const { testEndTime, failTest } = useTestResults(testType, mockEmit);
            failTest('Error');
            expect(testEndTime.value).not.toBeNull();
        });

        it('should emit test-failed event', () => {
            const { failTest } = useTestResults(testType, mockEmit);
            failTest('Test failure');
            expect(mockEmit).toHaveBeenCalledWith(
                'test-failed',
                testType,
                expect.objectContaining({
                    status: 'failed',
                    error: 'Test failure',
                })
            );
        });

        it('should include additionalData in emission', () => {
            const { failTest } = useTestResults(testType, mockEmit);
            failTest('Failure', { detail: 'more info' });
            expect(mockEmit).toHaveBeenCalledWith(
                'test-failed',
                testType,
                expect.objectContaining({
                    status: 'failed',
                    error: 'Failure',
                    detail: 'more info',
                })
            );
        });
    });

    describe('skipTest', () => {
        it('should set status to skipped', () => {
            const { testStatus, skipTest } = useTestResults(testType, mockEmit);
            skipTest('Not supported');
            expect(testStatus.value).toBe('skipped');
        });

        it('should not set lastError on skip', () => {
            const { lastError, skipTest } = useTestResults(testType, mockEmit);
            skipTest('Browser not supported');
            expect(lastError.value).toBeNull();
        });

        it('should emit test-skipped event', () => {
            const { skipTest } = useTestResults(testType, mockEmit);
            skipTest('Skipped');
            expect(mockEmit).toHaveBeenCalledWith(
                'test-skipped',
                testType,
                expect.objectContaining({
                    status: 'skipped',
                    reason: 'Skipped',
                })
            );
        });
    });

    describe('resetTest', () => {
        it('should reset status to pending', () => {
            const { testStatus, completeTest, resetTest } = useTestResults(testType, mockEmit);
            completeTest();
            resetTest();
            expect(testStatus.value).toBe('pending');
        });

        it('should clear timestamps', () => {
            const { testStartTime, testEndTime, completeTest, resetTest } = useTestResults(
                testType,
                mockEmit
            );
            completeTest();
            resetTest();
            expect(testStartTime.value).toBeNull();
            expect(testEndTime.value).toBeNull();
        });

        it('should clear attempts', () => {
            const { testAttempts, startTest, resetTest } = useTestResults(testType, mockEmit);
            startTest();
            startTest();
            resetTest();
            expect(testAttempts.value).toBe(0);
        });

        it('should clear lastError', () => {
            const { lastError, failTest, resetTest } = useTestResults(testType, mockEmit);
            failTest('Error');
            resetTest();
            expect(lastError.value).toBeNull();
        });
    });

    describe('retryTest', () => {
        it('should reset and start test', () => {
            const { testStatus, failTest, retryTest } = useTestResults(testType, mockEmit);
            failTest('Failed');
            expect(testStatus.value).toBe('failed');
            retryTest();
            expect(testStatus.value).toBe('running');
        });

        it('should increment attempts', () => {
            const { testAttempts, retryTest } = useTestResults(testType, mockEmit);
            retryTest();
            expect(testAttempts.value).toBe(1);
        });

        it('should clear lastError', () => {
            const { lastError, failTest, retryTest } = useTestResults(testType, mockEmit);
            failTest('Error');
            retryTest();
            expect(lastError.value).toBeNull();
        });
    });
});
