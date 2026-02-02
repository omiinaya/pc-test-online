<script lang="ts">
import { defineComponent, computed } from 'vue';
import TestSpinner from './TestSpinner.vue';

export type StatePanelState = 'loading' | 'error' | 'success' | 'info' | 'warning' | 'permission';

export default defineComponent({
  name: 'StatePanel',
  components: {
    TestSpinner,
  },
  emits: ['retry', 'action-clicked'],
  props: {
    state: {
      type: String as () => StatePanelState,
      default: 'info',
      validator: (value: string) =>
        ['loading', 'error', 'success', 'info', 'warning', 'permission'].includes(value),
    },
    title: {
      type: String,
      default: '',
    },
    message: {
      type: String,
      default: '',
    },
    showIcon: {
      type: Boolean,
      default: true,
    },
    showRetryButton: {
      type: Boolean,
      default: false,
    },
    showActionButton: {
      type: Boolean,
      default: false,
    },
    retryLabel: {
      type: String,
      default: '',
    },
    actionLabel: {
      type: String,
      default: '',
    },
    actionDisabled: {
      type: Boolean,
      default: false,
    },
    fullHeight: {
      type: Boolean,
      default: true,
    },
  },
  setup(props) {
    const showAction = computed(() => 
      props.showRetryButton || props.showActionButton
    );

    const iconClass = computed(() => ({
      'icon-error': props.state === 'error',
      'icon-success': props.state === 'success',
      'icon-warning': props.state === 'warning',
      'icon-info': props.state === 'info',
      'icon-loading': props.state === 'loading',
      'icon-permission': props.state === 'permission',
    }));

    return {
      showAction,
      iconClass,
    };
  },
});
</script>

<template>
  <div class="state-panel" :class="[`state-${state}`, { 'full-height': fullHeight }]">
    <!-- Special handling for loading state with TestSpinner -->
    <TestSpinner v-if="state === 'loading'" :message="title" :sub-message="message" />

    <!-- All other states use the regular icon + content layout -->
    <template v-else>
      <div v-if="showIcon" class="panel-icon" :class="iconClass">
        <slot name="icon">
          <!-- Error Icon -->
          <svg
            v-if="state === 'error'"
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>

          <!-- Success Icon -->
          <svg
            v-else-if="state === 'success'"
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>

          <!-- Warning Icon -->
          <svg
            v-else-if="state === 'warning'"
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
            ></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>

          <!-- Info Icon -->
          <svg
            v-else-if="state === 'info'"
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>

          <!-- Permission Icon -->
          <svg
            v-else-if="state === 'permission'"
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </slot>
      </div>

      <div class="panel-content">
        <h3 v-if="title" class="panel-title">{{ title }}</h3>
        <p v-if="message" class="panel-message">{{ message }}</p>
        <slot></slot>
      </div>

      <div v-if="showAction" class="panel-actions">
        <button
          v-if="showRetryButton"
          @click="$emit('retry')"
          class="button button--primary button--medium"
          :disabled="actionDisabled"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path
              d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"
            ></path>
          </svg>
          <span>{{ retryLabel || $t('buttons.retry') }}</span>
        </button>

        <button
          v-if="showActionButton"
          @click="$emit('action-clicked')"
          class="button button--primary button--medium"
          :disabled="actionDisabled"
        >
          <slot name="action-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </slot>
          <span>{{ actionLabel || $t('buttons.continue') }}</span>
        </button>

        <slot name="actions"></slot>
      </div>
    </template>
  </div>
</template>

<style scoped>
.state-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--spacing-lg);
  color: var(--text-primary);
  width: 100%;
  min-height: 200px;
  aspect-ratio: 16/9; /* Match the video container aspect ratio */
  background: var(--background-dark);
  border-radius: var(--border-radius);
}

.state-panel.full-height {
  flex-grow: 1;
}

.panel-icon {
  margin-bottom: var(--spacing-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel-icon.icon-error {
  color: var(--danger-color);
}

.panel-icon.icon-success {
  color: var(--success-color);
}

.panel-icon.icon-warning {
  color: var(--warning-color);
}

.panel-icon.icon-info {
  color: var(--primary-color);
}

.panel-icon.icon-loading {
  color: var(--primary-color);
}

.panel-icon.icon-permission {
  color: var(--primary-color);
}

.panel-content {
  max-width: 350px;
  width: 100%;
}

.panel-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--text-primary);
}

.panel-message {
  font-size: var(--font-size-sm);
  line-height: 1.5;
  margin: 0 0 var(--spacing-md) 0;
  color: var(--text-secondary);
}

.panel-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}

.spinning {
  animation: spin var(--animation-morphing) linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* State-specific styles */
.state-panel.state-error {
  background-color: rgba(220, 53, 69, 0.05);
}

.state-panel.state-success {
  background-color: rgba(40, 167, 69, 0.05);
}

.state-panel.state-warning {
  background-color: rgba(255, 193, 7, 0.05);
}

.state-panel.state-loading {
  background-color: rgba(255, 107, 0, 0.05);
}
</style>