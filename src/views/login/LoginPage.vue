<template>
  <div class="page">
    <div class="logo-area">
      <div class="logo-icon">📦</div>
      <div class="app-name">实物管家</div>
      <div class="app-slogan">让每一件物品 找得到 · 管得住 · 用得好</div>
    </div>

    <van-cell-group inset class="form-group">
      <van-field v-model="username" placeholder="请输入账号" left-icon="user-o" clearable />
      <van-field v-model="password" type="password" placeholder="请输入密码" left-icon="lock" clearable />
    </van-cell-group>

    <div class="forgot-row">
      <span class="forgot-link" @click="router.push('/forgot-password')">忘记密码？</span>
    </div>

    <div class="btn-area">
      <van-button type="primary" block round size="large" :loading="loading" @click="onLogin">
        登 录
      </van-button>
    </div>

    <div class="other-login">
      <van-divider>其他登录方式</van-divider>
      <div class="wx-btn" @click="showToast('微信登录功能开发中')">
        <van-icon name="wechat" size="36" color="#07c160" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { login, isLoggedIn } from '@/utils/auth.js'

const router   = useRouter()
const username = ref('')
const password = ref('')
const loading  = ref(false)

onMounted(() => {
  if (isLoggedIn()) router.replace('/home')
})

async function onLogin() {
  if (!username.value.trim()) { showToast('请输入账号'); return }
  if (!password.value.trim()) { showToast('请输入密码'); return }
  loading.value = true
  try {
    await login(username.value.trim(), password.value.trim())
    showToast('登录成功')
    router.replace('/home')
  } catch (e) {
    showToast('账号或密码错误')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh; background: #f5f6fa;
  display: flex; flex-direction: column; padding: 0 0 40px;
}
.logo-area {
  display: flex; flex-direction: column; align-items: center;
  padding: 80px 0 40px;
}
.logo-icon  { font-size: 64px; margin-bottom: 14px; }
.app-name   { font-size: 28px; font-weight: 700; color: #1A6DFF; margin-bottom: 8px; }
.app-slogan { font-size: 13px; color: #999; }
.form-group { margin: 0 0 8px; }
.forgot-row { text-align: right; padding: 0 24px 20px; }
.forgot-link { font-size: 13px; color: #1A6DFF; cursor: pointer; }
.btn-area   { padding: 0 16px 24px; }
.other-login { padding: 0 40px; }
.wx-btn { display: flex; justify-content: center; margin-top: 8px; cursor: pointer; }
</style>
