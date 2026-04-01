// 用户状态管理（Pinia）
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const USER_KEY = 'currentUser'

export const useUserStore = defineStore('user', () => {
  // 从 localStorage 恢复用户信息
  const userInfo = ref(JSON.parse(localStorage.getItem(USER_KEY) || 'null'))

  const isLoggedIn = computed(() => !!userInfo.value)
  const isAdmin = computed(() => userInfo.value?.role === 'admin')

  function setUser(info) {
    userInfo.value = info
    localStorage.setItem(USER_KEY, JSON.stringify(info))
  }

  function clearUser() {
    userInfo.value = null
    localStorage.removeItem(USER_KEY)
  }

  return { userInfo, isLoggedIn, isAdmin, setUser, clearUser }
})
