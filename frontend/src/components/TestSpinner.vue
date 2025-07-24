<script>
export default {
    name: 'TestSpinner',
    props: {
        message: { type: String, required: true },
        subMessage: { type: String, default: '' },
        color: { type: String, default: '#ff6b00' },
        showIcon: { type: Boolean, default: true },
    },
};
</script>

<template>
    <div class="test-spinner" :style="{ '--accent': color }">
        <div v-if="showIcon" class="spinner-icon">
            <slot name="icon">
                <svg class="spinner" width="40" height="40" viewBox="0 0 40 40">
                    <circle
                        class="spinner-bg"
                        cx="20"
                        cy="20"
                        r="18"
                        fill="none"
                        stroke="#333"
                        stroke-width="4"
                    />
                    <circle
                        class="spinner-fg"
                        cx="20"
                        cy="20"
                        r="18"
                        fill="none"
                        :stroke="color"
                        stroke-width="4"
                        stroke-linecap="round"
                        stroke-dasharray="113"
                        stroke-dashoffset="60"
                    />
                </svg>
            </slot>
        </div>
        <div class="spinner-messages">
            <p class="spinner-message">{{ message }}</p>
            <p v-if="subMessage" class="spinner-sub-message">{{ subMessage }}</p>
        </div>
    </div>
</template>

<style scoped>
.test-spinner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    width: 100%;
    padding: 1.5rem 0.5rem;
}

.spinner-icon {
    margin-bottom: 1rem;
}

.spinner {
    animation: spin var(--animation-morphing) linear infinite;
    width: 40px;
    height: 40px;
    display: block;
}

.spinner-bg {
    stroke: #333;
    opacity: 0.2;
}

.spinner-fg {
    stroke: var(--accent, #ff6b00);
    stroke-dasharray: 113;
    stroke-dashoffset: 60;
    animation: spinner-dash calc(var(--animation-morphing) * 1.2) ease-in-out infinite;
}

@keyframes spin {
    100% {
        transform: rotate(360deg);
    }
}

@keyframes spinner-dash {
    0% {
        stroke-dashoffset: 113;
    }

    50% {
        stroke-dashoffset: 30;
    }

    100% {
        stroke-dashoffset: 113;
    }
}

.spinner-message {
    font-size: 1.1rem;
    color: #fff;
    margin: 0 0 0.25rem 0;
    font-weight: 500;
}

.spinner-sub-message {
    font-size: 0.98rem;
    color: #bdbdbd;
    margin: 0;
}
</style>
