export const ALLOWED_DEVICE_TYPES = ['camera', 'microphone', 'speaker', 'screen'] as const;

export type DeviceType = (typeof ALLOWED_DEVICE_TYPES)[number];

export function isValidDeviceType(type: string): type is DeviceType {
    return ALLOWED_DEVICE_TYPES.includes(type as DeviceType);
}
