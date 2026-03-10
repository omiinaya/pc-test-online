import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useOptimizedEvents } from '../useOptimizedEvents';

describe('useOptimizedEvents', () => {
    let windowAdd: ReturnType<typeof vi.fn>;
    let windowRemove: ReturnType<typeof vi.fn>;
    let docAdd: ReturnType<typeof vi.fn>;
    let docRemove: ReturnType<typeof vi.fn>;
    let originalWindowAdd: typeof window.addEventListener;
    let originalWindowRemove: typeof window.removeEventListener;
    let originalDocAdd: typeof document.addEventListener;
    let originalDocRemove: typeof document.removeEventListener;

    beforeEach(() => {
        windowAdd = vi.fn();
        windowRemove = vi.fn();
        docAdd = vi.fn();
        docRemove = vi.fn();
        originalWindowAdd = window.addEventListener;
        originalWindowRemove = window.removeEventListener;
        originalDocAdd = document.addEventListener;
        originalDocRemove = document.removeEventListener;
        window.addEventListener = windowAdd;
        window.removeEventListener = windowRemove;
        document.addEventListener = docAdd;
        document.removeEventListener = docRemove;
    });

    afterEach(() => {
        window.addEventListener = originalWindowAdd;
        window.removeEventListener = originalWindowRemove;
        document.addEventListener = originalDocAdd;
        document.removeEventListener = originalDocRemove;
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

        expect(windowAdd).toHaveBeenCalledWith('resize', expect.any(Function), {
            passive: true,
        });
    });

    it('adds scroll listener with throttle', () => {
        const listeners = useOptimizedEvents();
        const mockCallback = vi.fn();

        listeners.addScrollListener(mockCallback);

        expect(windowAdd).toHaveBeenCalledWith('scroll', expect.any(Function), {
            passive: true,
        });
    });

    it('adds visibility change listener', () => {
        const listeners = useOptimizedEvents();
        const mockCallback = vi.fn();

        listeners.addVisibilityChangeListener(mockCallback);

        // Since no options are passed, addEventListener should be called with two arguments: type and listener
        expect(docAdd).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    });

    it('cleans up all listeners', () => {
        const listeners = useOptimizedEvents();
        const mockCallback = vi.fn();

        listeners.addOptimizedEventListener(window, 'test', mockCallback);
        listeners.cleanupAll();

        // Should have called removeEventListener for the test event
        expect(windowRemove).toHaveBeenCalledWith('test', expect.any(Function));
    });

    it('returns a remove function from addOptimizedEventListener', () => {
        const listeners = useOptimizedEvents();
        const mockCallback = vi.fn();

        const remove = listeners.addOptimizedEventListener(window, 'custom', mockCallback);
        expect(typeof remove).toBe('function');

        // The remove function should call removeEventListener when invoked
        remove();
        expect(windowRemove).toHaveBeenCalledWith('custom', expect.any(Function));
    });
});
