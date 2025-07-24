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
        class="visualizer-container"
        :class="[
            { 'full-width': fullWidth },
            { 'flex-centered': flexCentered },
            { 'keyboard-mode': keyboardMode },
            containerClass,
        ]"
        :style="containerStyle"
    >
        <slot></slot>
    </div>
</template>

<style scoped>
.visualizer-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-large);
    position: relative;
    overflow: hidden;

    /* Smooth transitions for size changes - Using normalized animation speeds */
    transition:
        min-height var(--transition-morphing),
        max-width var(--transition-morphing),
        padding var(--transition-morphing),
        height var(--transition-morphing),
        box-shadow var(--animation-slower) ease-out;
}

.visualizer-container.full-width {
    max-width: none;
    width: 100%;
}

.visualizer-container.flex-centered {
    align-items: center;
    justify-content: center;
}

.visualizer-container.keyboard-mode {
    /* Ensure keyboard gets appropriate width */
    padding: 1.5rem !important;
    max-width: 800px !important;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .visualizer-container {
        margin: var(--spacing-md) auto;
        padding: var(--spacing-md);
        /* Keep consistent transitions on mobile too */
        transition:
            min-height var(--transition-morphing),
            max-width var(--transition-morphing),
            padding var(--transition-morphing),
            height var(--transition-morphing),
            box-shadow var(--animation-slower) ease-out;
    }
}

/* Accessibility: Respect reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
    .visualizer-container {
        transition-duration: var(--animation-slow) !important;
    }
}
</style>
