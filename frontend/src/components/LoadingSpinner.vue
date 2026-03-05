<script lang="ts">
export default {
    name: 'LoadingSpinner',
    props: {
        size: {
            type: String as () => 'small' | 'medium' | 'large',
            default: 'medium',
            validator: (value: string) => ['small', 'medium', 'large'].includes(value),
        },
    },
    setup() {
        const sizeClasses = {
            small: 'spinner--small',
            medium: 'spinner--medium',
            large: 'spinner--large',
        };
        return { sizeClasses };
    },
};
</script>

<template>
    <div
        class="loading-spinner"
        :class="[sizeClasses[size], 'spinner']"
        role="status"
        aria-label="Loading"
    >
        <div class="spinner__ring"></div>
        <div class="spinner__ring"></div>
        <div class="spinner__ring"></div>
        <div class="spinner__ring"></div>
        <span class="spinner__text">Loading...</span>
    </div>
</template>

<style scoped>
.spinner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.spinner__ring {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 3px solid transparent;
    border-top-color: currentColor;
    animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}

.spinner__ring:nth-child(1) {
    animation-delay: -0.45s;
}

.spinner__ring:nth-child(2) {
    animation-delay: -0.3s;
}

.spinner__ring:nth-child(3) {
    animation-delay: -0.15s;
}

.spinner__text {
    margin-top: 35px;
    font-size: 0.875rem;
    color: var(--text-secondary, #aaa);
    font-weight: 500;
}

/* Size variants */
.spinner--small {
    width: 32px;
    height: 32px;
    color: var(--primary-color, #3b82f6);
}

.spinner--small .spinner__text {
    font-size: 0.75rem;
    margin-top: 28px;
}

.spinner--medium {
    width: 48px;
    height: 48px;
    color: var(--primary-color, #3b82f6);
}

.spinner--medium .spinner__text {
    font-size: 0.875rem;
    margin-top: 42px;
}

.spinner--large {
    width: 64px;
    height: 64px;
    color: var(--primary-color, #3b82f6);
}

.spinner--large .spinner__text {
    font-size: 1rem;
    margin-top: 56px;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}
</style>
