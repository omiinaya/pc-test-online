import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCommonTestPatterns, useTestTimers } from '../useCommonTestPatterns';

describe('useCommonTestPatterns', () => {
    let patterns: ReturnType<typeof useCommonTestPatterns>;
    let timers: ReturnType<typeof useTestTimers>;

    beforeEach(() => {
        patterns = useCommonTestPatterns();
        timers = useTestTimers();
    });

    describe('initial state', () => {
        it('should have actionsDisabled true', () => {
            expect(patterns.actionsDisabled.value).toBe(true);
        });

        it('should have loading false', () => {
            expect(patterns.loading.value).toBe(false);
        });

        it('should have error null', () => {
            expect(patterns.error.value).toBeNull();
        });

        it('should have skipped false', () => {
            expect(patterns.skipped.value).toBe(false);
        });

        it('should have testCompleted false', () => {
            expect(patterns.testCompleted.value).toBe(false);
        });
    });

    describe('handleTestPass', () => {
        it('should set testCompleted to true and actionsDisabled to true', () => {
            const emitMock = vi.fn();
            patterns.handleTestPass('webcam', emitMock);
            expect(patterns.testCompleted.value).toBe(true);
            expect(patterns.actionsDisabled.value).toBe(true);
        });

        it('should call emit callback with test-completed event', () => {
            const emitMock = vi.fn();
            patterns.handleTestPass('microphone', emitMock);
            expect(emitMock).toHaveBeenCalledWith('test-completed', {
                type: 'microphone',
                status: 'passed',
                timestamp: expect.any(Number),
            });
        });

        it('should not call emit if not provided', () => {
            patterns.handleTestPass('speaker', undefined);
            // Should not throw, just no-op
            expect(patterns.testCompleted.value).toBe(true);
        });
    });

    describe('handleTestFail', () => {
        it('should set error and actionsDisabled', () => {
            const emitMock = vi.fn();
            patterns.handleTestFail('keyboard', 'Connection lost', emitMock);
            expect(patterns.error.value).toBe('Connection lost');
            expect(patterns.actionsDisabled.value).toBe(true);
        });

        it('should call emit with test-failed event', () => {
            const emitMock = vi.fn();
            patterns.handleTestFail('mouse', 'Device busy', emitMock);
            expect(emitMock).toHaveBeenCalledWith('test-failed', {
                type: 'mouse',
                status: 'failed',
                error: 'Device busy',
                timestamp: expect.any(Number),
            });
        });
    });

    describe('handleTestSkip', () => {
        it('should set skipped and actionsDisabled', () => {
            const emitMock = vi.fn();
            patterns.handleTestSkip('touch', emitMock);
            expect(patterns.skipped.value).toBe(true);
            expect(patterns.actionsDisabled.value).toBe(true);
        });

        it('should call emit with test-skipped event', () => {
            const emitMock = vi.fn();
            patterns.handleTestSkip('battery', emitMock);
            expect(emitMock).toHaveBeenCalledWith('test-skipped', {
                type: 'battery',
                status: 'skipped',
                timestamp: expect.any(Number),
            });
        });
    });

    describe('resetTestState', () => {
        it('should reset all state to defaults', () => {
            // Set some state
            patterns.actionsDisabled.value = false;
            patterns.loading.value = true;
            patterns.error.value = 'Some error';
            patterns.skipped.value = true;
            patterns.testCompleted.value = true;

            patterns.resetTestState();

            expect(patterns.actionsDisabled.value).toBe(true);
            expect(patterns.loading.value).toBe(false);
            expect(patterns.error.value).toBeNull();
            expect(patterns.skipped.value).toBe(false);
            expect(patterns.testCompleted.value).toBe(false);
        });
    });
});

describe('useTestTimers', () => {
    let timers: ReturnType<typeof useTestTimers>;

    beforeEach(() => {
        timers = useTestTimers();
        vi.useFakeTimers();
    });

    afterEach(() => {
        timers.clearAllTimers();
        vi.useRealTimers();
    });

    it('should initialize skipTimer and testTimeout as null', () => {
        expect(timers.skipTimer.value).toBeNull();
        expect(timers.testTimeout.value).toBeNull();
    });

    it('startSkipTimer should set skipTimer to a timeout ID', () => {
        const callback = vi.fn();
        timers.startSkipTimer(callback, 1000);
        expect(timers.skipTimer.value).not.toBeNull();
    });

    it('clearSkipTimer should clear skipTimer and cancel timeout', () => {
        const callback = vi.fn();
        timers.startSkipTimer(callback, 1000);
        expect(timers.skipTimer.value).not.toBeNull();
        timers.clearSkipTimer();
        expect(timers.skipTimer.value).toBeNull();
    });

    it('startTestTimeout should set testTimeout to a timeout ID', () => {
        const callback = vi.fn();
        timers.startTestTimeout(callback, 5000);
        expect(timers.testTimeout.value).not.toBeNull();
    });

    it('clearTestTimeout should clear testTimeout and cancel timeout', () => {
        const callback = vi.fn();
        timers.startTestTimeout(callback, 5000);
        expect(timers.testTimeout.value).not.toBeNull();
        timers.clearTestTimeout();
        expect(timers.testTimeout.value).toBeNull();
    });

    it('clearAllTimers should clear both timers', () => {
        const cb1 = vi.fn();
        const cb2 = vi.fn();
        timers.startSkipTimer(cb1, 1000);
        timers.startTestTimeout(cb2, 5000);
        expect(timers.skipTimer.value).not.toBeNull();
        expect(timers.testTimeout.value).not.toBeNull();
        timers.clearAllTimers();
        expect(timers.skipTimer.value).toBeNull();
        expect(timers.testTimeout.value).toBeNull();
    });
});
