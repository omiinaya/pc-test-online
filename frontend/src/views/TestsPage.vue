<script setup lang="ts">
import {
    ref,
    reactive,
    computed,
    onMounted,
    onUnmounted,
    nextTick,
    defineAsyncComponent,
    defineEmits,
} from 'vue';
import { useI18n } from 'vue-i18n';
import { debounce } from '../utils/debounce';
import { resetAllTestStates } from '../composables/useTestState';
import { useCSSCompatibility } from '../composables/useCSSCompatibility';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import AsyncErrorFallback from '../components/AsyncErrorFallback.vue';
import TestHeader from '../components/TestHeader.vue';
import VisualizerContainer from '../components/VisualizerContainer.vue';
import TestActionButtons from '../components/TestActionButtons.vue';
import type { TestType } from '../types';

// Async test component definitions
const WebcamTest = defineAsyncComponent({
    loader: () => import('../components/WebcamTest.vue'),
    loadingComponent: LoadingSpinner,
    errorComponent: AsyncErrorFallback,
    delay: 200,
    timeout: 10000,
});
const MicrophoneTest = defineAsyncComponent({
    loader: () => import('../components/MicrophoneTest.vue'),
    loadingComponent: LoadingSpinner,
    errorComponent: AsyncErrorFallback,
    delay: 200,
    timeout: 10000,
});
const SpeakerTest = defineAsyncComponent({
    loader: () => import('../components/SpeakerTest.vue'),
    loadingComponent: LoadingSpinner,
    errorComponent: AsyncErrorFallback,
    delay: 200,
    timeout: 10000,
});
const KeyboardTest = defineAsyncComponent({
    loader: () => import('../components/KeyboardTest.vue'),
    loadingComponent: LoadingSpinner,
    errorComponent: AsyncErrorFallback,
    delay: 200,
    timeout: 10000,
});
const MouseTest = defineAsyncComponent({
    loader: () => import('../components/MouseTest.vue'),
    loadingComponent: LoadingSpinner,
    errorComponent: AsyncErrorFallback,
    delay: 200,
    timeout: 10000,
});
const TouchTest = defineAsyncComponent({
    loader: () => import('../components/TouchTest.vue'),
    loadingComponent: LoadingSpinner,
    errorComponent: AsyncErrorFallback,
    delay: 200,
    timeout: 10000,
});
const BatteryTest = defineAsyncComponent({
    loader: () => import('../components/BatteryTest.vue'),
    loadingComponent: LoadingSpinner,
    errorComponent: AsyncErrorFallback,
    delay: 200,
    timeout: 10000,
});
const TestsCompleted = defineAsyncComponent({
    loader: () => import('../components/TestsCompleted.vue'),
    loadingComponent: LoadingSpinner,
    errorComponent: AsyncErrorFallback,
    delay: 200,
    timeout: 10000,
});

// Types
type TestName = 'webcam' | 'microphone' | 'speakers' | 'keyboard' | 'mouse' | 'touch' | 'battery';
type TestResult = boolean | null;
interface TimingInfo {
    start: number | null;
    end: number | null;
    duration: number | null;
}
interface TimerInfo {
    running: boolean;
    startTime: number | null;
    elapsed: number;
}

// i18n
const { t } = useI18n();
const $t = t; // alias for template

// Emits
const emit = defineEmits<{
    'update-footer': [
        payload: { completedTests: number; totalTests: number; showExportMenu?: boolean },
    ];
    'reset-tests': [];
    'export-json': [];
    'export-csv': [];
}>();

// Test names list
const testNames: TestName[] = [
    'webcam',
    'microphone',
    'speakers',
    'keyboard',
    'mouse',
    'touch',
    'battery',
];

// Reactive state
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
const timers = reactive<Record<TestName, TimerInfo>>({
    webcam: { running: false, startTime: null, elapsed: 0 },
    microphone: { running: false, startTime: null, elapsed: 0 },
    speakers: { running: false, startTime: null, elapsed: 0 },
    keyboard: { running: false, startTime: null, elapsed: 0 },
    mouse: { running: false, startTime: null, elapsed: 0 },
    touch: { running: false, startTime: null, elapsed: 0 },
    battery: { running: false, startTime: null, elapsed: 0 },
});
const timerInterval = ref<number | null>(null);
const timerTick = ref(0);
const showExportMenu = ref(false);

// Helper to get timer
const getTimer = (test: TestName) => timers[test];

// Computed properties
const realTimeElapsed = computed(() => {
    const now = Date.now();
    void timerTick.value;
    const result: Partial<Record<TestName, number>> = {};
    testNames.forEach(test => {
        const timer = timers[test];
        if (timer.running && timer.startTime) {
            result[test] = (now - timer.startTime) / 1000 + timer.elapsed;
        } else {
            result[test] = timer.elapsed;
        }
    });
    return result as Record<TestName, number>;
});

const formattedRealTimeTimers = computed(() => {
    const formatted: Record<TestName, string> = {
        webcam: '0.00',
        microphone: '0.00',
        speakers: '0.00',
        keyboard: '0.00',
        mouse: '0.00',
        touch: '0.00',
        battery: '0.00',
    };
    testNames.forEach(test => {
        const time = realTimeElapsed.value[test];
        formatted[test] = time > 0 ? time.toFixed(2) : '0.00';
    });
    return formatted;
});

const currentTestDescription = computed(() => {
    const descriptionMap: Record<TestName | 'testsCompleted', string> = {
        webcam: t('tests.webcam.description'),
        microphone: t('tests.microphone.description'),
        speakers: t('tests.speakers.description'),
        keyboard: t('tests.keyboard.description'),
        mouse: t('tests.mouse.description'),
        touch: t('tests.touch.description'),
        battery: t('tests.battery.description'),
        testsCompleted: t('tests.completed.description'),
    };
    return descriptionMap[activeTest.value] || descriptionMap.webcam;
});

const currentTestComponent = computed(() => {
    const componentMap: Record<TestName | 'testsCompleted', any> = {
        webcam: WebcamTest,
        microphone: MicrophoneTest,
        speakers: SpeakerTest,
        keyboard: KeyboardTest,
        mouse: MouseTest,
        touch: TouchTest,
        battery: BatteryTest,
        testsCompleted: TestsCompleted,
    };
    return componentMap[activeTest.value] || WebcamTest;
});

const allTestsCompleted = computed(() => {
    return testNames.every(test => results[test] !== null || skippedTests.value.includes(test));
});

const completedTestsCount = computed(() => {
    return testNames.filter(test => results[test] !== null || skippedTests.value.includes(test))
        .length;
});

const totalTestsCount = computed(() => testNames.length);

const passedTests = computed(() => {
    return testNames.filter(test => results[test] === true && !skippedTests.value.includes(test));
});

const failedTests = computed(() => {
    return testNames.filter(test => results[test] === false && !skippedTests.value.includes(test));
});

const pendingTests = computed(() => {
    return testNames.filter(test => results[test] === null && !skippedTests.value.includes(test));
});

const skippedTestsList = computed(() => skippedTests.value);

const summaryText = computed(() => {
    const totalTests = totalTestsCount.value;
    const completedCount = completedTestsCount.value;
    if (!allTestsCompleted.value) {
        return `${completedCount}/${totalTests} In Progress...`;
    } else {
        const failedCount = Object.values(results).filter(r => r === false).length;
        if (failedCount > 0) {
            return `${totalTests}/${totalTests} Completed (${failedCount} Failed)`;
        } else {
            return `${totalTests}/${totalTests} Completed`;
        }
    }
});

const totalTimeSpent = computed(() => {
    return Object.values(timings)
        .map(t => (typeof t.duration === 'number' ? t.duration : 0))
        .reduce((a, b) => a + b, 0);
});

const i18nTestNameMap = computed(() => {
    return {
        webcam: t('tests.webcam.name'),
        microphone: t('tests.microphone.name'),
        speakers: t('tests.speakers.name'),
        keyboard: t('tests.keyboard.name'),
        mouse: t('tests.mouse.name'),
        touch: t('tests.touch.name'),
        battery: t('tests.battery.name'),
    };
});

const formattedTimings = computed(() => {
    const formatted: Partial<Record<TestName, string>> = {};
    testNames.forEach(test => {
        const timing = timings[test];
        if (timing && typeof timing === 'object') {
            if (typeof timing.duration === 'number' && timing.duration > 0) {
                formatted[test] = `${timing.duration.toFixed(2)}s`;
            } else if (results[test] !== null || skippedTests.value.includes(test)) {
                formatted[test] = '0.00s';
            } else if (timers[test].running) {
                formatted[test] = `${formattedRealTimeTimers.value[test]}s`;
            } else {
                formatted[test] = '0.00s';
            }
        } else {
            formatted[test] = '0.00s';
        }
    });
    return formatted as Record<TestName, string>;
});

const currentContainerStyles = computed(() => {
    const styleMap: Record<TestName | 'testsCompleted', { minHeight: string; maxWidth?: string }> =
        {
            webcam: { minHeight: '420px' },
            microphone: { minHeight: '420px' },
            speakers: { minHeight: '420px', maxWidth: '600px' },
            keyboard: { minHeight: '420px', maxWidth: '800px' },
            mouse: { minHeight: '420px' },
            touch: { minHeight: '420px', maxWidth: '800px' },
            battery: { minHeight: '420px' },
            testsCompleted: { minHeight: '420px' },
        };
    return styleMap[activeTest.value] || { minHeight: '420px' };
});

// Global event listener handlers
const handleResetFromFooter = () => {
    resetTests();
};

const handleExportPdfFromFooter = () => {
    exportAsPDF();
};

const handleExportJsonFromFooter = () => {
    exportAsJSON();
};

const handleExportCsvFromFooter = () => {
    exportAsCSV();
};

const handleCloseExportMenuFromFooter = () => {
    showExportMenu.value = false;
};

const setupGlobalEventListeners = () => {
    window.addEventListener('app-footer-reset-tests', handleResetFromFooter);
    window.addEventListener('app-footer-export-pdf', handleExportPdfFromFooter);
    window.addEventListener('app-footer-export-json', handleExportJsonFromFooter);
    window.addEventListener('app-footer-export-csv', handleExportCsvFromFooter);
    window.addEventListener('app-footer-close-export-menu', handleCloseExportMenuFromFooter);
};

const cleanupGlobalEventListeners = () => {
    window.removeEventListener('app-footer-reset-tests', handleResetFromFooter);
    window.removeEventListener('app-footer-export-pdf', handleExportPdfFromFooter);
    window.removeEventListener('app-footer-export-json', handleExportJsonFromFooter);
    window.removeEventListener('app-footer-export-csv', handleExportCsvFromFooter);
    window.removeEventListener('app-footer-close-export-menu', handleCloseExportMenuFromFooter);
};

// Debounced active test setter
const setActiveTest = (testType: TestType) => {
    if (activeTest.value && activeTest.value !== testType) {
        if (activeTest.value !== 'testsCompleted') {
            stopTimer(activeTest.value as TestName);
        }
    }
    // Only access timings if testType is a TestName (not 'testsCompleted')
    if (testType !== 'testsCompleted' && timings[testType]) {
        if (activeTest.value !== testType || timings[testType].start === null) {
            timings[testType].start = Date.now();
            timings[testType].end = null;
            startTimer(testType);
        }
    }
    activeTest.value = testType;
};

const debouncedSetActiveTest = debounce(setActiveTest, 200);

// Test handlers
const onTestCompleted = (testType: TestName) => {
    if (!timings[testType]) return;
    stopTimer(testType);

    skippedTests.value = skippedTests.value.filter(t => t !== testType);
    results[testType] = true;
    timings[testType].end = Date.now();

    const timing = timings[testType];
    if (timing.start !== null && timing.end !== null) {
        const sessionDuration = (timing.end - timing.start) / 1000;
        if (sessionDuration >= 0 && sessionDuration <= 600) {
            timing.duration = sessionDuration;
        } else {
            timing.duration = 0;
        }
    } else {
        timing.duration = 0;
    }

    runCounts[testType] += 1;
    autoAdvance(testType);
    emitProgressUpdate();
};

const onTestFailed = (testType: TestName) => {
    if (!timings[testType]) return;
    stopTimer(testType);

    skippedTests.value = skippedTests.value.filter(t => t !== testType);
    results[testType] = false;
    timings[testType].end = Date.now();

    const timing = timings[testType];
    if (timing.start !== null && timing.end !== null) {
        const sessionDuration = (timing.end - timing.start) / 1000;
        if (sessionDuration >= 0 && sessionDuration <= 600) {
            timing.duration = sessionDuration;
        } else {
            timing.duration = 0;
        }
    } else {
        timing.duration = 0;
    }

    runCounts[testType] += 1;
    autoAdvance(testType);
    emitProgressUpdate();
};
const onTestSkipped = (payload: TestType | { testType: TestType; duration?: number }) => {
    // Extract raw test type
    let rawTestType: TestType;
    if (typeof payload === 'string') {
        rawTestType = payload as TestType;
    } else {
        rawTestType = payload.testType;
    }

    // Only process if it's a TestName (exclude 'testsCompleted')
    if (rawTestType === 'testsCompleted') {
        return;
    }

    const testType: TestName = rawTestType;
    const duration = typeof payload === 'object' && 'duration' in payload ? payload.duration : null;

    if (!timings[testType]) return;
    stopTimer(testType);

    if (!skippedTests.value.includes(testType)) {
        skippedTests.value.push(testType);
    }

    const timing = timings[testType];
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
        if (sessionDuration >= 0 && sessionDuration <= 600) {
            timing.duration = sessionDuration;
        } else {
            timing.duration = 0;
        }
    } else {
        timing.duration = 0;
    }
    results[testType] = null;
    runCounts[testType] += 1;
    autoAdvance(testType);
};

const autoAdvance = (currentTest: TestName) => {
    if (allTestsCompleted.value) {
        activeTest.value = 'testsCompleted' as TestType;
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
    // Look for next incomplete test after current
    for (let i = currentIndex + 1; i < tests.length; i++) {
        const test = tests[i] as TestName;
        if (results[test] === null) {
            setActiveTest(test);
            return;
        }
    }
    // Wrap around
    for (let i = 0; i < currentIndex; i++) {
        const test = tests[i] as TestName;
        if (results[test] === null) {
            setActiveTest(test);
            return;
        }
    }
};

const handleTestsCompletedClick = () => {
    if (allTestsCompleted.value) {
        activeTest.value = 'testsCompleted' as TestType;
    }
};

// Timer methods
const startTimer = (testType: TestName) => {
    const timer = timers[testType];
    if (!timer) return;

    if (!timerInterval.value) {
        timerInterval.value = window.setInterval(() => {
            timerTick.value = Date.now();
        }, 100);
    }
};

const stopTimer = (testType: TestName) => {
    const timer = timers[testType];
    if (!timer || !timer.running) return;

    const now = Date.now();
    const elapsed = (now - timer.startTime!) / 1000;
    timer.elapsed += elapsed;
    timer.running = false;
    timer.startTime = null;

    cleanupTimerInterval();
};

const cleanupTimerInterval = () => {
    const anyRunning = testNames.some(test => timers[test].running);
    if (!anyRunning && timerInterval.value) {
        clearInterval(timerInterval.value);
        timerInterval.value = null;
    }
};

const getTestStatusClass = (testType: TestName) => {
    if (skippedTests.value.includes(testType)) return 'skipped';
    if (results[testType] === true) return 'completed-success';
    if (results[testType] === false) return 'completed-fail';
    return 'pending';
};

const emitProgressUpdate = () => {
    emit('update-footer', {
        completedTests: completedTestsCount.value,
        totalTests: totalTestsCount.value,
    });
};

// Export functions
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

    const testRows = testNames
        .map(test => {
            let status = '';
            let statusClass = '';
            let statusIcon = '';

            if (results[test] === true) {
                status = t('status.passed');
                statusClass = 'status-passed';
                statusIcon = '✓';
            } else if (results[test] === false) {
                status = t('status.failed');
                statusClass = 'status-failed';
                statusIcon = '✗';
            } else if (skippedTests.value.includes(test)) {
                status = t('status.skipped');
                statusClass = 'status-skipped';
                statusIcon = '↷';
            } else {
                status = t('status.pending');
                statusClass = 'status-pending';
                statusIcon = '⏳';
            }

            const runCount = runCounts[test] || 0;
            const duration =
                typeof timings[test].duration === 'number'
                    ? timings[test].duration!.toFixed(2)
                    : '';

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
        <h1>${t('app.name')} ${t('results.summary')}</h1>
        <div class="accent-bar"></div>
      </div>
      
      <div class="summary-card">
        <div class="summary-item">
          <span class="label">Completed:</span>
          <span class="value">${completedCount}/${testNames.length}</span>
        </div>
        <div class="summary-item passed">
          <span class="label">${t('export.summaryLabels.passed')}</span>
          <span class="value">${passedCount}</span>
        </div>
        ${
            failedCount > 0
                ? `
        <div class="summary-item failed">
          <span class="label">${t('export.summaryLabels.failed')}</span>
          <span class="value">${failedCount}</span>
        </div>
        `
                : ''
        }
        ${
            skippedCount > 0
                ? `
        <div class="summary-item skipped">
          <span class="label">${t('export.summaryLabels.skipped')}</span>
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
              <th>${t('results.testDetails')}</th>
              <th>${t('status.status')}</th>
              <th>${t('results.runCount')}</th>
              <th>${t('results.duration')} (s)</th>
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
      .pdf-content { background: #0d0d0d; color: #fff; padding: 0; }
      .header h1 { font-size: 36px; font-weight: bold; margin: 0 0 8px 0; color: #fff; }
      .accent-bar { height: 6px; background: linear-gradient(90deg, #ff6b00 0%, #ff8800 50%, #ff6b00 100%); border-radius: 3px; margin-bottom: 40px; }
      .summary-card { background: #232326; border: 1px solid #404040; border-radius: 8px; padding: 24px; margin-bottom: 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      .summary-item { display: flex; justify-content: space-between; align-items: center; }
      .summary-item .label { color: #e0e0e0; font-size: 16px; }
      .summary-item .value { color: #e0e0e0; font-size: 16px; font-weight: 500; }
      .summary-item.passed .value { color: #28a745; }
      .summary-item.failed .value { color: #dc3545; }
      .summary-item.skipped .value { color: #ffc107; }
      .summary-total-time { margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid rgba(255, 255, 255, 0.1); }
      .table-container { background: #141416; border: 1px solid #333; border-radius: 8px; overflow: hidden; }
      .results-table { width: 100%; border-collapse: collapse; }
      .results-table th { background: #252526; color: #fff; padding: 16px; text-align: left; font-weight: bold; font-size: 14px; border-bottom: 1px solid #444; }
      .results-table td { padding: 12px 16px; border-bottom: 1px solid #333; font-size: 13px; }
      .results-table tr:nth-child(even) { background: #1c1c1e; }
      .test-name { color: #f0f0f0; font-weight: 500; }
      .status { display: flex; align-items: center; gap: 8px; font-weight: 600; }
      .status-icon { font-size: 14px; }
      .status-passed { color: #28a745; }
      .status-failed { color: #dc3545; }
      .status-skipped { color: #ffc107; }
      .status-pending { color: #ff6b00; }
      .run-count, .duration { color: #a0a0a0; }
    </style>
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
        alert(t('alerts.pdfGenerationError'));
    } finally {
        document.body.removeChild(container);
        showExportMenu.value = false;
    }
};

const exportAsJSON = () => {
    exportResults();
    showExportMenu.value = false;
    emit('export-json');
};

const hasTimingData = (test: unknown): boolean => {
    try {
        if (
            test === null ||
            test === undefined ||
            (typeof test !== 'string' && typeof test !== 'number')
        ) {
            return false;
        }
        const testStr = String(test) as TestName;
        const timingValue = formattedTimings.value[testStr];
        const result = typeof timingValue === 'string' && timingValue !== '';
        const timer = getTimer(testStr);
        if (timer?.running) {
            return true;
        }
        return result;
    } catch (error) {
        console.warn('Error checking timing data for test:', test, error);
        return false;
    }
};

const exportAsCSV = () => {
    emit('export-csv');

    const header = [
        t('results.testDetails'),
        t('status.status'),
        t('results.runCount'),
        `${t('results.duration')} (s)`,
    ];
    const rows: string[][] = [header];
    testNames.forEach(test => {
        let status = '';
        if (results[test] === true) status = t('status.passed');
        else if (results[test] === false) status = t('status.failed');
        else status = t('status.pending');
        const runCount = runCounts[test] || 0;
        const duration =
            typeof timings[test].duration === 'number' ? timings[test].duration!.toFixed(2) : '';
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

// getTestName function with robust fallback
const getTestName = (test: unknown): string => {
    const map = i18nTestNameMap.value;
    if (!map || typeof map !== 'object') {
        console.warn('i18nTestNameMap is not properly defined, using fallback mapping');
        const fallbackMap: Record<TestName, string> = {
            webcam: t('tests.webcam.name'),
            microphone: t('tests.microphone.name'),
            speakers: t('tests.speakers.name'),
            keyboard: t('tests.keyboard.name'),
            mouse: t('tests.mouse.name'),
            touch: t('tests.touch.name'),
            battery: t('tests.battery.name'),
        };
        const testKey = test as TestName | null;
        if (testKey === null) {
            return getSafeFallback(test);
        }
        return fallbackMap[testKey] || getSafeFallback(test);
    }

    if (
        test === null ||
        test === undefined ||
        (typeof test !== 'string' && typeof test !== 'number')
    ) {
        console.warn(`Invalid test parameter: ${typeof test}`, test);
        return getSafeFallback(test);
    }

    const testStr = String(test) as TestName;
    const name = map[testStr];
    if (typeof name === 'string' && name.trim().length > 0) {
        return name;
    }

    return getSafeFallback(test);
};

const getSafeFallback = (test: unknown): string => {
    let testStr = 'unknown';
    try {
        if (test === null || test === undefined) {
            testStr = 'unknown';
        } else if (typeof test === 'string') {
            testStr = test;
        } else if (typeof test === 'number') {
            testStr = test.toString();
        } else if (typeof test === 'object') {
            if ((test as any).__v_skip) {
                testStr = 'reactive-object';
            } else {
                testStr = JSON.stringify(test).slice(0, 50);
            }
        } else {
            testStr = String(test);
        }
    } catch (error) {
        console.warn('Error converting test to string:', error);
        testStr = 'conversion-error';
    }

    if (['unknown', 'null', 'undefined', 'reactive-object', 'conversion-error'].includes(testStr)) {
        return t('errors.unknownTest');
    }

    const translationMap: Record<TestName, string> = {
        webcam: t('tests.webcam.name'),
        microphone: t('tests.microphone.name'),
        speakers: t('tests.speakers.name'),
        keyboard: t('tests.keyboard.name'),
        mouse: t('tests.mouse.name'),
        touch: t('tests.touch.name'),
        battery: t('tests.battery.name'),
    };

    return (
        translationMap[testStr as TestName] || testStr.charAt(0).toUpperCase() + testStr.slice(1)
    );
};

const resetTests = () => {
    testNames.forEach(test => {
        stopTimer(test);
    });

    testNames.forEach(test => {
        results[test] = null;
        timings[test] = { start: null, end: null, duration: null };
        timers[test].running = false;
        timers[test].startTime = null;
        timers[test].elapsed = 0;
        runCounts[test] = 0;
    });

    skippedTests.value = [];

    resetAllTestStates();

    setActiveTest('webcam');

    emit('reset-tests');
    emitProgressUpdate();
};

// Electron detection
const isElectron = (): boolean => {
    const win = window as any;
    return !!(
        win.electronAPI ||
        win.electron ||
        navigator.userAgent.toLowerCase().includes('electron') ||
        (typeof process !== 'undefined' && (process as any)?.type === 'renderer') ||
        (win.process as any)?.type === 'renderer'
    );
};

// Lifecycle hooks
onMounted(() => {
    if (isElectron()) {
        document.body.classList.add('electron-app');
        if ((window as any).electronAPI?.platform) {
            document.body.classList.add(`platform-${(window as any).electronAPI.platform}`);
        }
    }

    console.log('TestsPage mounted - isElectron:', isElectron(), 'activeTest:', activeTest.value);

    nextTick(() => {
        console.log('Initializing first test:', activeTest.value);
        if (activeTest.value !== 'testsCompleted' && timings[activeTest.value]) {
            timings[activeTest.value].start = null;
            timings[activeTest.value].end = null;
        }
        setActiveTest(activeTest.value);
    });

    const cssCompat = useCSSCompatibility();
    cssCompat.initialize();

    setupGlobalEventListeners();
    emitProgressUpdate();
});

onUnmounted(() => {
    if (debouncedSetActiveTest && typeof (debouncedSetActiveTest as any).cancel === 'function') {
        (debouncedSetActiveTest as any).cancel();
    }

    if (timerInterval.value) {
        clearInterval(timerInterval.value);
        timerInterval.value = null;
    }

    cleanupGlobalEventListeners();
});
</script>

<template>
    <div class="app-layout">
        <!-- Left Sidebar -->
        <aside class="sidebar">
            <div class="sidebar-header">
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
                                <span v-if="getTimer(test)?.running" class="live-indicator">●</span>
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
                                <span v-if="getTimer(test)?.running" class="live-indicator">●</span>
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
                                <span v-if="getTimer(test)?.running" class="live-indicator">●</span>
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
                                <span v-if="getTimer(test)?.running" class="live-indicator">●</span>
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
    padding-bottom: 0.5rem;
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
