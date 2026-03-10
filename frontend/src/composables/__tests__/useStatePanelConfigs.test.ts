import { describe, it, expect } from 'vitest';
import { useStatePanelConfigs } from '../useStatePanelConfigs';

describe('useStatePanelConfigs', () => {
    describe('with default device type', () => {
        const configs = useStatePanelConfigs();

        it('should provide detectingDevices config', () => {
            const cfg = configs.getConfig('detectingDevices');
            expect(cfg.state).toBe('loading');
            expect(cfg.title).toContain('Detecting');
            expect(cfg.message).toContain('search for available');
        });

        it('should provide checkingPermissions config', () => {
            const cfg = configs.getConfig('checkingPermissions');
            expect(cfg.state).toBe('loading');
            expect(cfg.title).toBe('Checking permissions...');
        });

        it('should provide permissionRequired config', () => {
            const cfg = configs.getConfig('permissionRequired');
            expect(cfg.state).toBe('info');
            expect(cfg.title).toContain('Permission Required');
            expect(cfg.showActionButton).toBe(true);
        });

        it('should provide noDevicesFound config', () => {
            const cfg = configs.getConfig('noDevicesFound');
            expect(cfg.state).toBe('error');
            expect(cfg.title).toContain('No devices Found');
        });

        it('should provide browserNotSupported config', () => {
            const cfg = configs.getConfig('browserNotSupported');
            expect(cfg.state).toBe('error');
            expect(cfg.title).toBe('Browser Not Supported');
        });
    });

    describe('with custom device type', () => {
        const configs = useStatePanelConfigs('microphone');

        it('should substitute device type in title and message', () => {
            const cfg = configs.getConfig('detectingDevices');
            expect(cfg.title).toBe('Detecting microphones...');
            expect(cfg.message).toContain('microphones');
        });

        it('should use custom device type in permissionRequired', () => {
            const cfg = configs.getConfig('permissionRequired');
            expect(cfg.title).toBe('microphone Permission Required');
            expect(cfg.actionLabel).toBe('Grant microphone Access');
        });

        it('should use custom device type in noDevicesFound', () => {
            const cfg = configs.getConfig('noDevicesFound');
            expect(cfg.title).toBe('No microphones Found');
            expect(cfg.message).toContain('microphones');
        });
    });

    describe('getConfigForDevice', () => {
        const configs = useStatePanelConfigs('camera');

        it('should return config with device-specific substitutions', () => {
            const cfg = configs.getConfigForDevice('detectingDevices', 'camera');
            expect(cfg.title).toBe('Detecting cameras...');
        });

        it('should allow overriding properties via customProps', () => {
            const cfg = configs.getConfigForDevice('detectingDevices', 'camera', {
                message: 'Custom message',
            });
            expect(cfg.message).toBe('Custom message');
        });
    });

    describe('getErrorConfig', () => {
        const configs = useStatePanelConfigs('speaker');

        it('should return a notFound error config for NotFoundError', () => {
            const error = new Error('Device not found');
            error.name = 'NotFoundError';
            const cfg = configs.getErrorConfig(error);
            expect(cfg).not.toBeNull();
            expect(cfg!.state).toBe('error');
            expect(cfg!.title).toContain('No speakers Found');
        });

        it('should return permissionDenied config for NotAllowedError', () => {
            const error = new Error('User denied');
            error.name = 'NotAllowedError';
            const cfg = configs.getErrorConfig(error);
            expect(cfg).not.toBeNull();
            expect(cfg!.state).toBe('error');
            // The title is 'speaker Access Denied'
            expect(cfg!.title).toContain('Access Denied');
            expect(cfg!.message).toContain('access was denied');
        });

        it('should return a generic error config for unknown errors', () => {
            const error = new Error('Something else');
            (error as any).name = 'UnknownError';
            const cfg = configs.getErrorConfig(error);
            expect(cfg).not.toBeNull();
            expect(cfg!.state).toBe('error');
        });

        it('should return null if error is falsy', () => {
            const cfg = configs.getErrorConfig(null);
            expect(cfg).toBeNull();
        });
    });

    describe('configs property', () => {
        it('should expose all predefined configs', () => {
            const configs = useStatePanelConfigs();
            expect(Object.keys(configs.configs).length).toBeGreaterThan(0);
            expect(configs.configs.testCompleted).toBeDefined();
            expect(configs.configs.testSkipped).toBeDefined();
        });
    });
});
