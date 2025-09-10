import { createApp } from 'vue';
import router from './router';
import AppLayout from './AppLayout.vue';
import i18n, { initLocale } from './i18n';

// Debug identifier for tracking execution flow
const DEBUG_ID = `main-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;

console.log(`[${DEBUG_ID}] Frontend bundle loading started at ${new Date().toISOString()}`);
console.log(`[${DEBUG_ID}] Environment check - typeof window: ${typeof window}, typeof document: ${typeof document}`);

// Import shared styles
import './styles/variables.css';
import './styles/utilities.css';
import './styles/components/Button.css';

console.log(`[${DEBUG_ID}] All imports completed successfully at ${new Date().toISOString()}`);

// Initialize locale
console.log(`[${DEBUG_ID}] Initializing locale at ${new Date().toISOString()}`);
initLocale();

console.log(`[${DEBUG_ID}] Creating Vue app at ${new Date().toISOString()}`);
const app = createApp(AppLayout);
console.log(`[${DEBUG_ID}] Vue app created successfully`);

console.log(`[${DEBUG_ID}] Installing router plugin`);
app.use(router);
console.log(`[${DEBUG_ID}] Router installed successfully`);

console.log(`[${DEBUG_ID}] Installing i18n plugin`);
app.use(i18n);
console.log(`[${DEBUG_ID}] i18n installed successfully`);

// Mount the app and expose methods for Electron integration
console.log(`[${DEBUG_ID}] Attempting to mount app to #app element at ${new Date().toISOString()}`);
console.log(`[${DEBUG_ID}] Checking if #app element exists:`, document.getElementById('app') ? 'Found' : 'Not found');

let vueApp;
try {
    vueApp = app.mount('#app');
    console.log(`[${DEBUG_ID}] App mounted successfully at ${new Date().toISOString()}`);
    console.log(`[${DEBUG_ID}] Mounted app instance:`, vueApp ? 'Available' : 'Undefined');
} catch (mountError) {
    console.error(`[${DEBUG_ID}] CRITICAL: App mount failed at ${new Date().toISOString()}`, mountError);
    console.error(`[${DEBUG_ID}] Mount error details:`, {
        message: mountError.message,
        stack: mountError.stack,
        name: mountError.name
    });
    
    // Try to provide more context about the mounting failure
    const appElement = document.getElementById('app');
    console.error(`[${DEBUG_ID}] App element state:`, {
        exists: !!appElement,
        innerHTML: appElement ? appElement.innerHTML : 'null',
        outerHTML: appElement ? appElement.outerHTML : 'null'
    });
    
    throw mountError; // Re-throw to maintain original error behavior
}

// Simple navigation to ensure we're on the home route
// This is handled more gracefully by the router's catch-all route

// Check environment variables for debugging
console.log(`[${DEBUG_ID}] Environment variables check:`);
console.log(`[${DEBUG_ID}] - import.meta.env.MODE: ${import.meta.env?.MODE || 'undefined'}`);
console.log(`[${DEBUG_ID}] - import.meta.env.PROD: ${import.meta.env?.PROD || 'undefined'}`);
console.log(`[${DEBUG_ID}] - import.meta.env.DEV: ${import.meta.env?.DEV || 'undefined'}`);
console.log(`[${DEBUG_ID}] - import.meta.env.BASE_URL: ${import.meta.env?.BASE_URL || 'undefined'}`);
console.log(`[${DEBUG_ID}] - import.meta.env.VITE_APP_TITLE: ${import.meta.env?.VITE_APP_TITLE || 'undefined'}`);

// Log successful initialization completion
console.log(`[${DEBUG_ID}] Frontend initialization completed successfully at ${new Date().toISOString()}`);

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
