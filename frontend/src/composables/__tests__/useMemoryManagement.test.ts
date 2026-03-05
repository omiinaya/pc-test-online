import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useMemoryManagement } from '../useMemoryManagement';

describe('useMemoryManagement', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with empty tracked resources', () => {
        const { trackedResources } = useMemoryManagement();
        expect(trackedResources.value).toEqual([]);
    });

    it('should track a resource and return cleanup function', () => {
        const { trackResource, trackedResources } = useMemoryManagement();
        const mockCleanup = vi.fn();

        const resourceId = trackResource(mockCleanup, 'timeout', 'Test timeout');

        expect(resourceId).toBeDefined();
        expect(trackedResources.value).toHaveLength(1);
        expect(trackedResources.value[0].id).toBe(resourceId);
        expect(trackedResources.value[0].type).toBe('timeout');
        expect(trackedResources.value[0].description).toBe('Test timeout');

        // Call cleanup
        trackedResources.value[0].cleanup();
        expect(mockCleanup).toHaveBeenCalledTimes(1);
    });

    it('should untrack a resource', () => {
        const { trackResource, untrackResource, trackedResources } = useMemoryManagement();
        const mockCleanup = vi.fn();

        const resourceId = trackResource(mockCleanup, 'interval', 'Test interval');
        expect(trackedResources.value).toHaveLength(1);

        untrackResource(resourceId);
        expect(trackedResources.value).toHaveLength(0);
    });

    it('should clean up all resources on cleanupAll', () => {
        const { trackResource, cleanupAll, trackedResources } = useMemoryManagement();
        const mockCleanup1 = vi.fn();
        const mockCleanup2 = vi.fn();

        trackResource(mockCleanup1, 'timeout', 'Timeout 1');
        trackResource(mockCleanup2, 'interval', 'Interval 1');
        expect(trackedResources.value).toHaveLength(2);

        cleanupAll();

        expect(mockCleanup1).toHaveBeenCalledTimes(1);
        expect(mockCleanup2).toHaveBeenCalledTimes(1);
        expect(trackedResources.value).toHaveLength(0);
    });

    it('should automatically cleanup on unmount', () => {
        const { trackResource, cleanupAll, mount, unmount } = useMemoryManagement();
        const mockCleanup = vi.fn();

        const stop = mount();
        const resourceId = trackResource(mockCleanup, 'animationFrame', 'RAF');
        expect(trackedResources.value).toHaveLength(1);

        unmount();
        expect(mockCleanup).toHaveBeenCalledTimes(1);
        expect(stop).toBe(true); // cleanupAll returned true indicating it ran
    });

    it('should handle errors during cleanup gracefully', () => {
        const { trackResource, cleanupAll, trackedResources } = useMemoryManagement();
        const mockCleanup = vi.fn(() => {
            throw new Error('Cleanup failed');
        });

        trackResource(mockCleanup, 'timeout', 'Failing cleanup');
        expect(() => cleanupAll()).not.toThrow();
        expect(trackedResources.value).toHaveLength(0);
    });
});
