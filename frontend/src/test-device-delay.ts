/**
 * Test script to verify device detection delay functionality
 * This can be run in the browser console to test the timing
 */

console.log('🧪 Testing Device Detection Delay...');

// Simulate device enumeration behavior
const mockDeviceEnumeration = {
    loadingDevices: { value: false },
    hasDevices: { value: false },
    availableDevices: { value: [] },
};

// Mock Vue reactive refs
const mockRef = initialValue => ({
    value: initialValue,
});

const mockComputed = fn => ({
    get value() {
        return fn();
    },
});

// Import the delay logic (conceptually - would need actual import in real test)
const testDeviceDetectionDelay = (deviceEnum, delayMs = 2000) => {
    const detectionStartTime = mockRef(null);
    const showNoDevicesMessage = mockRef(false);
    let detectionTimer = null;

    const startDetection = () => {
        console.log('⏰ Starting device detection...');
        detectionStartTime.value = Date.now();
        showNoDevicesMessage.value = false;

        if (detectionTimer) {
            clearTimeout(detectionTimer);
            detectionTimer = null;
        }

        detectionTimer = setTimeout(() => {
            if (!deviceEnum.hasDevices.value && !deviceEnum.loadingDevices.value) {
                console.log(`⚠️  No devices found after ${delayMs}ms delay - showing message`);
                showNoDevicesMessage.value = true;
            }
            detectionTimer = null;
        }, delayMs);
    };

    const shouldShowNoDevices = mockComputed(() => {
        if (deviceEnum.loadingDevices.value) return false;
        if (deviceEnum.hasDevices.value) return false;
        return showNoDevicesMessage.value;
    });

    return {
        shouldShowNoDevices,
        showNoDevicesMessage,
        startDetection,
    };
};

// Run the test
const delay = testDeviceDetectionDelay(mockDeviceEnumeration, 2000);

console.log('📋 Initial state:');
console.log('- Should show no devices:', delay.shouldShowNoDevices.value);
console.log('- Show message flag:', delay.showNoDevicesMessage.value);

// Start detection
delay.startDetection();

console.log('📋 After starting detection:');
console.log('- Should show no devices:', delay.shouldShowNoDevices.value);
console.log('- Show message flag:', delay.showNoDevicesMessage.value);

// Check after 1 second
setTimeout(() => {
    console.log('📋 After 1 second:');
    console.log('- Should show no devices:', delay.shouldShowNoDevices.value);
    console.log('- Show message flag:', delay.showNoDevicesMessage.value);
}, 1000);

// Check after 2.5 seconds (should show message now)
setTimeout(() => {
    console.log('📋 After 2.5 seconds:');
    console.log('- Should show no devices:', delay.shouldShowNoDevices.value);
    console.log('- Show message flag:', delay.showNoDevicesMessage.value);
    console.log('✅ Test complete!');
}, 2500);
