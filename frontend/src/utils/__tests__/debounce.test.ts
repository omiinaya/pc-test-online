import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce, throttle } from '../debounce';

describe('debounce', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should delay function execution until after wait period', () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100);

        debounced();
        expect(fn).not.toHaveBeenCalled();

        vi.advanceTimersByTime(100);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should cancel previous calls when invoked multiple times', () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100);

        debounced();
        debounced(); // This should cancel the first call
        debounced(); // This should cancel the second call

        vi.advanceTimersByTime(100);
        expect(fn).toHaveBeenCalledTimes(1); // Only the last call executes
    });

    it('should pass arguments to the debounced function', () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100);

        debounced('arg1', 'arg2');
        vi.advanceTimersByTime(100);

        expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should preserve this context', () => {
        const fn = vi.fn(function (this: any) {
            return this.value;
        });
        const context = { value: 42 };
        const debounced = debounce(fn, 100);

        debounced.call(context);
        vi.advanceTimersByTime(100);

        expect(fn).toHaveBeenCalledWith();
    });

    it('should support cancel method', () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100);

        debounced();
        debounced.cancel();
        vi.advanceTimersByTime(100);

        expect(fn).not.toHaveBeenCalled();
    });

    it('should support flush method', () => {
        const fn = vi.fn().mockReturnValue('result');
        const debounced = debounce(fn, 100);

        debounced();
        const result = debounced.flush();

        expect(fn).toHaveBeenCalled();
        expect(result).toBe('result');
    });

    it('should respect leading option', () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100, { leading: true });

        debounced();
        expect(fn).toHaveBeenCalledTimes(1); // Leading call

        debounced();
        vi.advanceTimersByTime(100);
        expect(fn).toHaveBeenCalledTimes(2); // Trailing call from second invocation

        debounced();
        vi.advanceTimersByTime(100);
        expect(fn).toHaveBeenCalledTimes(3); // Next leading call
    });

    it('should respect trailing option', () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100, { trailing: false });

        // With trailing false, function should not be called until leading is also enabled
        // But leading defaults to false, so no call occurs
        debounced();
        expect(fn).toHaveBeenCalledTimes(0); // No leading, no trailing

        debounced();
        vi.advanceTimersByTime(100);
        expect(fn).toHaveBeenCalledTimes(0); // Still no call
    });
});

describe('throttle', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should limit function calls to once per wait period', () => {
        const fn = vi.fn();
        const throttled = throttle(fn, 100);

        throttled();
        throttled();
        throttled();

        expect(fn).toHaveBeenCalledTimes(1); // Only first call executes

        vi.advanceTimersByTime(100);
        expect(fn).toHaveBeenCalledTimes(2); // Next allowed after wait period
    });

    it('should pass arguments to the throttled function', () => {
        const fn = vi.fn();
        const throttled = throttle(fn, 100);

        throttled('arg1', 'arg2');
        vi.advanceTimersByTime(100);
        throttled('arg3', 'arg4');

        expect(fn).toHaveBeenNthCalledWith(1, 'arg1', 'arg2');
        expect(fn).toHaveBeenNthCalledWith(2, 'arg3', 'arg4');
    });

    it('should support cancel method', () => {
        const fn = vi.fn();
        const throttled = throttle(fn, 100);

        throttled();
        throttled.cancel();
        vi.advanceTimersByTime(100);

        expect(fn).toHaveBeenCalledTimes(1); // leading call was made; cancel prevents any further calls
    });

    it('should support flush method', () => {
        const fn = vi.fn().mockReturnValue('throttled result');
        const throttled = throttle(fn, 100);

        throttled();
        const result = throttled.flush();

        expect(fn).toHaveBeenCalled();
        expect(result).toBe('throttled result');
    });
});
