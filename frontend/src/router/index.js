import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router';
import TestsPage from '../views/TestsPage.vue';
import AboutPage from '../views/AboutPage.vue';

const routes = [
    {
        path: '/',
        name: 'Home',
        component: TestsPage,
    },
    {
        path: '/about',
        name: 'About',
        component: AboutPage,
    },
    // Catch-all route - redirect anything else to TestsPage
    {
        path: '/:pathMatch(.*)*',
        redirect: '/',
    },
];

// Use hash history for Electron (file://) and web history for browser
const isElectron =
    typeof window !== 'undefined' &&
    (window.electronAPI ||
        window.electron ||
        navigator.userAgent.toLowerCase().indexOf('electron') > -1 ||
        (typeof process !== 'undefined' && process?.type === 'renderer') ||
        (typeof window !== 'undefined' && window.process?.type === 'renderer'));

const router = createRouter({
    history: isElectron ? createWebHashHistory() : createWebHistory(),
    routes,
});

// Add debugging
router.beforeEach((to, from, next) => {
    console.log('Router beforeEach:', from.path, '->', to.path);
    next();
});

export default router;
