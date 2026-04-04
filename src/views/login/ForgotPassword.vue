<template>
  <div class="page">
    <NavBar title="忘记密码" />

    <div class="tips">请输入注册时绑定的手机号，我们将发送验证码帮您重置密码。</div>

    <van-form @submit="onSubmit" class="form">
      <van-cell-group inset>
        <van-field
          v-model="form.phone"
          label="手机号"
          placeholder="请输入手机号"
          type="tel"
          :rules="[{ required: true, message: '请输入手机号' }, { pattern: /^1\d{10}$/, message: '手机号格式不正确' }]"
        />
        <van-field
          v-model="form.code"
          label="验证码"
          placeholder="请输入验证码"
          :rules="[{ required: true, message: '请输入验证码' }]"
        >
          <template #button>
            <van-button
              size="small" type="primary" plain
              :disabled="countdown > 0"
              @click.prevent="sendCode"
            >
              {{ countdown > 0 ? countdown + 's后重试' : '获取验证码' }}
            </van-button>
          </template>
        </van-field>
        <van-field
          v-model="form.newPwd"
          label="新密码"
          type="password"
          placeholder="请输入新密码"
          :rules="[{ required: true, message: '请输入新密码' }]"
        />
        <van-field
          v-model="form.confirmPwd"
          label="确认密码"
          type="password"
          placeholder="请再次输入新密码"
          :rules="[{ required: true, message: '请确认密码' }, { validator: checkSame, message: '两次密码不一致' }]"
        />
      </van-cell-group>

      <div class="submit-btn">
        <van-button type="primary" block round size="large" native-type="submit">
          确认重置
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { NavBar } from '@/components'

const router    = useRouter()
const countdown = ref(0)
const form = reactive({ phone: '', code: '', newPwd: '', confirmPwd: '' })

function checkSame() {
  return form.confirmPwd === form.newPwd
}

function sendCode() {
  if (!form.phone || !/^1\d{10}$/.test(form.phone)) {
    showToast('请先输入正确的手机号'); return
  }
  showToast('验证码已发送（测试：任意输入可通过）')
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) clearInterval(timer)
  }, 1000)
}

function onSubmit() {
  showToast('密码重置成功')
  router.push('/login')
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 40px; }
.tips { font-size: 13px; color: #888; padding: 16px 20px; line-height: 1.6; }
.form { margin-top: 8px; }
.submit-btn { padding: 24px 16px 0; }
</style>
