import { createRouter, createWebHistory, type RouteRecordRaw, type Router } from 'vue-router';
import TestsPage from '../views/TestsPage.vue';

// Define route type for better type safety
export type AppRoute = RouteRecordRaw & {
  meta?: {
    requiresAuth?: boolean;
    title?: string;
  };
}

const routes: AppRoute[] = [
  {
    path: '/',
    name: 'Home',
    component: TestsPage,
    meta: {
      title: 'Device Tests'
    }
  },
  // Catch-all route - redirect anything else to TestsPage
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
    meta: {
      title: 'Not Found'
    }
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
router.onError((error) => {
  console.error('Router navigation error:', error);
});

export default router;