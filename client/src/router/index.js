import { createRouter, createWebHistory } from 'vue-router';

import { useDbStore } from '../stores/dbStore';
import { pinia } from '../stores/pinia';

const routes = [
  {
    path: '/',
    redirect: '/anmelden',
  },
  {
    path: '/anmelden',
    alias: '/login',
    name: 'anmelden',
    component: () => import('../views/LoginView.vue'),
  },
  {
    path: '/registrieren',
    alias: '/register',
    name: 'registrieren',
    component: () => import('../views/RegisterView.vue'),
  },
  {
    path: '/passwort-vergessen',
    alias: '/forgot-password',
    name: 'passwort-vergessen',
    component: () => import('../views/ForgotPasswordView.vue'),
  },
  {
    path: '/auth/callback',
    name: 'auth-callback',
    component: () => import('../views/AuthCallbackView.vue'),
  },
  {
    path: '/veranstaltungen',
    alias: '/events',
    name: 'veranstaltungen',
    component: () => import('../views/EventListView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/veranstaltungen/:eventId/workshops',
    alias: '/events/:eventId',
    name: 'event-workshops',
    component: () => import('../views/WorkshopListView.vue'),
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: '/workshops',
    name: 'workshops',
    component: () => import('../views/WorkshopListAllView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/workshops/:workshopId',
    alias: '/events/:eventId/workshops/:workshopId',
    name: 'workshop-detail',
    component: () => import('../views/WorkshopDetailView.vue'),
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: '/meine-workshops',
    alias: '/my-workshops',
    name: 'meine-workshops',
    component: () => import('../views/MyWorkshopsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/meine-events',
    name: 'meine-events',
    component: () => import('../views/MyEventsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profil/:id?',
    name: 'profil',
    component: () => import('../views/UserProfileView.vue'),
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: '/freunde',
    name: 'freunde',
    component: () => import('../views/FriendsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/orte',
    redirect: '/workshops',
  },
  {
    path: '/vortragende',
    name: 'vortragende',
    component: () => import('../views/SpeakersView.vue'),
    meta: { requiresAuth: true, allowedRoles: ['ORGANISATOR', 'ADMINISTRATOR'] },
  },
  {
    path: '/administration/benutzer',
    name: 'admin-benutzer',
    component: () => import('../views/AdminUserManagementView.vue'),
    meta: { requiresAuth: true, allowedRoles: ['ADMINISTRATOR'] },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'nicht-gefunden',
    component: () => import('../views/NotFoundView.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to) => {
  const dbStore = useDbStore(pinia);
  if (!dbStore.initialized) {
    await dbStore.initStore();
  }

  if (to.meta.requiresAuth && !dbStore.istAngemeldet) {
    return { name: 'anmelden', query: { redirect: to.fullPath } };
  }

  if (to.meta.allowedRoles?.length) {
    const allowed = to.meta.allowedRoles;
    if (!allowed.includes(dbStore.rolle)) {
      return { path: dbStore.routeNachRolle() };
    }
  }

  if (dbStore.istAngemeldet && (to.name === 'anmelden' || to.name === 'registrieren')) {
    return { path: dbStore.routeNachRolle() };
  }

  return true;
});

export default router;
