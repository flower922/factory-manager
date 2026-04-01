<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps({
  unreadCount: { type: Number, default: 0 },
})

const route = useRoute()
const router = useRouter()

// 根据当前路由路径判断激活哪个 Tab
const active = computed(() => {
  const path = route.path
  if (path.startsWith('/home')) return 0
  if (path.startsWith('/map')) return 1
  if (path.startsWith('/scan')) return 2
  if (path.startsWith('/message')) return 3
  if (path.startsWith('/profile')) return 4
  return 0
})

function onChange(index) {
  const routes = ['/home', '/map', '/scan', '/message', '/profile']
  router.push(routes[index])
}
</script>

<template>
  <van-tabbar :model-value="active" @change="onChange" active-color="#1A6DFF">
    <van-tabbar-item icon="home-o">首页</van-tabbar-item>
    <van-tabbar-item icon="location-o">地图</van-tabbar-item>

    <!-- 扫码Tab：圆形蓝色背景突出显示 -->
    <van-tabbar-item>
      <template #icon>
        <div class="scan-btn">
          <van-icon name="scan" size="22" color="#fff" />
        </div>
      </template>
      扫码
    </van-tabbar-item>

    <!-- 消息Tab：显示未读数红点 -->
    <van-tabbar-item icon="chat-o" :badge="unreadCount > 0 ? unreadCount : ''">
      消息
    </van-tabbar-item>

    <van-tabbar-item icon="contact-o">我的</van-tabbar-item>
  </van-tabbar>
</template>

<style scoped>
.scan-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #1A6DFF;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -16px;
  box-shadow: 0 2px 8px rgba(26, 109, 255, 0.4);
}
</style>
