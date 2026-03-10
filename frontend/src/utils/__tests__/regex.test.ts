import { describe, it, expect } from 'vitest';
import {
    escapeRegExp,
    createDeviceTypeRegex,
    replaceDeviceType,
    replaceDeviceTypeCaseInsensitive,
} from '../regex';
import { isValidDeviceType } from '../../types/device';

describe('Device Type Validation', () => {
    it('should validate allowed device types', () => {
        expect(isValidDeviceType('camera')).toBe(true);
        expect(isValidDeviceType('microphone')).toBe(true);
        expect(isValidDeviceType('speaker')).toBe(true);
        expect(isValidDeviceType('screen')).toBe(true);
    });

    it('should reject invalid device types', () => {
        expect(isValidDeviceType('printer')).toBe(false);
        expect(isValidDeviceType('')).toBe(false);
        expect(isValidDeviceType('camera123')).toBe(false);
    });
});

describe('escapeRegExp', () => {
    it('escapes special regex characters', () => {
        expect(escapeRegExp('camera')).toBe('camera');
        expect(escapeRegExp('camera+microphone')).toBe('camera\\+microphone');
        expect(escapeRegExp('test.*pattern')).toBe('test\\.\\*pattern');
        expect(escapeRegExp('a|b|c')).toBe('a\\|b\\|c');
        expect(escapeRegExp('[abc]')).toBe('\\[abc\\]');
        expect(escapeRegExp('(hello)')).toBe('\\(hello\\)');
        expect(escapeRegExp('test?')).toBe('test\\?');
        expect(escapeRegExp('a^b$c')).toBe('a\\^b\\$c');
    });
});

describe('createDeviceTypeRegex', () => {
    it('creates valid regex for allowed device types', () => {
        const regex = createDeviceTypeRegex('camera');
        expect(regex).toBeInstanceOf(RegExp);
        expect(regex?.flags).toBe('gi');
        expect(regex?.source).toBe('camera');
    });

    it('returns null for invalid device types', () => {
        expect(createDeviceTypeRegex('invalid')).toBeNull();
        expect(createDeviceTypeRegex('')).toBeNull();
    });

    it('allows custom flags', () => {
        const regex = createDeviceTypeRegex('microphone', 'g');
        expect(regex?.flags).toBe('g');
    });
});

describe('replaceDeviceType', () => {
    it('replaces device type in string case-insensitively', () => {
        const result = replaceDeviceType('Camera and CAMERA', 'camera', 'microphone');
        expect(result).toBe('microphone and microphone');
    });

    it('returns original string if deviceType is invalid', () => {
        const result = replaceDeviceType('camera test', 'printer', 'foo');
        expect(result).toBe('camera test');
    });
});

describe('replaceDeviceTypeCaseInsensitive', () => {
    it('replaces device type case-insensitively', () => {
        const result = replaceDeviceTypeCaseInsensitive(
            'Camera, CAMERA, camera',
            'camera',
            'microphone'
        );
        expect(result).toBe('microphone, microphone, microphone');
    });

    it('handles partial matches', () => {
        const result = replaceDeviceTypeCaseInsensitive(
            'Testing camera device',
            'camera',
            'microphone'
        );
        expect(result).toBe('Testing microphone device');
    });
});
