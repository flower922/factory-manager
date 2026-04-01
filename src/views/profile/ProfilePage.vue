<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showDialog } from 'vant'
import { TabBar } from '@/components'
import { getCurrentUser, logout } from '@/utils/auth.js'
import { update, list } from '@/utils/api.js'

const router = useRouter()
const user = getCurrentUser() || { name: '未知用户', role: 'user' }

// 取姓名第一个字作为头像
const avatarChar = computed(() => user.name?.charAt(0) || '?')
const isAdmin = computed(() => user.role === 'admin')

// 修改密码弹窗
const pwdDialogVisible = ref(false)
const oldPwd = ref('')
const newPwd = ref('')
const confirmPwd = ref('')

async function handleChangePwd() {
  if (!oldPwd.value) { showToast('请输入旧密码'); return }
  if (!newPwd.value) { showToast('请输入新密码'); return }
  if (newPwd.value !== confirmPwd.value) { showToast('两次密码不一致'); return }

  try {
    // 查询当前用户验证旧密码
    const users = await list('users', { username: user.username }, 'created_at', 'desc', 1, 1)
    if (!users.length || users[0].password_hash !== oldPwd.value) {
      showToast('旧密码错误')
      return
    }
    await update('users', users[0]._id, { password_hash: newPwd.value })
    showToast({ message: '密码修改成功', type: 'success' })
    pwdDialogVisible.value = false
    oldPwd.value = ''
    newPwd.value = ''
    confirmPwd.value = ''
  } catch (e) {
    showToast('修改失败，请重试')
  }
}

// 关于系统弹窗
const aboutDialogVisible = ref(false)

// 退出登录
function handleLogout() {
  showDialog({
    title: '退出登录',
    message: '确定要退出登录吗？',
    confirmButtonText: '退出',
    confirmButtonColor: '#EE0A24',
    cancelButtonText: '取消',
  }).then(() => {
    logout()
    router.replace('/login')
  }).catch(() => {})
}
</script>

<template>
  <div class="profile-page">
    <!-- 顶部蓝色区域 -->
    <div class="header">
      <div class="avatar">{{ avatarChar }}</div>
      <div class="user-name">{{ user.name }}</div>
      <van-tag :type="isAdmin ? 'primary' : 'default'" size="medium">
        {{ isAdmin ? '管理员' : '普通用户' }}
      </van-tag>
    </div>

    <!-- 菜单列表 -->
    <van-cell-group inset style="margin: 16px;">
      <!-- 修改密码 -->
      <van-cell
        title="修改密码"
        is-link
        @click="pwdDialogVisible = true"
      >
        <template #icon>
          <van-icon name="lock" style="margin-right: 8px;" color="#1A6DFF" />
        </template>
      </van-cell>

      <!-- 关于系统 -->
      <van-cell
        title="关于系统"
        is-link
        @click="aboutDialogVisible = true"
      >
        <template #icon>
          <van-icon name="info-o" style="margin-right: 8px;" color="#1A6DFF" />
        </template>
      </van-cell>
    </van-cell-group>

    <!-- 退出登录 -->
    <div style="padding: 0 16px;">
      <van-button
        plain
        type="danger"
        block
        round
        @click="handleLogout"
      >
        退出登录
      </van-button>
    </div>

    <!-- 修改密码弹窗 -->
    <van-dialog
      v-model:show="pwdDialogVisible"
      title="修改密码"
      show-cancel-button
      :before-close="() => true"
      @confirm="handleChangePwd"
    >
      <div style="padding: 16px;">
        <van-field
          v-model="oldPwd"
          type="password"
          label="旧密码"
          placeholder="请输入旧密码"
          label-width="60px"
        />
        <van-field
          v-model="newPwd"
          type="password"
          label="新密码"
          placeholder="请输入新密码"
          label-width="60px"
        />
        <van-field
          v-model="confirmPwd"
          type="password"
          label="确认密码"
          placeholder="请再次输入新密码"
          label-width="60px"
        />
      </div>
    </van-dialog>

    <!-- 关于系统弹窗 -->
    <van-dialog
      v-model:show="aboutDialogVisible"
      title="关于系统"
      confirm-button-text="知道了"
    >
      <div class="about-content">
        <div class="about-logo">📦</div>
        <div class="about-name">实物管家</div>
        <div class="about-version">版本 v1.0.0</div>
        <van-divider />
        <div class="about-desc">工厂实物管理系统</div>
        <div class="about-desc">让每一件物品找得到 · 管得住 · 用得好</div>
      </div>
    </van-dialog>

    <!-- 底部导航 -->
    <TabBar />
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 60px;
}

/* 顶部蓝色区域 */
.header {
  background: #1A6DFF;
  border-radius: 0 0 24px 24px;
  padding: 48px 24px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  border: 3px solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  color: #fff;
}
.user-name {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}

/* 关于弹窗 */
.about-content {
  padding: 16px;
  text-align: center;
}
.about-logo {
  font-size: 48px;
  margin-bottom: 8px;
}
.about-name {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}
.about-version {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
}
.about-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.8;
}
</style>
