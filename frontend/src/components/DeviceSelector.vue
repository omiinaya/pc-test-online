<script>
export default {
    name: 'DeviceSelector',
    props: {
        devices: {
            type: Array,
            required: true,
        },
        selectedDeviceId: {
            type: String,
            default: '',
        },
        label: {
            type: String,
            required: true,
        },
        deviceType: {
            type: String,
            required: true,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        selectId: {
            type: String,
            default: () => `device-select-${Math.random().toString(36).substr(2, 9)}`,
        },
    },
    computed: {
        noDevicesMessage() {
            // Special handling for audio output devices - many systems have default output
            // even if not explicitly enumerated by the browser
            if (this.deviceType.toLowerCase() === 'speaker') {
                return 'No speakers enumerated (default output available)';
            }
            return `No ${this.deviceType.toLowerCase()}s found`;
        },
    },
    emits: ['device-changed'],
};
</script>

<template>
    <div class="device-selector">
        <label :for="selectId">{{ label }}:</label>
        <select
            :id="selectId"
            :value="selectedDeviceId"
            @change="$emit('device-changed', $event.target.value)"
            :disabled="disabled || devices.length <= 0"
        >
            <option v-if="devices.length <= 0" value="">
                {{ noDevicesMessage }}
            </option>
            <option v-for="device in devices" :key="device.deviceId" :value="device.deviceId">
                {{ device.label || `${deviceType} ${device.deviceId.slice(0, 4)}...` }}
            </option>
        </select>
    </div>
</template>

<style scoped>
.device-selector {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-md);
    border-top: 1px solid var(--border-color);
    padding: var(--spacing-sm) 0;
    margin: 0;
    width: 100%;
}

.device-selector label {
    color: var(--text-primary);
    font-size: var(--font-size-sm);
}

.device-selector select {
    padding: var(--spacing-sm);
    border-radius: var(--border-radius-small);
    border: 1px solid var(--border-color-light);
    background: var(--border-color-custom);
    color: var(--text-primary);
    font-size: var(--font-size-sm);
    cursor: pointer;
    min-width: 200px;
    width: 100%;
    transition: var(--transition-default);
}

.device-selector select:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.device-selector select:focus {
    outline: none;
    border-color: var(--primary-color);
}

.device-selector select option {
    background: var(--border-color-custom);
    color: var(--text-primary);
}
</style>
