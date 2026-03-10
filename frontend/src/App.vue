<script lang="ts">
import {
    defineComponent,
    defineAsyncComponent,
    ref,
    reactive,
    computed,
    onMounted,
    onUnmounted,
    nextTick,
} from 'vue';
import { useI18n } from 'vue-i18n';
import { resetAllTestStates } from './composables/useTestState';
import { debounce } from './utils/debounce';
import LoadingSpinner from './components/LoadingSpinner.vue';
import AsyncErrorFallback from './components/AsyncErrorFallback.vue';
import PerformanceMonitor from './components/PerformanceMonitor.vue';

// Types
type TestName = 'webcam' | 'microphone' | 'speakers' | 'keyboard' | 'mouse' | 'touch' | 'battery';
type TestType = TestName | 'testsCompleted';
type TestResult = boolean | null;

interface TimingInfo {
    start: number | null;
    end: number | null;
    duration: number | null;
}

interface StyleInfo {
    minHeight: string;
    maxWidth?: string;
}

const testNames: TestName[] = [
    'webcam',
    'microphone',
    'speakers',
    'keyboard',
    'mouse',
    'touch',
    'battery',
];

function isTestName(value: string): value is TestName {
    return testNames.includes(value as TestName);
}

// Async component definitions
const WebcamTest = defineAsyncComponent({
    loader: () => import('./components/WebcamTest.vue'),
    loadingComponent: LoadingSpinner,
    errorComponent: AsyncErrorFallback,
    delay: 200,
    timeout: 10000,
});
const MicrophoneTest = defineAsyncComponent({
    loader: () => import('./components/MicrophoneTest.vue'),
    loadingComponent: LoadingSpinner,
    errorComponent: AsyncErrorFallback,
    delay: 200,
    timeout: 10000,
});
const SpeakerTest = defineAsyncComponent({
    loader: () => import('./components/SpeakerTest.vue'),
    loadingComponent: LoadingSpinner,
    errorComponent: AsyncErrorFallback,
    delay: 200,
    timeout: 10000,
});
const KeyboardTest = defineAsyncComponent({
    loader: () => import('./components/KeyboardTest.vue'),
    loadingComponent: LoadingSpinner,
    errorComponent: AsyncErrorFallback,
    delay: 200,
    timeout: 10000,
});
const MouseTest = defineAsyncComponent({
    loader: () => import('./components/MouseTest.vue'),
    loadingComponent: LoadingSpinner,
    errorComponent: AsyncErrorFallback,
    delay: 200,
    timeout: 10000,
});
const TouchTest = defineAsyncComponent({
    loader: () => import('./components/TouchTest.vue'),
    loadingComponent: LoadingSpinner,
    errorComponent: AsyncErrorFallback,
    delay: 200,
    timeout: 10000,
});
const BatteryTest = defineAsyncComponent({
    loader: () => import('./components/BatteryTest.vue'),
    loadingComponent: LoadingSpinner,
    errorComponent: AsyncErrorFallback,
    delay: 200,
    timeout: 10000,
});
const TestsCompleted = defineAsyncComponent({
    loader: () => import('./components/TestsCompleted.vue'),
    loadingComponent: LoadingSpinner,
    errorComponent: AsyncErrorFallback,
    delay: 200,
    timeout: 10000,
});
const VisualizerContainer = defineAsyncComponent({
    loader: () => import('./components/VisualizerContainer.vue'),
    loadingComponent: LoadingSpinner,
    errorComponent: AsyncErrorFallback,
    delay: 200,
    timeout: 10000,
});
const TestActionButtons = defineAsyncComponent({
    loader: () => import('./components/TestActionButtons.vue'),
    loadingComponent: LoadingSpinner,
    errorComponent: AsyncErrorFallback,
    delay: 200,
    timeout: 10000,
});
const TestHeader = defineAsyncComponent({
    loader: () => import('./components/TestHeader.vue'),
    loadingComponent: LoadingSpinner,
    errorComponent: AsyncErrorFallback,
    delay: 200,
    timeout: 10000,
});
const AppFooter = defineAsyncComponent({
    loader: () => import('./components/AppFooter.vue'),
    loadingComponent: LoadingSpinner,
    errorComponent: AsyncErrorFallback,
    delay: 200,
    timeout: 10000,
});

export default defineComponent({
    name: 'App',
    setup() {
        const { t } = useI18n();
        const $t = t;

        // Reactive state
        const isMobile = ref(false);
        const showSummaryModal = ref(false);
        const activeTest = ref<TestType>('webcam');
        const results = reactive<Record<TestName, TestResult>>({
            webcam: null,
            microphone: null,
            speakers: null,
            keyboard: null,
            mouse: null,
            touch: null,
            battery: null,
        });
        const skippedTests = ref<TestName[]>([]);
        const testIconMap: Record<TestName, string> = {
            webcam: '📷',
            microphone: '🎤',
            speakers: '🔊',
            keyboard: '⌨️',
            mouse: '🖱️',
            touch: '👆',
            battery: '🔋',
        };
        const testNameMap = computed<Record<TestName, string>>(() => ({
            webcam: $t('tests.webcam.name'),
            microphone: $t('tests.microphone.name'),
            speakers: $t('tests.speakers.name'),
            keyboard: $t('tests.keyboard.name'),
            mouse: $t('tests.mouse.name'),
            touch: $t('tests.touch.name'),
            battery: $t('tests.battery.name'),
        }));
        const timings = reactive<Record<TestName, TimingInfo>>({
            webcam: { start: null, end: null, duration: null },
            microphone: { start: null, end: null, duration: null },
            speakers: { start: null, end: null, duration: null },
            keyboard: { start: null, end: null, duration: null },
            mouse: { start: null, end: null, duration: null },
            touch: { start: null, end: null, duration: null },
            battery: { start: null, end: null, duration: null },
        });
        const runCounts = reactive<Record<TestName, number>>({
            webcam: 0,
            microphone: 0,
            speakers: 0,
            keyboard: 0,
            mouse: 0,
            touch: 0,
            battery: 0,
        });
        const showExportMenu = ref(false);
        const switchDebounceTimer = ref<number | null>(null);
        const isSwitching = ref(false);
        const showPerformanceMonitor = ref(false);
        const announcement = ref('');

        // Computed
        const availableTests = computed<TestName[]>(() => {
            const tests = Object.keys(results) as TestName[];
            return isMobile.value ? tests.filter(test => test !== 'keyboard') : tests;
        });

        const currentTestIcon = computed<string>(() => {
            const iconMap: Record<TestType, string> = {
                webcam: '📷',
                microphone: '🎤',
                speakers: '🔊',
                keyboard: '⌨️',
                mouse: '🖱️',
                touch: '👆',
                battery: '🔋',
                testsCompleted: '✅',
            };
            return iconMap[activeTest.value] || '📷';
        });

        const currentTestTitle = computed<string>(() => {
            const titleMap: Record<TestType, string> = {
                webcam: $t('tests.webcam.name'),
                microphone: $t('tests.microphone.name'),
                speakers: $t('tests.speakers.name'),
                keyboard: $t('tests.keyboard.name'),
                mouse: $t('tests.mouse.name'),
                touch: $t('tests.touch.name'),
                battery: $t('tests.battery.name'),
                testsCompleted: $t('tests.completed.name'),
            };
            return titleMap[activeTest.value] || $t('tests.webcam.name');
        });

        const currentTestDescription = computed<string>(() => {
            const descriptionMap: Record<TestType, string> = {
                webcam: $t('tests.webcam.description'),
                microphone: $t('tests.microphone.description'),
                speakers: $t('tests.speakers.description'),
                keyboard: $t('tests.keyboard.description'),
                mouse: $t('tests.mouse.description'),
                touch: $t('tests.touch.description'),
                battery: $t('tests.battery.description'),
                testsCompleted: $t('tests.completed.description'),
            };
            return descriptionMap[activeTest.value] || $t('tests.webcam.description');
        });

        const allTestsCompleted = computed<boolean>(() => {
            return availableTests.value.every(
                test => results[test] !== null || skippedTests.value.includes(test)
            );
        });

        const completedTestsCount = computed<number>(() => {
            return availableTests.value.filter(
                test => results[test] !== null || skippedTests.value.includes(test)
            ).length;
        });

        const totalTestsCount = computed<number>(() => availableTests.value.length);

        const passedTests = computed<TestName[]>(() => {
            return availableTests.value.filter(
                test => results[test] === true && !skippedTests.value.includes(test)
            );
        });

        const failedTests = computed<TestName[]>(() => {
            return availableTests.value.filter(
                test => results[test] === false && !skippedTests.value.includes(test)
            );
        });

        const pendingTests = computed<TestName[]>(() => {
            return availableTests.value.filter(
                test => results[test] === null && !skippedTests.value.includes(test)
            );
        });

        const skippedTestsList = computed<TestName[]>(() =>
            skippedTests.value.filter(test => availableTests.value.includes(test))
        );

        const summaryClass = computed<string>(() => {
            if (failedTests.value.length > 0) return 'completed-fail';
            if (allTestsCompleted.value) return 'completed-success';
            return 'in-progress';
        });

        const summaryText = computed<string>(() => {
            const totalTests = availableTests.value.length;
            const completedCount = completedTestsCount.value;
            if (!allTestsCompleted.value) {
                return `${completedCount}/${totalTests} In Progress...`;
            } else {
                const failedCount = failedTests.value.length;
                if (failedCount > 0) {
                    return `${totalTests}/${totalTests} Completed (${failedCount} Failed)`;
                } else {
                    return `${totalTests}/${totalTests} Completed`;
                }
            }
        });

        const totalTimeSpent = computed<number>(() => {
            return Object.values(timings)
                .map(t => (typeof t.duration === 'number' ? t.duration : 0))
                .reduce((a, b) => a + b, 0);
        });

        const i18nTestNameMap = computed<Record<TestName, string>>(() => ({
            webcam: $t('tests.webcam.name'),
            microphone: $t('tests.microphone.name'),
            speakers: $t('tests.speakers.name'),
            keyboard: $t('tests.keyboard.name'),
            mouse: $t('tests.mouse.name'),
            touch: $t('tests.touch.name'),
            battery: $t('tests.battery.name'),
        }));

        const componentMap = {
            webcam: WebcamTest,
            microphone: MicrophoneTest,
            speakers: SpeakerTest,
            keyboard: KeyboardTest,
            mouse: MouseTest,
            touch: TouchTest,
            battery: BatteryTest,
            testsCompleted: TestsCompleted,
        };

        const currentTestComponent = computed(() => {
            return componentMap[activeTest.value] || WebcamTest;
        });

        const currentContainerStyles = computed<{ minHeight: string; maxWidth?: string }>(() => {
            const styleMap: Record<TestType, StyleInfo> = {
                webcam: { minHeight: '420px' },
                microphone: { minHeight: '280px' },
                speakers: { minHeight: '350px', maxWidth: '600px' },
                keyboard: { minHeight: '350px', maxWidth: '800px' },
                mouse: { minHeight: '350px' },
                touch: { minHeight: '400px', maxWidth: '800px' },
                battery: { minHeight: '250px' },
                testsCompleted: { minHeight: '250px' },
            };
            return styleMap[activeTest.value] || { minHeight: '250px' };
        });

        // Methods
        const debouncedSetActiveTest = debounce(
            (testType: string) => {
                if (isSwitching.value) {
                    return;
                }
                isSwitching.value = true;
                setActiveTest(testType);
                setTimeout(() => {
                    isSwitching.value = false;
                }, 200);
            },
            50,
            { leading: true, trailing: false }
        );

        const setActiveTest = (testType: string) => {
            if (!isTestName(testType)) return;
            const test = testType as TestName;
            if (activeTest.value !== testType || !timings[test].start) {
                timings[test].start = Date.now();
                timings[test].end = null;
            }
            activeTest.value = testType as TestType;
        };

        const onTestCompleted = (testType: string) => {
            if (!isTestName(testType)) return;
            const test = testType;
            skippedTests.value = skippedTests.value.filter(t => t !== test);
            results[test] = true;
            const timing = timings[test]!;
            timing.end = Date.now();

            if (timing.start && timing.end) {
                const duration = (timing.end - timing.start) / 1000;
                timing.duration = duration >= 0 && duration <= 600 ? duration : 0;
            } else {
                timing.duration = 0;
            }

            runCounts[test] += 1;
            autoAdvance(test);
        };

        const onTestFailed = (testType: string) => {
            if (!isTestName(testType)) return;
            const test = testType;
            skippedTests.value = skippedTests.value.filter(t => t !== test);
            results[test] = false;
            const timing = timings[test]!;
            timing.end = Date.now();

            if (timing.start && timing.end) {
                const duration = (timing.end - timing.start) / 1000;
                timing.duration = duration >= 0 && duration <= 600 ? duration : 0;
            } else {
                timing.duration = 0;
            }

            runCounts[test] += 1;
            autoAdvance(test);
            announcement.value = $t('announcements.testFailed', { test: testNameMap.value[test] });
            setTimeout(() => {
                announcement.value = '';
            }, 3000);
        };

        const onTestSkipped = (payload: string | { testType: string; duration?: number }) => {
            const testType = typeof payload === 'string' ? payload : payload.testType;
            if (!isTestName(testType)) return;
            const test = testType;

            const duration =
                typeof payload === 'object' && payload.duration !== undefined
                    ? payload.duration
                    : null;

            if (!skippedTests.value.includes(test)) {
                skippedTests.value.push(test);
            }

            const timing = timings[test]!;

            if (duration !== null) {
                if (duration >= 0 && duration <= 600) {
                    timing.duration = duration;
                    if (timing.start !== null) {
                        timing.end = timing.start + duration * 1000;
                    }
                } else {
                    timing.duration = 0;
                }
            } else if (timing.end === null && timing.start !== null) {
                timing.end = Date.now();
                const sessionDuration = (timing.end - timing.start) / 1000;
                timing.duration =
                    sessionDuration >= 0 && sessionDuration <= 600 ? sessionDuration : 0;
            } else {
                timing.duration = 0;
            }
            results[test] = null;
            runCounts[test] += 1;
            autoAdvance(test);
            announcement.value = $t('announcements.testSkipped', { test: testNameMap.value[test] });
            setTimeout(() => {
                announcement.value = '';
            }, 3000);
        };

        // Wrapper handlers for dynamic component events to satisfy TypeScript
        const handleTestCompleted = (payload: unknown) => {
            if (typeof payload === 'string') {
                onTestCompleted(payload);
            }
        };
        const handleTestFailed = (payload: unknown) => {
            if (typeof payload === 'string') {
                onTestFailed(payload);
            }
        };
        const handleTestSkipped = (payload: unknown) => {
            if (typeof payload === 'string') {
                onTestSkipped(payload);
            } else if (payload && typeof payload === 'object' && 'testType' in payload) {
                onTestSkipped(payload as { testType: string; duration?: number });
            }
        };

        const autoAdvance = (currentTest: TestName) => {
            if (allTestsCompleted.value) {
                activeTest.value = 'testsCompleted';
                return;
            }
            const tests: TestName[] = [
                'webcam',
                'microphone',
                'speakers',
                'keyboard',
                'mouse',
                'touch',
                'battery',
            ];
            const currentIndex = tests.indexOf(currentTest);

            for (let i = currentIndex + 1; i < tests.length; i++) {
                const test = tests[i]!;
                if (results[test] === null) {
                    setActiveTest(test);
                    return;
                }
            }
            for (let i = 0; i < currentIndex; i++) {
                const test = tests[i]!;
                if (results[test] === null) {
                    setActiveTest(test);
                    return;
                }
            }
        };

        const handleTestsCompletedClick = () => {
            if (allTestsCompleted.value) {
                activeTest.value = 'testsCompleted';
            }
        };

        const resetTests = () => {
            availableTests.value.forEach(test => {
                timings[test] = { start: null, end: null, duration: null };
                runCounts[test] = 0;
                results[test] = null;
            });
            skippedTests.value = [];
            resetAllTestStates();
            setActiveTest('webcam');
            announcement.value = '';
        };

        const getTestStatusClass = (testType: TestName) => {
            if (skippedTests.value.includes(testType)) return 'skipped';
            if (results[testType] === true) return 'completed-success';
            if (results[testType] === false) return 'completed-fail';
            return 'pending';
        };

        const exportResults = () => {
            const report = {
                timestamp: new Date().toISOString(),
                results: JSON.parse(JSON.stringify(results)),
                summary: summaryText.value,
            };
            const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mmit-test-results-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        };

        const toggleExportMenu = () => {
            showExportMenu.value = !showExportMenu.value;
        };

        const togglePerformanceMonitor = () => {
            showPerformanceMonitor.value = !showPerformanceMonitor.value;
        };

        const exportAsPDF = async () => {
            const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
                import('jspdf'),
                import('html2canvas'),
            ]);

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

            const completedCount = Object.values(results).filter(r => r !== null).length;
            const passedCount = Object.values(results).filter(r => r === true).length;
            const failedCount = Object.values(results).filter(r => r === false).length;
            const totalTime = `${totalTimeSpent.value.toFixed(2)}s`;
            const skippedCount = skippedTests.value.length;
            const tests = Object.keys(results) as TestName[];
            const testRows = tests
                .map(test => {
                    let status = '';
                    let statusClass = '';
                    let statusIcon = '';

                    if (results[test] === true) {
                        status = $t('status.passed');
                        statusClass = 'status-passed';
                        statusIcon = '✓';
                    } else if (results[test] === false) {
                        status = $t('status.failed');
                        statusClass = 'status-failed';
                        statusIcon = '✗';
                    } else if (skippedTests.value.includes(test)) {
                        status = $t('status.skipped');
                        statusClass = 'status-skipped';
                        statusIcon = '↷';
                    } else {
                        status = $t('status.pending');
                        statusClass = 'status-pending';
                        statusIcon = '⏳';
                    }

                    const runCount = runCounts[test] || 0;
                    const duration =
                        timings[test].duration !== null ? timings[test].duration!.toFixed(2) : '';

                    return `
                    <tr>
                        <td class="test-name">${i18nTestNameMap.value[test]}</td>
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
                        <h1>${$t('app.name')} ${$t('results.summary')}</h1>
                        <div class="accent-bar"></div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-item">
                            <span class="label">Completed:</span>
                            <span class="value">${completedCount}/${tests.length}</span>
                        </div>
                        <div class="summary-item passed">
                            <span class="label">${$t('export.summaryLabels.passed')}</span>
                            <span class="value">${passedCount}</span>
                        </div>
                        ${
                            failedCount > 0
                                ? `
                            <div class="summary-item failed">
                                <span class="label">${$t('export.summaryLabels.failed')}</span>
                                <span class="value">${failedCount}</span>
                            </div>
                        `
                                : ''
                        }
                        ${
                            skippedCount > 0
                                ? `
                            <div class="summary-item skipped">
                                <span class="label">${$t('export.summaryLabels.skipped')}</span>
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
                                    <th>${$t('results.testDetails')}</th>
                                    <th>${$t('status.status')}</th>
                                    <th>${$t('results.runCount')}</th>
                                    <th>${$t('results.duration')} (s)</th>
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
            `;

            document.body.appendChild(container);

            try {
                const canvas = await html2canvas(container, {
                    backgroundColor: null,
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                });

                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'pt',
                    format: 'a4',
                });

                const imgData = canvas.toDataURL('image/png');
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();

                pdf.setFillColor(13, 13, 13);
                pdf.rect(0, 0, pageWidth, pageHeight, 'F');

                const imgWidth = pageWidth;
                const imgHeight = (canvas.height / canvas.width) * imgWidth;

                pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
                pdf.save('mmit-test-results.pdf');
            } catch (error) {
                alert($t('alerts.pdfGenerationError'));
            } finally {
                document.body.removeChild(container);
                showExportMenu.value = false;
            }
        };

        const exportAsJSON = () => {
            exportResults();
            showExportMenu.value = false;
        };

        const exportAsCSV = () => {
            const header = [
                $t('results.testDetails'),
                $t('status.status'),
                $t('results.runCount'),
                `${$t('results.duration')} (s)`,
            ];
            const rows: string[][] = [header];
            const tests = Object.keys(results) as TestName[];
            tests.forEach(test => {
                let status = '';
                if (results[test] === true) status = $t('status.passed');
                else if (results[test] === false) status = $t('status.failed');
                else status = $t('status.pending');
                const runCount = runCounts[test] || 0;
                const duration =
                    timings[test].duration !== null ? timings[test].duration!.toFixed(2) : '';
                rows.push([i18nTestNameMap.value[test], status, String(runCount), duration]);
            });
            const csv = rows
                .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
                .join('\r\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'mmit-test-results.csv';
            a.click();
            URL.revokeObjectURL(url);
            showExportMenu.value = false;
        };

        const handleResize = debounce(
            () => {
                isMobile.value = window.innerWidth <= 768;
            },
            250,
            { leading: false, trailing: true }
        );

        // Lifecycle
        onMounted(() => {
            handleResize();
            window.addEventListener('resize', handleResize);

            nextTick(() => {
                if (timings[activeTest.value as TestName]) {
                    timings[activeTest.value as TestName].start = null;
                    timings[activeTest.value as TestName].end = null;
                }
                setActiveTest(activeTest.value);
            });
        });

        onUnmounted(() => {
            window.removeEventListener('resize', handleResize);
            if (switchDebounceTimer.value) {
                clearTimeout(switchDebounceTimer.value);
            }
            if (typeof window !== 'undefined' && window.app) {
                delete window.app;
            }
        });

        return {
            // State
            isMobile,
            showSummaryModal,
            activeTest,
            results,
            skippedTests,
            testIconMap,
            testNameMap,
            timings,
            runCounts,
            showExportMenu,
            isSwitching,
            showPerformanceMonitor,
            announcement,
            // Computed
            availableTests,
            currentTestIcon,
            currentTestTitle,
            currentTestDescription,
            currentTestComponent,
            allTestsCompleted,
            completedTestsCount,
            totalTestsCount,
            passedTests,
            failedTests,
            pendingTests,
            skippedTestsList,
            summaryClass,
            summaryText,
            totalTimeSpent,
            i18nTestNameMap,
            currentContainerStyles,
            // Methods
            debouncedSetActiveTest,
            setActiveTest,
            onTestCompleted,
            onTestFailed,
            onTestSkipped,
            handleTestCompleted,
            handleTestFailed,
            handleTestSkipped,
            autoAdvance,
            handleTestsCompletedClick,
            resetTests,
            getTestStatusClass,
            exportResults,
            toggleExportMenu,
            togglePerformanceMonitor,
            exportAsPDF,
            exportAsJSON,
            exportAsCSV,
            handleResize,
            t: $t,
        };
    },
    components: {
        PerformanceMonitor,
        VisualizerContainer,
        TestActionButtons,
        TestHeader,
        AppFooter,
    },
});
</script>

<template>
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <div v-if="!isMobile" class="app-layout">
        <AppHeader :test-title="currentTestTitle" :test-icon="currentTestIcon" />
        <main class="main-content" id="main-content">
            <div aria-live="polite" aria-atomic="true" class="visually-hidden">
                {{ announcement }}
            </div>
            <TestHeader :test-description="currentTestDescription" :center-align="true" />
            <VisualizerContainer
                :custom-styles="currentContainerStyles"
                :keyboard-mode="activeTest === 'keyboard'"
            >
                <component
                    :is="currentTestComponent"
                    @test-completed="handleTestCompleted"
                    @test-failed="handleTestFailed"
                    @test-skipped="handleTestSkipped"
                    @start-over="resetTests"
                />
            </VisualizerContainer>
            <TestActionButtons
                v-if="activeTest !== 'testsCompleted'"
                :actions-disabled="false"
                :container-styles="currentContainerStyles"
                @working="onTestCompleted(activeTest)"
                @not-working="onTestFailed(activeTest)"
                @skip="onTestSkipped(activeTest)"
            />
        </main>
        <AppFooter
            :show-export-menu="showExportMenu"
            @reset-tests="resetTests"
            @toggle-export-menu="toggleExportMenu"
            @export-pdf="exportAsPDF"
            @export-json="exportAsJSON"
            @export-csv="exportAsCSV"
        />
    </div>
    <div v-else class="mobile-layout">
        <!-- Mobile Header (same as before, just include it) -->
        <header class="mobile-header electron-app">
            <div class="mobile-header-content">
                <div class="mobile-header-title-container">
                    <span class="mobile-header-icon">{{ currentTestIcon }}</span>
                    <h1 class="mobile-header-title">{{ currentTestTitle }}</h1>
                </div>
                <button @click="showSummaryModal = true" class="summary-button">
                    <div class="completion-badge" :class="summaryClass">
                        <span class="completion-text"
                            >{{ completedTestsCount }}/{{ totalTestsCount }}</span
                        >
                    </div>
                </button>
            </div>
        </header>
        <main class="mobile-main-content" id="main-content">
            <div aria-live="polite" aria-atomic="true" class="visually-hidden">
                {{ announcement }}
            </div>
            <VisualizerContainer
                :custom-styles="currentContainerStyles"
                :keyboard-mode="activeTest === 'keyboard'"
                class="mobile-visualizer"
            >
                <component
                    :is="currentTestComponent"
                    @test-completed="handleTestCompleted"
                    @test-failed="handleTestFailed"
                    @test-skipped="handleTestSkipped"
                    @start-over="resetTests"
                />
            </VisualizerContainer>
        </main>
        <footer class="mobile-footer">
            <div class="mobile-action-buttons" v-if="activeTest !== 'testsCompleted'">
                <button
                    @click="onTestFailed(activeTest)"
                    class="button button--danger button--medium"
                >
                    {{ t('buttons.fail') }}
                </button>
                <button
                    @click="onTestCompleted(activeTest)"
                    class="button button--success button--medium"
                >
                    {{ t('buttons.pass') }}
                </button>
                <button
                    @click="onTestSkipped(activeTest)"
                    class="button button--skip button--medium"
                >
                    {{ t('buttons.skip') }}
                </button>
            </div>
            <nav class="mobile-nav">
                <button
                    v-for="test in availableTests"
                    :key="test"
                    :class="{ active: activeTest === test }"
                    @click="debouncedSetActiveTest(test)"
                    class="mobile-nav-btn"
                >
                    <span class="test-icon">{{ testIconMap[test] }}</span>
                    <span class="mobile-nav-label">{{ i18nTestNameMap[test] }}</span>
                </button>
                <button
                    :class="{
                        active: activeTest === 'testsCompleted',
                        disabled: !allTestsCompleted,
                    }"
                    @click="handleTestsCompletedClick"
                    class="mobile-nav-btn"
                >
                    <span class="test-icon">✅</span>
                    <span class="mobile-nav-label">{{ $t('sidebar.summary') }}</span>
                </button>
            </nav>
        </footer>
        <transition name="modal-fade">
            <div
                v-if="showSummaryModal"
                class="summary-modal-overlay"
                @click="showSummaryModal = false"
            >
                <div class="summary-modal-content" @click.stop>
                    <div class="sidebar-header">
                        <h2>{{ t('sidebar.summary') }}</h2>
                        <button @click="showSummaryModal = false" class="close-modal-btn">
                            {{ t('ui.closeSymbol') }}
                        </button>
                    </div>
                    <div class="mobile-summary-body">
                        <div class="test-summary">
                            <div class="test-summary__overview">
                                <div
                                    class="test-summary__badge"
                                    :class="`test-summary__badge--${summaryClass}`"
                                >
                                    <span class="test-summary__completion-text"
                                        >{{ $t('export.summaryLabels.completed') }}
                                        {{ completedTestsCount }}/{{ totalTestsCount }}</span
                                    >
                                </div>
                            </div>
                            <div class="test-summary__results">
                                <div v-if="pendingTests.length > 0" class="test-summary__section">
                                    <div class="test-summary__section-header">
                                        <span
                                            class="test-summary__section-label test-summary__section-label--pending"
                                            >Pending: {{ pendingTests.length }}</span
                                        >
                                    </div>
                                    <ul class="test-summary__list">
                                        <li
                                            v-for="test in pendingTests"
                                            :key="test"
                                            class="test-summary__item"
                                        >
                                            <span class="test-summary__name">{{
                                                i18nTestNameMap[test]
                                            }}</span>
                                        </li>
                                    </ul>
                                </div>
                                <div v-if="failedTests.length > 0" class="test-summary__section">
                                    <div
                                        v-if="pendingTests.length > 0"
                                        class="test-summary__divider"
                                    ></div>
                                    <div class="test-summary__section-header">
                                        <span
                                            class="test-summary__section-label test-summary__section-label--failed"
                                            >Failed: {{ failedTests.length }}</span
                                        >
                                    </div>
                                    <ul class="test-summary__list">
                                        <li
                                            v-for="test in failedTests"
                                            :key="test"
                                            class="test-summary__item"
                                        >
                                            <span class="test-summary__name">{{
                                                i18nTestNameMap[test]
                                            }}</span>
                                            <div class="test-summary__meta">
                                                <span
                                                    v-if="runCounts[test] > 0"
                                                    class="test-summary__count"
                                                    >{{ runCounts[test] }}x</span
                                                >
                                                <span
                                                    v-if="timings[test].duration !== null"
                                                    class="test-summary__time"
                                                    >{{
                                                        timings[test]
                                                            .duration!.toFixed(2)
                                                            .padStart(5, '0')
                                                    }}s</span
                                                >
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                                <div
                                    v-if="skippedTestsList.length > 0"
                                    class="test-summary__section"
                                >
                                    <div
                                        v-if="pendingTests.length > 0 || failedTests.length > 0"
                                        class="test-summary__divider"
                                    ></div>
                                    <div class="test-summary__section-header">
                                        <span
                                            class="test-summary__section-label test-summary__section-label--skipped"
                                            >{{ t('status.skipped') }}:
                                            {{ skippedTestsList.length }}</span
                                        >
                                    </div>
                                    <ul class="test-summary__list">
                                        <li
                                            v-for="test in skippedTestsList"
                                            :key="test"
                                            class="test-summary__item"
                                        >
                                            <span class="test-summary__name">{{
                                                i18nTestNameMap[test]
                                            }}</span>
                                            <div class="test-summary__meta">
                                                <span class="test-summary__count"
                                                    >{{ runCounts[test] }}x</span
                                                >
                                                <span
                                                    v-if="timings[test].duration !== null"
                                                    class="test-summary__time"
                                                    >{{
                                                        timings[test]
                                                            .duration!.toFixed(2)
                                                            .padStart(5, '0')
                                                    }}s</span
                                                >
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                                <div v-if="passedTests.length > 0" class="test-summary__section">
                                    <div
                                        v-if="
                                            pendingTests.length > 0 ||
                                            failedTests.length > 0 ||
                                            skippedTestsList.length > 0
                                        "
                                        class="test-summary__divider"
                                    ></div>
                                    <div class="test-summary__section-header">
                                        <span
                                            class="test-summary__section-label test-summary__section-label--passed"
                                            >Passed: {{ passedTests.length }}</span
                                        >
                                    </div>
                                    <ul class="test-summary__list">
                                        <li
                                            v-for="test in passedTests"
                                            :key="test"
                                            class="test-summary__item"
                                        >
                                            <span class="test-summary__name">{{
                                                i18nTestNameMap[test]
                                            }}</span>
                                            <div class="test-summary__meta">
                                                <span
                                                    v-if="runCounts[test] > 0"
                                                    class="test-summary__count"
                                                    >{{ runCounts[test] }}x</span
                                                >
                                                <span
                                                    v-if="timings[test].duration !== null"
                                                    class="test-summary__time"
                                                    >{{
                                                        timings[test]
                                                            .duration!.toFixed(2)
                                                            .padStart(5, '0')
                                                    }}s</span
                                                >
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <div v-if="completedTestsCount > 0" class="test-summary__total-time">
                                <div class="test-summary__total-container">
                                    <span class="test-summary__total-label">Total Time:</span>
                                    <span class="test-summary__total-value"
                                        >{{ totalTimeSpent.toFixed(2) }}s</span
                                    >
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
        <button
            class="performance-toggle-btn"
            @click="togglePerformanceMonitor"
            :title="showPerformanceMonitor ? $t('performance.hide') : $t('performance.show')"
            aria-label="Toggle performance monitor"
        >
            ⚡
        </button>
        <PerformanceMonitor v-if="showPerformanceMonitor" class="performance-panel" />
    </div>
</template>

<style>
/* Same CSS as before - kept unchanged */
.skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: #000;
    color: white;
    padding: 8px;
    z-index: 100;
    transition: top 0.3s;
}
.skip-link:focus {
    top: 0;
}
.visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}
.app-layout {
    display: flex;
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
    background-color: #000000;
    border-right: 1px solid #404040;
    display: flex;
    flex-direction: column;
    padding: 1rem;
    transition: var(--transition-width);
    z-index: 2;
}
.right-sidebar {
    border-right: none;
    border-left: 1px solid #404040;
    left: auto;
    right: 0;
    position: relative;
    background-color: #000000;
}
.main-content {
    flex: 1;
    padding: 2rem;
    padding-top: calc(2rem + var(--header-height));
    overflow-y: auto;
    min-width: 0;
    position: relative;
}
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
    color: #ffffff;
    margin: 0;
    text-align: center;
    white-space: nowrap;
    display: block;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
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
.test-navigation__status {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-left: auto;
    transition:
        background-color var(--animation-slow) ease,
        box-shadow var(--animation-slow) ease;
    box-shadow: 0 0 6px transparent;
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
    color: #e0e0e0;
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
    color: #e0e0e0;
    font-size: 0.9rem;
}
.test-panel-wrapper {
    background-color: #000000;
    border-radius: 8px;
    border: 1px solid #404040;
    box-shadow: 0 4px 25px rgba(0, 0, 0, 0.2);
}
.detailed-summary {
    width: 100%;
    padding: 1rem;
    background-color: #1a1a1a;
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
    color: #e0e0e0;
    text-align: center;
    margin-bottom: 1rem;
}
.sidebar-summary-top {
    margin-bottom: 1rem;
}
.summary-table {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}
.summary-row {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 0.5rem;
    align-items: center;
    padding: 0.1rem;
    min-height: 40px;
}
.summary-row:hover {
    background: rgba(255, 255, 255, 0.06);
    transform: translateX(4px);
}
.summary-name {
    grid-column: 1;
    text-align: left;
    font-weight: 500;
    color: #e2e8f0;
    font-size: 0.9rem;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-left: 1.25rem;
    white-space: nowrap;
}
.summary-meta {
    grid-column: 2 / 4;
    display: grid;
    grid-template-columns: 32px 48px;
    gap: 0.5rem;
    align-items: center;
    justify-content: end;
}
.summary-time {
    text-align: center;
    color: #94a3b8;
    font-size: 0.8rem;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
    background: rgba(148, 163, 184, 0.1);
    padding: 0.27rem;
    border-radius: 4px;
    border: 1px solid rgba(148, 163, 184, 0.2);
    width: 48px;
    box-sizing: border-box;
}
.summary-count {
    text-align: center;
    background: linear-gradient(135deg, #f59e0b, #fbbf24);
    color: #1a1a1a;
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.17rem 0.4rem;
    border-radius: 4px;
    width: 32px;
    box-shadow: 0 1px 3px rgba(245, 158, 11, 0.3);
    box-sizing: border-box;
}
.summary-total-time {
    margin-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}
.total-time-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    border-radius: 6px;
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
.mobile-layout {
    display: flex;
    flex-direction: column;
    background-color: #000;
    color: #fff;
    overflow: hidden;
}
.mobile-header {
    flex-shrink: 0;
    padding: 0.75rem 1rem;
    background-color: #1a1a1a;
    border-bottom: 1px solid #333;
    z-index: 100;
}
.performance-toggle-btn {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    color: white;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;
}
.performance-toggle-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.6);
}
.performance-toggle-btn:active {
    transform: scale(0.95);
}
.performance-panel {
    position: fixed;
    bottom: 80px;
    right: 20px;
    z-index: 9998;
    max-width: 420px;
    max-height: 70vh;
    overflow-y: auto;
    background: var(--surface-primary, #1e1e1e);
    border: 1px solid var(--border-color, #333);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    padding: 16px;
}
.performance-panel::-webkit-scrollbar {
    width: 8px;
}
.performance-panel::-webkit-scrollbar-track {
    background: var(--surface-secondary, #2a2a2a);
    border-radius: 4px;
}
.performance-panel::-webkit-scrollbar-thumb {
    background: var(--border-color, #444);
    border-radius: 4px;
}
.performance-panel::-webkit-scrollbar-thumb:hover {
    background: var(--text-secondary, #666);
}
</style>
