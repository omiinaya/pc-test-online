<script>
import AppHeader from './components/AppHeader.vue';
import AppFooter from './components/AppFooter.vue';
import TestsPage from './views/TestsPage.vue';

export default {
    name: 'AppLayout',
    components: {
        AppHeader,
        AppFooter,
        TestsPage,
    },
    data() {
        return {
            showFallback: false,
            footerState: {
                showExportMenu: false,
                completedTests: 0,
                totalTests: 7,
            },
        };
    },
    mounted() {
        // Set up global event handlers for AppFooter actions
        this.setupGlobalEventHandlers();

        // Debug router state
        console.log('AppLayout mounted - route:', this.$route);
        console.log('Router matched:', this.$route.matched);
    },
    methods: {
        handleFooterUpdate(payload) {
            // Update footer state based on emitted events from child components
            if (payload && typeof payload === 'object') {
                if ('showExportMenu' in payload) {
                    this.footerState.showExportMenu = payload.showExportMenu;
                }
                if ('completedTests' in payload) {
                    this.footerState.completedTests = payload.completedTests;
                }
                if ('totalTests' in payload) {
                    this.footerState.totalTests = payload.totalTests;
                }
            }
        },
        handleResetTests() {
            // Dispatch a global event that TestsPage can listen to
            window.dispatchEvent(new CustomEvent('app-footer-reset-tests'));
        },
        handleToggleExportMenu() {
            this.footerState.showExportMenu = !this.footerState.showExportMenu;
        },
        handleExportPdf() {
            // Dispatch a global event that TestsPage can listen to
            window.dispatchEvent(new CustomEvent('app-footer-export-pdf'));
        },
        handleExportJson() {
            // Dispatch a global event that TestsPage can listen to
            window.dispatchEvent(new CustomEvent('app-footer-export-json'));
        },
        handleExportCsv() {
            // Dispatch a global event that TestsPage can listen to
            window.dispatchEvent(new CustomEvent('app-footer-export-csv'));
        },
        setupGlobalEventHandlers() {
            // Set up event listeners for global events from TestsPage
            window.addEventListener('tests-page-update-footer', event => {
                this.handleFooterUpdate(event.detail);
            });
        },
    },
};
</script>

<template>
    <div class="app-layout-container">
        <AppHeader />
        <router-view v-slot="{ Component }">
            <component :is="Component" @update-footer="handleFooterUpdate" />
        </router-view>
        <!-- Fallback: If router-view is empty, show TestsPage directly -->
        <TestsPage v-if="showFallback" @update-footer="handleFooterUpdate" />
        <AppFooter
            :show-export-menu="footerState.showExportMenu"
            :completed-tests="footerState.completedTests"
            :total-tests="footerState.totalTests"
            @reset-tests="handleResetTests"
            @toggle-export-menu="handleToggleExportMenu"
            @export-pdf="handleExportPdf"
            @export-json="handleExportJson"
            @export-csv="handleExportCsv"
        />
    </div>
</template>

<style>
/* Global styles for the app layout */
#app {
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    padding-top: var(--header-height); /* Space for the fixed header */
    padding-bottom: 1rem; /* Space for the fixed footer */
}

/* Ensure main content doesn't get hidden behind the header/footer */
.router-view {
    flex: 1;
    min-height: 0; /* Allow flex item to shrink properly */
}

/* Style the root div to take full height */
.app-layout-container {
    height: 100%;
    display: flex;
    flex-direction: column;
}
</style>
