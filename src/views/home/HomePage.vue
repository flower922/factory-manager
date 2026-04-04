<template>
  <div class="page">
    <!-- 顶部蓝色区域 -->
    <div class="header-area">
      <div class="header-top">
        <span class="app-title">实物管家</span>
        <van-icon name="bell" size="22" color="#fff" @click="router.push('/message')" />
      </div>
      <van-search
        v-model="searchKw"
        placeholder="搜索物品名称/编码"
        class="header-search"
        @search="onSearch"
      />
      <!-- 三个统计卡片 -->
      <div class="stat-row">
        <div class="stat-card">
          <div class="stat-val">{{ stats.total }}</div>
          <div class="stat-lbl">物品总数</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">{{ stats.monthIn }}</div>
          <div class="stat-lbl">本月入库</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">{{ stats.monthOut }}</div>
          <div class="stat-lbl">本月出库</div>
        </div>
      </div>
    </div>

    <!-- 预警统计 -->
    <div class="warn-row">
      <StatCard label="已过期"   :value="stats.expired"  color="#e53935" :clickable="true" @click="router.push('/expiry/list')" />
      <StatCard label="即将到期" :value="stats.expiring" color="#ff7a00" :clickable="true" @click="router.push('/expiry/list')" />
      <StatCard label="低库存"   :value="stats.lowStock" color="#ff7a00" />
    </div>

    <!-- 到期预警列表 -->
    <div class="card" v-if="expiryList.length">
      <div class="card-title-row">
        <span class="card-title">⚠️ 到期预警</span>
        <span class="card-more" @click="router.push('/expiry/list')">查看全部 ›</span>
      </div>
      <div
        v-for="item in expiryList"
        :key="item._id"
        :class="['expiry-item', item.status === 'expired' ? 'expired' : 'expiring']"
        @click="router.push('/items/' + item._id)"
      >
        <div class="expiry-info">
          <div class="expiry-name">{{ item.name }}</div>
          <div class="expiry-loc">{{ item.zone_name }}</div>
        </div>
        <StatusTag :status="item.status" />
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="card">
      <div class="card-title">快捷操作</div>
      <div class="quick-grid">
        <div class="quick-btn" @click="router.push('/stock/in')">
          <div class="quick-icon">📥</div><div class="quick-lbl">入库</div>
        </div>
        <div class="quick-btn" @click="router.push('/stock/out')">
          <div class="quick-icon">📤</div><div class="quick-lbl">出库</div>
        </div>
        <div class="quick-btn" @click="router.push('/stock/borrow')">
          <div class="quick-icon">🔧</div><div class="quick-lbl">借用</div>
        </div>
        <div class="quick-btn" @click="router.push('/stock/transfer')">
          <div class="quick-icon">🔄</div><div class="quick-lbl">移库</div>
        </div>
        <div class="quick-btn" @click="router.push('/stock/apply')">
          <div class="quick-icon">📋</div><div class="quick-lbl">申领</div>
        </div>
        <div class="quick-btn" @click="router.push('/stock/check/create')">
          <div class="quick-icon">📊</div><div class="quick-lbl">盘点</div>
        </div>
        <div class="quick-btn" @click="router.push('/map')">
          <div class="quick-icon">🗺</div><div class="quick-lbl">地图</div>
        </div>
        <div class="quick-btn" @click="router.push('/scan')">
          <div class="quick-icon">📷</div><div class="quick-lbl">扫码</div>
        </div>
      </div>
    </div>

    <TabBar />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { StatCard, StatusTag, TabBar } from '@/components'
import { list, count } from '@/utils/api.js'

const router   = useRouter()
const searchKw = ref('')

const stats = reactive({
  total: 0, monthIn: 0, monthOut: 0,
  expired: 0, expiring: 0, lowStock: 0
})
const expiryList = ref([])

onMounted(async () => {
  try {
    const [products, records] = await Promise.all([
      list('products', {}, 'created_at', 'desc', 200, 1),
      list('stock_records', {}, 'created_at', 'desc', 200, 1),
    ])

    stats.total    = products.length
    stats.expired  = products.filter(p => p.status === 'expired').length
    stats.expiring = products.filter(p => p.status === 'expiring').length
    stats.lowStock = products.filter(p => p.status === 'low_stock').length

    expiryList.value = products
      .filter(p => p.status === 'expired' || p.status === 'expiring')
      .sort((a, b) => new Date(a.expire_date) - new Date(b.expire_date))
      .slice(0, 3)

    // 本月统计
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    stats.monthIn  = records.filter(r => r.type === 'in'  && new Date(r.created_at) >= monthStart).length
    stats.monthOut = records.filter(r => r.type === 'out' && new Date(r.created_at) >= monthStart).length
  } catch (e) { /* CloudBase 未配置时静默 */ }
})

function onSearch() {
  if (searchKw.value.trim()) {
    router.push('/items?keyword=' + encodeURIComponent(searchKw.value.trim()))
  }
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 80px; }

/* 顶部蓝色区域 */
.header-area {
  background: #1A6DFF;
  border-radius: 0 0 20px 20px;
  padding: 16px 16px 20px;
}
.header-top {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 12px;
}
.app-title { font-size: 18px; font-weight: 700; color: #fff; }
.header-search { background: rgba(255,255,255,0.2); border-radius: 20px; margin-bottom: 14px; }
.stat-row { display: flex; gap: 10px; }
.stat-card {
  flex: 1; background: rgba(255,255,255,0.2);
  border-radius: 10px; padding: 10px 0; text-align: center;
}
.stat-val { font-size: 22px; font-weight: 700; color: #fff; }
.stat-lbl { font-size: 11px; color: rgba(255,255,255,0.8); margin-top: 2px; }

/* 预警统计 */
.warn-row { display: flex; gap: 10px; padding: 12px 12px 0; }

/* 卡片 */
.card {
  background: #fff; margin: 12px; border-radius: 12px;
  padding: 14px; box-shadow: 0 1px 6px rgba(0,0,0,0.06);
}
.card-title { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 12px; display: block; }
.card-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.card-more { font-size: 12px; color: #1A6DFF; }

/* 到期预警列表 */
.expiry-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 10px; border-radius: 8px; margin-bottom: 6px; cursor: pointer;
}
.expiry-item.expired  { background: #fff0f0; }
.expiry-item.expiring { background: #fff8f0; }
.expiry-name { font-size: 13px; font-weight: 600; }
.expiry-loc  { font-size: 12px; color: #999; margin-top: 2px; }

/* 快捷操作网格 */
.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.quick-btn {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 12px 0; background: #f7f8fc; border-radius: 10px; cursor: pointer;
}
.quick-btn:active { opacity: 0.7; }
.quick-icon { font-size: 24px; }
.quick-lbl  { font-size: 12px; color: #555; }
</style>
