<script>
import StatePanel from './StatePanel.vue';
import DeviceSelector from './DeviceSelector.vue';
import { useDeviceEnumeration } from '../composables/useDeviceEnumeration.js';
import {
    useCommonTestPatterns,
    useDeviceChangeHandler,
} from '../composables/useCommonTestPatterns.js';

export default {
    name: 'DeviceTestBase',
    components: {
        StatePanel,
        DeviceSelector,
    },
    props: {
        deviceKind: {
            type: String,
            required: true,
            validator: value => ['videoinput', 'audioinput', 'audiooutput'].includes(value),
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
    setup(props) {
        const deviceEnumeration = useDeviceEnumeration(props.deviceKind, props.deviceType);
        const commonTest = useCommonTestPatterns();
        const deviceChangeHandler = useDeviceChangeHandler();

        return {
            deviceEnumeration,
            ...commonTest,
            ...deviceChangeHandler,
        };
    },
    computed: {
        availableDevices() {
            return this.deviceEnumeration.availableDevices.value;
        },
        selectedDeviceId: {
            get() {
                return this.deviceEnumeration.selectedDeviceId.value;
            },
            set(value) {
                this.deviceEnumeration.selectedDeviceId.value = value;
            },
        },
        hasDevices() {
            return this.deviceEnumeration.hasDevices.value;
        },
        selectedDevice() {
            return this.availableDevices.find(device => device.deviceId === this.selectedDeviceId);
        },
    },
    async mounted() {
        await this.initializeDevices();
    },
    methods: {
        async initializeDevices() {
            try {
                await this.deviceEnumeration.enumerateDevices();

                // Set initial device if provided
                if (this.initialDeviceId && this.hasDevices) {
                    const deviceExists = this.availableDevices.some(
                        d => d.deviceId === this.initialDeviceId
                    );
                    if (deviceExists) {
                        this.selectedDeviceId = this.initialDeviceId;
                    }
                }

                this.$emit('devices-ready', {
                    devices: this.availableDevices,
                    selectedDeviceId: this.selectedDeviceId,
                });
            } catch (error) {
                this.error = `Failed to initialize ${this.deviceType.toLowerCase()}s: ${error.message}`;
                this.$emit('devices-error', error);
            }
        },

        async handleDeviceChange(newDeviceId) {
            try {
                await this.handleDeviceChange(
                    newDeviceId,
                    this.selectedDeviceId,
                    async deviceId => {
                        this.selectedDeviceId = deviceId;
                        this.$emit('device-changed', {
                            deviceId,
                            device: this.selectedDevice,
                        });
                    }
                );
            } catch (error) {
                this.error = error.message;
                this.$emit('device-change-error', error);
            }
        },

        async refreshDevices() {
            await this.deviceEnumeration.enumerateDevices();
        },
    },
    emits: ['devices-ready', 'devices-error', 'device-changed', 'device-change-error'],
};
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
