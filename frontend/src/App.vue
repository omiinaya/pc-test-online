<script>
import { useI18n } from 'vue-i18n';
import WebcamTest from './components/WebcamTest.vue';
import MicrophoneTest from './components/MicrophoneTest.vue';
import SpeakerTest from './components/SpeakerTest.vue';
import KeyboardTest from './components/KeyboardTest.vue';
import MouseTest from './components/MouseTest.vue';
import TouchTest from './components/TouchTest.vue';
import BatteryTest from './components/BatteryTest.vue';
import TestsCompleted from './components/TestsCompleted.vue';
import VisualizerContainer from './components/VisualizerContainer.vue';
import TestActionButtons from './components/TestActionButtons.vue';
import TestHeader from './components/TestHeader.vue';
import AppFooter from './components/AppFooter.vue';
import { resetAllTestStates } from './composables/useTestState.js';
import { useCSSCompatibility } from './composables/useCSSCompatibility';
// Dynamic imports for PDF libraries to reduce initial bundle size

export default {
    name: 'App',
    setup() {
        const { t } = useI18n();
        return { t };
    },
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
        TestHeader,
        AppFooter,
    },
    data() {
        return {
            isMobile: false,
            showSummaryModal: false,
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
                webcam: 'Camera',
                microphone: 'Mic',
                speakers: 'Speaker',
                keyboard: 'Keyboard',
                mouse: 'Mouse',
                touch: 'Touch',
                battery: 'Battery',
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
            showExportMenu: false,
            switchDebounceTimer: null,
            isSwitching: false,
        };
    },
    computed: {
        availableTests() {
            const tests = Object.keys(this.results);
            if (this.isMobile) {
                return tests.filter(test => test !== 'keyboard');
            }
            return tests;
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
            return (
                descriptionMap[this.activeTest] ||
                this.t('tests.webcam.description')
            );
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
            return this.availableTests.every(
                test => this.results[test] !== null || this.skippedTests.includes(test)
            );
        },
        completedTestsCount() {
            // Count as completed if passed, failed, or skipped
            return this.availableTests.filter(
                test => this.results[test] !== null || this.skippedTests.includes(test)
            ).length;
        },
        totalTestsCount() {
            return this.availableTests.length;
        },
        passedTests() {
            return this.availableTests.filter(
                test => this.results[test] === true && !this.skippedTests.includes(test)
            );
        },
        failedTests() {
            return this.availableTests.filter(
                test => this.results[test] === false && !this.skippedTests.includes(test)
            );
        },
        pendingTests() {
            return this.availableTests.filter(
                test => this.results[test] === null && !this.skippedTests.includes(test)
            );
        },
        skippedTestsList() {
            return this.skippedTests.filter(test => this.availableTests.includes(test));
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
        // Container styles for smooth morphing based on active test
        currentContainerStyles() {
            const styleMap = {
                webcam: { minHeight: '420px' },
                microphone: { minHeight: '280px' },
                speakers: { minHeight: '350px', maxWidth: '600px' },
                keyboard: { minHeight: '350px', maxWidth: '800px' },
                mouse: { minHeight: '350px' },
                touch: { minHeight: '400px', maxWidth: '800px' },
                battery: { minHeight: '250px' },
                testsCompleted: { minHeight: '250px' },
            };
            return styleMap[this.activeTest] || { minHeight: '250px' };
        },
    },
    methods: {
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
            if (this.switchDebounceTimer) {
                clearTimeout(this.switchDebounceTimer);
            }

            // Mark as switching
            this.isSwitching = true;
            console.log(`Switching from ${this.activeTest} to ${testType}`);

            // Perform the switch immediately for good UX
            this.setActiveTest(testType);

            // Reset switching flag after a short delay to prevent rapid switches
            this.switchDebounceTimer = setTimeout(() => {
                this.isSwitching = false;
                this.switchDebounceTimer = null;
                console.log(`Switch cooldown ended, ready for next switch`);
            }, 200); // 200ms cooldown between switches
        },

        setActiveTest(testType) {
            // Only start timing if we're switching to a new test or the test hasn't started timing yet
            if (this.activeTest !== testType || this.timings[testType].start === null) {
                this.timings[testType].start = Date.now();
                this.timings[testType].end = null;
            }
            this.activeTest = testType;
        },
        onTestCompleted(testType) {
            if (!this.timings[testType]) {
                return;
            }
            // Remove from skippedTests if present (robust reactivity)
            this.skippedTests = this.skippedTests.filter(t => t !== testType);
            this.results[testType] = true;
            // Stop timing and store only the last session duration
            this.timings[testType].end = Date.now();

            // Validate timing data before calculation
            if (this.timings[testType].start && this.timings[testType].end) {
                const sessionDuration =
                    (this.timings[testType].end - this.timings[testType].start) / 1000;
                // Ensure duration is reasonable (between 0 and 10 minutes)
                if (sessionDuration >= 0 && sessionDuration <= 600) {
                    this.timings[testType].duration = sessionDuration;
                } else {
                    this.timings[testType].duration = 0;
                }
            } else {
                this.timings[testType].duration = 0;
            }

            this.runCounts[testType] += 1;
            this.autoAdvance(testType);
        },
        onTestFailed(testType) {
            if (!this.timings[testType]) {
                return;
            }
            // Remove from skippedTests if present (robust reactivity)
            this.skippedTests = this.skippedTests.filter(t => t !== testType);
            this.results[testType] = false;
            // Stop timing and store only the last session duration
            this.timings[testType].end = Date.now();

            // Validate timing data before calculation
            if (this.timings[testType].start && this.timings[testType].end) {
                const sessionDuration =
                    (this.timings[testType].end - this.timings[testType].start) / 1000;
                // Ensure duration is reasonable (between 0 and 10 minutes)
                if (sessionDuration >= 0 && sessionDuration <= 600) {
                    this.timings[testType].duration = sessionDuration;
                } else {
                    this.timings[testType].duration = 0;
                }
            } else {
                this.timings[testType].duration = 0;
            }

            this.runCounts[testType] += 1;
            this.autoAdvance(testType);
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
            } else {
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
            // Reset shared component states
            resetAllTestStates();
            // Set active test and start timing
            this.setActiveTest('webcam');
        },
        getTestStatusClass(testType) {
            if (this.skippedTests.includes(testType)) return 'skipped';
            if (this.results[testType] === true) return 'completed-success';
            if (this.results[testType] === false) return 'completed-fail';
            return 'pending';
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
            <td class="test-name">${this.testNameMap[test]}</td>
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
            <h1>MMITLab Test Results</h1>
            <div class="accent-bar"></div>
          </div>
          
          <div class="summary-card">
            <div class="summary-item">
              <span class="label">Completed:</span>
              <span class="value">${completedCount}/${Object.keys(this.results).length}</span>
            </div>
            <div class="summary-item passed">
              <span class="label">Passed:</span>
              <span class="value">${passedCount}</span>
            </div>
            ${
                failedCount > 0
                    ? `

              <div class="summary-item failed">
                <span class="label">Failed:</span>
                <span class="value">${failedCount}</span>
              </div>
            `
                    : ''
            }
            ${
                skippedCount > 0
                    ? `

              <div class="summary-item skipped">
                <span class="label">Skipped:</span>
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
                  <th>Test Name</th>
                  <th>Status</th>
                  <th>Run Count</th>
                  <th>Duration (s)</th>
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
                alert('Error generating PDF. Please try again.');
            } finally {
                // Clean up
                document.body.removeChild(container);
                this.showExportMenu = false;
            }
        },
        exportAsJSON() {
            this.exportResults();
            this.showExportMenu = false;
        },
        exportAsCSV() {
            // Prepare CSV header
            const header = ['Test Name', 'Status', 'Run Count', 'Duration (s)'];
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
                rows.push([this.testNameMap[test], status, runCount, duration]);
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
        // Utility function for debouncing
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },
        // Handle window resize to detect mobile/desktop mode
        handleResize() {
            // In Electron, prefer desktop mode unless window is very small
            // Check multiple ways to detect Electron
            const isElectron =
                window.electronAPI ||
                window.electron ||
                navigator.userAgent.toLowerCase().indexOf('electron') > -1 ||
                (typeof process !== 'undefined' && process?.type === 'renderer') ||
                window.process?.type === 'renderer';

            if (isElectron) {
                // Force desktop mode for Electron unless window is extremely small
                this.isMobile = window.innerWidth <= 500;
            } else {
                this.isMobile = window.innerWidth <= 768; // Standard mobile threshold for web
            }

            console.log(
                'handleResize - isElectron:',
                isElectron,
                'window.innerWidth:',
                window.innerWidth,
                'isMobile:',
                this.isMobile
            );
        },
    },
    mounted() {
        // Detect Electron environment first - do this synchronously
        const isElectron =
            window.electronAPI ||
            window.electron ||
            navigator.userAgent.toLowerCase().indexOf('electron') > -1 ||
            (typeof process !== 'undefined' && process?.type === 'renderer') ||
            window.process?.type === 'renderer';

        // Set initial mobile state - force desktop mode for Electron
        if (isElectron) {
            this.isMobile = false; // Always start in desktop mode for Electron
            document.body.classList.add('electron-app');
            if (window.electronAPI?.platform) {
                document.body.classList.add(`platform-${window.electronAPI.platform}`);
            }
        } else {
            this.handleResize();
        }

        window.addEventListener('resize', this.handleResize);
        this.debouncedSetActiveTest = this.debounce(this.setActiveTest, 300);
        const { supported, unsupported } = useCSSCompatibility();
        console.log('Supported CSS Properties:', supported);
        console.log('Unsupported CSS Properties:', unsupported);
        console.log('Environment Detection - isElectron:', isElectron, 'isMobile:', this.isMobile);

        // Initialize the first test properly - force initialization even if activeTest is already set
        this.$nextTick(() => {
            console.log('Initializing activeTest:', this.activeTest, 'isMobile:', this.isMobile);
            // Reset timing to ensure clean start
            if (this.timings[this.activeTest]) {
                this.timings[this.activeTest].start = null;
                this.timings[this.activeTest].end = null;
            }
            this.setActiveTest(this.activeTest);
        });

        // Expose methods to window for Electron integration
        if (typeof window !== 'undefined') {
            window.app = {
                setActiveTest: this.setActiveTest.bind(this),
                resetTests: this.resetTests.bind(this),
                exportResults: this.exportResults.bind(this),
                exportAsPDF: this.exportAsPDF.bind(this),
                exportAsJSON: this.exportAsJSON.bind(this),
                exportAsCSV: this.exportAsCSV.bind(this),
            };
        }
    },
    beforeUnmount() {
        window.removeEventListener('resize', this.handleResize);
        if (this.switchDebounceTimer) {
            clearTimeout(this.switchDebounceTimer);
        }

        // Clean up window references
        if (typeof window !== 'undefined' && window.app) {
            delete window.app;
        }
    },
};
</script>

<template>
    <div v-if="!isMobile" class="app-layout">
        <!-- Main Content Only - Sidebars removed to avoid duplication with TestsPage.vue -->
        <main class="main-content">
            <!-- Test Header Outside Container -->
            <TestHeader :test-title="currentTestTitle" :test-description="currentTestDescription">
                <template #icon>{{ currentTestIcon }}</template>
            </TestHeader>

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

        <!-- App Footer with Action Buttons -->
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
        <!-- Mobile Header -->
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

        <!-- Main Content -->
        <main class="mobile-main-content">
            <VisualizerContainer
                :custom-styles="currentContainerStyles"
                :keyboard-mode="activeTest === 'keyboard'"
                class="mobile-visualizer"
            >
                <component
                    :is="currentTestComponent"
                    @test-completed="onTestCompleted"
                    @test-failed="onTestFailed"
                    @test-skipped="onTestSkipped"
                    @start-over="resetTests"
                />
            </VisualizerContainer>
        </main>

        <!-- Mobile Footer with Test Actions and Navigation -->
        <footer class="mobile-footer">
            <div class="mobile-action-buttons" v-if="activeTest !== 'testsCompleted'">
                <button @click="onTestFailed(activeTest)" class="button button--danger button--medium">
                    {{ t('buttons.fail') }}
                </button>
                <button @click="onTestCompleted(activeTest)" class="button button--success button--medium">
                    {{ t('buttons.pass') }}
                </button>
                <button @click="onTestSkipped(activeTest)" class="button button--skip button--medium">
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
                    <span class="mobile-nav-label">{{ testNameMap[test] }}</span>
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
                    <span class="mobile-nav-label">Summary</span>
                </button>
            </nav>
        </footer>

        <!-- Summary Modal -->
        <transition name="modal-fade">
            <div
                v-if="showSummaryModal"
                class="summary-modal-overlay"
                @click="showSummaryModal = false"
            >
                <div class="summary-modal-content" @click.stop>
                    <div class="sidebar-header">
                        <div class="brand-icon">📋</div>
                        <h2>{{ t('sidebar.summary') }}</h2>
                        <button @click="showSummaryModal = false" class="close-modal-btn">
                            {{ t('ui.closeSymbol') }}
                        </button>
                    </div>
                    <div class="mobile-summary-body">
                        <div class="test-summary">
                            <div class="test-summary__overview">
                                <div class="test-summary__badge" :class="`test-summary__badge--${summaryClass}`">
                                    <span class="test-summary__completion-text"
                                        >Completed: {{ completedTestsCount }}/{{
                                            totalTestsCount
                                        }}</span
                                    >
                                </div>
                            </div>
                            
                            <div class="test-summary__results">
                                <div v-if="pendingTests.length > 0" class="test-summary__section">
                                    <div class="test-summary__section-header">
                                        <span class="test-summary__section-label test-summary__section-label--pending"
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
                                                testNameMap[test]
                                            }}</span>
                                        </li>
                                    </ul>
                                </div>
                                <div v-if="failedTests.length > 0" class="test-summary__section">
                                    <div v-if="pendingTests.length > 0" class="test-summary__divider"></div>
                                    <div class="test-summary__section-header">
                                        <span class="test-summary__section-label test-summary__section-label--failed"
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
                                                testNameMap[test]
                                            }}</span>
                                            <div class="test-summary__meta">
                                                <span
                                                    v-if="runCounts[test] > 0"
                                                    class="test-summary__count"
                                                    >{{ runCounts[test] }}x</span
                                                ><span
                                                    v-if="timings[test].duration !== null"
                                                    class="test-summary__time"
                                                    >{{
                                                        timings[test].duration
                                                            .toFixed(2)
                                                            .padStart(5, '0')
                                                    }}s</span
                                                >
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                                <div v-if="skippedTestsList.length > 0" class="test-summary__section">
                                    <div
                                        v-if="pendingTests.length > 0 || failedTests.length > 0"
                                        class="test-summary__divider"
                                    ></div>
                                    <div class="test-summary__section-header">
                                        <span class="test-summary__section-label test-summary__section-label--skipped"
                                            >{{ t('status.skipped') }}: {{ skippedTestsList.length }}</span
                                        >
                                    </div>
                                    <ul class="test-summary__list">
                                        <li
                                            v-for="test in skippedTestsList"
                                            :key="test"
                                            class="test-summary__item"
                                        >
                                            <span class="test-summary__name">{{
                                                testNameMap[test]
                                            }}</span>
                                            <div class="test-summary__meta">
                                                <span class="test-summary__count"
                                                    >{{ runCounts[test] }}x</span
                                                ><span
                                                    v-if="timings[test].duration !== null"
                                                    class="test-summary__time"
                                                    >{{
                                                        timings[test].duration
                                                            .toFixed(2)
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
                                        <span class="test-summary__section-label test-summary__section-label--passed"
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
                                                testNameMap[test]
                                            }}</span>
                                            <div class="test-summary__meta">
                                                <span
                                                    v-if="runCounts[test] > 0"
                                                    class="test-summary__count"
                                                    >{{ runCounts[test] }}x</span
                                                ><span
                                                    v-if="timings[test].duration !== null"
                                                    class="test-summary__time"
                                                    >{{
                                                        timings[test].duration
                                                            .toFixed(2)
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
                                    <span class="test-summary__total-label">Total Time:</span
                                    ><span class="test-summary__total-value"
                                        >{{ totalTimeSpent.toFixed(2) }}s</span
                                    >
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<style>
/* Global Layout */
.app-layout {
    display: flex;
    min-height: 100vh;
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
    padding-top: calc(2rem + var(--header-height)); /* Account for fixed header */
    overflow-y: auto;
    min-width: 0;
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
    grid-template-columns: 1fr auto auto; /* Label takes remaining space, counter and timer are auto-sized */
    gap: 0.5rem;
    align-items: center;
    padding: 0.1rem;
    min-height: 40px; /* Consistent row height */
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
    grid-column: 2 / 4; /* Spans both counter and timer columns */
    display: grid;
    grid-template-columns: 32px 48px; /* Fixed widths for perfect alignment */
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
    width: 48px; /* Fixed width for perfect column alignment */
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
    width: 32px; /* Fixed width for perfect column alignment */
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



/* Mobile Layout Styles */
.mobile-layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: #000;
    color: #fff;
    overflow: hidden;
}

/* Electron-specific styles */
.electron-app {
    -webkit-app-region: drag; /* Allow dragging the app by the header */
}

.electron-app button,
.electron-app .summary-button {
    -webkit-app-region: no-drag; /* Prevent buttons from being draggable */
}

/* Platform-specific styles */
body.platform-win32 .mobile-header {
    height: 48px; /* Windows title bar height */
}

body.platform-darwin .mobile-header {
    height: 44px; /* macOS title bar height */
    padding-left: 78px; /* Account for traffic lights */
}

body.platform-linux .mobile-header {
    height: 46px; /* Linux title bar height */
}

/* Electron window controls area */
.electron-titlebar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 30px;
    -webkit-app-region: drag;
    z-index: 9999;
    background: transparent;
}

.electron-titlebar.platform-darwin {
    height: 22px;
}

/* Improve scrollbars for desktop */
.app-layout ::-webkit-scrollbar {
    width: 8px;
}

.app-layout ::-webkit-scrollbar-track {
    background: #1a1a1a;
}

.app-layout ::-webkit-scrollbar-thumb {
    background: #404040;
    border-radius: 4px;
}

.app-layout ::-webkit-scrollbar-thumb:hover {
    background: #555;
}

/* Enhanced focus styles for desktop */
.app-layout button:focus,
.app-layout .test-nav li:focus {
    outline: 2px solid #ff6b00;
    outline-offset: 2px;
}

/* Electron-specific animations */
@media (prefers-reduced-motion: no-preference) {
    .electron-app * {
        transition-duration: 0.15s; /* Faster transitions for desktop feel */
    }
}

.mobile-header {
    flex-shrink: 0;
    padding: 0.75rem 1rem;
    background-color: #1a1a1a;
    border-bottom: 1px solid #333;
    z-index: 100;
}
</style>
