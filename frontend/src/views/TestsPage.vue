<script>
import WebcamTest from '../components/WebcamTest.vue';
import MicrophoneTest from '../components/MicrophoneTest.vue';
import SpeakerTest from '../components/SpeakerTest.vue';
import KeyboardTest from '../components/KeyboardTest.vue';
import MouseTest from '../components/MouseTest.vue';
import TouchTest from '../components/TouchTest.vue';
import BatteryTest from '../components/BatteryTest.vue';
import TestsCompleted from '../components/TestsCompleted.vue';
import VisualizerContainer from '../components/VisualizerContainer.vue';
import TestActionButtons from '../components/TestActionButtons.vue';
import AppHeader from '../components/AppHeader.vue';
import TestHeader from '../components/TestHeader.vue';
import { resetAllTestStates } from '../composables/useTestState.js';
import { useCSSCompatibility } from '../composables/useCSSCompatibility';
import { useI18n } from 'vue-i18n';
// Dynamic imports for PDF libraries to reduce initial bundle size

export default {
    name: 'TestsPage',
    components: {
        WebcamTest,
        MicrophoneTest,
        SpeakerTest,
        KeyboardTest,
        MouseTest,
        TouchTest,
        BatteryTest,
        TestsCompleted,
        VisualizerContainer,
        TestActionButtons,
        AppHeader,
        TestHeader,
    },
    setup() {
        const { t } = useI18n();
        return { t };
    },
    data() {
        // Create reactive timers object
        const realTimeTimers = {
            webcam: { running: false, startTime: null, elapsed: 0 },
            microphone: { running: false, startTime: null, elapsed: 0 },
            speakers: { running: false, startTime: null, elapsed: 0 },
            keyboard: { running: false, startTime: null, elapsed: 0 },
            mouse: { running: false, startTime: null, elapsed: 0 },
            touch: { running: false, startTime: null, elapsed: 0 },
            battery: { running: false, startTime: null, elapsed: 0 },
        };

        return {
            activeTest: 'webcam', // Start with webcam test
            results: {
                webcam: null, // null: pending, true: pass, false: fail
                microphone: null,
                speakers: null,
                keyboard: null,
                mouse: null,
                touch: null,
                battery: null,
            },
            skippedTests: [],
            testIconMap: {
                webcam: '📷',
                microphone: '🎤',
                speakers: '🔊',
                keyboard: '⌨️',
                mouse: '🖱️',
                touch: '👆',
                battery: '🔋',
            },
            testNameMap: {
                webcam: this.t('tests.webcam.name'),
                microphone: this.t('tests.microphone.name'),
                speakers: this.t('tests.speakers.name'),
                keyboard: this.t('tests.keyboard.name'),
                mouse: this.t('tests.mouse.name'),
                touch: this.t('tests.touch.name'),
                battery: this.t('tests.battery.name'),
            },
            timings: {
                webcam: { start: null, end: null, duration: null },
                microphone: { start: null, end: null, duration: null },
                speakers: { start: null, end: null, duration: null },
                keyboard: { start: null, end: null, duration: null },
                mouse: { start: null, end: null, duration: null },
                touch: { start: null, end: null, duration: null },
                battery: { start: null, end: null, duration: null },
            },
            runCounts: {
                webcam: 0,
                microphone: 0,
                speakers: 0,
                keyboard: 0,
                mouse: 0,
                touch: 0,
                battery: 0,
            },
            realTimeTimers,
            timerInterval: null,
            showExportMenu: false,
            switchDebounceTime: null,
            isSwitching: false,
        };
    },
    computed: {
        // Real-time elapsed time for each test
        realTimeElapsed() {
            const elapsed = {};
            const now = Date.now();

            Object.keys(this.realTimeTimers).forEach(test => {
                const timer = this.realTimeTimers[test];
                if (timer.running && timer.startTime) {
                    elapsed[test] = (now - timer.startTime) / 1000 + timer.elapsed;
                } else {
                    elapsed[test] = timer.elapsed;
                }
            });

            return elapsed;
        },

        // Formatted real-time timers with two decimal places
        formattedRealTimeTimers() {
            const formatted = {};
            Object.keys(this.realTimeElapsed).forEach(test => {
                const time = this.realTimeElapsed[test];
                formatted[test] = time > 0 ? time.toFixed(2) : '0.00';
            });

            return formatted;
        },

        // Test header content
        currentTestIcon() {
            const iconMap = {
                webcam: '📷',
                microphone: '🎤',
                speakers: '🔊',
                keyboard: '⌨️',
                mouse: '🖱️',
                touch: '👆',
                battery: '🔋',
                testsCompleted: '✅',
            };
            return iconMap[this.activeTest] || '📷';
        },
        currentTestTitle() {
            const titleMap = {
                webcam: this.t('tests.webcam.name'),
                microphone: this.t('tests.microphone.name'),
                speakers: this.t('tests.speakers.name'),
                keyboard: this.t('tests.keyboard.name'),
                mouse: this.t('tests.mouse.name'),
                touch: this.t('tests.touch.name'),
                battery: this.t('tests.battery.name'),
                testsCompleted: this.t('tests.completed.name'),
            };
            return titleMap[this.activeTest] || this.t('tests.webcam.name');
        },
        currentTestDescription() {
            const descriptionMap = {
                webcam: this.t('tests.webcam.description'),
                microphone: this.t('tests.microphone.description'),
                speakers: this.t('tests.speakers.description'),
                keyboard: this.t('tests.keyboard.description'),
                mouse: this.t('tests.mouse.description'),
                touch: this.t('tests.touch.description'),
                battery: this.t('tests.battery.description'),
                testsCompleted: this.t('tests.completed.description'),
            };
            return descriptionMap[this.activeTest] || this.t('tests.webcam.description');
        },
        // Dynamic component mapping for keep-alive functionality
        currentTestComponent() {
            const componentMap = {
                webcam: 'WebcamTest',
                microphone: 'MicrophoneTest',
                speakers: 'SpeakerTest',
                keyboard: 'KeyboardTest',
                mouse: 'MouseTest',
                touch: 'TouchTest',
                battery: 'BatteryTest',
                testsCompleted: 'TestsCompleted',
            };
            return componentMap[this.activeTest] || 'WebcamTest';
        },
        allTestsCompleted() {
            return Object.keys(this.results).every(
                test => this.results[test] !== null || this.skippedTests.includes(test)
            );
        },
        completedTestsCount() {
            // Count as completed if passed, failed, or skipped
            return Object.keys(this.results).filter(
                test => this.results[test] !== null || this.skippedTests.includes(test)
            ).length;
        },
        totalTestsCount() {
            return Object.keys(this.results).length;
        },
        passedTests() {
            return Object.keys(this.results)
                .filter(test => this.results[test] === true && !this.skippedTests.includes(test))
                .map(test => String(test)); // Ensure simple strings, not Proxy objects
        },
        failedTests() {
            return Object.keys(this.results)
                .filter(test => this.results[test] === false && !this.skippedTests.includes(test))
                .map(test => String(test)); // Ensure simple strings, not Proxy objects
        },
        pendingTests() {
            return Object.keys(this.results)
                .filter(test => this.results[test] === null && !this.skippedTests.includes(test))
                .map(test => String(test)); // Ensure simple strings, not Proxy objects
        },
        skippedTestsList() {
            return this.skippedTests.map(test => String(test)); // Ensure simple strings, not Proxy objects
        },
        anyTestsFailed() {
            return Object.values(this.results).some(r => r === false);
        },
        summaryClass() {
            if (this.anyTestsFailed) {
                return 'completed-fail';
            }
            if (this.allTestsCompleted) {
                return 'completed-success';
            }
            return 'in-progress';
        },
        summaryText() {
            const totalTests = Object.keys(this.results).length;
            const completedCount = this.completedTestsCount;

            if (!this.allTestsCompleted) {
                return `${completedCount}/${totalTests} In Progress...`;
            } else {
                const failedCount = Object.values(this.results).filter(r => r === false).length;
                if (failedCount > 0) {
                    return `${totalTests}/${totalTests} Completed (${failedCount} Failed)`;
                } else {
                    return `${totalTests}/${totalTests} Completed`;
                }
            }
        },
        totalTimeSpent() {
            return Object.values(this.timings)
                .map(t => (typeof t.duration === 'number' ? t.duration : 0))
                .reduce((a, b) => a + b, 0);
        },
        // Internationalized test names for sidebar and export functions
        i18nTestNameMap() {
            return {
                webcam: this.t('tests.webcam.name'),
                microphone: this.t('tests.microphone.name'),
                speakers: this.t('tests.speakers.name'),
                keyboard: this.t('tests.keyboard.name'),
                mouse: this.t('tests.mouse.name'),
                touch: this.t('tests.touch.name'),
                battery: this.t('tests.battery.name'),
            };
        },
        // Format individual test timing for display
        formattedTimings() {
            const formatted = {};
            Object.keys(this.timings).forEach(test => {
                const timing = this.timings[test];
                // Ensure timing object exists and has proper structure
                if (timing && typeof timing === 'object') {
                    if (typeof timing.duration === 'number' && timing.duration > 0) {
                        formatted[test] = `${timing.duration.toFixed(2)}s`;
                    } else if (this.results[test] !== null || this.skippedTests.includes(test)) {
                        // Test completed but no timing data (skipped or quick completion)
                        formatted[test] = '0.00s';
                    } else if (this.realTimeTimers[test].running) {
                        // Test is currently running - show real-time timer
                        formatted[test] = `${this.formattedRealTimeTimers[test]}s`;
                    } else {
                        // Test pending - show "0.00" initially
                        formatted[test] = '0.00s';
                    }
                } else {
                    // Fallback for invalid timing data - show "0.00"
                    formatted[test] = '0.00s';
                }
            });

            return formatted;
        },
        // Container styles for smooth morphing based on active test
        currentContainerStyles() {
            const styleMap = {
                webcam: { minHeight: '420px' },
                microphone: { minHeight: '420px' },
                speakers: { minHeight: '420px', maxWidth: '600px' },
                keyboard: { minHeight: '420px', maxWidth: '800px' },
                mouse: { minHeight: '420px' },
                touch: { minHeight: '420px', maxWidth: '800px' },
                battery: { minHeight: '420px' },
                testsCompleted: { minHeight: '420px' },
            };
            return styleMap[this.activeTest] || { minHeight: '420px' };
        },
    },
    methods: {
        // Safe access to test name mapping with comprehensive error handling
        getTestName(test) {
            // Validate that i18nTestNameMap exists and is an object
            if (!this.i18nTestNameMap || typeof this.i18nTestNameMap !== 'object') {
                console.warn('i18nTestNameMap is not properly defined, using fallback mapping');
                const fallbackMap = {
                    webcam: this.t('tests.webcam.name'),
                    microphone: this.t('tests.microphone.name'),
                    speakers: this.t('tests.speakers.name'),
                    keyboard: this.t('tests.keyboard.name'),
                    mouse: this.t('tests.mouse.name'),
                    touch: this.t('tests.touch.name'),
                    battery: this.t('tests.battery.name'),
                };
                return fallbackMap[test] || this.getSafeFallback(test);
            }

            // Validate that test parameter is a valid primitive
            if (
                test === null ||
                test === undefined ||
                (typeof test !== 'string' && typeof test !== 'number')
            ) {
                console.warn(`Invalid test parameter: ${typeof test}`, test);
                return this.getSafeFallback(test);
            }

            // Get the name from the map, ensuring it's a string
            const name = this.i18nTestNameMap[test];

            // Return the mapped name if it's a valid string, otherwise fallback
            if (typeof name === 'string' && name.trim().length > 0) {
                return name;
            }

            return this.getSafeFallback(test);
        },

        // Helper method to provide safe fallback values
        getSafeFallback(test) {
            // Handle Vue Proxy objects and complex types safely
            let testStr = 'unknown';

            try {
                if (test === null || test === undefined) {
                    testStr = 'unknown';
                } else if (typeof test === 'string') {
                    testStr = test;
                } else if (typeof test === 'number') {
                    testStr = test.toString();
                } else if (typeof test === 'object') {
                    // Handle Vue Proxy objects - try to access underlying value
                    if (test.__v_skip) {
                        // This is likely a Vue reactive object, try to get raw value
                        testStr = 'reactive-object';
                    } else {
                        // Try to stringify or get a meaningful representation
                        testStr = JSON.stringify(test).slice(0, 50);
                    }
                } else {
                    // Fallback for other types
                    testStr = String(test);
                }
            } catch (error) {
                // If any conversion fails, use a safe fallback
                console.warn('Error converting test to string:', error);
                testStr = 'conversion-error';
            }

            // Return a meaningful fallback that won't cause conversion issues
            if (
                testStr === 'unknown' ||
                testStr === 'null' ||
                testStr === 'undefined' ||
                testStr === 'reactive-object' ||
                testStr === 'conversion-error'
            ) {
                return this.t('errors.unknownTest');
            }

            // Use translation for the test name based on the test key
            const translationMap = {
                webcam: this.t('tests.webcam.name'),
                microphone: this.t('tests.microphone.name'),
                speakers: this.t('tests.speakers.name'),
                keyboard: this.t('tests.keyboard.name'),
                mouse: this.t('tests.mouse.name'),
                touch: this.t('tests.touch.name'),
                battery: this.t('tests.battery.name'),
            };

            return translationMap[testStr] || testStr.charAt(0).toUpperCase() + testStr.slice(1);
        },

        // Debounced test switching to prevent rapid component changes and lag
        debouncedSetActiveTest(testType) {
            // If we're already switching, ignore new requests
            if (this.isSwitching) {
                console.log(
                    `Switching debounced: already switching to ${this.activeTest}, ignoring request for ${testType}`
                );
                return;
            }

            // Clear any pending switch
            if (this.switchDebounceTime) {
                clearTimeout(this.switchDebounceTime);
            }

            // Mark as switching
            this.isSwitching = true;
            console.log(`Switching from ${this.activeTest} to ${testType}`);

            // Perform the switch immediately for good UX
            this.setActiveTest(testType);

            // Reset switching flag after a short delay to prevent rapid switches
            this.switchDebounceTime = setTimeout(() => {
                this.isSwitching = false;
                this.switchDebounceTime = null;
                console.log(`Switch cooldown ended, ready for next switch`);
            }, 200); // 200ms cooldown between switches
        },

        setActiveTest(testType) {
            // Stop timer for previous active test if it was running
            if (this.activeTest && this.activeTest !== testType) {
                this.stopTimer(this.activeTest);
            }

            // Only start timing if we're switching to a new test or the test hasn't started timing yet
            if (this.timings[testType]) {
                if (this.activeTest !== testType || this.timings[testType].start === null) {
                    this.timings[testType].start = Date.now();
                    this.timings[testType].end = null;
                    // Start real-time timer for this test
                    this.startTimer(testType);
                }
            }
            this.activeTest = testType;
        },
        onTestCompleted(testType) {
            if (!this.timings[testType]) {
                return;
            }
            // Stop real-time timer
            this.stopTimer(testType);

            // Remove from skippedTests if present (robust reactivity)
            this.skippedTests = this.skippedTests.filter(t => t !== testType);
            this.results[testType] = true;
            // Stop timing and store only the last session duration
            this.timings[testType].end = Date.now();

            // Validate timing data before calculation
            if (
                this.timings[testType] &&
                this.timings[testType].start &&
                this.timings[testType].end
            ) {
                const sessionDuration =
                    (this.timings[testType].end - this.timings[testType].start) / 1000;
                // Ensure duration is reasonable (between 0 and 10 minutes)
                if (sessionDuration >= 0 && sessionDuration <= 600) {
                    this.timings[testType].duration = sessionDuration;
                } else {
                    this.timings[testType].duration = 0;
                }
            } else if (this.timings[testType]) {
                this.timings[testType].duration = 0;
            }

            this.runCounts[testType] += 1;
            this.autoAdvance(testType);
            this.emitProgressUpdate();
        },
        onTestFailed(testType) {
            if (!this.timings[testType]) {
                return;
            }
            // Stop real-time timer
            this.stopTimer(testType);

            // Remove from skippedTests if present (robust reactivity)
            this.skippedTests = this.skippedTests.filter(t => t !== testType);
            this.results[testType] = false;
            // Stop timing and store only the last session duration
            this.timings[testType].end = Date.now();

            // Validate timing data before calculation
            if (
                this.timings[testType] &&
                this.timings[testType].start &&
                this.timings[testType].end
            ) {
                const sessionDuration =
                    (this.timings[testType].end - this.timings[testType].start) / 1000;
                // Ensure duration is reasonable (between 0 and 10 minutes)
                if (sessionDuration >= 0 && sessionDuration <= 600) {
                    this.timings[testType].duration = sessionDuration;
                } else {
                    this.timings[testType].duration = 0;
                }
            } else if (this.timings[testType]) {
                this.timings[testType].duration = 0;
            }

            this.runCounts[testType] += 1;
            this.autoAdvance(testType);
            this.emitProgressUpdate();
        },
        onTestSkipped(payload) {
            // Support both old (string) and new (object) signatures for robustness
            const testType = typeof payload === 'string' ? payload : payload.testType;
            const duration =
                typeof payload === 'object' && payload.duration !== undefined
                    ? payload.duration
                    : null;

            if (!this.timings[testType]) {
                return;
            }
            // Stop real-time timer
            this.stopTimer(testType);

            if (!this.skippedTests.includes(testType)) {
                this.skippedTests.push(testType);
            }
            // Use the provided duration if available, otherwise calculate as before
            if (duration !== null) {
                // Validate provided duration
                if (duration >= 0 && duration <= 600) {
                    this.timings[testType].duration = duration;
                    this.timings[testType].end = this.timings[testType].start + duration * 1000;
                } else {
                    this.timings[testType].duration = 0;
                }
            } else if (
                this.timings[testType] &&
                this.timings[testType].end === null &&
                typeof this.timings[testType].start === 'number'
            ) {
                this.timings[testType].end = Date.now();
                const sessionDuration =
                    (this.timings[testType].end - this.timings[testType].start) / 1000;
                // Validate calculated duration
                if (sessionDuration >= 0 && sessionDuration <= 600) {
                    this.timings[testType].duration = sessionDuration;
                } else {
                    this.timings[testType].duration = 0;
                }
            } else if (this.timings[testType]) {
                this.timings[testType].duration = 0;
            }
            this.results[testType] = null; // Keep as pending, but filtered out of summary
            this.runCounts[testType] += 1;
            this.autoAdvance(testType);
        },
        autoAdvance(currentTest) {
            const tests = [
                'webcam',
                'microphone',
                'speakers',
                'keyboard',
                'mouse',
                'touch',
                'battery',
            ];
            const currentIndex = tests.indexOf(currentTest);
            // If not all tests are completed
            if (!this.allTestsCompleted) {
                // Try to go to the next incomplete test after the current one
                for (let i = currentIndex + 1; i < tests.length; i++) {
                    if (this.results[tests[i]] === null) {
                        this.setActiveTest(tests[i]);
                        return;
                    }
                }
                // If none after, look from the start up to current
                for (let i = 0; i < currentIndex; i++) {
                    if (this.results[tests[i]] === null) {
                        this.setActiveTest(tests[i]);
                        return;
                    }
                }
                // If we're on the last test and there are still incomplete tests, stay on the last test
                // (do nothing)
            } else {
                // All tests completed, go to testsCompleted step
                this.activeTest = 'testsCompleted';
            }
        },
        handleTestsCompletedClick() {
            if (this.allTestsCompleted) {
                this.activeTest = 'testsCompleted';
            }
        },
        resetTests() {
            // Stop all running timers
            Object.keys(this.realTimeTimers).forEach(test => {
                this.stopTimer(test);
            });

            this.results = {
                webcam: null,
                microphone: null,
                speakers: null,
                keyboard: null,
                mouse: null,
                touch: null,
                battery: null,
            };
            this.skippedTests = []; // Reset skipped tests
            this.timings = {
                webcam: { start: null, end: null, duration: null },
                microphone: { start: null, end: null, duration: null },
                speakers: { start: null, end: null, duration: null },
                keyboard: { start: null, end: null, duration: null },
                mouse: { start: null, end: null, duration: null },
                touch: { start: null, end: null, duration: null },
                battery: { start: null, end: null, duration: null },
            };
            // Reset real-time timers
            Object.keys(this.realTimeTimers).forEach(test => {
                this.realTimeTimers[test] = { running: false, startTime: null, elapsed: 0 };
            });
            // Reset shared component states
            resetAllTestStates();
            // Set active test and start timing
            this.setActiveTest('webcam');

            // Emit reset event for AppFooter
            this.$emit('reset-tests');
            this.emitProgressUpdate();
        },

        // Timer management methods
        startTimer(testType) {
            if (!this.realTimeTimers[testType]) return;

            // Stop any existing timer for this test
            this.stopTimer(testType);

            // Create a new object to ensure reactivity
            this.realTimeTimers[testType] = {
                ...this.realTimeTimers[testType],
                running: true,
                startTime: Date.now(),
            };

            console.log(
                `Timer started for ${testType}, running: ${this.realTimeTimers[testType].running}`
            );

            // Start update interval if not already running
            if (!this.timerInterval) {
                this.timerInterval = setInterval(() => {
                    // Simply access the reactive properties to trigger updates
                    // Vue's reactivity system will handle the rest
                    this.$forceUpdate();
                }, 100); // Update every 100ms for smooth animation
            }
        },

        stopTimer(testType) {
            if (!this.realTimeTimers[testType]) return;

            if (this.realTimeTimers[testType].running) {
                // Calculate and store elapsed time
                const elapsed = (Date.now() - this.realTimeTimers[testType].startTime) / 1000;

                // Create a new object to ensure reactivity
                this.realTimeTimers[testType] = {
                    ...this.realTimeTimers[testType],
                    elapsed: this.realTimeTimers[testType].elapsed + elapsed,
                    running: false,
                    startTime: null,
                };

                // console.log(`Timer stopped for ${testType}, total elapsed: ${this.realTimeTimers[testType].elapsed.toFixed(2)}s`);
            }

            // Clean up interval if no timers are running
            this.cleanupTimerInterval();
        },

        cleanupTimerInterval() {
            const anyTimerRunning = Object.values(this.realTimeTimers).some(timer => timer.running);
            if (!anyTimerRunning && this.timerInterval) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
                // console.log('Timer interval cleaned up');
            }
        },
        getTestStatusClass(testType) {
            if (this.skippedTests.includes(testType)) return 'skipped';
            if (this.results[testType] === true) return 'completed-success';
            if (this.results[testType] === false) return 'completed-fail';
            return 'pending';
        },
        emitProgressUpdate() {
            this.$emit('update-footer', {
                completedTests: this.completedTestsCount,
                totalTests: this.totalTestsCount,
            });
        },
        exportResults() {
            const report = {
                timestamp: new Date().toISOString(),
                results: this.results,
                summary: this.summaryText,
            };

            const blob = new Blob([JSON.stringify(report, null, 2)], {
                type: 'application/json',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mmit-test-results-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        },
        toggleExportMenu() {
            this.showExportMenu = !this.showExportMenu;
            // Emit event to parent component for AppFooter synchronization
            this.$emit('update-footer', { showExportMenu: this.showExportMenu });
        },
        async exportAsPDF() {
            // Dynamic imports to reduce initial bundle size
            const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
                import('jspdf'),
                import('html2canvas'),
            ]);

            // Create a hidden container with app-like styling
            const container = document.createElement('div');
            container.style.cssText = `
        position: fixed;
        top: -9999px;
        left: -9999px;
        width: 800px;
        background: #0d0d0d;
        padding: 40px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #fff;
      `;

            // Build the HTML content
            const completedCount = Object.values(this.results).filter(r => r !== null).length;
            const passedCount = Object.values(this.results).filter(r => r === true).length;
            const failedCount = Object.values(this.results).filter(r => r === false).length;
            const totalTime = `${this.totalTimeSpent.toFixed(2)}s`;
            const skippedCount = this.skippedTests.length;

            const tests = Object.keys(this.results);
            const testRows = tests
                .map(test => {
                    let status = '';
                    let statusClass = '';
                    let statusIcon = '';

                    if (this.results[test] === true) {
                        status = this.t('status.passed');
                        statusClass = 'status-passed';
                        statusIcon = '✓';
                    } else if (this.results[test] === false) {
                        status = this.t('status.failed');
                        statusClass = 'status-failed';
                        statusIcon = '✗';
                    } else if (this.skippedTests.includes(test)) {
                        status = this.t('status.skipped');
                        statusClass = 'status-skipped';
                        statusIcon = '↷';
                    } else {
                        status = this.t('status.pending');
                        statusClass = 'status-pending';
                        statusIcon = '⏳';
                    }

                    const runCount = this.runCounts[test] || 0;
                    const duration =
                        this.timings[test] && typeof this.timings[test].duration === 'number'
                            ? this.timings[test].duration.toFixed(2)
                            : '';

                    return `
          <tr>
            <td class="test-name">${this.i18nTestNameMap[test]}</td>
            <td class="status ${statusClass}">
              <span class="status-icon">${statusIcon}</span>
              ${status}
            </td>
            <td class="run-count">${runCount}</td>
            <td class="duration">${duration}</td>
          </tr>
        `;
                })
                .join('');

            container.innerHTML = `
        <div class="pdf-content">
          <div class="header">
            <h1>${this.t('app.name')} ${this.t('results.summary')}</h1>
            <div class="accent-bar"></div>
          </div>
          
          <div class="summary-card">
            <div class="summary-item">
              <span class="label">Completed:</span>
              <span class="value">${completedCount}/${Object.keys(this.results).length}</span>
            </div>
            <div class="summary-item passed">
              <span class="label">${this.t('export.summaryLabels.passed')}</span>
              <span class="value">${passedCount}</span>
            </div>
          ${
              failedCount > 0
                  ? `
            <div class="summary-item failed">
              <span class="label">${this.t('export.summaryLabels.failed')}</span>
              <span class="value">${passedCount}</span>
            </div>
          `
                  : ''
          }
          ${
              skippedCount > 0
                  ? `
            <div class="summary-item skipped">
              <span class="label">${this.t('export.summaryLabels.skipped')}</span>
              <span class="value">${skippedCount}</span>
            </div>
          `
                  : ''
          }
          </div>
          
          <div class="table-container">
            <table class="results-table">
              <thead>
                <tr>
                  <th>${this.t('results.testDetails')}</th>
                  <th>${this.t('status.status')}</th>
                  <th>${this.t('results.runCount')}</th>
                  <th>${this.t('results.duration')} (s)</th>
                </tr>
              </thead>
              <tbody>
                ${testRows}
              </tbody>
            </table>
          </div>

          <div class="summary-total-time">
            <span class="label">Total Time:</span>
            <span class="value">${totalTime}</span>
          </div>
        </div>
        
        <style>
          .pdf-content {
            background: #0d0d0d;
            color: #fff;
            padding: 0;
          }
          
          .header h1 {
            font-size: 36px;
            font-weight: bold;
            margin: 0 0 8px 0;
            color: #fff;
          }
          
          .accent-bar {
            height: 6px;
            background: linear-gradient(90deg, #ff6b00 0%, #ff8800 50%, #ff6b00 100%);
            border-radius: 3px;
            margin-bottom: 40px;
          }
          
          .summary-card {
            background: #232326;
            border: 1px solid #404040;
            border-radius: 8px;
            padding: 24px;
            margin-bottom: 32px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          
          .summary-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .summary-item .label {
            color: #e0e0e0;
            font-size: 16px;
          }
          
          .summary-item .value {
            color: #e0e0e0;
            font-size: 16px;
            font-weight: 500;
          }
          
          .summary-item.passed .value {
            color: #28a745;
          }
          
          .summary-item.failed .value {
            color: #dc3545;
          }

          .summary-item.skipped .value {
            color: #ffc107;
          }

          .summary-total-time {
            margin-top: 1.5rem;
            padding-top: 1.25rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }

          .total-time-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 1.25rem;
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            border-radius: 8px;
            border: 1px solid #475569;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .total-time-label {
            font-weight: 600;
            color: #cbd5e1;
            font-size: 0.9rem;
            letter-spacing: 0.025em;
          }

          .total-time-value {
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
            font-weight: 700;
            color: #f1f5f9;
            font-size: 1rem;
            background: rgba(241, 245, 249, 0.1);
            padding: 0.375rem 0.75rem;
            border-radius: 6px;
            border: 1px solid rgba(241, 245, 249, 0.2);
          }
          
          .table-container {
            background: #141416;
            border: 1px solid #333;
            border-radius: 8px;
            overflow: hidden;
          }
          
          .results-table {
            width: 100%;
            border-collapse: collapse;
          }
          
          .results-table th {
            background: #252526;
            color: #fff;
            padding: 16px;
            text-align: left;
            font-weight: bold;
            font-size: 14px;
            border-bottom: 1px solid #444;
          }
          
          .results-table td {
            padding: 12px 16px;
            border-bottom: 1px solid #333;
            font-size: 13px;
          }
          
          .results-table tr:nth-child(even) {
            background: #1c1c1e;
          }
          
          .test-name {
            color: #f0f0f0;
            font-weight: 500;
          }
          
          .status {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
          }
          
          .status-icon {
            font-size: 14px;
          }
          
          .status-passed {
            color: #28a745;
          }
          
          .status-failed {
            color: #dc3545;
          }
          
          .status-skipped {
            color: #ffc107;
          }
          
          .status-pending {
            color: #ff6b00;
          }
          
          .run-count, .duration {
            color: #a0a0a0;
          }
        </style>
      `;

            document.body.appendChild(container);

            try {
                // Capture the styled element
                const canvas = await html2canvas(container, {
                    backgroundColor: null, // Let it be transparent
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                });

                // Create PDF
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'pt',
                    format: 'a4',
                });

                const imgData = canvas.toDataURL('image/png');
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();

                // Set dark background for the entire PDF page - this will be the ONLY background
                pdf.setFillColor(13, 13, 13); // #0d0d0d - same as app background
                pdf.rect(0, 0, pageWidth, pageHeight, 'F');

                // Calculate dimensions to fit the page
                const imgWidth = pageWidth;
                const imgHeight = (canvas.height / canvas.width) * imgWidth;

                // Add image to PDF with no margins so it fills completely
                pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

                // Save the PDF
                pdf.save('mmit-test-results.pdf');
            } catch (error) {
                alert(this.$t('alerts.pdfGenerationError'));
            } finally {
                // Clean up
                document.body.removeChild(container);
                this.showExportMenu = false;
            }
        },
        exportAsJSON() {
            this.exportResults();
            this.showExportMenu = false;
            // Emit event for AppFooter
            this.$emit('export-json');
        },
        // Check if a test has timing data to display with comprehensive error handling
        hasTimingData(test) {
            try {
                // Ensure test parameter is a valid primitive
                if (
                    test === null ||
                    test === undefined ||
                    (typeof test !== 'string' && typeof test !== 'number')
                ) {
                    return false;
                }

                // Safely access the timing value
                const timingValue = this.formattedTimings[test];

                // Debug logging
                // console.log(`hasTimingData - ${test}: ${timingValue}, type: ${typeof timingValue}`);

                // Handle cases where timing value might be undefined, null, or non-string
                // Allow "0.00s" to be displayed for pending tests
                const result = typeof timingValue === 'string' && timingValue !== '';
                // console.log(`hasTimingData result for ${test}: ${result}`);
                return result;
            } catch (error) {
                console.warn('Error checking timing data for test:', test, error);
                return false;
            }
        },

        exportAsCSV() {
            // Emit event for AppFooter
            this.$emit('export-csv');

            // Prepare CSV header with translated labels
            const header = [
                this.t('results.testDetails'),
                this.t('status.status'),
                this.t('results.runCount'),
                `${this.t('results.duration')} (s)`,
            ];
            const rows = [header];
            const tests = Object.keys(this.results);
            for (const test of tests) {
                let status = '';
                if (this.results[test] === true) status = this.t('status.passed');
                else if (this.results[test] === false) status = this.t('status.failed');
                else status = this.t('status.pending');
                const runCount = this.runCounts[test] || 0;
                const duration =
                    this.timings[test] && typeof this.timings[test].duration === 'number'
                        ? this.timings[test].duration.toFixed(2)
                        : '';
                rows.push([this.i18nTestNameMap[test], status, runCount, duration]);
            }
            // Convert to CSV string
            const csv = rows
                .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
                .join('\r\n');
            // Download as file
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'mmit-test-results.csv';
            a.click();
            URL.revokeObjectURL(url);
            this.showExportMenu = false;
        },
        // Global event listener methods
        setupGlobalEventListeners() {
            // Listen for AppFooter events
            window.addEventListener('app-footer-reset-tests', this.handleResetFromFooter);
            window.addEventListener('app-footer-export-pdf', this.handleExportPdfFromFooter);
            window.addEventListener('app-footer-export-json', this.handleExportJsonFromFooter);
            window.addEventListener('app-footer-export-csv', this.handleExportCsvFromFooter);
            window.addEventListener('app-footer-close-export-menu', this.handleCloseExportMenuFromFooter);
        },
        cleanupGlobalEventListeners() {
            // Remove AppFooter event listeners
            window.removeEventListener('app-footer-reset-tests', this.handleResetFromFooter);
            window.removeEventListener('app-footer-export-pdf', this.handleExportPdfFromFooter);
            window.removeEventListener('app-footer-export-json', this.handleExportJsonFromFooter);
            window.removeEventListener('app-footer-export-csv', this.handleExportCsvFromFooter);
            window.removeEventListener('app-footer-close-export-menu', this.handleCloseExportMenuFromFooter);
        },
        handleResetFromFooter() {
            this.resetTests();
        },
        handleExportPdfFromFooter() {
            this.exportAsPDF();
        },
        handleExportJsonFromFooter() {
            this.exportAsJSON();
        },
        handleExportCsvFromFooter() {
            this.exportAsCSV();
        },
        handleCloseExportMenuFromFooter() {
            this.showExportMenu = false;
        },
    },
    mounted() {
        // Detect Electron environment and add platform classes
        const isElectron =
            window.electronAPI ||
            window.electron ||
            navigator.userAgent.toLowerCase().indexOf('electron') > -1 ||
            (typeof process !== 'undefined' && process?.type === 'renderer') ||
            window.process?.type === 'renderer';

        if (isElectron) {
            document.body.classList.add('electron-app');
            if (window.electronAPI?.platform) {
                document.body.classList.add(`platform-${window.electronAPI.platform}`);
            }
        }

        console.log('TestsPage mounted - isElectron:', isElectron, 'activeTest:', this.activeTest);

        // Initialize the first test properly with proper timing
        this.$nextTick(() => {
            console.log('Initializing first test:', this.activeTest);
            // Reset timing to ensure clean start
            if (this.timings[this.activeTest]) {
                this.timings[this.activeTest].start = null;
                this.timings[this.activeTest].end = null;
            }
            this.setActiveTest(this.activeTest);
        });

        // Initialize CSS compatibility system
        const cssCompat = useCSSCompatibility();
        cssCompat.initialize();

        // Set up global event listeners for AppFooter actions
        this.setupGlobalEventListeners();
        // Emit initial progress
        this.emitProgressUpdate();
    },
    beforeUnmount() {
        // Clean up any pending debounce timers to prevent memory leaks
        if (this.switchDebounceTime) {
            clearTimeout(this.switchDebounceTime);
            this.switchDebounceTime = null;
        }

        // Clean up timer interval
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        // Clean up global event listeners
        this.cleanupGlobalEventListeners();
    },
};
</script>

<template>
    <div class="app-layout">
        <!-- App Header with test title only in navbar -->
        <AppHeader :test-title="currentTestTitle" :test-icon="currentTestIcon" />

        <!-- Left Sidebar -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <div class="brand-icon">📋</div>
                <h2>{{ $t('navigation.tests') }}</h2>
            </div>
            <nav class="test-navigation">
                <ul class="test-navigation__list">
                    <li
                        class="test-navigation__item"
                        :class="{ 'test-navigation__item--active': activeTest === 'webcam' }"
                        @click="debouncedSetActiveTest('webcam')"
                    >
                        <span class="test-navigation__icon">📹</span>
                        <span class="test-navigation__name">{{
                            $t('tests.webcam.shortName')
                        }}</span>
                        <span
                            class="test-navigation__status"
                            :class="'test-navigation__status--' + getTestStatusClass('webcam')"
                        ></span>
                    </li>
                    <li
                        class="test-navigation__item"
                        :class="{ 'test-navigation__item--active': activeTest === 'microphone' }"
                        @click="debouncedSetActiveTest('microphone')"
                    >
                        <span class="test-navigation__icon">🎤</span>
                        <span class="test-navigation__name">{{
                            $t('tests.microphone.shortName')
                        }}</span>
                        <span
                            class="test-navigation__status"
                            :class="'test-navigation__status--' + getTestStatusClass('microphone')"
                        ></span>
                    </li>
                    <li
                        class="test-navigation__item"
                        :class="{ 'test-navigation__item--active': activeTest === 'speakers' }"
                        @click="debouncedSetActiveTest('speakers')"
                    >
                        <span class="test-navigation__icon">🔊</span>
                        <span class="test-navigation__name">{{
                            $t('tests.speakers.shortName')
                        }}</span>
                        <span
                            class="test-navigation__status"
                            :class="'test-navigation__status--' + getTestStatusClass('speakers')"
                        ></span>
                    </li>
                    <li
                        class="test-navigation__item"
                        :class="{ 'test-navigation__item--active': activeTest === 'keyboard' }"
                        @click="debouncedSetActiveTest('keyboard')"
                    >
                        <span class="test-navigation__icon">⌨️</span>
                        <span class="test-navigation__name">{{
                            $t('tests.keyboard.shortName')
                        }}</span>
                        <span
                            class="test-navigation__status"
                            :class="'test-navigation__status--' + getTestStatusClass('keyboard')"
                        ></span>
                    </li>
                    <li
                        class="test-navigation__item"
                        :class="{ 'test-navigation__item--active': activeTest === 'mouse' }"
                        @click="debouncedSetActiveTest('mouse')"
                    >
                        <span class="test-navigation__icon">🖱️</span>
                        <span class="test-navigation__name">{{ $t('tests.mouse.shortName') }}</span>
                        <span
                            class="test-navigation__status"
                            :class="'test-navigation__status--' + getTestStatusClass('mouse')"
                        ></span>
                    </li>
                    <li
                        class="test-navigation__item"
                        :class="{ 'test-navigation__item--active': activeTest === 'touch' }"
                        @click="debouncedSetActiveTest('touch')"
                    >
                        <span class="test-navigation__icon">👆</span>
                        <span class="test-navigation__name">{{ $t('tests.touch.shortName') }}</span>
                        <span
                            class="test-navigation__status"
                            :class="'test-navigation__status--' + getTestStatusClass('touch')"
                        ></span>
                    </li>
                    <li
                        class="test-navigation__item"
                        :class="{ 'test-navigation__item--active': activeTest === 'battery' }"
                        @click="debouncedSetActiveTest('battery')"
                    >
                        <span class="test-navigation__icon">🔋</span>
                        <span class="test-navigation__name">{{
                            $t('tests.battery.shortName')
                        }}</span>
                        <span
                            class="test-navigation__status"
                            :class="'test-navigation__status--' + getTestStatusClass('battery')"
                        ></span>
                    </li>
                    <li
                        class="test-navigation__item"
                        :class="{
                            'test-navigation__item--active': activeTest === 'testsCompleted',
                            'test-navigation__item--disabled': !allTestsCompleted,
                        }"
                        @click="handleTestsCompletedClick"
                    >
                        <span class="test-navigation__icon">✅</span>
                        <span class="test-navigation__name">{{ $t('tests.completed.name') }}</span>
                        <span
                            class="test-navigation__status"
                            :class="{
                                'test-navigation__status--completed-success': allTestsCompleted,
                                'test-navigation__status--pending': !allTestsCompleted,
                            }"
                        ></span>
                    </li>
                </ul>
            </nav>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <!-- Test Header with description only -->
            <TestHeader :test-description="currentTestDescription" :center-align="true" />

            <!-- Single persistent VisualizerContainer for smooth morphing -->
            <VisualizerContainer
                :custom-styles="currentContainerStyles"
                :keyboard-mode="activeTest === 'keyboard'"
            >
                <!-- Dynamic component without forced re-render -->
                <component
                    :is="currentTestComponent"
                    @test-completed="onTestCompleted"
                    @test-failed="onTestFailed"
                    @test-skipped="onTestSkipped"
                    @start-over="resetTests"
                />
            </VisualizerContainer>

            <!-- Action Buttons Outside Container -->
            <TestActionButtons
                v-if="activeTest !== 'testsCompleted'"
                :actions-disabled="false"
                :container-styles="currentContainerStyles"
                @working="onTestCompleted(activeTest)"
                @not-working="onTestFailed(activeTest)"
                @skip="onTestSkipped(activeTest)"
            />
        </main>

        <!-- Right Sidebar - Simple Navigation Style -->
        <aside class="sidebar right-sidebar">
            <div class="sidebar-header">
                <div class="brand-icon">📋</div>
                <h2>{{ $t('sidebar.summary') }}</h2>
            </div>
            <nav class="test-navigation">
                <ul class="test-navigation__list">
                    <!-- Pending Tests Section -->
                    <div v-if="pendingTests.length > 0" class="test-section test-section--pending">
                        <div class="test-section__header">
                            <span class="test-section__status-indicator"></span>
                            <span class="test-section__title">{{
                                $t('sidebar.pendingTests')
                            }}</span>
                        </div>
                        <li v-for="test in pendingTests" :key="test" class="test-navigation__item">
                            <span class="test-navigation__name">{{ getTestName(test) }}</span>
                            <span class="test-navigation__timing" v-if="hasTimingData(test)">
                                {{ formattedTimings[test] }}
                                <span v-if="realTimeTimers[test].running" class="live-indicator"
                                    >●</span
                                >
                            </span>
                        </li>
                    </div>

                    <!-- Failed Tests Section -->
                    <div v-if="failedTests.length > 0" class="test-section test-section--failed">
                        <div class="test-section__header">
                            <span class="test-section__status-indicator"></span>
                            <span class="test-section__title">{{ $t('sidebar.failedTests') }}</span>
                        </div>
                        <li v-for="test in failedTests" :key="test" class="test-navigation__item">
                            <span class="test-navigation__name">{{ getTestName(test) }}</span>
                            <span class="test-navigation__timing" v-if="hasTimingData(test)">
                                {{ formattedTimings[test] }}
                                <span v-if="realTimeTimers[test].running" class="live-indicator"
                                    >●</span
                                >
                            </span>
                        </li>
                    </div>

                    <!-- Skipped Tests Section -->
                    <div
                        v-if="skippedTestsList.length > 0"
                        class="test-section test-section--skipped"
                    >
                        <div class="test-section__header">
                            <span class="test-section__status-indicator"></span>
                            <span class="test-section__title">{{
                                $t('sidebar.skippedTests')
                            }}</span>
                        </div>
                        <li
                            v-for="test in skippedTestsList"
                            :key="test"
                            class="test-navigation__item"
                        >
                            <span class="test-navigation__name">{{ getTestName(test) }}</span>
                            <span class="test-navigation__timing" v-if="hasTimingData(test)">
                                {{ formattedTimings[test] }}
                                <span v-if="realTimeTimers[test].running" class="live-indicator"
                                    >●</span
                                >
                            </span>
                        </li>
                    </div>

                    <!-- Passed Tests Section -->
                    <div v-if="passedTests.length > 0" class="test-section test-section--passed">
                        <div class="test-section__header">
                            <span class="test-section__status-indicator"></span>
                            <span class="test-section__title">{{ $t('sidebar.passedTests') }}</span>
                        </div>
                        <li v-for="test in passedTests" :key="test" class="test-navigation__item">
                            <span class="test-navigation__name">{{ getTestName(test) }}</span>
                            <span class="test-navigation__timing" v-if="hasTimingData(test)">
                                {{ formattedTimings[test] }}
                                <span v-if="realTimeTimers[test].running" class="live-indicator"
                                    >●</span
                                >
                            </span>
                        </li>
                    </div>
                </ul>
            </nav>
        </aside>
    </div>
</template>

<style scoped>
/* Ad Container Styles */
.ad-container {
    margin-top: 1.5rem;
    padding: 1rem;
    background-color: #1a1a1a;
    border-radius: 8px;
    border: 1px solid #404040;
}

.ad-container ins {
    border-radius: 6px;
    overflow: hidden;
}

/* Global Layout */
.app-layout {
    display: flex;
    height: 100%;
    background-color: #0d0d0d;
    color: #d4d4d4;
    font-family:
        'Inter',
        -apple-system,
        BlinkMacSystemFont,
        'Segoe UI',
        Roboto,
        Oxygen,
        Ubuntu,
        Cantarell,
        sans-serif;
    position: relative;
}

.sidebar {
    width: 270px;
    flex-shrink: 0;
    background-color: #000000; /* Pure black for maximum contrast */
    border-right: 1px solid #404040; /* Lighter border for better definition */
    display: flex;
    flex-direction: column;
    padding: 1rem;
    transition: var(--transition-width);
    z-index: 2;
}

.right-sidebar {
    border-right: none;
    border-left: 1px solid #404040; /* Lighter border for better definition */
    left: auto;
    right: 0;
    position: relative;
    background-color: #000000; /* Pure black for maximum contrast */
}

.main-content {
    flex: 1;
    padding: 2rem;
    overflow-y: auto;
    min-width: 0;
    min-height: 0; /* Allow flex item to shrink properly */
    position: relative; /* Required for absolute positioning of action buttons */
}

/* Transition animations */
.expand-fade-enter-active,
.expand-fade-leave-active {
    transition: all 0.2s ease;
}

.expand-fade-enter-from,
.expand-fade-leave-to {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
}

.expand-fade-enter-to,
.expand-fade-leave-from {
    opacity: 1;
    transform: translateY(0) scale(1);
}

.app-layout > .main-content {
    margin-left: 0;
    margin-right: 0;
}

@media (min-width: 900px) {
    .app-layout {
        flex-direction: row;
    }
    .main-content {
        margin-left: 0;
        margin-right: 0;
    }
    .sidebar.right-sidebar {
        position: relative;
        right: 0;
        left: auto;
    }
}

.sidebar-header {
    position: relative;
    margin-bottom: 2rem;
    padding: 0.5rem;
    flex-shrink: 0;
    height: 56px;
}

.sidebar-header .brand-icon {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 1.5rem;
    color: #ff6b00;
    display: block;
}

.sidebar-header h2 {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    font-size: 1.5rem;
    font-weight: 600;
    color: #ffffff; /* Pure white for maximum contrast */
    margin: 0;
    text-align: center;
    white-space: nowrap;
    display: block;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7); /* Stronger shadow for better contrast */
}

.test-navigation {
    flex-grow: 1;
}
.test-navigation__list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.test-navigation__item {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    margin-bottom: 0.5rem;
    border-radius: 6px;
    cursor: pointer;
    transition:
        background-color var(--animation-normal) ease,
        border-color var(--animation-normal) ease,
        color var(--animation-normal) ease;
    border: 1px solid transparent;
    color: #e0e0e0;
    background: none;
}

.test-navigation__item:hover {
    background-color: #2a2a2a;
    color: #ffffff;
}

.test-navigation__item--active {
    background-color: rgba(255, 107, 0, 0.08);
    border-color: rgba(255, 107, 0, 0.5);
    color: #ff9854;
}

.test-navigation__item--disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.test-navigation__item--disabled:hover {
    background-color: transparent;
    color: #e0e0e0;
}

/* Section highlighting */
.test-section {
    margin-bottom: 1rem;
    border-radius: 8px;
    border: 1px solid transparent;
    background-color: rgba(0, 0, 0, 0.3);
    overflow: hidden;
    transition: all var(--animation-normal) ease;
}

.test-section__header {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    background-color: rgba(0, 0, 0, 0.2);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.test-section__status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 0.5rem;
}

.test-section__title {
    font-weight: 600;
    font-size: 0.9rem;
    color: #ffffff;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
}

/* Pending section styling */
.test-section--pending {
    background-color: rgba(85, 85, 85, 0.15);
    border-color: rgba(85, 85, 85, 0.4);
}

.test-section--pending .test-section__header {
    background-color: rgba(85, 85, 85, 0.25);
    border-bottom-color: rgba(85, 85, 85, 0.3);
}

.test-section--pending .test-section__status-indicator {
    background-color: #555;
    box-shadow: 0 0 8px #555;
}

/* Failed section styling */
.test-section--failed {
    background-color: rgba(220, 53, 69, 0.15);
    border-color: rgba(220, 53, 69, 0.4);
}

.test-section--failed .test-section__header {
    background-color: rgba(220, 53, 69, 0.25);
    border-bottom-color: rgba(220, 53, 69, 0.3);
}

.test-section--failed .test-section__status-indicator {
    background-color: #dc3545;
    box-shadow: 0 0 8px #dc3545;
}

/* Skipped section styling */
.test-section--skipped {
    background-color: rgba(255, 193, 7, 0.15);
    border-color: rgba(255, 193, 7, 0.4);
}

.test-section--skipped .test-section__header {
    background-color: rgba(255, 193, 7, 0.25);
    border-bottom-color: rgba(255, 193, 7, 0.3);
}

.test-section--skipped .test-section__status-indicator {
    background-color: #ffc107;
    box-shadow: 0 0 8px #ffc107;
}

/* Passed section styling */
.test-section--passed {
    background-color: rgba(40, 167, 69, 0.15);
    border-color: rgba(40, 167, 69, 0.4);
}

.test-section--passed .test-section__header {
    background-color: rgba(40, 167, 69, 0.25);
    border-bottom-color: rgba(40, 167, 69, 0.3);
}

.test-section--passed .test-section__status-indicator {
    background-color: #28a745;
    box-shadow: 0 0 8px #28a745;
}

/* Remove individual item highlighting */
.test-navigation__item {
    background: none;
    border: 1px solid transparent;
}

.test-navigation__item:hover {
    background-color: #2a2a2a;
    color: #ffffff;
}

.test-navigation__icon {
    font-size: 1.2rem;
    margin-right: 0.8rem;
    width: 20px;
    text-align: center;
}

.test-navigation__name {
    color: #ffffff;
    font-weight: 500;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
    flex-grow: 1;
}

.test-navigation__timing {
    margin-left: auto;
    font-size: 0.85rem;
    color: #a0a0a0;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
    font-weight: 500;
    letter-spacing: -0.01em;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.05);
    transition: all var(--animation-normal) ease;
}

.test-navigation__item:hover .test-navigation__timing {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.1);
}

/* Status indicator styles for left sidebar - matching right sidebar */
.test-navigation__status {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-left: auto;
    transition:
        background-color var(--animation-slow) ease,
        box-shadow var(--animation-slow) ease;
    box-shadow: 0 0 8px transparent;
}

.test-navigation__status--pending {
    background-color: #555;
}

.test-navigation__status--completed-success {
    background-color: #28a745;
    box-shadow: 0 0 6px #28a745;
}

.test-navigation__status--completed-fail {
    background-color: #dc3545;
    box-shadow: 0 0 6px #dc3545;
}

.test-navigation__status--skipped {
    background-color: #ffc107;
    box-shadow: 0 0 6px #ffc107;
}

.status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-left: auto;
    transition:
        background-color var(--animation-slow) ease,
        box-shadow var(--animation-slow) ease;
    box-shadow: 0 0 6px transparent;
}

.status-indicator.pending {
    background-color: #555;
}

.status-indicator.completed-success {
    background-color: #28a745;
    box-shadow: 0 0 6px #28a745;
}

.status-indicator.completed-fail {
    background-color: #dc3545;
    box-shadow: 0 0 6px #dc3545;
}

.status-indicator.skipped {
    background-color: #ffc107;
    box-shadow: 0 0 6px #ffc107;
}

.sidebar-footer {
    margin-top: 0;
    padding: 0;
    border-top: none;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.live-indicator {
    color: #ff6b00;
    font-size: 8px;
    margin-left: 4px;
    animation: pulse 1s infinite;
}

@keyframes pulse {
    0% {
        opacity: 1;
    }
    50% {
        opacity: 0.3;
    }
    100% {
        opacity: 1;
    }
}

.detailed-summary {
    margin-bottom: 0.5rem;
    width: 100%;
    padding: 1rem;
    background: linear-gradient(135deg, #1e1e1e 0%, #252526 100%);
    border-radius: 8px;
    border: 1px solid #404040;
    box-shadow:
        0 4px 20px rgba(0, 0, 0, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.summary-overview {
    margin-bottom: 1rem;
}

.completion-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.9rem;
    letter-spacing: 0.025em;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
}

.completion-badge::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transition: left 0.5s ease;
}

.completion-badge:hover::before {
    left: 100%;
}

.completion-badge.in-progress {
    background: linear-gradient(135deg, #1a5490 0%, #2563eb 100%);
    border: 1px solid #3b82f6;
    color: #dbeafe;
    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
}

.completion-badge.completed-success {
    background: linear-gradient(135deg, #166534 0%, #22c55e 100%);
    border: 1px solid #16a34a;
    color: #dcfce7;
    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.2);
}

.completion-badge.completed-fail {
    background: linear-gradient(135deg, #991b1b 0%, #ef4444 100%);
    border: 1px solid #dc2626;
    color: #fecaca;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
}

.detailed-summary h4 {
    color: #fff;
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
}

.detailed-summary p {
    color: #e0e0e0; /* Improved contrast from #a0a0a0 */
    margin: 0 0 1rem 0;
    font-size: 0.9rem;
}

.result-list {
    margin-bottom: 0.75rem;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 6px;
    padding: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    transition: all 0.2s ease;
}

.result-list.unified {
    padding: 0;
    overflow: hidden;
}

.result-list:hover {
    background: rgba(255, 255, 255, 0.04);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.result-list.unified:hover {
    transform: none;
}

.result-list:last-child {
    margin-bottom: 0;
}

.result-section {
    padding: 0.5rem;
}

.result-section:first-child {
    padding-top: 0.75rem;
}

.result-section:last-child {
    padding-bottom: 0.75rem;
}

.result-section-header {
    display: flex;
    align-items: center;

    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.result-label {
    font-weight: 600;
    font-size: 0.95rem;
    letter-spacing: 0.025em;
    padding-left: 0.5rem;
}

.result-label.passed {
    color: #4ade80;
}

.result-label.failed {
    color: #f87171;
}

.result-label.pending {
    color: #60a5fa;
}

.result-label.skipped {
    color: #fbbf24;
}

.result-list ul {
    list-style: none;
    margin: 0;
    padding: 0;
}

.result-list li {
    color: #e0e0e0; /* Improved contrast from #a0a0a0 */
    font-size: 0.9rem;
}

.test-panel-wrapper {
    background-color: #000000; /* Pure black for maximum contrast */
    border-radius: 8px;
    border: 1px solid #404040; /* Lighter border for better definition */
    box-shadow: 0 4px 25px rgba(0, 0, 0, 0.2);
}

.detailed-summary {
    width: 100%;
    padding: 1rem;
    background-color: #1a1a1a; /* Slightly lighter for better contrast */
    border-radius: 8px;
    margin-bottom: 1rem;
}

.detailed-summary h4 {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
    text-align: center;
}

.detailed-summary > p {
    font-size: 0.9rem;
    color: #e0e0e0; /* Improved contrast from #a0a0a0 */
    text-align: center;
    margin-bottom: 1rem;
}
</style>
