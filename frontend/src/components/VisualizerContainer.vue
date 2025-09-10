<script>
export default {
    name: 'VisualizerContainer',
    props: {
        backgroundColor: {
            type: String,
            default: 'var(--background-medium)',
        },
        borderColor: {
            type: String,
            default: 'var(--border-color)',
        },
        borderRadius: {
            type: String,
            default: 'var(--border-radius-large)',
        },
        minHeight: {
            type: String,
            default: '300px',
        },
        maxWidth: {
            type: String,
            default: 'var(--container-max-width)',
        },
        padding: {
            type: String,
            default: 'var(--spacing-lg)',
        },
        margin: {
            type: String,
            default: 'var(--spacing-xl) auto',
        },
        fullWidth: {
            type: Boolean,
            default: false,
        },
        flexCentered: {
            type: Boolean,
            default: false,
        },
        containerClass: {
            type: String,
            default: '',
        },
        customStyles: {
            type: Object,
            default: () => ({}),
        },
        keyboardMode: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        containerStyle() {
            const baseStyles = {
                backgroundColor: this.backgroundColor,
                borderColor: this.borderColor,
                borderRadius: this.borderRadius,
                maxWidth: this.maxWidth,
                padding: this.padding,
                margin: this.margin,
                minHeight: this.minHeight,
                ...this.customStyles,
            };

            return baseStyles;
        },
    },
};
</script>

<template>
    <div
        class="visualizer"
        :class="[
            { 'visualizer--full-width': fullWidth },
            { 'visualizer--flex-centered': flexCentered },
            { 'visualizer--keyboard-mode': keyboardMode },
            containerClass,
        ]"
        :style="containerStyle"
    >
        <slot></slot>
    </div>
</template>

<style scoped>
.visualizer {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-large);
    position: relative;
    overflow: hidden;

    /* GPU-accelerated transitions for 60fps performance */
    transition:
        transform var(--transition-morphing) ease-out,
        opacity var(--transition-morphing) ease-out,
        box-shadow var(--animation-slower) ease-out;

    /* Will-change hints for browser optimization */
    will-change: transform, opacity;
}

.visualizer--full-width {
    max-width: none;
    width: 100%;
}

.visualizer--flex-centered {
    align-items: center;
    justify-content: center;
}

.visualizer--keyboard-mode {
    /* Ensure keyboard gets appropriate width with proper specificity */
    padding: 1.5rem;
    max-width: 800px;
}

/* Responsive design with consistent breakpoints */
@media (max-width: 768px) {
    .visualizer {
        margin: var(--spacing-md) auto;
        padding: var(--spacing-md);
        /* GPU-accelerated transitions on mobile */
        transition:
            transform var(--transition-morphing) ease-out,
            opacity var(--transition-morphing) ease-out,
            box-shadow var(--animation-slower) ease-out;
    }

    .visualizer--keyboard-mode {
        padding: var(--spacing-md);
        max-width: none;
    }
}

/* Tablet breakpoint */
@media (min-width: 769px) and (max-width: 1024px) {
    .visualizer--keyboard-mode {
        max-width: 700px;
    }
}

/* Accessibility: Respect reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
    .visualizer {
        transition-duration: var(--animation-slow);
    }
}
</style>
