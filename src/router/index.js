import { createRouter, createWebHistory } from 'vue-router'
import { isLoggedIn } from '@/utils/auth.js'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: () => import('@/views/login/LoginPage.vue') },
  { path: '/forgot-password', component: () => import('@/views/login/ForgotPassword.vue') },
  { path: '/home', component: () => import('@/views/home/HomePage.vue'), meta: { requiresAuth: true } },
  { path: '/message', component: () => import('@/views/message/MessagePage.vue'), meta: { requiresAuth: true } },
  { path: '/profile', component: () => import('@/views/profile/ProfilePage.vue'), meta: { requiresAuth: true } },
  { path: '/map', component: () => import('@/views/map/MapOverview.vue'), meta: { requiresAuth: true } },
  { path: '/map/zone/:code', component: () => import('@/views/map/ZoneDetail.vue'), meta: { requiresAuth: true } },
  { path: '/map/slot/:code', component: () => import('@/views/map/SlotMap.vue'), meta: { requiresAuth: true } },
  { path: '/items', component: () => import('@/views/items/ItemList.vue'), meta: { requiresAuth: true } },
  { path: '/items/:id', component: () => import('@/views/items/ItemDetail.vue'), meta: { requiresAuth: true } },
  { path: '/items/add', component: () => import('@/views/items/ItemForm.vue'), meta: { requiresAuth: true } },
  { path: '/items/edit/:id', component: () => import('@/views/items/ItemForm.vue'), meta: { requiresAuth: true } },
  { path: '/items/import', component: () => import('@/views/items/ItemImport.vue'), meta: { requiresAuth: true } },
  { path: '/items/categories', component: () => import('@/views/items/CategoryManage.vue'), meta: { requiresAuth: true } },
  { path: '/stock/in', component: () => import('@/views/stock/StockIn.vue'), meta: { requiresAuth: true } },
  { path: '/stock/out', component: () => import('@/views/stock/StockOut.vue'), meta: { requiresAuth: true } },
  { path: '/stock/records', component: () => import('@/views/stock/StockRecords.vue'), meta: { requiresAuth: true } },
  { path: '/stock/check/create', component: () => import('@/views/stock/CheckCreate.vue'), meta: { requiresAuth: true } },
  { path: '/stock/check/exec/:id', component: () => import('@/views/stock/CheckExec.vue'), meta: { requiresAuth: true } },
  { path: '/stock/check/report/:id', component: () => import('@/views/stock/CheckReport.vue'), meta: { requiresAuth: true } },
  { path: '/expiry/list', component: () => import('@/views/expiry/ExpiryList.vue'), meta: { requiresAuth: true } },
  { path: '/expiry/handle/:id', component: () => import('@/views/expiry/ExpiryHandle.vue'), meta: { requiresAuth: true } },
  { path: '/scan', component: () => import('@/views/scan/ScanPage.vue'), meta: { requiresAuth: true } },
  { path: '/poison/ledger', component: () => import('@/views/poison/PoisonLedger.vue'), meta: { requiresAuth: true } },
  { path: '/poison/verify/:id', component: () => import('@/views/poison/PoisonVerify.vue'), meta: { requiresAuth: true } },
  { path: '/poison/confirm', component: () => import('@/views/poison/PoisonConfirm.vue'), meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 权限守卫：未登录则跳转到登录页
router.beforeEach((to) => {
  if (to.meta.requiresAuth && !isLoggedIn()) {
    return '/login'
  }
})

export default router
