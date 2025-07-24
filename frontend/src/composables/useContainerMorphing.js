import { ref, reactive } from 'vue';

// Global state for container morphing
const morphingState = reactive({
    currentTest: null,
    containerKey: 0, // Force reactivity updates
});

// Container styles for each test
const containerStyles = {
    webcam: { minHeight: '500px' },
    microphone: { minHeight: '350px' },
    speakers: { minHeight: '380px' },
    keyboard: { minHeight: '320px' },
    mouse: { minHeight: '550px' },
    touch: { minHeight: '250px' },
    battery: { minHeight: '280px' },
    testsCompleted: { minHeight: '300px' },
};

export function useContainerMorphing() {
    const currentTest = ref(morphingState.currentTest);

    const setActiveTest = testType => {
        if (morphingState.currentTest !== testType) {
            morphingState.currentTest = testType;
            morphingState.containerKey++; // Force update
            currentTest.value = testType;
        }
    };

    const getContainerStyles = testType => {
        return containerStyles[testType] || { minHeight: '300px' };
    };

    const getCurrentContainerStyles = () => {
        return getContainerStyles(morphingState.currentTest);
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
export { morphingState, containerStyles };
