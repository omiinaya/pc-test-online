<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { ref, computed, onErrorCaptured, onMounted, readonly } from 'vue';
import type { ErrorInfo, ErrorType } from '@/types';

interface Props {
    fallbackTitle?: string;
    fallbackMessage?: string;
    showDetails?: boolean;
    showReload?: boolean;
    showReport?: boolean;
    maxRetries?: number;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    onRetry?: () => void | Promise<void>;
}

const { t } = useI18n();

const props = withDefaults(defineProps<Props>(), {
  fallbackTitle: t('errors.generic.title'),
  fallbackMessage: t('errors.generic.message'),
  showDetails: false,
  showReload: true,
  showReport: false,
  maxRetries: 3,
});

// Error state
const hasError = ref(false);
const error = ref<Error | null>(null);
const errorInfo = ref<ErrorInfo | null>(null);
const retryCount = ref(0);
const isRetrying = ref(false);

// Helper function to map error names to ErrorType
const mapErrorType = (errorName: string): ErrorType => {
    const errorTypeMap: Record<string, ErrorType> = {
        ChunkLoadError: 'UNEXPECTED_ERROR',
        NetworkError: 'UNEXPECTED_ERROR',
        NotAllowedError: 'PERMISSION_DENIED',
        NotFoundError: 'DEVICE_NOT_FOUND',
        NotReadableError: 'DEVICE_BUSY',
        NotSupportedError: 'BROWSER_NOT_SUPPORTED',
        OverconstrainedError: 'DEVICE_NOT_FOUND',
        AbortError: 'UNEXPECTED_ERROR',
        TimeoutError: 'DEVICE_TIMEOUT',
    };

    return errorTypeMap[errorName] || 'UNEXPECTED_ERROR';
};

// Computed properties
const errorTitle = computed(() => {
  if (error.value?.name === 'ChunkLoadError') {
    return t('errors.update_available.title');
  }
  if (error.value?.name === 'NetworkError') {
    return t('errors.network.title');
  }
  return props.fallbackTitle;
});

const errorMessage = computed(() => {
  if (error.value?.name === 'ChunkLoadError') {
    return t('errors.update_available.message');
  }
  if (error.value?.name === 'NetworkError') {
    return t('errors.network.message');
  }
  return error.value?.message || props.fallbackMessage;
});

const errorDetails = computed(() => {
    if (!props.showDetails || !error.value) return null;

    return [
        `Error: ${error.value.name}`,
        `Message: ${error.value.message}`,
        error.value.stack ? `Stack: ${error.value.stack}` : '',
        errorInfo.value ? `Component: ${errorInfo.value.type}` : '',
        errorInfo.value ? `Context: ${errorInfo.value.context || t('common.unknown')}` : '',
    ]
        .filter(Boolean)
        .join('\n');
});

// Error capture
onErrorCaptured((err: Error, info: any) => {
    console.error('ErrorBoundary caught error:', err);
    console.error('Error info:', info);

    error.value = err;
    const newErrorInfo: ErrorInfo = {
        type: mapErrorType(err.name),
        message: err.message,
        context: info?.componentName || t('common.unknownComponent'),
        originalError: err,
    };
    errorInfo.value = newErrorInfo;
    hasError.value = true;

    // Call custom error handler
    if (props.onError) {
        props.onError(err, newErrorInfo);
    }

    // Prevent the error from propagating
    return false;
});

// Global error handler for unhandled promise rejections
onMounted(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        console.error('Unhandled promise rejection:', event.reason);

        const err = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
        error.value = err;
        const newErrorInfo: ErrorInfo = {
            type: 'UNEXPECTED_ERROR',
            message: err.message,
            context: 'Global Promise Handler',
            originalError: err,
        };
        errorInfo.value = newErrorInfo;
        hasError.value = true;

        if (props.onError) {
            props.onError(err, newErrorInfo);
        }

        // Prevent the unhandled rejection from being logged to console
        event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup
    return () => {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
});

// Actions
const handleRetry = async () => {
    if (retryCount.value >= props.maxRetries) {
        handleReload();
        return;
    }

    isRetrying.value = true;
    retryCount.value++;

    try {
        // Call custom retry handler
        if (props.onRetry) {
            await props.onRetry();
        }

        // Wait a bit before clearing error
        await new Promise(resolve => setTimeout(resolve, 500));

        // Clear error state
        hasError.value = false;
        error.value = null;
        errorInfo.value = null;
    } catch (retryError) {
        console.error('Retry failed:', retryError);
        // Keep the error state and show reload option
    } finally {
        isRetrying.value = false;
    }
};

const handleReload = () => {
    window.location.reload();
};

const handleReport = () => {
    const errorReport = {
        error: error.value?.name,
        message: error.value?.message,
        stack: error.value?.stack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
    };

    // In a real application, this would send the error to a reporting service
    console.log('Error report:', errorReport);

    // For now, just copy to clipboard
    navigator.clipboard
        ?.writeText(JSON.stringify(errorReport, null, 2))
        .then(() => {
            alert(this.$t('alerts.errorDetailsCopied'));
        })
        .catch(() => {
            alert(this.$t('alerts.unableToCopyErrorDetails'));
        });
};

// Expose reset method for parent components
const reset = () => {
    hasError.value = false;
    error.value = null;
    errorInfo.value = null;
    retryCount.value = 0;
    isRetrying.value = false;
};

defineExpose({
    reset,
    hasError: readonly(hasError),
    error: readonly(error),
});
</script>

<template>
    <div v-if="hasError" class="error-boundary">
        <div class="error-boundary__container">
            <div class="error-boundary__icon">
                <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
            </div>

            <h2 class="error-boundary__title">
                {{ errorTitle }}
            </h2>

            <p class="error-boundary__message">
                {{ errorMessage }}
            </p>

            <div v-if="showDetails && errorDetails" class="error-boundary__details">
                <details class="error-boundary__accordion">
                  <summary class="error-boundary__summary">{{ t('errors.technical_details') }}</summary>
                    <div class="error-boundary__content">
                        <pre class="error-boundary__stack">{{ errorDetails }}</pre>
                    </div>
                </details>
            </div>

            <div class="error-boundary__actions">
                <button
                    type="button"
                    class="error-boundary__button error-boundary__button--primary"
                    @click="handleRetry"
                    :disabled="isRetrying"
                >
                    <span
                        v-if="isRetrying"
                        class="error-boundary__spinner"
                        aria-hidden="true"
                    ></span>
                    {{ isRetrying ? t('buttons.retrying') : t('buttons.retry') }}
                </button>
        
                <button
                    v-if="showReload"
                    type="button"
                    class="error-boundary__button error-boundary__button--secondary"
                    @click="handleReload"
                >
                    {{ t('buttons.reload') }}
                </button>
        
                <button
                    v-if="showReport"
                    type="button"
                    class="error-boundary__button error-boundary__button--ghost"
                    @click="handleReport"
                >
                    {{ t('buttons.report') }}
                </button>
            </div>
        </div>
    </div>

    <slot v-else />
</template>

<style scoped>
.error-boundary {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    padding: 2rem;
    background: linear-gradient(135deg, #fef2f2 0%, #fef7ff 100%);
    border-radius: 8px;
    border: 1px solid #fecaca;
}

.error-boundary__container {
    max-width: 500px;
    text-align: center;
    color: #374151;
}

.error-boundary__icon {
    color: #ef4444;
    margin-bottom: 1.5rem;
    display: flex;
    justify-content: center;
}

.error-boundary__title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
    color: #1f2937;
}

.error-boundary__message {
    font-size: 1rem;
    line-height: 1.6;
    margin-bottom: 1.5rem;
    color: #6b7280;
}

.error-boundary__details {
    margin-bottom: 2rem;
    text-align: left;
}

.error-boundary__accordion {
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    overflow: hidden;
}

.error-boundary__summary {
    background: #f9fafb;
    padding: 0.75rem 1rem;
    cursor: pointer;
    font-weight: 500;
    border-bottom: 1px solid #e5e7eb;
    user-select: none;
}

.error-boundary__summary:hover {
    background: #f3f4f6;
}

.error-boundary__content {
    padding: 1rem;
    background: #ffffff;
}

.error-boundary__stack {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.75rem;
    line-height: 1.4;
    color: #374151;
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0;
}

.error-boundary__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: center;
}

.error-boundary__button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    border-radius: 6px;
    font-weight: 500;
    font-size: 0.875rem;
    transition: all 0.2s;
    cursor: pointer;
    border: 1px solid transparent;
    text-decoration: none;
}

.error-boundary__button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.error-boundary__button--primary {
    background: #2563eb;
    color: white;
    border-color: #2563eb;
}

.error-boundary__button--primary:hover:not(:disabled) {
    background: #1d4ed8;
    border-color: #1d4ed8;
}

.error-boundary__button--secondary {
    background: #6b7280;
    color: white;
    border-color: #6b7280;
}

.error-boundary__button--secondary:hover:not(:disabled) {
    background: #374151;
    border-color: #374151;
}

.error-boundary__button--ghost {
    background: transparent;
    color: #6b7280;
    border-color: #d1d5db;
}

.error-boundary__button--ghost:hover:not(:disabled) {
    background: #f9fafb;
    color: #374151;
}

.error-boundary__spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* Responsive design */
@media (max-width: 640px) {
    .error-boundary {
        padding: 1rem;
        min-height: 300px;
    }

    .error-boundary__title {
        font-size: 1.25rem;
    }

    .error-boundary__actions {
        flex-direction: column;
        align-items: stretch;
    }

    .error-boundary__button {
        justify-content: center;
    }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
    .error-boundary {
        background: white;
        border: 2px solid #000000;
    }

    .error-boundary__title {
        color: #000000;
    }

    .error-boundary__message {
        color: #000000;
    }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
    .error-boundary__spinner {
        animation: none;
    }

    .error-boundary__button {
        transition: none;
    }
}
</style>
