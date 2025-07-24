// CSS feature detection and progressive enhancement for cross-browser compatibility
import { ref, onMounted } from 'vue';

export interface CSSFeatureSupport {
    grid: boolean;
    flexbox: boolean;
    customProperties: boolean;
    containerQueries: boolean;
    aspectRatio: boolean;
    clipPath: boolean;
    backdropFilter: boolean;
    scrollBehavior: boolean;
    appearance: boolean;
    userSelect: boolean;
}

export interface CSSCompatibilityState {
    features: CSSFeatureSupport;
    browserName: string;
    browserVersion: number;
    fallbacksApplied: string[];
    recommendations: string[];
    cssGrade: 'A' | 'B' | 'C' | 'D' | 'F';
}

/**
 * CSS compatibility and progressive enhancement composable
 * Detects CSS feature support and applies fallbacks for better cross-browser compatibility
 */
export function useCSSCompatibility() {
    const state = ref<CSSCompatibilityState>({
        features: {
            grid: false,
            flexbox: false,
            customProperties: false,
            containerQueries: false,
            aspectRatio: false,
            clipPath: false,
            backdropFilter: false,
            scrollBehavior: false,
            appearance: false,
            userSelect: false,
        },
        browserName: '',
        browserVersion: 0,
        fallbacksApplied: [],
        recommendations: [],
        cssGrade: 'A',
    });

    const isInitialized = ref(false);

    /**
     * Detect browser and version
     */
    const detectBrowser = () => {
        const userAgent = navigator.userAgent;

        if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) {
            state.value.browserName = 'Chrome';
            const match = userAgent.match(/Chrome\/(\d+)/);
            state.value.browserVersion = match ? parseInt(match[1] || '0') : 0;
        } else if (userAgent.includes('Firefox')) {
            state.value.browserName = 'Firefox';
            const match = userAgent.match(/Firefox\/(\d+)/);
            state.value.browserVersion = match ? parseInt(match[1] || '0') : 0;
        } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            state.value.browserName = 'Safari';
            const match = userAgent.match(/Version\/(\d+)/);
            state.value.browserVersion = match ? parseInt(match[1] || '0') : 0;
        } else if (userAgent.includes('Edge')) {
            state.value.browserName = 'Edge';
            const match = userAgent.match(/Edge?\/(\d+)/);
            state.value.browserVersion = match ? parseInt(match[1] || '0') : 0;
        }
    };

    /**
     * Test if a CSS feature is supported
     */
    const testCSSFeature = (property: string, value: string): boolean => {
        if (typeof CSS !== 'undefined' && CSS.supports) {
            return CSS.supports(property, value);
        }

        // Fallback feature detection
        const element = document.createElement('div');
        const prefixes = ['', '-webkit-', '-moz-', '-ms-', '-o-'];

        for (const prefix of prefixes) {
            const prefixedProperty = prefix + property;
            try {
                element.style.setProperty(prefixedProperty, value);
                if (element.style.getPropertyValue(prefixedProperty) === value) {
                    return true;
                }
            } catch (e) {
                // Property not supported
            }
        }

        return false;
    };

    /**
     * Detect CSS feature support
     */
    const detectCSSFeatures = () => {
        const features = state.value.features;

        // CSS Grid
        features.grid = testCSSFeature('display', 'grid');

        // Flexbox
        features.flexbox = testCSSFeature('display', 'flex');

        // CSS Custom Properties (Variables)
        features.customProperties = testCSSFeature('--test', 'test');

        // Container Queries
        features.containerQueries = testCSSFeature('container-type', 'inline-size');

        // Aspect Ratio
        features.aspectRatio = testCSSFeature('aspect-ratio', '16/9');

        // Clip Path
        features.clipPath = testCSSFeature('clip-path', 'circle(50%)');

        // Backdrop Filter
        features.backdropFilter = testCSSFeature('backdrop-filter', 'blur(10px)');

        // Scroll Behavior
        features.scrollBehavior = testCSSFeature('scroll-behavior', 'smooth');

        // Appearance
        features.appearance = testCSSFeature('appearance', 'none');

        // User Select
        features.userSelect = testCSSFeature('user-select', 'none');
    };

    /**
     * Apply CSS fallbacks and progressive enhancement
     */
    const applyCSSFallbacks = () => {
        const fallbacks: string[] = [];
        const recommendations: string[] = [];

        // Add CSS classes to document for feature detection
        const htmlEl = document.documentElement;

        // Grid fallback
        if (!state.value.features.grid) {
            htmlEl.classList.add('no-grid');
            fallbacks.push('CSS Grid fallback applied - using flexbox layouts');
            recommendations.push('Update to a modern browser for CSS Grid support');
        } else {
            htmlEl.classList.add('has-grid');
        }

        // Flexbox fallback
        if (!state.value.features.flexbox) {
            htmlEl.classList.add('no-flexbox');
            fallbacks.push('Flexbox fallback applied - using block layouts');
            recommendations.push('Update browser for flexbox support');
        } else {
            htmlEl.classList.add('has-flexbox');
        }

        // Custom Properties fallback
        if (!state.value.features.customProperties) {
            htmlEl.classList.add('no-css-vars');
            fallbacks.push('CSS variables fallback applied - using static values');
            recommendations.push('Update browser for CSS custom properties support');
        } else {
            htmlEl.classList.add('has-css-vars');
        }

        // Container Queries fallback
        if (!state.value.features.containerQueries) {
            htmlEl.classList.add('no-container-queries');
            fallbacks.push('Container queries not supported - using media queries');
        } else {
            htmlEl.classList.add('has-container-queries');
        }

        // Aspect Ratio fallback
        if (!state.value.features.aspectRatio) {
            htmlEl.classList.add('no-aspect-ratio');
            fallbacks.push('Aspect ratio fallback applied - using padding technique');
        } else {
            htmlEl.classList.add('has-aspect-ratio');
        }

        // Backdrop Filter fallback
        if (!state.value.features.backdropFilter) {
            htmlEl.classList.add('no-backdrop-filter');
            fallbacks.push('Backdrop filter fallback applied - using solid backgrounds');
        } else {
            htmlEl.classList.add('has-backdrop-filter');
        }

        // Browser-specific classes
        htmlEl.classList.add(`browser-${state.value.browserName.toLowerCase()}`);
        htmlEl.classList.add(
            `browser-${state.value.browserName.toLowerCase()}-${state.value.browserVersion}`
        );

        // Safari-specific recommendations
        if (state.value.browserName === 'Safari') {
            if (state.value.browserVersion < 14) {
                recommendations.push('Safari 14+ recommended for modern CSS features');
            }
            if (!state.value.features.backdropFilter) {
                recommendations.push('Backdrop filters require Safari 14+ or use Chrome/Firefox');
            }
        }

        // Firefox-specific recommendations
        if (state.value.browserName === 'Firefox') {
            if (!state.value.features.containerQueries && state.value.browserVersion < 110) {
                recommendations.push('Firefox 110+ required for container queries');
            }
        }

        // IE/Edge Legacy warnings
        if (state.value.browserName === 'Edge' && state.value.browserVersion < 79) {
            recommendations.push('Update to Chromium-based Edge for full CSS support');
            fallbacks.push('Legacy Edge detected - extensive fallbacks applied');
        }

        state.value.fallbacksApplied = fallbacks;
        state.value.recommendations = recommendations;
    };

    /**
     * Calculate CSS compatibility grade
     */
    const calculateCSSGrade = () => {
        const features = state.value.features;
        let score = 0;
        const totalFeatures = Object.keys(features).length;

        // Count supported features
        Object.values(features).forEach(supported => {
            if (supported) score++;
        });

        const percentage = (score / totalFeatures) * 100;

        if (percentage >= 90) state.value.cssGrade = 'A';
        else if (percentage >= 80) state.value.cssGrade = 'B';
        else if (percentage >= 70) state.value.cssGrade = 'C';
        else if (percentage >= 60) state.value.cssGrade = 'D';
        else state.value.cssGrade = 'F';

        return percentage;
    };

    /**
     * Inject critical CSS fallbacks
     */
    const injectCSSFallbacks = () => {
        const style = document.createElement('style');
        style.id = 'css-compatibility-fallbacks';

        const css = `
      /* CSS Compatibility Fallbacks */
      
      /* Grid Fallback */
      .no-grid .grid-container {
        display: flex;
        flex-wrap: wrap;
      }
      
      .no-grid .grid-item {
        flex: 1 1 300px;
        margin: 0.5rem;
      }
      
      /* Flexbox Fallback */
      .no-flexbox .flex-container {
        display: block;
      }
      
      .no-flexbox .flex-item {
        display: inline-block;
        vertical-align: top;
        width: 48%;
        margin: 1%;
      }
      
      /* Aspect Ratio Fallback */
      .no-aspect-ratio .aspect-ratio-container {
        position: relative;
        width: 100%;
        padding-bottom: 56.25%; /* 16:9 aspect ratio */
      }
      
      .no-aspect-ratio .aspect-ratio-content {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
      
      /* Backdrop Filter Fallback */
      .no-backdrop-filter .backdrop-filter {
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: none;
      }
      
      /* Browser-specific fixes */
      .browser-safari .safari-fix {
        -webkit-transform: translateZ(0);
      }
      
      .browser-firefox .firefox-fix {
        -moz-appearance: none;
      }
      
      /* Dark mode fallbacks */
      @media (prefers-color-scheme: dark) {
        .no-css-vars {
          --text-primary: #ffffff;
          --text-secondary: #cccccc;
          --background-primary: #1a1a1a;
          --background-secondary: #2d2d2d;
        }
      }
    `;
        style.textContent = css;
        document.head.appendChild(style);
    };

    /**
     * Initialize CSS compatibility system
     */
    const initialize = () => {
        if (isInitialized.value) return;

        detectBrowser();
        detectCSSFeatures();
        applyCSSFallbacks();
        calculateCSSGrade();
        injectCSSFallbacks();

        isInitialized.value = true;
    };

    /**
     * Get CSS compatibility summary
     */
    const getCompatibilitySummary = () => ({
        grade: state.value.cssGrade,
        score: calculateCSSGrade(),
        browser: `${state.value.browserName} ${state.value.browserVersion}`,
        features: { ...state.value.features },
        fallbacksCount: state.value.fallbacksApplied.length,
        recommendationsCount: state.value.recommendations.length,
        hasIssues:
            state.value.fallbacksApplied.length > 0 || state.value.recommendations.length > 0,
    });

    // Auto-initialize on mount
    onMounted(() => {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
            initialize();
        });
    });

    return {
        // State
        state,
        isInitialized,

        // Methods
        initialize,
        getCompatibilitySummary,
        calculateCSSGrade,

        // Computed getters
        get cssGrade() {
            return state.value.cssGrade;
        },
        get features() {
            return state.value.features;
        },
        get fallbacksApplied() {
            return state.value.fallbacksApplied;
        },
        get recommendations() {
            return state.value.recommendations;
        },
        get browserInfo() {
            return `${state.value.browserName} ${state.value.browserVersion}`;
        },
        get hasCompatibilityIssues() {
            return (
                state.value.fallbacksApplied.length > 0 || state.value.recommendations.length > 0
            );
        },
    };
}
