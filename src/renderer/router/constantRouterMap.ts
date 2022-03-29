import { RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
    { path: '/', component: () => import('@renderer/views/home/index.vue') },
    { path: '/home', component: () => import('@renderer/views/home/index.vue') },
    { path: '/login', component: () => import('@renderer/views/login/index.vue') },
    { path: '/:pathMatch(.*)*', component: () => import("@renderer/views/404.vue") },
    // { path: '/', name: '总览', component: () => import('@renderer/components/LandingPage.vue') },
]

export default routes