<template>
  <div class="page">
    <NavBar title="到期预警" :left-arrow="false" />

    <van-tabs v-model:active="activeTab" @change="onTabChange">
      <van-tab>
        <template #title>已过期 <van-badge v-if="counts.expired" :content="counts.expired" /></template>
      </van-tab>
      <van-tab>
        <template #title>7天内 <van-badge v-if="counts.week" :content="counts.week" /></template>
      </van-tab>
      <van-tab title="30天内" />
    </van-tabs>

    <van-pull-refresh v-model="refreshing" @refresh="loadItems">
      <van-list v-model:loading="listLoading" :finished="true" finished-text="">
        <div
          v-for="item in items"
          :key="item._id"
          :class="['expiry-row', item.status === 'expired' ? 'row-expired' : 'row-expiring']"
          @click="router.push('/expiry/handle/' + item._id)"
        >
          <div :class="['left-bar', item.status === 'expired' ? 'bar-red' : 'bar-orange']"></div>
          <div :class="['cat-icon', catColor(item.category_l1)]">{{ catEmoji(item.category_l1) }}</div>
          <div class="expiry-info">
            <div class="expiry-name">{{ item.name }}</div>
            <div class="expiry-meta">{{ item.zone_name || '-' }} · {{ item.code }}</div>
            <div :class="['expiry-date', item.status === 'expired' ? 'text-red' : 'text-orange']">
              {{ expiryDesc(item.expire_date) }}
            </div>
          </div>
          <StatusTag :status="item.status" />
        </div>
        <EmptyState v-if="!listLoading && !items.length" text="暂无到期预警" icon="like-o" />
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NavBar, StatusTag, EmptyState } from '@/components'
import { list } from '@/utils/api.js'

const router = useRouter()
const activeTab  = ref(0)
const listLoading= ref(false)
const refreshing = ref(false)
const items      = ref([])
const counts     = reactive({ expired: 0, week: 0, month: 0 })

const catColorMap = { 原料:'bg-blue', 试剂:'bg-purple', 成品:'bg-green', 工具:'bg-orange', 耗材:'bg-gray', 劳保:'bg-pink' }
const catEmojiMap = { 原料:'🧪', 试剂:'🔬', 成品:'📦', 工具:'🔧', 耗材:'📎', 劳保:'🦺' }
const catColor = c => catColorMap[c] || 'bg-gray'
const catEmoji = c => catEmojiMap[c] || '📦'

onMounted(() => { loadItems() })

async function loadItems() {
  listLoading.value = true
  refreshing.value  = false
  try {
    const all = await list('products', {}, 'expire_date', 'asc', 200, 1)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const expired = all.filter(p => p.expire_date && new Date(p.expire_date) < today)
    const week    = all.filter(p => {
      if (!p.expire_date) return false
      const d = new Date(p.expire_date)
      return d >= today && d < new Date(today.getTime() + 7 * 86400000)
    })
    const month   = all.filter(p => {
      if (!p.expire_date) return false
      const d = new Date(p.expire_date)
      return d >= new Date(today.getTime() + 7 * 86400000) && d < new Date(today.getTime() + 30 * 86400000)
    })

    counts.expired = expired.length
    counts.week    = week.length
    counts.month   = month.length

    if (activeTab.value === 0) items.value = expired
    else if (activeTab.value === 1) items.value = week
    else items.value = month
  } finally {
    listLoading.value = false
  }
}

function onTabChange() { loadItems() }

function expiryDesc(date) {
  if (!date) return ''
  const diff = Math.round((new Date(date) - new Date()) / 86400000)
  if (diff < 0)  return `已过期 ${Math.abs(diff)} 天`
  if (diff === 0) return '今天到期'
  return `${diff} 天后到期`
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 20px; }
.expiry-row { display: flex; align-items: center; gap: 10px; background: #fff; margin: 8px 12px; border-radius: 10px; overflow: hidden; padding: 12px 12px 12px 0; cursor: pointer; }
.row-expired  { background: #fff8f8; }
.row-expiring { background: #fffaf5; }
.left-bar { width: 4px; align-self: stretch; flex-shrink: 0; border-radius: 0 2px 2px 0; }
.bar-red    { background: #e53935; }
.bar-orange { background: #ff7a00; }
.cat-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.expiry-info { flex: 1; }
.expiry-name { font-size: 14px; font-weight: 600; }
.expiry-meta { font-size: 12px; color: #999; margin-top: 2px; }
.expiry-date { font-size: 12px; font-weight: 600; margin-top: 4px; }
.text-red    { color: #e53935; }
.text-orange { color: #ff7a00; }
.bg-blue   { background: #e3f2fd; }
.bg-purple { background: #f3e5f5; }
.bg-green  { background: #e8f5e9; }
.bg-orange { background: #fff3e0; }
.bg-gray   { background: #f5f5f5; }
.bg-pink   { background: #fce4ec; }
</style>
