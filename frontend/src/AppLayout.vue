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
            },
        };
    },
    mounted() {
        // Check if we need to show fallback after a short delay
        setTimeout(() => {
            const routerView = document.querySelector('.router-view');
            const hasContent = routerView && routerView.children.length > 0;

            // If router-view is empty and we're not on a route, show fallback
            if (!hasContent && (!this.$route.matched || this.$route.matched.length === 0)) {
                console.log('Router not working, showing TestsPage fallback');
                this.showFallback = true;
            }
        }, 100);
        
        // Set up global event handlers for AppFooter actions
        this.setupGlobalEventHandlers();
    },
    methods: {
        handleFooterUpdate(payload) {
            // Update footer state based on emitted events from child components
            if (payload && typeof payload === 'object') {
                if ('showExportMenu' in payload) {
                    this.footerState.showExportMenu = payload.showExportMenu;
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
            window.addEventListener('tests-page-update-footer', (event) => {
                this.handleFooterUpdate(event.detail);
            });
        },
    },
};
</script>

<template>
    <div>
        <AppHeader />
        <router-view v-slot="{ Component }">
            <component :is="Component" @update-footer="handleFooterUpdate" />
        </router-view>
        <!-- Fallback: If router-view is empty, show TestsPage directly -->
        <TestsPage v-if="showFallback" @update-footer="handleFooterUpdate" ref="testsPageComponent" />
        <AppFooter
            :show-export-menu="footerState.showExportMenu"
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
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
    padding-top: var(--header-height); /* Space for the fixed header */
    padding-bottom: 1rem; /* Space for the fixed footer */
}

/* Ensure main content doesn't get hidden behind the header/footer */
.router-view {
    flex: 1;
}

/* Override any existing body padding */
body {
    padding-top: 0 !important;
    padding-bottom: 0 !important;
}
</style>
