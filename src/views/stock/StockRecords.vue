<template>
  <div class="page">
    <NavBar title="出入库记录" right-text="导出" @click-right="exportData" />

    <van-tabs v-model:active="activeTab" @change="onTabChange">
      <van-tab title="全部" />
      <van-tab title="入库" />
      <van-tab title="出库" />
    </van-tabs>

    <!-- 筛选栏 -->
    <div class="filter-row">
      <van-field
        v-model="filterZone" label="" placeholder="区域" readonly is-link
        @click="showZonePicker = true" class="filter-field"
      />
      <van-field
        v-model="filterTimeLabel" label="" placeholder="时间" readonly is-link
        @click="showTimePicker = true" class="filter-field"
      />
    </div>

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list v-model:loading="listLoading" :finished="finished" finished-text="没有更多了" @load="loadMore">
        <van-cell v-for="r in records" :key="r._id"
          :label="r.quantity + '件 · ' + (r.destination || r.source || '') + ' · ' + r.operator"
          :value="formatDate(r.created_at)"
        >
          <template #icon>
            <div :class="['rec-icon', r.type === 'in' ? 'icon-in' : 'icon-out']">
              {{ r.type === 'in' ? '📥' : '📤' }}
            </div>
          </template>
          <template #title>
            <span :class="r.type === 'in' ? 'text-green' : 'text-blue'">
              {{ r.type === 'in' ? '入库' : '出库' }}
            </span>
            · {{ r.product_name }}
          </template>
        </van-cell>
        <EmptyState v-if="!listLoading && !records.length" text="暂无记录" />
      </van-list>
    </van-pull-refresh>

    <van-popup v-model:show="showZonePicker" position="bottom" round>
      <van-picker :columns="zoneOptions" @confirm="onZoneConfirm" @cancel="showZonePicker = false" />
    </van-popup>
    <van-popup v-model:show="showTimePicker" position="bottom" round>
      <van-picker :columns="timeOptions" @confirm="onTimeConfirm" @cancel="showTimePicker = false" />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { NavBar, EmptyState } from '@/components'
import { list } from '@/utils/api.js'

const route = useRoute()

const activeTab     = ref(0)
const records       = ref([])
const pageNum       = ref(1)
const listLoading   = ref(false)
const finished      = ref(false)
const refreshing    = ref(false)
const filterZone    = ref('')
const filterTimeLabel = ref('全部')
const filterDays    = ref(0)
const showZonePicker= ref(false)
const showTimePicker= ref(false)

const timeOptions = [
  { text: '全部',    value: 0 },
  { text: '最近7天', value: 7 },
  { text: '最近30天',value: 30 },
].map(v => v)

const zoneOptions = computed(() => [
  { text: '全部区域', value: '' },
])

onMounted(() => {
  if (route.query.product) {
    // 按物品ID筛选时，直接读取
  }
  loadItems(true)
})

async function loadItems(reset = false) {
  if (reset) { pageNum.value = 1; finished.value = false; records.value = [] }
  listLoading.value = true
  try {
    const typeMap = ['', 'in', 'out']
    const where = {}
    if (typeMap[activeTab.value]) where.type = typeMap[activeTab.value]
    if (route.query.product) where.product_id = route.query.product

    let res = await list('stock_records', where, 'created_at', 'desc', 20, pageNum.value)

    // 时间筛选（前端过滤）
    if (filterDays.value > 0) {
      const cutoff = Date.now() - filterDays.value * 86400000
      res = res.filter(r => new Date(r.created_at).getTime() > cutoff)
    }

    if (reset) records.value = res
    else records.value.push(...res)
    if (res.length < 20) finished.value = true
  } finally {
    listLoading.value = false
    refreshing.value  = false
  }
}

function loadMore()   { pageNum.value++; loadItems(false) }
function onRefresh()  { loadItems(true) }
function onTabChange(){ loadItems(true) }

function onZoneConfirm(v) {
  filterZone.value = v.selectedValues[0]
  showZonePicker.value = false
  loadItems(true)
}
function onTimeConfirm(v) {
  filterDays.value      = v.selectedValues[0]
  filterTimeLabel.value = v.selectedOptions[0].text
  showTimePicker.value  = false
  loadItems(true)
}

function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function exportData() {
  const json = JSON.stringify(records.value, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `出入库记录_${new Date().toLocaleDateString()}.json`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 20px; }
.filter-row { display: flex; gap: 8px; padding: 8px 12px; background: #fff; border-bottom: 1px solid #f0f0f0; }
.filter-field { flex: 1; padding: 4px 8px; border: 1px solid #eee; border-radius: 6px; font-size: 13px; }
.rec-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; margin-right: 8px; }
.icon-in  { background: #e8f5e9; }
.icon-out { background: #e3f2fd; }
.text-green { color: #00B578; font-weight: 600; }
.text-blue  { color: #1A6DFF; font-weight: 600; }
</style>
