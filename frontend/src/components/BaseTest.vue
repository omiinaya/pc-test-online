<script lang="ts">
import { defineComponent, ref, onMounted, onActivated, onDeactivated } from 'vue';
import TestActionButtons from './TestActionButtons.vue';
import { useTestState } from '../composables/useTestState';

export default defineComponent({
  name: 'BaseTest',
  components: { TestActionButtons },
  props: {
    actionsDisabled: {
      type: Boolean,
      default: false,
    },
    width: {
      type: String,
      default: 'auto',
    },
    testType: {
      type: String,
      required: true,
    },
    showActionButtons: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['test-completed', 'test-failed', 'test-skipped'],
  setup(props) {
    const testState = useTestState(props.testType);
    const status = ref<'pending' | 'passed' | 'failed' | 'skipped'>('pending');
    const start = ref<number | null>(null);
    const end = ref<number | null>(null);
    const duration = ref<number | null>(null);
    const runCount = ref(0);
    const hasStartedTimer = ref(false);

    const startTimer = (): void => {
      if (!hasStartedTimer.value) {
        start.value = Date.now();
        end.value = null;
        duration.value = null;
        hasStartedTimer.value = true;
        testState.setActive(true);
      }
    };

    const stopTimer = (): void => {
      if (start.value && !end.value) {
        end.value = Date.now();
        duration.value = (end.value - start.value) / 1000;
        testState.setActive(false);
      }
    };

    const resetTimer = (): void => {
      hasStartedTimer.value = false;
      start.value = null;
      end.value = null;
      duration.value = null;
    };

    onMounted(() => {
      startTimer();
    });

    onActivated(() => {
      // Vue keep-alive hook - component becomes active
      if (!hasStartedTimer.value || status.value === 'pending') {
        startTimer();
      }
    });

    onDeactivated(() => {
      // Vue keep-alive hook - component becomes inactive
      testState.setActive(false);
    });

    return {
      testState,
      status,
      start,
      end,
      duration,
      runCount,
      hasStartedTimer,
      startTimer,
      stopTimer,
      resetTimer,
    };
  },
  methods: {
    handlePass(): void {
      this.stopTimer();
      this.status = 'passed';
      this.runCount += 1;
      this.$emit('test-completed', this.testType);
    },

    handleFail(): void {
      this.stopTimer();
      this.status = 'failed';
      this.runCount += 1;
      this.$emit('test-failed', this.testType);
    },

    handleSkip(): void {
      this.stopTimer();
      this.status = 'skipped';
      this.runCount += 1;
      this.$emit('test-skipped', {
        testType: this.testType,
        duration: this.duration,
      });
    },
  },
});
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