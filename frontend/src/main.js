import { createApp } from 'vue';
import router from './router';
import AppLayout from './AppLayout.vue';

// Import shared styles
import './styles/variables.css';
import './styles/utilities.css';
import './styles/buttons.css';

const app = createApp(AppLayout);
app.use(router);

// Mount the app and expose methods for Electron integration
const vueApp = app.mount('#app');

// Detect if running in Electron
const isElectron =
    window.electronAPI ||
    window.electron ||
    navigator.userAgent.toLowerCase().indexOf('electron') > -1 ||
    (typeof process !== 'undefined' && process?.type === 'renderer') ||
    window.process?.type === 'renderer';

// Force navigation to home route for Electron and add debugging
console.log('App loaded - isElectron:', isElectron);
console.log('Current route:', router.currentRoute.value.path);
console.log('Router history mode:', router.options.history);

// Always ensure we're on the Tests page
router
    .push('/')
    .then(() => {
        console.log('Successfully navigated to home route');
    })
    .catch(err => {
        console.log('Navigation error:', err);
    });

// Add router debugging
router.afterEach((to, from) => {
    console.log('Router navigation:', from.path, '->', to.path);
});

// Expose app methods to window for Electron menu integration
if (typeof window !== 'undefined') {
    window.app = {
        // Expose methods that Electron menus can call
        setActiveTest: testType => {
            if (vueApp && vueApp.$children && vueApp.$children[0]) {
                const appComponent = vueApp.$children[0];
                if (appComponent.setActiveTest) {
                    appComponent.setActiveTest(testType);
                }
            }
        },
        resetTests: () => {
            if (vueApp && vueApp.$children && vueApp.$children[0]) {
                const appComponent = vueApp.$children[0];
                if (appComponent.resetTests) {
                    appComponent.resetTests();
                }
            }
        },
        exportResults: () => {
            if (vueApp && vueApp.$children && vueApp.$children[0]) {
                const appComponent = vueApp.$children[0];
                if (appComponent.exportResults) {
                    appComponent.exportResults();
                }
            }
        },
    };

    // Detect if running in Electron
    const isElectron = () => {
        return (
            typeof window !== 'undefined' &&
            typeof window.process === 'object' &&
            window.process.type === 'renderer'
        );
    };

    // Add Electron-specific styling if needed
    if (isElectron()) {
        document.body.classList.add('electron-app');

        // Add platform-specific classes
        const platform = navigator.platform.toLowerCase();
        if (platform.includes('mac')) {
            document.body.classList.add('platform-darwin');
        } else if (platform.includes('win')) {
            document.body.classList.add('platform-win32');
        } else if (platform.includes('linux')) {
            document.body.classList.add('platform-linux');
        }

        // Disable text selection for better native app feel
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';

        // Add keyboard shortcuts for Electron
        document.addEventListener('keydown', e => {
            // Ctrl/Cmd + R: Reset tests
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                if (window.app && window.app.resetTests) {
                    window.app.resetTests();
                }
            }

            // Ctrl/Cmd + E: Export results
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                if (window.app && window.app.exportResults) {
                    window.app.exportResults();
                }
            }

            // Ctrl/Cmd + 1-7: Switch between tests
            if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '7') {
                e.preventDefault();
                const testMap = {
                    1: 'webcam',
                    2: 'microphone',
                    3: 'speakers',
                    4: 'keyboard',
                    5: 'mouse',
                    6: 'touch',
                    7: 'battery',
                };
                if (window.app && window.app.setActiveTest) {
                    window.app.setActiveTest(testMap[e.key]);
                }
            }
        });
    }
}
