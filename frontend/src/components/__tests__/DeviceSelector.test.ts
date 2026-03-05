import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DeviceSelector from '../DeviceSelector.vue';

describe('DeviceSelector', () => {
    const mockDevices = [
        { deviceId: 'dev-1', label: 'Device 1', kind: 'audioinput' },
        { deviceId: 'dev-2', label: 'Device 2', kind: 'audioinput' },
    ];

    it('renders dropdown with devices', () => {
        const wrapper = mount(DeviceSelector, {
            props: {
                devices: mockDevices,
                label: 'Select Device',
                deviceType: 'audioinput',
            },
        });
        expect(wrapper.text()).toContain('Select Device');
        const options = wrapper.findAll('option');
        expect(options.length).toBe(2);
    });

    it('shows selected device', async () => {
        const wrapper = mount(DeviceSelector, {
            props: {
                devices: mockDevices,
                selectedDeviceId: 'dev-1',
                label: 'Select Device',
                deviceType: 'audioinput',
            },
        });
        const select = wrapper.find('select');
        expect(select.element.value).toBe('dev-1');
    });

    it('emits device-changed when selection changes', async () => {
        const wrapper = mount(DeviceSelector, {
            props: {
                devices: mockDevices,
                selectedDeviceId: '',
                label: 'Select Device',
                deviceType: 'audioinput',
            },
        });
        await wrapper.find('select').setValue('dev-2');
        expect(wrapper.emitted('device-changed')).toBeTruthy();
        expect(wrapper.emitted('device-changed')?.[0]).toEqual(['dev-2']);
    });

    it('generates unique selectId by default', () => {
        const wrapper = mount(DeviceSelector, {
            props: {
                devices: mockDevices,
                label: 'Select',
                deviceType: 'audioinput',
            },
        });
        const selectId = wrapper.find('select').attributes('id');
        expect(selectId).toMatch(/^device-select-[a-z0-9]+$/);
    });

    it('uses provided selectId', () => {
        const wrapper = mount(DeviceSelector, {
            props: {
                devices: mockDevices,
                label: 'Select',
                deviceType: 'audioinput',
                selectId: 'custom-id',
            },
        });
        expect(wrapper.find('select').attributes('id')).toBe('custom-id');
    });

    it('disables select when disabled prop is true', () => {
        const wrapper = mount(DeviceSelector, {
            props: {
                devices: mockDevices,
                label: 'Select',
                deviceType: 'audioinput',
                disabled: true,
            },
        });
        expect(wrapper.find('select').attributes('disabled')).toBeDefined();
    });
});
