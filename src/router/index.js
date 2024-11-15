import { createRouter, createWebHistory } from '@ionic/vue-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import AuthPage from '../views/AuthPage.vue';

const routes = [
  {
    path: '/',
    redirect: '/folder/Index',
  },
  {
    path: '/folder/Index',
    component: () => import('../views/PunchesIndex.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/folder/Import',
    component: () => import('../views/PunchesImport.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/folder/List',
    component: () => import('../views/PunchesList.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/folder/Report',
    component: () => import('../views/PunchesReport.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/folder/Auth',
    component: AuthPage,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to, from, next) => {
  const auth = getAuth();
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

  if (requiresAuth) {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        next();
      } else {
        next('/folder/Auth');
      }
    });
  } else {
    next();
  }
});

export default router;
