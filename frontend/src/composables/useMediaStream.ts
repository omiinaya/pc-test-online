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
    console.log('[useMediaStream] createStream() called with constraints:', constraints);
    loading.value = true;
    error.value = null;

    try {
      if (stream.value) {
        console.log('[useMediaStream] Stopping existing stream before creating new one');
        stopStream();
      }

      console.log('[useMediaStream] Calling webrtcCompat.getUserMedia()');
      // Use compatibility layer instead of direct API access
      stream.value = await webrtcCompat.getUserMedia(constraints);
      console.log('[useMediaStream] Stream created successfully:', stream.value);
      console.log('[useMediaStream] Stream video tracks:', stream.value.getVideoTracks().length);
      console.log('[useMediaStream] Stream audio tracks:', stream.value.getAudioTracks().length);
      
      // Track the media stream for memory management
      if (streamResourceId !== null) {
        memoryManager.untrackResource(streamResourceId);
      }
      
      streamResourceId = memoryManager.trackResource(
        () => {
          console.log('[useMediaStream] Cleanup callback triggered for stream resource');
          if (stream.value) {
            stream.value.getTracks().forEach(track => {
              console.log('[useMediaStream] Stopping track:', track.label, 'enabled:', track.enabled);
              track.stop();
              track.enabled = false;
            });
          }
        },
        'stream',
        'MediaStream with audio/video tracks'
      );
      
      console.log('[useMediaStream] Stream resource tracked, ID:', streamResourceId);
      return stream.value;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('[useMediaStream] Error creating stream:', err);
      error.value = errorMessage;
      throw new Error(errorMessage);
    } finally {
      loading.value = false;
      console.log('[useMediaStream] loading.value set to false');
    }
  };

  const stopStream = (): void => {
    console.log('[useMediaStream] stopStream() called');
    if (stream.value) {
      console.log('[useMediaStream] Stopping all tracks in current stream');
      // First disable tracks, then stop them to ensure clean release
      stream.value.getTracks().forEach(track => {
        console.log('[useMediaStream] Disabling track:', track.label, 'enabled:', track.enabled);
        track.enabled = false;
      });
      // Small delay to ensure tracks are disabled before stopping
      stream.value.getTracks().forEach(track => {
        console.log('[useMediaStream] Stopping track:', track.label);
        track.stop();
      });
      stream.value = null;
      console.log('[useMediaStream] stream.value set to null');
    } else {
      console.log('[useMediaStream] No stream to stop');
    }
    if (streamResourceId !== null) {
      memoryManager.untrackResource(streamResourceId);
      streamResourceId = null;
      console.log('[useMediaStream] Stream resource untracked');
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