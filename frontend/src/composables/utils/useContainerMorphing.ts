import { ref, reactive, type Ref } from 'vue';
import type { ContainerStyles } from '../../types';

/** @ignore */
interface MorphingState {
    currentTest: string | null;
    containerKey: number;
}

// Global state for container morphing
/** @ignore */
const morphingState: MorphingState = reactive({
    currentTest: null,
    containerKey: 0, // Force reactivity updates
});

// Container styles for each test
/** @ignore */
const containerStyles: Record<string, ContainerStyles> = {
    webcam: { minHeight: '500px' },
    microphone: { minHeight: '350px' },
    speakers: { minHeight: '380px' },
    keyboard: { minHeight: '320px' },
    mouse: { minHeight: '550px' },
    touch: { minHeight: '250px' },
    battery: { minHeight: '280px' },
    testsCompleted: { minHeight: '300px' },
};

/** @ignore */
interface ContainerMorphingReturn {
    currentTest: Ref<string | null>;
    setActiveTest: (testType: string) => void;
    getContainerStyles: (testType: string) => { minHeight: string };
    getCurrentContainerStyles: () => { minHeight: string };
    containerKey: () => number;
}

/** @ignore */
export function useContainerMorphing(): ContainerMorphingReturn {
    const currentTest: Ref<string | null> = ref(morphingState.currentTest);

    const setActiveTest = (testType: string) => {
        if (morphingState.currentTest !== testType) {
            morphingState.currentTest = testType;
            morphingState.containerKey++; // Force update
            currentTest.value = testType;
        }
    };

    const getContainerStyles = (testType: string): { minHeight: string } => {
        return containerStyles[testType] || { minHeight: '300px' };
    };

    const getCurrentContainerStyles = (): { minHeight: string } => {
        return getContainerStyles(morphingState.currentTest || '');
    };

    return {
        currentTest,
        setActiveTest,
        getContainerStyles,
        getCurrentContainerStyles,
        containerKey: () => morphingState.containerKey,
    };
}

// Export the state for debugging
/** @ignore */
export { morphingState, containerStyles };