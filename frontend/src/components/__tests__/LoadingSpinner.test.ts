import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import LoadingSpinner from '../LoadingSpinner.vue';

describe('LoadingSpinner', () => {
    it('renders with default medium size', () => {
        const wrapper = mount(LoadingSpinner);
        expect(wrapper.classes()).toContain('loading-spinner');
        expect(wrapper.classes()).toContain('spinner');
        expect(wrapper.classes()).toContain('spinner--medium');
        expect(wrapper.find('.spinner__text').text()).toBe('Loading...');
    });

    it('renders with small size', () => {
        const wrapper = mount(LoadingSpinner, {
            props: { size: 'small' },
        });
        expect(wrapper.classes()).toContain('spinner--small');
    });

    it('renders with large size', () => {
        const wrapper = mount(LoadingSpinner, {
            props: { size: 'large' },
        });
        expect(wrapper.classes()).toContain('spinner--large');
    });

    it('has proper accessibility attributes', () => {
        const wrapper = mount(LoadingSpinner);
        expect(wrapper.attributes('role')).toBe('status');
        expect(wrapper.attributes('aria-label')).toBe('Loading');
    });
});
