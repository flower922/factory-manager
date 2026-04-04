<template>
  <!-- 使用 to 属性时 Vant 会自动根据路由高亮，不需要 v-model -->
  <van-tabbar fixed placeholder route>
    <van-tabbar-item icon="home-o"     to="/home">首页</van-tabbar-item>
    <van-tabbar-item icon="location-o" to="/map">地图</van-tabbar-item>
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
defineProps({
  unreadCount: { type: Number, default: 0 }
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
  box-shadow: 0 2px 8px rgba(26,109,255,0.4);
}
</style>
