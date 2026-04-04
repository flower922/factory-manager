<template>
  <div class="page">
    <NavBar title="数据统计" />

    <div v-if="loading" class="loading-wrap">
      <van-loading color="#1A6DFF" />
    </div>

    <template v-else>
      <!-- Section 1: 概览卡片 2x2 -->
      <div class="section-title">概览</div>
      <div class="overview-grid">
        <div class="ov-card">
          <div class="ov-val">{{ overview.totalItems }}</div>
          <div class="ov-lbl">物品总数</div>
        </div>
        <div class="ov-card">
          <div class="ov-val" style="font-size:16px;">{{ overview.totalValue }}</div>
          <div class="ov-lbl">资产总价值</div>
        </div>
        <div class="ov-card">
          <div class="ov-val" style="color:#00B578;">{{ overview.monthIn }}</div>
          <div class="ov-lbl">本月入库次数</div>
        </div>
        <div class="ov-card">
          <div class="ov-val" style="color:#e53935;">{{ overview.monthOut }}</div>
          <div class="ov-lbl">本月出库次数</div>
        </div>
      </div>

      <!-- Section 2: 分类分布 -->
      <div class="section-title">分类分布</div>
      <div class="card">
        <div v-for="cat in categoryDist" :key="cat.name" class="dist-row">
          <span class="dist-name">{{ cat.name }}</span>
          <span class="dist-count">{{ cat.count }}</span>
          <div class="dist-bar-bg">
            <div class="dist-bar-fill" :style="{ width: cat.pct + '%' }"></div>
          </div>
          <span class="dist-pct">{{ cat.pct }}%</span>
        </div>
        <EmptyState v-if="!categoryDist.length" text="暂无分类数据" />
      </div>

      <!-- Section 3: 近7天出入库 -->
      <div class="section-title">近7天出入库</div>
      <div class="card">
        <table class="week-table">
          <thead>
            <tr>
              <th>日期</th>
              <th style="color:#00B578;">入库</th>
              <th style="color:#e53935;">出库</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in weekData" :key="row.date">
              <td>{{ row.date }}</td>
              <td>{{ row.in }}</td>
              <td>{{ row.out }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Section 4: 区域库存分布 -->
      <div class="section-title">区域库存分布</div>
      <div class="card">
        <div v-for="zone in zoneDist" :key="zone.name" class="dist-row">
          <span class="dist-name">{{ zone.name }}</span>
          <span class="dist-count">{{ zone.count }}</span>
          <div class="dist-bar-bg">
            <div class="dist-bar-fill zone-fill" :style="{ width: zone.pct + '%' }"></div>
          </div>
          <span class="dist-pct">{{ zone.pct }}%</span>
        </div>
        <EmptyState v-if="!zoneDist.length" text="暂无区域数据" />
      </div>

      <!-- Section 5: 低库存 TOP5 -->
      <div class="section-title">低库存物品 TOP5</div>
      <div class="card">
        <van-cell
          v-for="(item, idx) in lowStockTop5"
          :key="item._id"
          :title="item.name"
          :label="item.zone_name || ''"
          @click="router.push('/items/' + item._id)"
        >
          <template #icon>
            <div class="rank-badge">{{ idx + 1 }}</div>
          </template>
          <template #right-icon>
            <span class="low-qty" style="color:#e53935;">{{ item.quantity }}{{ item.unit }}</span>
          </template>
        </van-cell>
        <EmptyState v-if="!lowStockTop5.length" text="暂无低库存物品" />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { NavBar, EmptyState } from '@/components'
import { list } from '@/utils/api.js'

const router   = useRouter()
const loading  = ref(true)

const overview = ref({ totalItems: 0, totalValue: '¥0', monthIn: 0, monthOut: 0 })
const categoryDist = ref([])
const weekData     = ref([])
const zoneDist     = ref([])
const lowStockTop5 = ref([])

onMounted(async () => {
  try {
    const [products, records] = await Promise.all([
      list('products', {}, 'created_at', 'desc', 500, 1),
      list('stock_records', {}, 'created_at', 'desc', 500, 1),
    ])

    // 概览
    const totalValue = products.reduce((sum, p) => {
      const price = p.unit_price || 0
      return price > 0 ? sum + (p.quantity || 0) * price : sum
    }, 0)
    overview.value.totalItems = products.length
    overview.value.totalValue = '¥' + totalValue.toLocaleString('zh-CN', { maximumFractionDigits: 0 })

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    overview.value.monthIn  = records.filter(r => r.type === 'in'  && new Date(r.created_at) >= monthStart).length
    overview.value.monthOut = records.filter(r => r.type === 'out' && new Date(r.created_at) >= monthStart).length

    // 分类分布
    const catMap = {}
    products.forEach(p => {
      const c = p.category_l1 || '未分类'
      catMap[c] = (catMap[c] || 0) + 1
    })
    const total = products.length || 1
    categoryDist.value = Object.entries(catMap)
      .map(([name, count]) => ({ name, count, pct: Math.round(count / total * 100) }))
      .sort((a, b) => b.count - a.count)

    // 近7天出入库
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = `${d.getMonth()+1}/${d.getDate()}`
      const fullStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      days.push({ label: dateStr, full: fullStr })
    }
    weekData.value = days.map(day => {
      const dayIn  = records.filter(r => r.type === 'in'  && r.created_at && r.created_at.toString().substring(0,10) === day.full).length
      const dayOut = records.filter(r => r.type === 'out' && r.created_at && r.created_at.toString().substring(0,10) === day.full).length
      return { date: day.label, in: dayIn, out: dayOut }
    })

    // 区域分布
    const zoneMap = {}
    products.forEach(p => {
      const z = p.zone_name || '未设置'
      zoneMap[z] = (zoneMap[z] || 0) + 1
    })
    zoneDist.value = Object.entries(zoneMap)
      .map(([name, count]) => ({ name, count, pct: Math.round(count / total * 100) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // 低库存 TOP5（quantity 最少的5个）
    lowStockTop5.value = [...products]
      .filter(p => p.quantity !== undefined)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 5)

  } catch (e) {
    showToast('数据加载失败')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 20px; }
.loading-wrap { display: flex; justify-content: center; padding: 60px 0; }

.section-title {
  font-size: 14px; font-weight: 600; color: #333;
  padding: 12px 16px 6px;
}

/* 概览卡片 */
.overview-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 10px; padding: 0 12px 4px;
}
.ov-card {
  background: #fff; border-radius: 12px; padding: 16px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.06); text-align: center;
}
.ov-val { font-size: 22px; font-weight: 700; color: #1A6DFF; }
.ov-lbl { font-size: 12px; color: #999; margin-top: 4px; }

/* 通用卡片 */
.card {
  background: #fff; margin: 0 12px 4px; border-radius: 12px;
  padding: 14px; box-shadow: 0 1px 6px rgba(0,0,0,0.06);
}

/* 分布条 */
.dist-row {
  display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
}
.dist-name { min-width: 48px; font-size: 13px; color: #333; }
.dist-count { min-width: 28px; font-size: 12px; color: #999; text-align: right; }
.dist-bar-bg {
  flex: 1; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden;
}
.dist-bar-fill {
  height: 100%; background: #1A6DFF; border-radius: 4px; transition: width 0.4s;
}
.zone-fill { background: #00B578; }
.dist-pct { min-width: 32px; font-size: 11px; color: #bbb; text-align: right; }

/* 近7天表格 */
.week-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.week-table th { padding: 6px 8px; text-align: center; font-weight: 500; font-size: 12px; border-bottom: 1px solid #f0f0f0; }
.week-table td { padding: 8px; text-align: center; border-bottom: 1px solid #f8f8f8; }
.week-table tr:last-child td { border-bottom: none; }

/* 低库存 */
.rank-badge {
  width: 22px; height: 22px; border-radius: 50%; background: #1A6DFF;
  color: #fff; font-size: 12px; display: flex; align-items: center; justify-content: center;
  margin-right: 10px; flex-shrink: 0;
}
.low-qty { font-size: 14px; font-weight: 600; }
</style>
