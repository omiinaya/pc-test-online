<script>
export default {
    name: 'AsyncErrorFallback',
    props: {
        error: {
            type: [Error, Object],
            default: null,
        },
        retry: {
            type: Function,
            default: null,
        },
        componentName: {
            type: String,
            default: 'Component',
        },
    },
    setup(props) {
        const handleRetry = () => {
            if (props.retry) {
                props.retry();
            }
        };
        return { handleRetry };
    },
};
</script>

<template>
    <div class="async-error-fallback" role="alert">
        <div class="error-icon">⚠️</div>
        <h4 class="error-title">Failed to load {{ componentName }}</h4>
        <p class="error-message" v-if="error">
            {{ error.message || 'An unknown error occurred' }}
        </p>
        <p class="error-message" v-else>
            The component could not be loaded. Please check your internet connection and try again.
        </p>
        <button v-if="retry" @click="handleRetry" class="error-retry-btn">Try Again</button>
        <p class="error-suggestion">If the problem persists, refresh the page.</p>
    </div>
</template>

<style scoped>
.async-error-fallback {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    text-align: center;
    background: var(--surface-secondary, #1a1a1a);
    border: 1px solid var(--border-color, #333);
    border-radius: var(--border-radius, 8px);
    min-height: 200px;
}

.error-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    filter: grayscale(0.3);
}

.error-title {
    color: var(--error-color, #ef4444);
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
}

.error-message {
    color: var(--text-secondary, #aaa);
    font-size: 0.875rem;
    margin: 0 0 1rem 0;
    max-width: 300px;
    line-height: 1.5;
}

.error-retry-btn {
    background: var(--primary-color, #3b82f6);
    color: white;
    border: none;
    padding: 0.5rem 1.5rem;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s ease;
    margin-bottom: 1rem;
}

.error-retry-btn:hover {
    background: var(--primary-hover, #2563eb);
}

.error-suggestion {
    color: var(--text-muted, #666);
    font-size: 0.75rem;
    margin: 0;
}
</style>
