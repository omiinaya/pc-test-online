import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router';
import TestsPage from '../views/TestsPage.vue';

const routes = [
    {
        path: '/',
        name: 'Home',
        component: TestsPage,
    },
    // Catch-all route - redirect anything else to TestsPage
    {
        path: '/:pathMatch(.*)*',
        redirect: '/',
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

// Add debugging
router.beforeEach((to, from, next) => {
    console.log('Router beforeEach:', from.path, '->', to.path);
    next();
});

export default router;
