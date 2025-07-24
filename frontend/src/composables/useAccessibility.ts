// Accessibility composable for WCAG 2.1 AA compliance
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import type { ARIAAttributes, A11yConfig } from '@/types';

/**
 * Composable for comprehensive accessibility features
 */
export function useAccessibility(options: Partial<A11yConfig> = {}) {
    const config = ref<A11yConfig>({
        enableHighContrast: false,
        enableScreenReader: true,
        enableKeyboardNavigation: true,
        announceStateChanges: true,
        respectReducedMotion: true,
        ...options,
    });

    // Screen reader announcements
    const announcements = ref<string[]>([]);
    const currentAnnouncement = ref<string>('');

    // High contrast mode
    const isHighContrastMode = ref(false);
    const prefersHighContrast = ref(false);

    // Reduced motion preference
    const prefersReducedMotion = ref(false);

    // Focus management
    const focusedElement = ref<HTMLElement | null>(null);
    const focusTrapEnabled = ref(false);
    const focusTrapElements = ref<HTMLElement[]>([]);

    // Keyboard navigation
    const keyboardNavEnabled = ref(config.value.enableKeyboardNavigation);

    // Screen reader detection
    const screenReaderActive = computed(() => {
        // Check for common screen reader indicators
        if (typeof window === 'undefined') return false;

        return !!(
            window.navigator.userAgent.includes('NVDA') ||
            window.navigator.userAgent.includes('JAWS') ||
            window.speechSynthesis ||
            document.querySelector('[aria-live]') ||
            config.value.enableScreenReader
        );
    });

    // Color contrast utilities
    const contrastRatios = {
        // WCAG AA minimum contrast ratios
        normal: 4.5,
        large: 3.0,
        // WCAG AAA contrast ratios
        normalAAA: 7.0,
        largeAAA: 4.5,
    };

    /**
     * Calculate color contrast ratio
     */
    const calculateContrastRatio = (color1: string, color2: string): number => {
        const getLuminance = (color: string): number => {
            // Convert color to RGB values
            const rgb = color.match(/\d+/g)?.map(Number) || [0, 0, 0];
            const [r = 0, g = 0, b = 0] = rgb.map(value => {
                const sRGB = value / 255;
                return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
            });

            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };

        const lum1 = getLuminance(color1);
        const lum2 = getLuminance(color2);
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);

        return (brightest + 0.05) / (darkest + 0.05);
    };

    /**
     * Check if color contrast meets WCAG standards
     */
    const meetsContrastRequirement = (
        foreground: string,
        background: string,
        level: 'AA' | 'AAA' = 'AA',
        size: 'normal' | 'large' = 'normal'
    ): boolean => {
        const ratio = calculateContrastRatio(foreground, background);
        const requiredRatio =
            level === 'AAA'
                ? size === 'large'
                    ? contrastRatios.largeAAA
                    : contrastRatios.normalAAA
                : size === 'large'
                  ? contrastRatios.large
                  : contrastRatios.normal;

        return ratio >= requiredRatio;
    };

    /**
     * Announce message to screen readers
     */
    const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
        if (!config.value.announceStateChanges || !screenReaderActive.value) return;

        announcements.value.push(message);
        currentAnnouncement.value = message;

        // Create or update live region
        let liveRegion = document.querySelector(
            `[aria-live="${priority}"][data-vue-a11y]`
        ) as HTMLElement;

        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.setAttribute('aria-live', priority);
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.setAttribute('data-vue-a11y', 'true');
            liveRegion.style.cssText = `
        position: absolute !important;
        left: -10000px !important;
        width: 1px !important;
        height: 1px !important;
        overflow: hidden !important;
      `;
            document.body.appendChild(liveRegion);
        }

        // Clear and set new message
        liveRegion.textContent = '';
        nextTick(() => {
            liveRegion.textContent = message;
        });

        // Clean up old announcements
        if (announcements.value.length > 10) {
            announcements.value = announcements.value.slice(-10);
        }
    };

    /**
     * Generate comprehensive ARIA attributes
     */
    const generateARIA = (
        options: {
            role?: string;
            label?: string;
            labelledBy?: string;
            describedBy?: string;
            expanded?: boolean;
            selected?: boolean;
            checked?: boolean;
            disabled?: boolean;
            hidden?: boolean;
            live?: 'polite' | 'assertive' | 'off';
            atomic?: boolean;
            current?: boolean | 'page' | 'step' | 'location' | 'date' | 'time';
            level?: number;
            setSize?: number;
            posInSet?: number;
        } = {}
    ): ARIAAttributes => {
        const aria: ARIAAttributes = {};

        if (options.role) aria.role = options.role;
        if (options.label) aria['aria-label'] = options.label;
        if (options.labelledBy) aria['aria-labelledby'] = options.labelledBy;
        if (options.describedBy) aria['aria-describedby'] = options.describedBy;
        if (typeof options.expanded === 'boolean') aria['aria-expanded'] = options.expanded;
        if (typeof options.selected === 'boolean') aria['aria-selected'] = options.selected;
        if (typeof options.checked === 'boolean') aria['aria-checked'] = options.checked;
        if (typeof options.disabled === 'boolean') aria['aria-disabled'] = options.disabled;
        if (typeof options.hidden === 'boolean') aria['aria-hidden'] = options.hidden;
        if (options.live) aria['aria-live'] = options.live;
        if (typeof options.atomic === 'boolean') aria['aria-atomic'] = options.atomic;

        return aria;
    };

    /**
     * Focus management utilities
     */
    const focusFirst = (container?: HTMLElement) => {
        const focusableElements = getFocusableElements(container);
        if (focusableElements.length > 0) {
            focusableElements[0]?.focus();
            return true;
        }
        return false;
    };

    const focusLast = (container?: HTMLElement) => {
        const focusableElements = getFocusableElements(container);
        if (focusableElements.length > 0) {
            focusableElements[focusableElements.length - 1]?.focus();
            return true;
        }
        return false;
    };

    const getFocusableElements = (container?: HTMLElement): HTMLElement[] => {
        const selector = [
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            'a[href]',
            '[tabindex]:not([tabindex="-1"])',
            '[contenteditable="true"]',
        ].join(', ');

        const elements = Array.from(
            (container || document).querySelectorAll(selector)
        ) as HTMLElement[];

        return elements.filter(element => {
            return (
                element.offsetWidth > 0 &&
                element.offsetHeight > 0 &&
                !element.hasAttribute('aria-hidden')
            );
        });
    };

    /**
     * Focus trap implementation
     */
    const enableFocusTrap = (container: HTMLElement) => {
        focusTrapEnabled.value = true;
        focusTrapElements.value = getFocusableElements(container);

        const handleKeyDown = (event: KeyboardEvent) => {
            if (!focusTrapEnabled.value || event.key !== 'Tab') return;

            const elements = focusTrapElements.value;
            if (elements.length === 0) return;

            const firstElement = elements[0];
            const lastElement = elements[elements.length - 1];
            const activeElement = document.activeElement as HTMLElement;

            if (event.shiftKey) {
                // Shift + Tab (backward)
                if (activeElement === firstElement) {
                    event.preventDefault();
                    lastElement?.focus();
                }
            } else {
                // Tab (forward)
                if (activeElement === lastElement) {
                    event.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        // Focus first element
        focusFirst(container);

        // Return cleanup function
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            focusTrapEnabled.value = false;
            focusTrapElements.value = [];
        };
    };

    /**
     * Keyboard navigation handler
     */
    const handleKeyboardNavigation = (
        event: KeyboardEvent,
        options: {
            onEnter?: () => void;
            onSpace?: () => void;
            onEscape?: () => void;
            onArrowUp?: () => void;
            onArrowDown?: () => void;
            onArrowLeft?: () => void;
            onArrowRight?: () => void;
            onHome?: () => void;
            onEnd?: () => void;
        } = {}
    ) => {
        if (!keyboardNavEnabled.value) return;

        switch (event.key) {
            case 'Enter':
                options.onEnter?.();
                break;
            case ' ':
            case 'Space':
                event.preventDefault();
                options.onSpace?.();
                break;
            case 'Escape':
                options.onEscape?.();
                break;
            case 'ArrowUp':
                event.preventDefault();
                options.onArrowUp?.();
                break;
            case 'ArrowDown':
                event.preventDefault();
                options.onArrowDown?.();
                break;
            case 'ArrowLeft':
                options.onArrowLeft?.();
                break;
            case 'ArrowRight':
                options.onArrowRight?.();
                break;
            case 'Home':
                event.preventDefault();
                options.onHome?.();
                break;
            case 'End':
                event.preventDefault();
                options.onEnd?.();
                break;
        }
    };

    /**
     * Check and apply user preferences
     */
    const checkUserPreferences = () => {
        if (typeof window === 'undefined') return;

        // Check for prefers-reduced-motion
        const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        prefersReducedMotion.value = reducedMotionQuery.matches;
        config.value.respectReducedMotion = reducedMotionQuery.matches;

        // Check for prefers-contrast
        const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
        prefersHighContrast.value = highContrastQuery.matches;
        if (highContrastQuery.matches) {
            isHighContrastMode.value = true;
            config.value.enableHighContrast = true;
        }

        // Listen for changes
        reducedMotionQuery.addEventListener('change', e => {
            prefersReducedMotion.value = e.matches;
            config.value.respectReducedMotion = e.matches;
        });

        highContrastQuery.addEventListener('change', e => {
            prefersHighContrast.value = e.matches;
            if (e.matches) {
                isHighContrastMode.value = true;
                config.value.enableHighContrast = true;
            }
        });
    };

    /**
     * Skip link functionality
     */
    const createSkipLink = (targetId: string, text: string = 'Skip to main content') => {
        const skipLink = document.createElement('a');
        skipLink.href = `#${targetId}`;
        skipLink.textContent = text;
        skipLink.className = 'skip-link';
        skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 1000;
      border-radius: 4px;
      font-weight: 600;
    `;

        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '6px';
        });

        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });

        skipLink.addEventListener('click', e => {
            e.preventDefault();
            const target = document.getElementById(targetId);
            if (target) {
                target.focus();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });

        return skipLink;
    };

    // Initialize on mount
    onMounted(() => {
        checkUserPreferences();

        // Add skip link if main content exists
        const mainContent = document.getElementById('main') || document.querySelector('main');
        if (mainContent && !document.querySelector('.skip-link')) {
            if (!mainContent.id) {
                mainContent.id = 'main-content';
            }
            const skipLink = createSkipLink(mainContent.id);
            document.body.insertBefore(skipLink, document.body.firstChild);
        }
    });

    // Cleanup on unmount
    onUnmounted(() => {
        // Remove live regions
        const liveRegions = document.querySelectorAll('[data-vue-a11y]');
        liveRegions.forEach(region => region.remove());
    });

    return {
        // Configuration
        config,

        // State
        isHighContrastMode,
        prefersHighContrast,
        prefersReducedMotion,
        screenReaderActive,
        focusedElement,
        announcements,
        currentAnnouncement,

        // Utility functions
        announce,
        generateARIA,
        calculateContrastRatio,
        meetsContrastRequirement,

        // Focus management
        focusFirst,
        focusLast,
        getFocusableElements,
        enableFocusTrap,

        // Keyboard navigation
        handleKeyboardNavigation,

        // User preferences
        checkUserPreferences,

        // Skip links
        createSkipLink,
    };
}

/**
 * Composable for managing accessible form validation
 */
export function useAccessibleValidation() {
    const errors = ref<Record<string, string>>({});
    const touched = ref<Record<string, boolean>>({});

    const setError = (field: string, message: string) => {
        errors.value[field] = message;
    };

    const clearError = (field: string) => {
        delete errors.value[field];
    };

    const setTouched = (field: string, value: boolean = true) => {
        touched.value[field] = value;
    };

    const getFieldProps = (field: string) => {
        const hasError = !!errors.value[field] && touched.value[field];

        return {
            'aria-invalid': hasError,
            'aria-describedby': hasError ? `${field}-error` : undefined,
        };
    };

    const getErrorProps = (field: string) => {
        const hasError = !!errors.value[field] && touched.value[field];

        return {
            id: `${field}-error`,
            role: 'alert',
            'aria-live': 'polite' as const,
            style: { display: hasError ? 'block' : 'none' },
        };
    };

    return {
        errors,
        touched,
        setError,
        clearError,
        setTouched,
        getFieldProps,
        getErrorProps,
    };
}
