<template>
  <van-tabbar v-model="active" fixed placeholder active-color="#1A6DFF">
    <van-tabbar-item icon="home-o"     to="/home">首页</van-tabbar-item>
    <van-tabbar-item icon="location-o" to="/map">地图</van-tabbar-item>
    <!-- 扫码Tab：圆形蓝色背景突出显示 -->
    <van-tabbar-item to="/scan">
      <template #icon>
        <div class="scan-icon">
          <van-icon name="scan" size="22" color="#fff" />
        </div>
      </template>
      扫码
    </van-tabbar-item>
    <van-tabbar-item icon="chat-o" to="/message" :badge="unreadCount > 0 ? unreadCount : undefined">消息</van-tabbar-item>
    <van-tabbar-item icon="contact-o" to="/profile">我的</van-tabbar-item>
  </van-tabbar>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

defineProps({
  unreadCount: { type: Number, default: 0 },
})

const route = useRoute()

const active = computed(() => {
  const path = route.path
  if (path.startsWith('/home'))    return 0
  if (path.startsWith('/map'))     return 1
  if (path.startsWith('/scan'))    return 2
  if (path.startsWith('/message')) return 3
  if (path.startsWith('/profile')) return 4
  return 0
})
</script>

<style scoped>
.scan-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #1A6DFF;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -16px;
  box-shadow: 0 2px 8px rgba(26, 109, 255, 0.4);
}
</style>
