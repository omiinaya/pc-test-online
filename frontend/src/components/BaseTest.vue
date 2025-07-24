<script>
import TestActionButtons from './TestActionButtons.vue';
import { useTestState } from '../composables/useTestState.js';

export default {
    name: 'BaseTest',
    components: { TestActionButtons },
    props: {
        actionsDisabled: { type: Boolean, default: false },
        width: { type: String, default: 'auto' },
        testType: { type: String, required: true },
        showActionButtons: { type: Boolean, default: true },
    },
    setup(props) {
        const testState = useTestState(props.testType);
        return { testState };
    },
    data() {
        return {
            status: 'pending', // 'pending', 'passed', 'failed', 'skipped'
            start: null,
            end: null,
            duration: null,
            runCount: 0,
            hasStartedTimer: false,
        };
    },
    methods: {
        startTimer() {
            if (!this.hasStartedTimer) {
                this.start = Date.now();
                this.end = null;
                this.duration = null;
                this.hasStartedTimer = true;
                this.testState.setActive(true);
            }
        },
        stopTimer() {
            if (this.start && !this.end) {
                this.end = Date.now();
                this.duration = (this.end - this.start) / 1000;
                this.testState.setActive(false);
            }
        },
        handlePass() {
            this.stopTimer();
            this.status = 'passed';
            this.runCount += 1;
            this.$emit('test-completed', this.testType);
        },
        handleFail() {
            this.stopTimer();
            this.status = 'failed';
            this.runCount += 1;
            this.$emit('test-failed', this.testType);
        },
        handleSkip() {
            this.stopTimer();
            this.status = 'skipped';
            this.runCount += 1;
            this.$emit('test-skipped', {
                testType: this.testType,
                duration: this.duration,
            });
        },
        resetTimer() {
            this.hasStartedTimer = false;
            this.start = null;
            this.end = null;
            this.duration = null;
        },
    },
    mounted() {
        this.startTimer();
    },
    activated() {
        // Vue keep-alive hook - component becomes active
        if (!this.hasStartedTimer || this.status === 'pending') {
            this.startTimer();
        }
    },
    deactivated() {
        // Vue keep-alive hook - component becomes inactive
        this.testState.setActive(false);
    },
};
</script>

<template>
    <div class="test-panel-wrapper fully-rounded" :style="{ width: width }">
        <div class="test-content">
            <slot></slot>
        </div>
        <TestActionButtons
            v-if="showActionButtons"
            :actionsDisabled="actionsDisabled"
            @not-working="handleFail"
            @working="handlePass"
            @skip="handleSkip"
        />
    </div>
</template>

<style scoped>
.test-panel-wrapper {
    background-color: #141414;
    border-radius: 16px !important;
    border: 1px solid #262626;
    box-shadow: 0 4px 25px rgba(0, 0, 0, 0.2);
}

.fully-rounded {
    border-radius: 16px !important;
}

.test-content {
    padding-top: var(--spacing-lg);
}

.test-header {
    margin-bottom: 0.5rem;
}

.test-title-centered {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 600;
    color: #fff;
    margin: 0 0 0.5rem 0;
    gap: 0.7rem;
}

.test-header-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    /* No margin-right */
}

.test-description {
    color: #bdbdbd;
    margin-bottom: 1.5rem;
    font-size: 1rem;
    text-align: center;
}
</style>
