<template>
  <div class="page">
    <NavBar title="易制毒品台账" right-text="导出" @click-right="exportData" />

    <!-- 警告条 -->
    <van-notice-bar color="#fff" background="#e53935" left-icon="warning-o" wrapable :scrollable="false">
      🔒 管控物品专区 · 所有操作需双人确认
    </van-notice-bar>

    <!-- 筛选 -->
    <div class="filter-row">
      <van-field v-model="filterProduct" label="" placeholder="选择物品" readonly is-link @click="showProductPicker = true" class="filter-field" />
      <van-field v-model="filterTimeLabel" label="" placeholder="时间范围" readonly is-link @click="showTimePicker = true" class="filter-field" />
    </div>

    <!-- 台账列表 -->
    <van-pull-refresh v-model="refreshing" @refresh="loadData">
      <van-list v-model:loading="listLoading" :finished="true">
        <div v-for="r in records" :key="r._id" class="ledger-row">
          <div class="ledger-main">
            <div class="ledger-name">{{ r.product_name }}</div>
            <div class="ledger-meta">{{ r.operator }} → {{ r.confirmer || '待确认' }}</div>
            <div class="ledger-meta">用途：{{ r.purpose || '-' }} · {{ formatDate(r.created_at) }}</div>
          </div>
          <div class="ledger-right">
            <van-tag :color="typeColor(r.type)" round>{{ typeLabel(r.type) }}</van-tag>
            <div class="ledger-qty">{{ r.type === 'out' ? '-' : '+' }}{{ r.quantity }}{{ r.unit }}</div>
            <div class="ledger-remain">余：{{ r.remaining }}</div>
          </div>
        </div>
        <EmptyState v-if="!listLoading && !records.length" text="暂无台账记录" />
      </van-list>
    </van-pull-refresh>

    <van-popup v-model:show="showProductPicker" position="bottom" round>
      <van-picker :columns="productOptions" @confirm="onProductConfirm" @cancel="showProductPicker = false" />
    </van-popup>
    <van-popup v-model:show="showTimePicker" position="bottom" round>
      <van-picker :columns="timeOptions" @confirm="onTimeConfirm" @cancel="showTimePicker = false" />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { NavBar, EmptyState } from '@/components'
import { list } from '@/utils/api.js'

const records        = ref([])
const listLoading    = ref(false)
const refreshing     = ref(false)
const allProducts    = ref([])
const filterProduct  = ref('')
const filterProductId= ref('')
const filterTimeLabel= ref('全部')
const filterDays     = ref(0)
const showProductPicker = ref(false)
const showTimePicker    = ref(false)

const timeOptions = [
  { text:'全部', value:0 }, { text:'本月', value:30 }, { text:'本季度', value:90 }
]
const productOptions = computed(() => [
  { text:'全部', value:'' },
  ...allProducts.value.map(p => ({ text: p.name, value: p._id }))
])

const typeColorMap = { in:'#00B578', out:'#1A6DFF', use:'#ff7a00' }
const typeLabelMap = { in:'入库', out:'出库', use:'使用' }
const typeColor = t => typeColorMap[t] || '#999'
const typeLabel = t => typeLabelMap[t] || t

onMounted(async () => {
  try {
    allProducts.value = (await list('products', {}, 'created_at', 'desc', 100, 1))
      .filter(p => p.is_controlled)
  } catch (e) { /* 静默 */ }
  loadData()
})

async function loadData() {
  listLoading.value = true
  refreshing.value  = false
  try {
    const where = {}
    if (filterProductId.value) where.product_id = filterProductId.value
    let res = await list('poison_records', where, 'created_at', 'desc', 100, 1)
    if (filterDays.value > 0) {
      const cutoff = Date.now() - filterDays.value * 86400000
      res = res.filter(r => new Date(r.created_at).getTime() > cutoff)
    }
    records.value = res
  } finally {
    listLoading.value = false
  }
}

function onProductConfirm(v) {
  filterProduct.value   = v.selectedOptions[0].text
  filterProductId.value = v.selectedValues[0]
  showProductPicker.value = false
  loadData()
}
function onTimeConfirm(v) {
  filterTimeLabel.value = v.selectedOptions[0].text
  filterDays.value      = v.selectedValues[0]
  showTimePicker.value  = false
  loadData()
}

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

function exportData() {
  const blob = new Blob([JSON.stringify(records.value, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = '易制毒品台账.json'; a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 20px; }
.filter-row { display: flex; gap: 8px; padding: 8px 12px; background: #fff; border-bottom: 1px solid #f0f0f0; }
.filter-field { flex: 1; }
.ledger-row { display: flex; align-items: center; background: #fff; margin: 8px 12px; padding: 12px; border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
.ledger-main { flex: 1; }
.ledger-name { font-size: 14px; font-weight: 600; }
.ledger-meta { font-size: 12px; color: #999; margin-top: 3px; }
.ledger-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.ledger-qty    { font-size: 14px; font-weight: 700; color: #333; }
.ledger-remain { font-size: 11px; color: #aaa; }
</style>
