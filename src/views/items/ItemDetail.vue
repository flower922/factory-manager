<template>
  <div class="page">
    <NavBar title="物品详情" right-text="编辑" @click-right="router.push('/items/edit/' + id)" />

    <van-loading v-if="loading" class="loading" />
    <template v-else-if="item">
      <!-- 物品头部 -->
      <div class="item-header">
        <div :class="['item-icon', catColor(item.category_l1)]">{{ catEmoji(item.category_l1) }}</div>
        <div class="item-info">
          <div class="item-name">{{ item.name }}</div>
          <div class="item-code">{{ item.code }}</div>
          <div class="item-tags">
            <StatusTag :status="item.status || 'normal'" />
            <StatusTag v-if="item.is_controlled" status="controlled" />
          </div>
        </div>
      </div>

      <!-- 基本信息 -->
      <van-cell-group inset title="基本信息" class="info-group">
        <van-cell title="分类" :value="item.category_l1 + (item.category_l2 ? ' › ' + item.category_l2 : '')" />
        <van-cell title="规格" :value="item.spec || '-'" />
        <van-cell title="当前库存">
          <template #value>
            <span class="qty-val">{{ item.quantity }}</span>
            <span class="qty-unit"> {{ item.unit }}</span>
          </template>
        </van-cell>
        <van-cell
          title="存放位置"
          :value="item.zone_name || '-'"
          :is-link="!!item.zone_name"
          @click="item.zone_name && router.push('/map/zone/' + encodeURIComponent(item.zone_name))"
        />
        <van-cell title="库位" :value="item.slot_id || '-'" />
        <van-cell title="供应商" :value="item.supplier || '-'" />
        <van-cell title="保质期至">
          <template #value>
            <span v-if="!item.expire_date">-</span>
            <span v-else :class="expiryClass(item.expire_date)">
              {{ item.expire_date }} {{ expiryDesc(item.expire_date) }}
            </span>
          </template>
        </van-cell>
        <van-cell v-if="item.open_date" title="开封日期" :value="item.open_date" />
        <van-cell v-if="item.note" title="备注" :value="item.note" />
      </van-cell-group>

      <!-- 出入库记录 -->
      <div class="card">
        <div class="card-title-row">
          <span class="card-title">出入库记录</span>
          <span class="card-more" @click="router.push('/stock/records?product=' + id)">查看全部 ›</span>
        </div>
        <EmptyState v-if="!records.length" text="暂无记录" />
        <div v-else class="timeline">
          <div v-for="r in records" :key="r._id" class="timeline-item">
            <span :class="['tl-dot', r.type === 'in' ? 'dot-in' : 'dot-out']"></span>
            <div>
              <div class="tl-main">
                <span :class="r.type === 'in' ? 'text-green' : 'text-blue'">
                  {{ r.type === 'in' ? '入库' : '出库' }}
                </span>
                × {{ r.quantity }}{{ item.unit }}
                <span v-if="r.destination"> · {{ r.destination }}</span>
              </div>
              <div class="tl-sub">{{ r.operator }} · {{ formatDate(r.created_at) }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <EmptyState v-else-if="!loading" text="物品不存在" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NavBar, StatusTag, EmptyState } from '@/components'
import { getById, list } from '@/utils/api.js'

const route  = useRoute()
const router = useRouter()
const id     = route.params.id

const loading = ref(true)
const item    = ref(null)
const records = ref([])

const catColorMap = { 原料:'bg-blue', 试剂:'bg-purple', 成品:'bg-green', 工具:'bg-orange', 耗材:'bg-gray', 劳保:'bg-pink' }
const catEmojiMap = { 原料:'🧪', 试剂:'🔬', 成品:'📦', 工具:'🔧', 耗材:'📎', 劳保:'🦺' }
const catColor = c => catColorMap[c] || 'bg-gray'
const catEmoji = c => catEmojiMap[c] || '📦'

onMounted(async () => {
  try {
    const [p, r] = await Promise.all([
      getById('products', id),
      list('stock_records', {}, 'created_at', 'desc', 10, 1)
    ])
    item.value    = p
    records.value = r.filter(rec => rec.product_id === id)
  } finally {
    loading.value = false
  }
})

function expiryClass(date) {
  const diff = (new Date(date) - new Date()) / 86400000
  if (diff < 0)  return 'text-red'
  if (diff < 30) return 'text-orange'
  return 'text-green-dark'
}

function expiryDesc(date) {
  const diff = Math.round((new Date(date) - new Date()) / 86400000)
  if (diff < 0)  return `（已过期${Math.abs(diff)}天）`
  if (diff === 0) return '（今天到期）'
  return `（剩余${diff}天）`
}

function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 30px; }
.loading { display: flex; justify-content: center; padding: 60px; }
.item-header {
  display: flex; gap: 14px; padding: 16px;
  background: #fff; margin-bottom: 10px;
}
.item-icon {
  width: 56px; height: 56px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; flex-shrink: 0;
}
.item-name { font-size: 18px; font-weight: 700; }
.item-code { font-size: 12px; color: #999; margin: 4px 0; }
.item-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.qty-val  { font-size: 20px; font-weight: 700; color: #1A6DFF; }
.qty-unit { font-size: 13px; color: #888; }
.text-red      { color: #e53935; }
.text-orange   { color: #e65100; }
.text-green-dark { color: #2e7d32; }
.text-green    { color: #00B578; font-weight: 600; }
.text-blue     { color: #1A6DFF; font-weight: 600; }
.bg-blue   { background: #e3f2fd; }
.bg-purple { background: #f3e5f5; }
.bg-green  { background: #e8f5e9; }
.bg-orange { background: #fff3e0; }
.bg-gray   { background: #f5f5f5; }
.bg-pink   { background: #fce4ec; }
.info-group { margin: 0 12px 12px; }
.card {
  background: #fff; margin: 0 12px 12px;
  border-radius: 10px; padding: 14px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.06);
}
.card-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.card-title { font-size: 14px; font-weight: 600; }
.card-more  { font-size: 12px; color: #1A6DFF; }
.timeline   { display: flex; flex-direction: column; gap: 12px; }
.timeline-item { display: flex; gap: 10px; align-items: flex-start; }
.tl-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }
.dot-in  { background: #00B578; }
.dot-out { background: #1A6DFF; }
.tl-main { font-size: 13px; color: #333; }
.tl-sub  { font-size: 12px; color: #999; margin-top: 2px; }
</style>
