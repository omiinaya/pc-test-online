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
    },
};
</script>

<template>
    <div id="app">
        <AppHeader />
        <router-view />
        <!-- Fallback: If router-view is empty, show TestsPage directly -->
        <TestsPage v-if="showFallback" />
        <AppFooter />
    </div>
</template>

<style>
/* Global styles for the app layout */
#app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
    padding-top: 1rem; /* Space for the fixed header */
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
