<template>
  <div class="page">
    <NavBar :title="zoneName || '区域详情'" />

    <van-loading v-if="loading" class="loading" />
    <template v-else>
      <!-- 区域信息卡片 -->
      <div class="zone-card">
        <div class="zone-card-bar"></div>
        <div class="zone-card-body">
          <div class="zone-name">{{ zoneName }}</div>
          <van-tag type="primary" size="medium">{{ typeLabel }}</van-tag>
          <span v-if="zoneInfo.has_slots" class="slot-count">共 {{ slotTotal }} 个库位</span>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="stat-row">
        <StatCard label="物品总数" :value="stats.total" color="#1A6DFF" />
        <StatCard label="即将到期" :value="stats.expiring" color="#FF7A00" />
        <StatCard v-if="zoneInfo.has_slots" label="空库位" :value="stats.emptySlots" color="#00B578" />
      </div>

      <!-- 分类占比卡片 -->
      <div class="card" v-if="categoryStats.length">
        <div class="card-title">分类占比</div>
        <div class="category-tags">
          <van-tag
            v-for="c in categoryStats"
            :key="c.name"
            plain
            type="primary"
            style="margin:4px;"
          >{{ c.name }} · {{ c.count }}件</van-tag>
        </div>
      </div>

      <!-- 最近出入库记录 -->
      <div class="card">
        <div class="card-title-row">
          <span class="card-title">最近出入库</span>
          <span class="card-more" @click="router.push('/stock/records')">查看全部 ›</span>
        </div>
        <EmptyState v-if="!records.length" text="暂无出入库记录" />
        <div v-else class="timeline">
          <div v-for="r in records" :key="r._id" class="timeline-item">
            <span :class="['tl-dot', r.type === 'in' ? 'tl-dot-in' : 'tl-dot-out']"></span>
            <div class="tl-content">
              <div class="tl-main">
                <span :class="r.type === 'in' ? 'text-green' : 'text-blue'">
                  {{ r.type === 'in' ? '入库' : '出库' }}
                </span>
                · {{ r.product_name }} × {{ r.quantity }}
              </div>
              <div class="tl-sub">{{ r.operator }} · {{ formatDate(r.created_at) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="btn-group">
        <van-button
          v-if="zoneInfo.has_slots"
          type="primary"
          block
          round
          @click="router.push('/map/slot/' + encodeURIComponent(zoneName))"
        >进入库位地图</van-button>
        <van-button
          plain
          type="primary"
          block
          round
          style="margin-top:10px;"
          @click="router.push('/items?zone=' + encodeURIComponent(zoneName))"
        >查看全部物品</van-button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { NavBar, StatCard, EmptyState } from '@/components'
import { list, count } from '@/utils/api.js'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const zoneName = ref(decodeURIComponent(route.params.code || ''))
const zoneInfo = ref({})
const stats = ref({ total: 0, expiring: 0, emptySlots: 0 })
const categoryStats = ref([])
const records = ref([])
const slotTotal = ref(0)

// 区域类型文字映射
const typeMap = {
  warehouse:  '仓储区',
  production: '生产区',
  lab:        '实验区',
  office:     '办公区'
}
const typeLabel = computed(() => typeMap[zoneInfo.value.type] || zoneInfo.value.type || '')

onMounted(async () => {
  try {
    await Promise.all([loadZoneInfo(), loadStats(), loadRecords()])
  } finally {
    loading.value = false
  }
})

async function loadZoneInfo() {
  try {
    const zones = await list('zones', {}, 'created_at', 'asc', 50, 1)
    const found = zones.find(z => z.name === zoneName.value || z.code === zoneName.value)
    if (found) {
      zoneInfo.value = found
      zoneName.value = found.name
    }
    // 查库位总数
    if (found?.has_slots) {
      slotTotal.value = await count('slots', { zone_name: zoneName.value })
    }
  } catch (e) { /* 静默 */ }
}

async function loadStats() {
  try {
    const products = await list('products', {}, 'created_at', 'desc', 100, 1)
    const zoneProducts = products.filter(p => p.zone_name === zoneName.value)
    stats.value.total = zoneProducts.length
    stats.value.expiring = zoneProducts.filter(p => p.status === 'expiring' || p.status === 'expired').length

    // 分类统计
    const catMap = {}
    for (const p of zoneProducts) {
      const cat = p.category_l1 || '未分类'
      catMap[cat] = (catMap[cat] || 0) + 1
    }
    categoryStats.value = Object.entries(catMap).map(([name, count]) => ({ name, count }))

    // 空库位
    if (zoneInfo.value.has_slots) {
      stats.value.emptySlots = await count('slots', { zone_name: zoneName.value, status: 'empty' })
    }
  } catch (e) { /* 静默 */ }
}

async function loadRecords() {
  try {
    const all = await list('stock_records', {}, 'created_at', 'desc', 5, 1)
    records.value = all
  } catch (e) { /* 静默 */ }
}

function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 80px; }
.loading { display: flex; justify-content: center; padding: 60px; }
.zone-card {
  display: flex;
  background: #fff;
  margin: 12px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 6px rgba(0,0,0,0.06);
}
.zone-card-bar { width: 5px; background: #1A6DFF; flex-shrink: 0; }
.zone-card-body { padding: 14px 16px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.zone-name { font-size: 18px; font-weight: 700; }
.slot-count { font-size: 12px; color: #999; }
.stat-row {
  display: flex;
  gap: 10px;
  padding: 0 12px 12px;
}
.card {
  background: #fff;
  margin: 0 12px 12px;
  border-radius: 10px;
  padding: 14px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.06);
}
.card-title { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 10px; display: block; }
.card-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.card-more { font-size: 12px; color: #1A6DFF; }
.category-tags { display: flex; flex-wrap: wrap; }
.timeline { display: flex; flex-direction: column; gap: 12px; }
.timeline-item { display: flex; gap: 10px; align-items: flex-start; }
.tl-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }
.tl-dot-in  { background: #00B578; }
.tl-dot-out { background: #1A6DFF; }
.tl-main { font-size: 13px; color: #333; }
.tl-sub  { font-size: 12px; color: #999; margin-top: 2px; }
.text-green { color: #00B578; font-weight: 600; }
.text-blue  { color: #1A6DFF; font-weight: 600; }
.btn-group { padding: 0 12px; }
</style>
