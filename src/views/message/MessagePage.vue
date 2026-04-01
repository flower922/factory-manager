<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { TabBar, EmptyState } from '@/components'
import { list } from '@/utils/api.js'

const router = useRouter()
const messages = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const db = (await import('@/utils/cloudbase.js')).db
    const _ = db.command

    // 并行查询过期、即将到期、低库存的物品
    const [expiredItems, expiringItems, lowStockItems] = await Promise.all([
      list('products', { status: 'expired' }, 'expire_date', 'asc', 50, 1),
      list('products', { status: 'expiring' }, 'expire_date', 'asc', 50, 1),
      list('products', { status: 'low_stock' }, 'created_at', 'desc', 50, 1),
    ])

    const today = new Date()

    // 拼装消息列表
    const result = []

    // 已过期（最紧急，排最前）
    for (const item of expiredItems) {
      const expire = new Date(item.expire_date)
      const days = Math.abs(Math.ceil((expire - today) / (1000 * 60 * 60 * 24)))
      result.push({
        id: item._id,
        productId: item._id,
        level: 1, // 用于排序
        iconName: 'warning',
        iconColor: '#EE0A24',
        title: '过期预警',
        content: `${item.name} 已过期 ${days} 天`,
        time: item.expire_date,
      })
    }

    // 即将到期
    for (const item of expiringItems) {
      const expire = new Date(item.expire_date)
      const days = Math.ceil((expire - today) / (1000 * 60 * 60 * 24))
      result.push({
        id: item._id,
        productId: item._id,
        level: 2,
        iconName: 'clock',
        iconColor: '#FF976A',
        title: '即将到期提醒',
        content: `${item.name} 将在 ${days} 天后到期`,
        time: item.expire_date,
      })
    }

    // 低库存
    for (const item of lowStockItems) {
      result.push({
        id: item._id,
        productId: item._id,
        level: 3,
        iconName: 'shopping-cart-o',
        iconColor: '#07C160',
        title: '库存不足',
        content: `${item.name} 当前库存 ${item.quantity} ${item.unit}，低于安全库存`,
        time: '',
      })
    }

    messages.value = result
  } catch (e) {
    messages.value = []
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="message-page">
    <!-- 顶部导航（Tab页不显示返回箭头）-->
    <van-nav-bar title="消息中心" />

    <!-- 加载中 -->
    <div v-if="loading" class="loading-area">
      <van-loading size="28" vertical>加载中...</van-loading>
    </div>

    <!-- 消息列表 -->
    <template v-else>
      <EmptyState v-if="messages.length === 0" text="暂无消息，一切正常 ✅" />

      <van-cell-group v-else inset style="margin-top: 12px;">
        <van-cell
          v-for="msg in messages"
          :key="msg.id"
          :title="msg.title"
          :label="msg.content"
          is-link
          @click="router.push(`/items/${msg.productId}`)"
        >
          <template #icon>
            <div class="msg-icon" :style="{ background: msg.iconColor + '20' }">
              <van-icon :name="msg.iconName" :color="msg.iconColor" size="20" />
            </div>
          </template>
          <template #right-icon>
            <van-icon name="arrow" color="#ccc" />
          </template>
        </van-cell>
      </van-cell-group>
    </template>

    <!-- 底部导航 -->
    <TabBar />
  </div>
</template>

<style scoped>
.message-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 60px;
}
.loading-area {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}
.msg-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}
</style>
