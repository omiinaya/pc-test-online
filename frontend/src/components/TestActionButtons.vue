<script lang="ts">
import { defineComponent, computed } from 'vue';

export default defineComponent({
    name: 'TestActionButtons',
    props: {
        actionsDisabled: {
            type: Boolean,
            default: false,
        },
        containerStyles: {
            type: Object as () => Record<string, string>,
            default: () => ({}),
        },
    },
    emits: ['working', 'not-working', 'skip'],
    setup(props) {
        const controlsBarStyle = computed(() => {
            const currentMaxWidth = props.containerStyles.maxWidth;

            // Use consistent timing that matches VisualizerContainer
            const transitionTime = 'var(--animation-slow)';

            return {
                maxWidth: currentMaxWidth || 'var(--container-max-width)',
                transition: `max-width ${transitionTime}`,
            };
        });

        return {
            controlsBarStyle,
        };
    },
});
</script>

<template>
    <div class="controls-bar" :style="controlsBarStyle">
        <button
            @click="$emit('not-working')"
            class="button button--danger button--medium"
            :disabled="actionsDisabled"
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
                class="feather feather-x"
            >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            <span>Fail</span>
        </button>
        <button
            @click="$emit('skip')"
            class="button button--skip button--medium"
            :disabled="actionsDisabled"
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
                class="feather feather-fast-forward"
            >
                <polygon points="13 19 22 12 13 5 13 19"></polygon>
                <polygon points="2 19 11 12 2 5 2 19"></polygon>
            </svg>
            <span>Skip</span>
        </button>
        <button
            @click="$emit('working')"
            class="button button--success button--medium"
            :disabled="actionsDisabled"
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
                class="feather feather-check"
            >
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Pass</span>
        </button>
    </div>
</template>

<style>
.controls-bar {
    width: 100%;
    margin: -1px auto 0 auto;
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 1rem;
    background-color: #2c2c2e;
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-large);
    border-radius: var(--border-radius-large);
}

.controls-bar > .button {
    flex: 1;
    min-width: 0;
}
</style>
