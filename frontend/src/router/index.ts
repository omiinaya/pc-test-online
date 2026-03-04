import { createRouter, createWebHistory, type RouteRecordRaw, type Router } from 'vue-router';
import TestsPage from '../views/TestsPage.vue';
import NotFoundPage from '../views/NotFoundPage.vue';

// Define route type for better type safety
export type AppRoute = RouteRecordRaw & {
    meta?: {
        requiresAuth?: boolean;
        title?: string;
        noindex?: boolean;
    };
};

const routes: AppRoute[] = [
    {
        path: '/',
        name: 'Home',
        component: TestsPage,
        meta: {
            title: 'Device Tests',
        },
    },
    // Catch-all route - show 404 page instead of redirect (better for SEO)
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: NotFoundPage,
        meta: {
            title: 'Page Not Found',
            noindex: true, // Prevent indexing 404 pages
        },
    },
];

const router: Router = createRouter({
    history: createWebHistory(),
    routes: routes as RouteRecordRaw[],
});

// Add type-safe navigation guards
router.beforeEach((to, from, next) => {
    console.log('Router beforeEach:', from.path, '->', to.path);

    // Set document title based on route meta
    if (to.meta?.title) {
        document.title = `${to.meta.title} - MMIT Testing Suite`;
    }

    next();
});

// Error handling for navigation failures
router.onError(error => {
    console.error('Router navigation error:', error);
});

export default router;
