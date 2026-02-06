import { isValidDeviceType } from '../types/device';

/**
 * Escapes special regex characters to prevent ReDoS attacks
 * @param str - The string to escape
 * @returns The escaped string safe for use in RegExp
 */
export function escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Creates a safe RegExp from a device type
 * Validates the device type against a whitelist before creating the regex
 * @param deviceType - The device type to convert to a regex
 * @param flags - RegExp flags (default: 'gi')
 * @returns A RegExp object or null if deviceType is invalid
 */
export function createDeviceTypeRegex(deviceType: string, flags: string = 'gi'): RegExp | null {
    // Validate against whitelist
    if (!isValidDeviceType(deviceType)) {
        console.warn(`[RegexUtil] Invalid device type for regex: ${deviceType}`);
        return null;
    }

    // Escape special characters and create regex
    const escaped = escapeRegExp(deviceType);
    return new RegExp(escaped, flags);
}

/**
 * Safely replaces device type in a string using a validated regex
 * @param str - The string to perform replacement on
 * @param deviceType - The device type to replace
 * @param replacement - The replacement string
 * @returns The modified string or original if deviceType is invalid
 */
export function replaceDeviceType(str: string, deviceType: string, replacement: string): string {
    const regex = createDeviceTypeRegex(deviceType);
    if (!regex) {
        console.warn(
            '[RegexUtil] Could not create regex for device type, returning original string'
        );
        return str;
    }
    return str.replace(regex, replacement);
}

/**
 * Cases-sensitive version of replaceDeviceType
 * @param str - The string to perform replacement on
 * @param deviceType - The device type to replace
 * @param replacement - The replacement string
 * @returns The modified string or original if deviceType is invalid
 */
export function replaceDeviceTypeCaseInsensitive(
    str: string,
    deviceType: string,
    replacement: string
): string {
    const regex = createDeviceTypeRegex(deviceType.toLowerCase(), 'gi');
    if (!regex) {
        console.warn(
            '[RegexUtil] Could not create regex for device type, returning original string'
        );
        return str;
    }
    return str.replace(regex, replacement);
}
