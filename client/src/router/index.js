import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue')
    },
    {
      path: '/events',
      name: 'events',
      component: () => import('../views/EventListView.vue')
    },
    {
      path: '/events/:eventId',
      name: 'event-workshops',
      component: () => import('../views/WorkshopListView.vue'),
      props: true
    },
    {
      path: '/events/:eventId/workshops/:workshopId',
      name: 'workshop-detail',
      component: () => import('../views/WorkshopDetailView.vue'),
      props: true
    },
    {
      path: '/:pathMatch(.*)',
      name: 'notfound',
      component: () => import('../views/NotFoundView.vue')
    }
  ]
})

export default router
