<template>
  <div class="page">
    <!-- 顶部蓝色区域 -->
    <div class="header-area">
      <div class="avatar">{{ user.name?.charAt(0) || '未' }}</div>
      <div class="user-name">{{ user.name || '未登录' }}</div>
      <van-tag :color="user.role === 'admin' ? '#1A6DFF' : '#999'" round class="role-tag">
        {{ user.role === 'admin' ? '管理员' : '普通用户' }}
      </van-tag>
    </div>

    <!-- 菜单列表 -->
    <van-cell-group inset class="menu-group">
      <van-cell title="修改密码" icon="lock" is-link @click="showPwdDialog = true" />
      <van-cell title="关于系统" icon="info-o" is-link @click="showAboutDialog = true" />
    </van-cell-group>

    <!-- 退出登录 -->
    <div class="logout-area">
      <van-button plain type="danger" block round size="large" @click="onLogout">
        退出登录
      </van-button>
    </div>

    <!-- 修改密码弹窗 -->
    <van-dialog
      v-model:show="showPwdDialog"
      title="修改密码"
      show-cancel-button
      @confirm="changePwd"
    >
      <div class="dialog-form">
        <van-field v-model="pwdForm.old" type="password" label="旧密码" placeholder="请输入旧密码" />
        <van-field v-model="pwdForm.new" type="password" label="新密码" placeholder="请输入新密码" />
        <van-field v-model="pwdForm.confirm" type="password" label="确认密码" placeholder="请再次输入新密码" />
      </div>
    </van-dialog>

    <!-- 关于系统弹窗 -->
    <van-dialog v-model:show="showAboutDialog" title="关于系统" confirm-button-text="知道了">
      <div class="about-content">
        <div class="about-logo">📦</div>
        <div class="about-name">实物管家 v1.0</div>
        <div class="about-desc">工厂实物管理系统，让每一件物品找得到、管得住、用得好。</div>
        <div class="about-contact">技术支持：联系管理员</div>
      </div>
    </van-dialog>

    <TabBar />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { TabBar } from '@/components'
import { logout, getCurrentUser } from '@/utils/auth.js'
import { list, update } from '@/utils/api.js'

const router = useRouter()
const user   = reactive(getCurrentUser() || {})

const showPwdDialog   = ref(false)
const showAboutDialog = ref(false)
const pwdForm = reactive({ old: '', new: '', confirm: '' })

async function changePwd() {
  if (!pwdForm.old || !pwdForm.new || !pwdForm.confirm) {
    showToast('请填写所有字段'); return
  }
  if (pwdForm.new !== pwdForm.confirm) {
    showToast('两次密码不一致'); return
  }
  try {
    // 查询用户验证旧密码
    const users = await list('users', {}, 'created_at', 'desc', 100, 1)
    const u = users.find(u => u.username === user.username)
    if (u && u.password_hash !== pwdForm.old) {
      showToast('旧密码不正确'); return
    }
    if (u) await update('users', u._id, { password_hash: pwdForm.new })
    showToast('密码修改成功')
    Object.assign(pwdForm, { old: '', new: '', confirm: '' })
  } catch (e) {
    showToast('修改失败，请重试')
  }
}

async function onLogout() {
  try {
    await showConfirmDialog({ title: '退出登录', message: '确定要退出登录吗？' })
    logout()
    router.replace('/login')
  } catch (e) { /* 取消 */ }
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 80px; }
.header-area {
  background: #1A6DFF;
  border-radius: 0 0 24px 24px;
  padding: 40px 20px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.avatar {
  width: 72px; height: 72px; border-radius: 50%;
  background: rgba(255,255,255,0.25);
  border: 3px solid rgba(255,255,255,0.6);
  display: flex; align-items: center; justify-content: center;
  font-size: 30px; font-weight: 700; color: #fff;
  margin-bottom: 12px;
}
.user-name { font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 8px; }
.role-tag  { font-size: 12px; }
.menu-group { margin: 16px 0 0; }
.logout-area { padding: 24px 16px; }
.dialog-form { padding: 0 16px 8px; }
.about-content { padding: 20px 24px; text-align: center; }
.about-logo { font-size: 48px; margin-bottom: 10px; }
.about-name { font-size: 18px; font-weight: 700; color: #1A6DFF; margin-bottom: 8px; }
.about-desc { font-size: 13px; color: #666; line-height: 1.6; margin-bottom: 10px; }
.about-contact { font-size: 12px; color: #999; }
</style>
