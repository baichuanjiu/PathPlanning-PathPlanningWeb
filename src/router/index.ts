import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/getStarted',
    },
    {
      path: '/getStarted',
      name: 'getStarted',
      component: () => import('@/views/GetStarted.vue')
    },
    {
      path: "/aboutUs",
      name: "aboutUs",
      component: () => import("@/views/AboutUs.vue"),
    },
  ]
})

export default router
