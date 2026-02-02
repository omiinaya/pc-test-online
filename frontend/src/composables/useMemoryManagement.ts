import { onUnmounted, ref, type Ref } from 'vue';

export interface MemoryResource {
  type: 'timeout' | 'interval' | 'event' | 'stream' | 'connection' | 'observer';
  id: number;
  cleanup: () => void;
  description?: string;
  createdAt: number;
}

export interface MemoryMetrics {
  totalResources: number;
  byType: Record<string, number>;
  memoryUsage: number;
  leaksDetected: number;
}

export function useMemoryManagement() {
  const resources: Ref<MemoryResource[]> = ref([]);
  let resourceId = 0;
  const metrics: Ref<MemoryMetrics> = ref({
    totalResources: 0,
    byType: {},
    memoryUsage: 0,
    leaksDetected: 0
  });

  // Track resource with automatic cleanup tracking
  const trackResource = (
    cleanup: () => void,
    type: MemoryResource['type'],
    description?: string
  ): number => {
    const id = resourceId++;
    const resource: MemoryResource = {
      type,
      id,
      cleanup,
      createdAt: Date.now(),
      ...(description !== undefined && { description }),
    };

    resources.value.push(resource);
    updateMetrics();

    return id;
  };

  // Untrack and cleanup specific resource
  const untrackResource = (id: number): boolean => {
    const index = resources.value.findIndex(r => r.id === id);
    if (index > -1) {
      const resource = resources.value[index];
      if (resource) {
        try {
          resource.cleanup();
          resources.value.splice(index, 1);
          updateMetrics();
          return true;
        } catch (error) {
          console.warn('Error cleaning up resource:', error);
          return false;
        }
      }
    }
    return false;
  };

  // Cleanup all resources of specific type
  const cleanupType = (type: MemoryResource['type']): number => {
    const toRemove = resources.value.filter(r => r.type === type);
    toRemove.forEach(resource => {
      try {
        resource.cleanup();
      } catch (error) {
        console.warn('Error cleaning up resource:', error);
      }
    });
    
    resources.value = resources.value.filter(r => r.type !== type);
    updateMetrics();
    
    return toRemove.length;
  };

  // Comprehensive cleanup
  const cleanupAll = (): void => {
    resources.value.forEach(resource => {
      try {
        resource.cleanup();
      } catch (error) {
        console.warn('Error cleaning up resource:', error);
      }
    });
    resources.value = [];
    updateMetrics();
  };

  // Update metrics
  const updateMetrics = (): void => {
    const byType: Record<string, number> = {};
    resources.value.forEach(resource => {
      byType[resource.type] = (byType[resource.type] || 0) + 1;
    });

    metrics.value = {
      totalResources: resources.value.length,
      byType,
      memoryUsage: getMemoryUsage(),
      leaksDetected: detectPotentialLeaks()
    };
  };

  // Get current memory usage
  const getMemoryUsage = (): number => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
    }
    return 0;
  };

  // Detect potential memory leaks
  const detectPotentialLeaks = (): number => {
    const now = Date.now();
    const longLivedThreshold = 5 * 60 * 1000; // 5 minutes
    
    return resources.value.filter(resource => 
      (now - resource.createdAt) > longLivedThreshold
    ).length;
  };

  // Auto-cleanup on component unmount
  onUnmounted(() => {
    cleanupAll();
  });

  return {
    resources,
    metrics,
    trackResource,
    untrackResource,
    cleanupType,
    cleanupAll,
    updateMetrics
  };
}