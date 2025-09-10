import { createApp } from 'vue';
import router from './router';
import AppLayout from './AppLayout.vue';
import i18n, { initLocale } from './i18n';

// Import shared styles
import './styles/variables.css';
import './styles/utilities.css';
import './styles/components/Button.css';

// Initialize locale
initLocale();

const app = createApp(AppLayout);
app.use(router);
app.use(i18n);

// Mount the app and expose methods for Electron integration
const vueApp = app.mount('#app');

// Simple navigation to ensure we're on the home route
// This is handled more gracefully by the router's catch-all route

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

}
