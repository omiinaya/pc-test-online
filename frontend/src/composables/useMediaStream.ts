import { ref, type Ref } from 'vue';
import { useWebRTCCompatibility } from './useWebRTCCompatibility';
import { useMemoryManagement } from './useMemoryManagement';
import type { DeviceConstraints, DeviceType } from '../types';

export interface UseMediaStreamReturn {
  stream: Ref<MediaStream | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  createStream: (constraints: DeviceConstraints) => Promise<MediaStream>;
  stopStream: () => void;
  switchDevice: (newDeviceId: string, deviceType: DeviceType, baseConstraints: DeviceConstraints) => Promise<MediaStream>;
  cleanup: () => void;
  webrtcCompat: ReturnType<typeof useWebRTCCompatibility>;
}

export function useMediaStream(): UseMediaStreamReturn {
  const stream: Ref<MediaStream | null> = ref(null);
  const loading: Ref<boolean> = ref(false);
  const error: Ref<string | null> = ref(null);

  // Use WebRTC compatibility layer
  const webrtcCompat = useWebRTCCompatibility();
  
  // Use memory management for cleanup tracking
  const memoryManager = useMemoryManagement();
  let streamResourceId: number | null = null;

  const createStream = async (constraints: DeviceConstraints): Promise<MediaStream> => {
    loading.value = true;
    error.value = null;

    try {
      if (stream.value) {
        stopStream();
      }

      // Use compatibility layer instead of direct API access
      stream.value = await webrtcCompat.getUserMedia(constraints);
      
      // Track the media stream for memory management
      if (streamResourceId !== null) {
        memoryManager.untrackResource(streamResourceId);
      }
      
      streamResourceId = memoryManager.trackResource(
        () => {
          if (stream.value) {
            stream.value.getTracks().forEach(track => {
              track.stop();
              track.enabled = false;
            });
          }
        },
        'stream',
        'MediaStream with audio/video tracks'
      );
      
      return stream.value;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      error.value = errorMessage;
      throw new Error(errorMessage);
    } finally {
      loading.value = false;
    }
  };

  const stopStream = (): void => {
    if (stream.value) {
      stream.value.getTracks().forEach(track => track.stop());
      stream.value = null;
    }
    if (streamResourceId !== null) {
      memoryManager.untrackResource(streamResourceId);
      streamResourceId = null;
    }
  };

  const switchDevice = async (
    newDeviceId: string,
    deviceType: DeviceType,
    baseConstraints: DeviceConstraints
  ): Promise<MediaStream> => {
    if (loading.value) {
      throw new Error('Cannot switch device while loading');
    }

    loading.value = true;
    error.value = null;

    try {
      stopStream();

      // Map DeviceType to constraint property
      const constraintKey = deviceType === 'Camera' ? 'video' : 'audio';

      const baseConstraint = baseConstraints[constraintKey] as MediaTrackConstraints | boolean | undefined;
      const newConstraint: MediaTrackConstraints = typeof baseConstraint === 'object' && baseConstraint !== null
        ? { ...baseConstraint, deviceId: { exact: newDeviceId } }
        : { deviceId: { exact: newDeviceId } };

      const constraints: DeviceConstraints = {
        ...baseConstraints,
        [constraintKey]: newConstraint,
      };

      return await createStream(constraints);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      error.value = `Failed to switch device: ${errorMessage}`;
      throw new Error(`Failed to switch device: ${errorMessage}`);
    } finally {
      loading.value = false;
    }
  };

  const cleanup = (): void => {
    stopStream();
    error.value = null;
    loading.value = false;
    
    // Cleanup any remaining audio analysis or WebRTC resources
    memoryManager.cleanupType('connection');
  };

  return {
    // State
    stream,
    loading,
    error,

    // Methods
    createStream,
    stopStream,
    switchDevice,
    cleanup,

    // Compatibility info
    webrtcCompat,
  };
}