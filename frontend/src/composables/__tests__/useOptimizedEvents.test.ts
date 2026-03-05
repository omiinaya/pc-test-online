import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useOptimizedEvents } from '../useOptimizedEvents';

describe('useOptimizedEvents', () => {
    let addEventListener: typeof vi.fn;
    let removeEventListener: typeof vi.fn;
    let originalAddEventListener: typeof addEventListener;
    let originalRemoveEventListener: typeof removeEventListener;

    beforeEach(() => {
        addEventListener = vi.fn();
        removeEventListener = vi.fn();
        originalAddEventListener = window.addEventListener;
        originalRemoveEventListener = window.removeEventListener;
        window.addEventListener = addEventListener;
        window.removeEventListener = removeEventListener;
    });

    afterEach(() => {
        window.addEventListener = originalAddEventListener;
        window.removeEventListener = originalRemoveEventListener;
        vi.clearAllMocks();
    });

    it('returns all expected methods', () => {
        const listeners = useOptimizedEvents();
        expect(typeof listeners.addOptimizedEventListener).toBe('function');
        expect(typeof listeners.addResizeListener).toBe('function');
        expect(typeof listeners.addScrollListener).toBe('function');
        expect(typeof listeners.addInputListener).toBe('function');
        expect(typeof listeners.addVisibilityChangeListener).toBe('function');
        expect(typeof listeners.cleanupAll).toBe('function');
    });

    it('adds resize listener with debounce', () => {
        const listeners = useOptimizedEvents();
        const mockCallback = vi.fn();

        listeners.addResizeListener(mockCallback);

        expect(addEventListener).toHaveBeenCalledWith(window, 'resize', expect.any(Function), {
            passive: true,
        });
    });

    it('adds scroll listener with throttle', () => {
        const listeners = useOptimizedEvents();
        const mockCallback = vi.fn();

        listeners.addScrollListener(mockCallback);

        expect(addEventListener).toHaveBeenCalledWith(window, 'scroll', expect.any(Function), {
            passive: true,
        });
    });

    it('adds visibility change listener', () => {
        const listeners = useOptimizedEvents();
        const mockCallback = vi.fn();

        listeners.addVisibilityChangeListener(mockCallback);

        expect(addEventListener).toHaveBeenCalledWith(
            document,
            'visibilitychange',
            expect.any(Function),
            undefined
        );
    });

    it('cleans up all listeners', () => {
        const listeners = useOptimizedEvents();
        const mockCallback = vi.fn();

        listeners.addOptimizedEventListener(window, 'test', mockCallback);
        listeners.cleanupAll();

        // Should have called removeEventListener for the test event
        expect(removeEventListener).toHaveBeenCalledWith(
            window,
            'test',
            expect.any(Function),
            undefined
        );
    });

    it('returns a remove function from addOptimizedEventListener', () => {
        const listeners = useOptimizedEvents();
        const mockCallback = vi.fn();

        const remove = listeners.addOptimizedEventListener(window, 'custom', mockCallback);
        expect(typeof remove).toBe('function');

        // The remove function should call removeEventListener when invoked
        remove();
        expect(removeEventListener).toHaveBeenCalledWith(
            window,
            'custom',
            expect.any(Function),
            undefined
        );
    });
});
