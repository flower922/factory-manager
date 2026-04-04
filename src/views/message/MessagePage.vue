<template>
  <div class="page">
    <NavBar title="消息中心" :left-arrow="false" />

    <van-pull-refresh v-model="refreshing" @refresh="loadMessages">
      <van-list v-model:loading="loading" :finished="true">
        <van-cell
          v-for="msg in messages"
          :key="msg.id"
          :title="msg.title"
          :label="msg.content"
          is-link
          @click="router.push('/items/' + msg.product_id)"
        >
          <template #icon>
            <div :class="['msg-icon', msg.level]">{{ msg.emoji }}</div>
          </template>
          <template #right-icon>
            <van-icon name="arrow" />
          </template>
        </van-cell>
        <EmptyState v-if="!loading && !messages.length" text="暂无消息" icon="bell" />
      </van-list>
    </van-pull-refresh>

    <TabBar />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NavBar, TabBar, EmptyState } from '@/components'
import { list } from '@/utils/api.js'

const router    = useRouter()
const loading   = ref(false)
const refreshing = ref(false)
const messages  = ref([])

onMounted(loadMessages)

async function loadMessages() {
  loading.value   = true
  refreshing.value = false
  try {
    const products = await list('products', {}, 'created_at', 'desc', 200, 1)
    const msgs = []
    const now  = new Date()

    products.forEach(p => {
      if (!p.expire_date && p.status !== 'low_stock') return
      const diff = p.expire_date ? Math.round((new Date(p.expire_date) - now) / 86400000) : null

      if (p.status === 'expired') {
        msgs.push({
          id: p._id + '_expired',
          product_id: p._id,
          level: 'red',
          emoji: '🔴',
          title: '过期预警',
          content: `${p.name} 已过期 ${Math.abs(diff)} 天`,
          sort: 0,
        })
      } else if (p.status === 'expiring') {
        msgs.push({
          id: p._id + '_expiring',
          product_id: p._id,
          level: 'orange',
          emoji: '🟠',
          title: '即将到期提醒',
          content: `${p.name} 将在 ${diff} 天后到期`,
          sort: 1,
        })
      } else if (p.status === 'low_stock') {
        msgs.push({
          id: p._id + '_low',
          product_id: p._id,
          level: 'green',
          emoji: '🟡',
          title: '库存不足',
          content: `${p.name} 当前库存 ${p.quantity}${p.unit}，低于安全库存`,
          sort: 2,
        })
      }
    })

    msgs.sort((a, b) => a.sort - b.sort)
    messages.value = msgs
  } catch (e) { /* 静默 */ } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 80px; }
.msg-icon {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; margin-right: 12px; flex-shrink: 0;
}
.msg-icon.red    { background: #fff0f0; }
.msg-icon.orange { background: #fff8f0; }
.msg-icon.green  { background: #f0fff4; }
</style>
