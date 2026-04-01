<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { login, isLoggedIn } from '@/utils/auth.js'

const router = useRouter()
const username = ref('')
const password = ref('')

// 已登录则直接跳首页
onMounted(() => {
  if (isLoggedIn()) {
    router.replace('/home')
  }
})

async function handleLogin() {
  if (!username.value.trim()) {
    showToast('请输入账号')
    return
  }
  if (!password.value.trim()) {
    showToast('请输入密码')
    return
  }
  showLoadingToast({ message: '登录中...', forbidClick: true })
  try {
    await login(username.value.trim(), password.value.trim())
    closeToast()
    showToast({ message: '登录成功', type: 'success' })
    setTimeout(() => router.replace('/home'), 800)
  } catch (e) {
    closeToast()
    showToast('账号或密码错误')
  }
}

function handleWechat() {
  showToast('微信登录功能开发中')
}
</script>

<template>
  <div class="login-page">
    <!-- Logo 区域 -->
    <div class="logo-area">
      <div class="logo-icon">📦</div>
      <div class="app-name">实物管家</div>
      <div class="app-slogan">让每一件物品 找得到 · 管得住 · 用得好</div>
    </div>

    <!-- 表单区域 -->
    <div class="form-area">
      <van-cell-group inset>
        <van-field
          v-model="username"
          placeholder="请输入账号"
          left-icon="user-o"
          clearable
        />
        <van-field
          v-model="password"
          type="password"
          placeholder="请输入密码"
          left-icon="lock"
          clearable
        />
      </van-cell-group>

      <!-- 忘记密码 -->
      <div class="forgot-row">
        <span class="forgot-link" @click="router.push('/forgot-password')">忘记密码？</span>
      </div>

      <!-- 登录按钮 -->
      <div class="btn-area">
        <van-button type="primary" block round size="large" @click="handleLogin">
          登 录
        </van-button>
      </div>
    </div>

    <!-- 其他登录方式 -->
    <div class="other-login">
      <van-divider>其他登录方式</van-divider>
      <div class="wechat-btn" @click="handleWechat">
        <van-icon name="wechat" size="28" color="#fff" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #f7f8fa;
  display: flex;
  flex-direction: column;
  padding-bottom: 40px;
}
.logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 72px 24px 40px;
}
.logo-icon {
  font-size: 64px;
  line-height: 1;
  margin-bottom: 16px;
}
.app-name {
  font-size: 28px;
  font-weight: 700;
  color: #1A6DFF;
  margin-bottom: 8px;
}
.app-slogan {
  font-size: 13px;
  color: #999;
  text-align: center;
}
.form-area {
  padding: 0 16px;
}
.forgot-row {
  text-align: right;
  margin: 12px 4px 0;
}
.forgot-link {
  font-size: 13px;
  color: #1A6DFF;
  cursor: pointer;
}
.btn-area {
  margin-top: 24px;
}
.other-login {
  margin-top: 32px;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.wechat-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #07C160;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-top: 4px;
}
</style>
