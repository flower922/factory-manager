<script setup>
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { NavBar } from '@/components'

const router = useRouter()
const phone = ref('')
const code = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

// 倒计时相关
const countdown = ref(0)
let timer = null

function startCountdown() {
  if (!phone.value.trim()) {
    showToast('请先输入手机号')
    return
  }
  if (!/^1[3-9]\d{9}$/.test(phone.value.trim())) {
    showToast('请输入正确的手机号')
    return
  }
  countdown.value = 60
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
  showToast('验证码已发送（v1.0测试版，输入任意值即可）')
}

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

function handleReset() {
  if (!phone.value.trim()) { showToast('请输入手机号'); return }
  if (!/^1[3-9]\d{9}$/.test(phone.value.trim())) { showToast('请输入正确的手机号'); return }
  if (!code.value.trim()) { showToast('请输入验证码'); return }
  if (!newPassword.value.trim()) { showToast('请输入新密码'); return }
  if (!confirmPassword.value.trim()) { showToast('请输入确认密码'); return }
  if (newPassword.value !== confirmPassword.value) { showToast('两次密码不一致'); return }

  showToast({ message: '密码重置成功', type: 'success' })
  setTimeout(() => router.replace('/login'), 800)
}
</script>

<template>
  <div class="forgot-page">
    <NavBar title="忘记密码" />

    <div class="content">
      <p class="tip-text">请输入注册时绑定的手机号，我们将发送验证码帮您重置密码。</p>

      <van-cell-group inset>
        <!-- 手机号 -->
        <van-field
          v-model="phone"
          placeholder="请输入手机号"
          left-icon="phone-o"
          type="tel"
          maxlength="11"
        />

        <!-- 验证码 -->
        <van-field
          v-model="code"
          placeholder="请输入验证码"
          left-icon="shield-o"
        >
          <template #button>
            <van-button
              size="small"
              type="primary"
              plain
              :disabled="countdown > 0"
              @click="startCountdown"
            >
              {{ countdown > 0 ? `${countdown}s后重试` : '获取验证码' }}
            </van-button>
          </template>
        </van-field>

        <!-- 新密码 -->
        <van-field
          v-model="newPassword"
          type="password"
          placeholder="请输入新密码"
          left-icon="lock"
        />

        <!-- 确认密码 -->
        <van-field
          v-model="confirmPassword"
          type="password"
          placeholder="请再次输入新密码"
          left-icon="lock"
        />
      </van-cell-group>

      <div class="btn-area">
        <van-button type="primary" block round size="large" @click="handleReset">
          确认重置
        </van-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.forgot-page {
  min-height: 100vh;
  background: #f7f8fa;
}
.content {
  padding: 16px;
}
.tip-text {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin: 0 4px 20px;
}
.btn-area {
  margin-top: 32px;
}
</style>
