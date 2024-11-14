import { createRouter, createWebHistory } from '@ionic/vue-router';

const routes = [
  {
    path: '/',
    redirect: '/folder/Index',
  },
  {
    path: '/folder/Index',
    component: () => import('../views/PunchesIndex.vue'),
  },
  {
    path: '/folder/Import',
    component: () => import('../views/PunchesImport.vue'),
  },
  {
    path: '/folder/List',
    component: () => import('../views/PunchesList.vue'),
  },
  {
    path: '/folder/Report',
    component: () => import('../views/PunchesReport.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
