<script lang="ts">
import { defineComponent, computed } from 'vue';
import StatePanel from './StatePanel.vue';
import DeviceSelector from './DeviceSelector.vue';
import { useDeviceEnumeration } from '../composables/useDeviceEnumeration';
import {
  useCommonTestPatterns,
  useDeviceChangeHandler,
} from '../composables/useCommonTestPatterns';
import type { MediaDeviceKind, MediaDeviceInfo } from '../types';

export default defineComponent({
  name: 'DeviceTestBase',
  components: {
    StatePanel,
    DeviceSelector,
  },
  props: {
    deviceKind: {
      type: String as () => MediaDeviceKind,
      required: true,
      validator: (value: string) => ['videoinput', 'audioinput', 'audiooutput'].includes(value),
    },
    deviceType: {
      type: String,
      required: true,
    },
    initialDeviceId: {
      type: String,
      default: '',
    },
  },
  emits: ['devices-ready', 'devices-error', 'device-changed', 'device-change-error'],
  setup(props, { emit }) {
    const deviceEnumeration = useDeviceEnumeration(props.deviceKind, props.deviceType);
    const commonTest = useCommonTestPatterns();
    const deviceChangeHandler = useDeviceChangeHandler();

    const availableDevices = computed<MediaDeviceInfo[]>(() => deviceEnumeration.availableDevices.value);
    
    const selectedDeviceId = computed({
      get: () => deviceEnumeration.selectedDeviceId.value,
      set: (value: string) => {
        deviceEnumeration.selectedDeviceId.value = value;
      },
    });

    const hasDevices = computed(() => deviceEnumeration.hasDevices.value);
    
    const selectedDevice = computed(() => 
      availableDevices.value.find(device => device.deviceId === selectedDeviceId.value)
    );

    const initializeDevices = async (): Promise<void> => {
      try {
        await deviceEnumeration.enumerateDevices();

        // Set initial device if provided
        if (props.initialDeviceId && hasDevices.value) {
          const deviceExists = availableDevices.value.some(
            d => d.deviceId === props.initialDeviceId
          );
          if (deviceExists) {
            selectedDeviceId.value = props.initialDeviceId;
          }
        }

        emit('devices-ready', {
          devices: availableDevices.value,
          selectedDeviceId: selectedDeviceId.value,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        commonTest.setCustomError(`Failed to initialize ${props.deviceType.toLowerCase()}s: ${errorMessage}`);
        emit('devices-error', error);
      }
    };

    const handleDeviceChange = async (newDeviceId: string): Promise<void> => {
      try {
        await deviceChangeHandler.handleDeviceChange(
          newDeviceId,
          selectedDeviceId.value,
          async (deviceId: string) => {
            selectedDeviceId.value = deviceId;
            emit('device-changed', {
              deviceId,
              device: selectedDevice.value,
            });
          }
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        commonTest.setCustomError(errorMessage);
        emit('device-change-error', error);
      }
    };

    const refreshDevices = async (): Promise<void> => {
      await deviceEnumeration.enumerateDevices();
    };

    return {
      deviceEnumeration,
      ...commonTest,
      ...deviceChangeHandler,
      availableDevices,
      selectedDeviceId,
      hasDevices,
      selectedDevice,
      initializeDevices,
      handleDeviceChange,
      refreshDevices,
    };
  },
  async mounted() {
    await this.initializeDevices();
  },
});
</script>

<template>
  <div class="device-test-base">
    <!-- Loading state -->
    <StatePanel
      v-if="deviceEnumeration.loadingDevices.value"
      state="loading"
      :title="$t('device_testing.detecting_devices', { deviceType })"
      :message="
        $t('device_testing.searching_devices', { deviceType: deviceType.toLowerCase() })
      "
    />

    <!-- Error state: no devices -->
    <StatePanel
      v-else-if="!hasDevices && !deviceEnumeration.loadingDevices.value"
      state="error"
      :title="$t('device_testing.no_devices_found', { deviceType })"
      :message="
        $t('device_testing.no_devices_message', { deviceType: deviceType.toLowerCase() })
      "
    >
      <template #icon>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="feather feather-alert-triangle"
        >
          <path
            d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
          ></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      </template>
    </StatePanel>

    <!-- Device selector and test content -->
    <template v-else-if="hasDevices">
      <!-- Device selector (if multiple devices available) -->
      <DeviceSelector
        v-if="availableDevices.length > 1"
        :devices="availableDevices"
        :selectedDeviceId="selectedDeviceId"
        :label="$t('device_testing.select_device', { deviceType })"
        :deviceType="deviceType"
        :disabled="loading"
        @device-changed="handleDeviceChange"
      />

      <!-- Test content slot -->
      <slot
        :devices="availableDevices"
        :selectedDevice="selectedDevice"
        :selectedDeviceId="selectedDeviceId"
        :loading="loading"
        :error="error"
        :hasDevices="hasDevices"
      />
    </template>
  </div>
</template>

<style scoped>
.device-test-base {
  width: 100%;
  height: 100%;
}
</style>