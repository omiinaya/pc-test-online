import { ref, reactive, type Ref } from 'vue';
import type { TestType, ContainerStyles } from '../types';

/** @ignore */
interface MorphingState {
  currentTest: TestType | null;
  containerKey: number; // Force reactivity updates
}

// Export the state for debugging
/** @ignore */
export const morphingState: MorphingState = reactive({
  currentTest: null,
  containerKey: 0,
});

// Container styles for each test
/** @ignore */
export const containerStyles: Record<TestType, ContainerStyles> = {
  webcam: { minHeight: '500px' },
  microphone: { minHeight: '350px' },
  speakers: { minHeight: '380px' },
  keyboard: { minHeight: '320px' },
  mouse: { minHeight: '550px' },
  touch: { minHeight: '250px' },
  battery: { minHeight: '280px' },
  testsCompleted: { minHeight: '300px' },
};

export interface UseContainerMorphingReturn {
  currentTest: Ref<TestType | null>;
  setActiveTest: (testType: TestType) => void;
  getContainerStyles: (testType: TestType) => ContainerStyles;
  getCurrentContainerStyles: () => ContainerStyles;
  containerKey: () => number;
}

export function useContainerMorphing(): UseContainerMorphingReturn {
  const currentTest: Ref<TestType | null> = ref(morphingState.currentTest);

  const setActiveTest = (testType: TestType): void => {
    if (morphingState.currentTest !== testType) {
      morphingState.currentTest = testType;
      morphingState.containerKey++; // Force update
      currentTest.value = testType;
    }
  };

  const getContainerStyles = (testType: TestType): ContainerStyles => {
    return containerStyles[testType] || { minHeight: '300px' };
  };

  const getCurrentContainerStyles = (): ContainerStyles => {
    return getContainerStyles(morphingState.currentTest as TestType);
  };

  return {
    currentTest,
    setActiveTest,
    getContainerStyles,
    getCurrentContainerStyles,
    containerKey: (): number => morphingState.containerKey,
  };
}