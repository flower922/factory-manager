<template>
  <div class="page">
    <NavBar title="固定资产" />

    <van-tabs v-model:active="activeTab" @change="onTabChange">
      <van-tab title="资产列表" />
      <van-tab title="折旧报告" />
    </van-tabs>

    <!-- Tab 0: 资产列表 -->
    <template v-if="activeTab === 0">
      <!-- 筛选区 -->
      <div class="filter-row">
        <van-dropdown-menu>
          <van-dropdown-item v-model="filterZone" :options="zoneOptions" @change="applyFilter" />
          <van-dropdown-item v-model="filterStatus" :options="statusOptions" @change="applyFilter" />
        </van-dropdown-menu>
      </div>

      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="loadAssets"
        >
          <div
            v-for="item in filteredAssets"
            :key="item._id"
            class="asset-card"
            @click="router.push('/items/' + item._id)"
          >
            <div class="asset-header">
              <span class="asset-name">{{ item.name }}</span>
              <span class="asset-code">{{ item.code }}</span>
            </div>
            <div class="asset-body">
              <div class="asset-info-row">
                <span class="info-label">区域</span>
                <span>{{ item.zone_name || '—' }}</span>
              </div>
              <div class="asset-info-row">
                <span class="info-label">原值</span>
                <span>{{ item.unit_price ? '¥' + item.unit_price.toFixed(2) : '—' }}</span>
              </div>
              <div class="asset-info-row">
                <span class="info-label">账面价值</span>
                <span class="book-val">{{ calcBookValue(item) }}</span>
              </div>
              <div class="asset-info-row">
                <span class="info-label">状态</span>
                <span :style="{ color: item.status === 'normal' ? '#00B578' : '#ff7a00' }">
                  {{ item.status || '正常' }}
                </span>
              </div>
            </div>
          </div>
          <EmptyState v-if="!loading && !filteredAssets.length" text="暂无固定资产" />
        </van-list>
      </van-pull-refresh>
    </template>

    <!-- Tab 1: 折旧报告 -->
    <template v-if="activeTab === 1">
      <div v-if="loadingReport" class="loading-wrap">
        <van-loading color="#1A6DFF" />
      </div>
      <template v-else>
        <!-- 汇总数据 -->
        <div class="report-summary">
          <div class="sum-card">
            <div class="sum-val">{{ summary.originalValue }}</div>
            <div class="sum-lbl">原值总计</div>
          </div>
          <div class="sum-card">
            <div class="sum-val" style="color:#00B578;">{{ summary.bookValue }}</div>
            <div class="sum-lbl">账面价值</div>
          </div>
          <div class="sum-card">
            <div class="sum-val" style="color:#e53935;">{{ summary.depreciation }}</div>
            <div class="sum-lbl">累计折旧</div>
          </div>
        </div>

        <!-- 按区域汇总 -->
        <div class="section-title">按区域汇总</div>
        <div class="card">
          <div v-for="zone in zoneSummary" :key="zone.name" class="zone-row">
            <span class="zone-name">{{ zone.name }}</span>
            <div class="zone-values">
              <span>原值：{{ zone.original }}</span>
              <span>账面：{{ zone.book }}</span>
            </div>
          </div>
          <EmptyState v-if="!zoneSummary.length" text="暂无数据" />
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { NavBar, EmptyState } from '@/components'
import { list } from '@/utils/api.js'

const router       = useRouter()
const activeTab    = ref(0)
const allAssets    = ref([])
const loading      = ref(false)
const finished     = ref(false)
const refreshing   = ref(false)
const loadingReport = ref(false)
const filterZone   = ref('')
const filterStatus = ref('')

const zoneOptions   = ref([{ text: '全部区域', value: '' }])
const statusOptions = [
  { text: '全部状态', value: '' },
  { text: '正常', value: 'normal' },
  { text: '低库存', value: 'low_stock' },
  { text: '已过期', value: 'expired' },
]

// 折旧报告数据
const summary     = ref({ originalValue: '¥0', bookValue: '¥0', depreciation: '¥0' })
const zoneSummary = ref([])

const TODAY = new Date()

// 计算资产账面价值
function calcBookValue(item) {
  const price = item.unit_price || item.purchase_price || 0
  if (!price || price <= 0) return '—'
  const usefulLife = item.useful_life || 5 // 默认5年
  if (!item.produce_date) return '¥' + price.toFixed(2)
  const yearsUsed = (TODAY - new Date(item.produce_date)) / (365.25 * 24 * 3600 * 1000)
  const ratio = Math.max(0, 1 - yearsUsed / usefulLife)
  return '¥' + (price * ratio).toFixed(2)
}

// 数字化账面价值
function calcBookNum(item) {
  const price = item.unit_price || item.purchase_price || 0
  if (!price || price <= 0) return 0
  const usefulLife = item.useful_life || 5
  if (!item.produce_date) return price
  const yearsUsed = (TODAY - new Date(item.produce_date)) / (365.25 * 24 * 3600 * 1000)
  const ratio = Math.max(0, 1 - yearsUsed / usefulLife)
  return price * ratio
}

const filteredAssets = computed(() => {
  let list = allAssets.value
  if (filterZone.value)   list = list.filter(a => a.zone_name === filterZone.value)
  if (filterStatus.value) list = list.filter(a => a.status === filterStatus.value)
  return list
})

onMounted(() => { loadAssets() })

async function loadAssets() {
  if (finished.value) return
  loading.value = true
  try {
    // 查询 category_l1 为 '设备' 或 asset_type 为 'fixed_asset' 的物品
    const [equipItems, fixedItems] = await Promise.all([
      list('products', { category_l1: '设备' }, 'created_at', 'desc', 200, 1),
      list('products', { asset_type: 'fixed_asset' }, 'created_at', 'desc', 200, 1),
    ])
    // 合并去重
    const merged = [...equipItems]
    fixedItems.forEach(f => { if (!merged.find(e => e._id === f._id)) merged.push(f) })
    allAssets.value = merged
    finished.value = true

    // 构建区域筛选选项
    const zones = [...new Set(merged.map(a => a.zone_name).filter(Boolean))]
    zoneOptions.value = [
      { text: '全部区域', value: '' },
      ...zones.map(z => ({ text: z, value: z })),
    ]
  } catch (e) {
    showToast('加载失败')
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

function onRefresh() {
  finished.value = false
  allAssets.value = []
  loadAssets()
}

function applyFilter() { /* computed 响应式 */ }

// 切换到折旧报告 Tab 时计算
function onTabChange(tab) {
  if (tab === 1) calcReport()
}

function calcReport() {
  loadingReport.value = true
  try {
    const assets = allAssets.value
    let totalOriginal = 0
    let totalBook     = 0

    const zoneMap = {}
    assets.forEach(a => {
      const price = a.unit_price || a.purchase_price || 0
      const book  = calcBookNum(a)
      totalOriginal += price
      totalBook     += book

      const zone = a.zone_name || '未分配'
      if (!zoneMap[zone]) zoneMap[zone] = { original: 0, book: 0 }
      zoneMap[zone].original += price
      zoneMap[zone].book     += book
    })

    summary.value = {
      originalValue: '¥' + totalOriginal.toFixed(2),
      bookValue:     '¥' + totalBook.toFixed(2),
      depreciation:  '¥' + (totalOriginal - totalBook).toFixed(2),
    }

    zoneSummary.value = Object.entries(zoneMap).map(([name, v]) => ({
      name,
      original: '¥' + v.original.toFixed(2),
      book:     '¥' + v.book.toFixed(2),
    }))
  } finally {
    loadingReport.value = false
  }
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 20px; }
.filter-row { background: #fff; }
.loading-wrap { display: flex; justify-content: center; padding: 60px 0; }

.asset-card {
  background: #fff; margin: 10px 12px; border-radius: 12px;
  padding: 14px; box-shadow: 0 1px 6px rgba(0,0,0,0.06); cursor: pointer;
}
.asset-card:active { opacity: 0.8; }
.asset-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.asset-name { font-size: 15px; font-weight: 600; color: #333; }
.asset-code { font-size: 12px; color: #999; }
.asset-body  { font-size: 13px; color: #555; }
.asset-info-row { display: flex; gap: 8px; margin-bottom: 3px; }
.info-label { color: #999; min-width: 56px; }
.book-val { color: #1A6DFF; font-weight: 600; }

/* 折旧报告 */
.report-summary {
  display: flex; gap: 10px; padding: 12px;
}
.sum-card {
  flex: 1; background: #fff; border-radius: 12px; padding: 14px; text-align: center;
  box-shadow: 0 1px 6px rgba(0,0,0,0.06);
}
.sum-val { font-size: 16px; font-weight: 700; color: #1A6DFF; }
.sum-lbl { font-size: 11px; color: #999; margin-top: 4px; }

.section-title { font-size: 14px; font-weight: 600; color: #333; padding: 4px 16px 6px; }
.card {
  background: #fff; margin: 0 12px; border-radius: 12px;
  padding: 4px 14px; box-shadow: 0 1px 6px rgba(0,0,0,0.06);
}
.zone-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 0; border-bottom: 1px solid #f5f5f5;
}
.zone-row:last-child { border-bottom: none; }
.zone-name { font-size: 13px; color: #333; font-weight: 500; }
.zone-values { display: flex; gap: 12px; font-size: 12px; color: #666; }
</style>
