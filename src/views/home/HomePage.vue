<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { TabBar, StatCard, StatusTag, EmptyState } from '@/components'
import { count, list } from '@/utils/api.js'

const router = useRouter()

// 统计数据
const totalItems = ref('-')
const monthIn = ref('-')
const monthOut = ref('-')
const expiredCount = ref('-')
const expiringCount = ref('-')
const lowStockCount = ref('-')

// 到期预警列表（最多3条）
const warningList = ref([])
const loading = ref(true)

// 搜索关键词
const searchKeyword = ref('')

function handleSearch(val) {
  if (val) router.push(`/items?keyword=${encodeURIComponent(val)}`)
}

// 本月开始时间
function getMonthStart() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

onMounted(async () => {
  try {
    const db = (await import('@/utils/cloudbase.js')).db
    const _ = db.command

    // 并行获取各统计数字
    const [total, expired, expiring, lowStock] = await Promise.all([
      count('products'),
      count('products', { status: 'expired' }),
      count('products', { status: 'expiring' }),
      count('products', { status: 'low_stock' }),
    ])

    totalItems.value = total
    expiredCount.value = expired
    expiringCount.value = expiring
    lowStockCount.value = lowStock

    // 本月出入库统计
    const monthStart = getMonthStart()
    const [inCount, outCount] = await Promise.all([
      count('stock_records', { type: 'in', created_at: _.gte(monthStart) }),
      count('stock_records', { type: 'out', created_at: _.gte(monthStart) }),
    ])
    monthIn.value = inCount
    monthOut.value = outCount

    // 到期预警列表（过期+即将到期，最多3条）
    const warnings = await list(
      'products',
      { status: _.in(['expired', 'expiring']) },
      'expire_date',
      'asc',
      3,
      1
    )
    warningList.value = warnings
  } catch (e) {
    // 数据库未配置时静默失败，显示占位数据
    totalItems.value = '--'
    monthIn.value = '--'
    monthOut.value = '--'
    expiredCount.value = '--'
    expiringCount.value = '--'
    lowStockCount.value = '--'
  } finally {
    loading.value = false
  }
})

// 格式化到期日期显示
function formatExpiry(item) {
  if (!item.expire_date) return ''
  const expire = new Date(item.expire_date)
  const today = new Date()
  const diffDays = Math.ceil((expire - today) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return `已过期 ${Math.abs(diffDays)} 天`
  if (diffDays === 0) return '今天到期'
  return `${diffDays} 天后到期`
}
</script>

<template>
  <div class="home-page">
    <!-- 顶部蓝色区域 -->
    <div class="header">
      <!-- 标题行 -->
      <div class="header-top">
        <span class="header-title">实物管家</span>
        <van-icon
          name="bell"
          size="22"
          color="#fff"
          @click="router.push('/message')"
        />
      </div>

      <!-- 搜索栏 -->
      <van-search
        v-model="searchKeyword"
        placeholder="搜索物品名称/编码"
        background="transparent"
        shape="round"
        @search="handleSearch"
        class="header-search"
      />

      <!-- 顶部三个统计卡片 -->
      <div class="header-stats">
        <div class="mini-stat">
          <div class="mini-stat-value">{{ totalItems }}</div>
          <div class="mini-stat-label">物品总数</div>
        </div>
        <div class="mini-stat-divider" />
        <div class="mini-stat">
          <div class="mini-stat-value">{{ monthIn }}</div>
          <div class="mini-stat-label">本月入库</div>
        </div>
        <div class="mini-stat-divider" />
        <div class="mini-stat">
          <div class="mini-stat-value">{{ monthOut }}</div>
          <div class="mini-stat-label">本月出库</div>
        </div>
      </div>
    </div>

    <!-- 主体内容 -->
    <div class="content">
      <!-- 预警统计卡片行 -->
      <div class="stat-row">
        <StatCard
          label="过期预警"
          :value="expiredCount"
          color="#EE0A24"
          clickable
          @click="router.push('/expiry/list')"
        />
        <StatCard
          label="即将到期"
          :value="expiringCount"
          color="#FF976A"
          clickable
          @click="router.push('/expiry/list')"
        />
        <StatCard
          label="低库存"
          :value="lowStockCount"
          color="#FF976A"
        />
      </div>

      <!-- 到期预警列表 -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">⚠️ 到期预警</span>
          <span class="card-more" @click="router.push('/expiry/list')">查看全部 ›</span>
        </div>

        <div v-if="loading" class="loading-area">
          <van-loading size="24" />
        </div>
        <template v-else>
          <EmptyState v-if="warningList.length === 0" text="暂无到期预警" />
          <div
            v-for="item in warningList"
            :key="item._id"
            class="warning-item"
            :class="item.status === 'expired' ? 'expired-bg' : 'expiring-bg'"
            @click="router.push(`/items/${item._id}`)"
          >
            <div class="warning-info">
              <div class="warning-name">{{ item.name }}</div>
              <div class="warning-location">{{ item.zone_name }}{{ item.slot_id ? ` · ${item.slot_id}` : '' }}</div>
            </div>
            <div class="warning-right">
              <div class="warning-days">{{ formatExpiry(item) }}</div>
              <StatusTag :status="item.status" />
            </div>
          </div>
        </template>
      </div>

      <!-- 快捷操作 -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">快捷操作</span>
        </div>
        <div class="quick-grid">
          <div class="quick-btn" @click="router.push('/stock/in')">
            <div class="quick-icon">📥</div>
            <div class="quick-label">入库</div>
          </div>
          <div class="quick-btn" @click="router.push('/stock/out')">
            <div class="quick-icon">📤</div>
            <div class="quick-label">出库</div>
          </div>
          <div class="quick-btn" @click="router.push('/stock/check/create')">
            <div class="quick-icon">📊</div>
            <div class="quick-label">盘点</div>
          </div>
          <div class="quick-btn" @click="router.push('/map')">
            <div class="quick-icon">🗺</div>
            <div class="quick-label">地图</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部导航 -->
    <TabBar />
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 60px;
}

/* 顶部蓝色区域 */
.header {
  background: #1A6DFF;
  border-radius: 0 0 24px 24px;
  padding: 48px 16px 20px;
}
.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.header-title {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}
.header-search :deep(.van-search__content) {
  background: rgba(255, 255, 255, 0.25);
}
.header-search :deep(.van-field__control) {
  color: #fff;
}
.header-search :deep(.van-field__control::placeholder) {
  color: rgba(255, 255, 255, 0.7);
}
.header-search :deep(.van-icon) {
  color: rgba(255, 255, 255, 0.8);
}

/* 顶部三格统计 */
.header-stats {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 14px 0;
  margin-top: 12px;
}
.mini-stat {
  flex: 1;
  text-align: center;
}
.mini-stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
}
.mini-stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 2px;
}
.mini-stat-divider {
  width: 1px;
  height: 32px;
  background: rgba(255, 255, 255, 0.3);
}

/* 内容区域 */
.content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 预警统计行 */
.stat-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
}

/* 卡片通用 */
.card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}
.card-more {
  font-size: 13px;
  color: #1A6DFF;
  cursor: pointer;
}

/* 预警列表 */
.loading-area {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}
.warning-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
}
.warning-item:last-child {
  margin-bottom: 0;
}
.expired-bg { background: #fff1f0; }
.expiring-bg { background: #fff7e6; }
.warning-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}
.warning-location {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}
.warning-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}
.warning-days {
  font-size: 12px;
  color: #666;
}

/* 快捷操作网格 */
.quick-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.quick-btn {
  background: #f7f8fa;
  border-radius: 12px;
  padding: 18px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: background 0.2s;
}
.quick-btn:active {
  background: #eef2ff;
}
.quick-icon {
  font-size: 28px;
}
.quick-label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}
</style>
