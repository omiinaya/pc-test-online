<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'TestHeader',
  props: {
    testDescription: {
      type: String,
      default: '',
    },
    centerAlign: {
      type: Boolean,
      default: true,
    },
  },
});
</script>

<template>
  <div class="test-header" :class="{ 'center-align': centerAlign }">
    <p v-if="testDescription" class="test-description">{{ testDescription }}</p>
    <slot></slot>
  </div>
</template>

<style scoped>
.test-header {
  margin-bottom: var(--spacing-lg);
  flex-shrink: 0;
}

.test-header.center-align {
  text-align: center;
}

.test-title {
  display: flex;
  align-items: center;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-sm) 0;
  gap: var(--spacing-sm);
}

.test-header.center-align .test-title {
  justify-content: center;
}

.test-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.test-icon svg {
  width: 32px;
  height: 32px;
  vertical-align: middle;
}

.test-title-text {
  line-height: 1.2;
}

.test-description {
  color: var(--text-secondary);
  font-size: var(--font-size-base);
  margin: 0;
  line-height: 1.5;
}

.test-header.center-align .test-description {
  margin-bottom: var(--spacing-lg);
}
</style>