import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TestSpinner from '../TestSpinner.vue';

describe('TestSpinner', () => {
    it('renders with required message', () => {
        const wrapper = mount(TestSpinner, {
            props: {
                message: 'Testing...',
            },
        });
        expect(wrapper.text()).toContain('Testing...');
    });

    it('renders subMessage when provided', () => {
        const wrapper = mount(TestSpinner, {
            props: {
                message: 'Testing...',
                subMessage: 'Please wait',
            },
        });
        expect(wrapper.text()).toContain('Please wait');
    });

    it('does not render subMessage when not provided', () => {
        const wrapper = mount(TestSpinner, {
            props: {
                message: 'Testing...',
            },
        });
        expect(wrapper.find('.spinner-sub-message').exists()).toBe(false);
    });

    it('renders with custom color', () => {
        const wrapper = mount(TestSpinner, {
            props: {
                message: 'Testing...',
                color: '#ff0000',
            },
        });
        expect(wrapper.attributes('style')).toContain('--accent: #ff0000');
    });

    it('hides icon when showIcon is false', () => {
        const wrapper = mount(TestSpinner, {
            props: {
                message: 'Testing...',
                showIcon: false,
            },
        });
        expect(wrapper.find('.spinner-icon').exists()).toBe(false);
    });

    it('shows icon by default', () => {
        const wrapper = mount(TestSpinner, {
            props: {
                message: 'Testing...',
            },
        });
        expect(wrapper.find('.spinner-icon').exists()).toBe(true);
    });
});
