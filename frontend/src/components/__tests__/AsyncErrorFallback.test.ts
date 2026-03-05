import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import AsyncErrorFallback from '../AsyncErrorFallback.vue';

describe('AsyncErrorFallback', () => {
    it('renders error message when error prop provided', () => {
        const wrapper = mount(AsyncErrorFallback, {
            props: {
                error: new Error('Test error'),
            },
        });
        expect(wrapper.text()).toContain('Failed to load Component');
        expect(wrapper.text()).toContain('Test error');
    });

    it('renders default message when no error prop', () => {
        const wrapper = mount(AsyncErrorFallback, {
            props: {
                error: null,
            },
        });
        expect(wrapper.text()).toContain('The component could not be loaded');
    });

    it('calls retry function when retry button clicked', async () => {
        const mockRetry = vi.fn();
        const wrapper = mount(AsyncErrorFallback, {
            props: {
                retry: mockRetry,
            },
        });
        await wrapper.find('.error-retry-btn').trigger('click');
        expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it('does not show retry button when retry is null', () => {
        const wrapper = mount(AsyncErrorFallback, {
            props: {
                retry: null,
            },
        });
        expect(wrapper.find('.error-retry-btn').exists()).toBe(false);
    });

    it('uses custom component name', () => {
        const wrapper = mount(AsyncErrorFallback, {
            props: {
                componentName: 'TestComponent',
            },
        });
        expect(wrapper.text()).toContain('Failed to load TestComponent');
    });

    it('has proper alert role for accessibility', () => {
        const wrapper = mount(AsyncErrorFallback);
        expect(wrapper.attributes('role')).toBe('alert');
    });
});
