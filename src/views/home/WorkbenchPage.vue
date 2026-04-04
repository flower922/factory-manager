<template>
  <div class="page">
    <NavBar title="待办工作台" />

    <!-- 待我处理 -->
    <div class="section-title">待我处理</div>
    <van-cell-group inset>
      <!-- 待审批申领（所有用户可见） -->
      <van-cell
        title="待审批申领"
        is-link
        @click="router.push('/stock/apply')"
      >
        <template #right-icon>
          <van-badge v-if="counts.pendingApply > 0" :content="counts.pendingApply" color="#ff7a00" />
          <span v-else style="color:#bbb;font-size:13px;">0</span>
        </template>
      </van-cell>

      <!-- 待审批采购（admin only） -->
      <van-cell
        v-if="isAdmin"
        title="待审批采购"
        is-link
        @click="router.push('/purchase/list')"
      >
        <template #right-icon>
          <van-badge v-if="counts.pendingPurchase > 0" :content="counts.pendingPurchase" color="#ff7a00" />
          <span v-else style="color:#bbb;font-size:13px;">0</span>
        </template>
      </van-cell>

      <!-- 未归还借用 -->
      <van-cell
        title="未归还借用"
        is-link
        @click="router.push('/stock/borrow')"
      >
        <template #right-icon>
          <van-badge v-if="counts.pendingBorrow > 0" :content="counts.pendingBorrow" color="#1A6DFF" />
          <span v-else style="color:#bbb;font-size:13px;">0</span>
        </template>
      </van-cell>
    </van-cell-group>

    <!-- 预警提醒 -->
    <div class="section-title">预警提醒</div>
    <van-cell-group inset>
      <van-cell
        title="已过期物品"
        is-link
        @click="router.push('/expiry/list')"
      >
        <template #right-icon>
          <van-badge v-if="counts.expired > 0" :content="counts.expired" color="#e53935" />
          <span v-else style="color:#bbb;font-size:13px;">0</span>
        </template>
      </van-cell>
      <van-cell
        title="即将到期物品"
        is-link
        @click="router.push('/expiry/list')"
      >
        <template #right-icon>
          <van-badge v-if="counts.expiring > 0" :content="counts.expiring" color="#ff7a00" />
          <span v-else style="color:#bbb;font-size:13px;">0</span>
        </template>
      </van-cell>
      <van-cell
        title="低库存物品"
        is-link
        @click="router.push('/items?status=low_stock')"
      >
        <template #right-icon>
          <van-badge v-if="counts.lowStock > 0" :content="counts.lowStock" color="#ff7a00" />
          <span v-else style="color:#bbb;font-size:13px;">0</span>
        </template>
      </van-cell>
    </van-cell-group>

    <!-- 最近操作 -->
    <div class="section-title">最近操作</div>
    <div class="card">
      <div v-if="!recentRecords.length" class="empty-text">暂无操作记录</div>
      <div
        v-for="(r, idx) in recentRecords"
        :key="r._id"
        class="timeline-item"
      >
        <div class="timeline-line" v-if="idx < recentRecords.length - 1"></div>
        <div :class="['timeline-dot', r.type === 'in' ? 'dot-in' : 'dot-out']"></div>
        <div class="timeline-content">
          <div class="tl-header">
            <span :class="['tl-type', r.type === 'in' ? 'type-in' : 'type-out']">
              {{ r.type === 'in' ? '入库' : '出库' }}
            </span>
            <span class="tl-name">{{ r.product_name }}</span>
          </div>
          <div class="tl-meta">
            <span>{{ r.operator }}</span>
            <span>数量：{{ r.quantity }}</span>
            <span>{{ formatTime(r.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { NavBar } from '@/components'
import { list } from '@/utils/api.js'
import { getCurrentUser, isAdmin as checkAdmin } from '@/utils/auth.js'

const router      = useRouter()
const isAdmin     = checkAdmin()
const currentUser = getCurrentUser()

const counts = reactive({
  pendingApply:    0,
  pendingPurchase: 0,
  pendingBorrow:   0,
  expired:         0,
  expiring:        0,
  lowStock:        0,
})

const recentRecords = ref([])

function formatTime(d) {
  if (!d) return ''
  const dt = new Date(d)
  return `${dt.getMonth()+1}/${dt.getDate()} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`
}

onMounted(async () => {
  try {
    const [products, stockRecords, purchaseReqs] = await Promise.all([
      list('products', {}, 'created_at', 'desc', 300, 1),
      list('stock_records', {}, 'created_at', 'desc', 50, 1),
      isAdmin ? list('purchase_requests', { status: 'pending' }, 'created_at', 'desc', 50, 1) : Promise.resolve([]),
    ])

    // 预警统计
    counts.expired  = products.filter(p => p.status === 'expired').length
    counts.expiring = products.filter(p => p.status === 'expiring').length
    counts.lowStock = products.filter(p => p.status === 'low_stock').length

    // 待审批申领（source=apply, apply_status=pending）
    counts.pendingApply = stockRecords.filter(
      r => r.source === 'apply' && r.apply_status === 'pending'
    ).length

    // 待审批采购
    counts.pendingPurchase = purchaseReqs.length

    // 未归还借用（source=borrow，没有对应 return 记录）
    counts.pendingBorrow = stockRecords.filter(r => r.source === 'borrow' && !r.returned).length

    // 最近5条记录
    recentRecords.value = stockRecords.slice(0, 5)
  } catch (e) {
    showToast('数据加载失败')
  }
})
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 20px; }

.section-title {
  font-size: 14px; font-weight: 600; color: #333;
  padding: 14px 16px 8px;
}

.card {
  background: #fff; margin: 0 12px; border-radius: 12px;
  padding: 14px; box-shadow: 0 1px 6px rgba(0,0,0,0.06);
}
.empty-text { color: #bbb; font-size: 13px; text-align: center; padding: 20px 0; }

/* 时间线 */
.timeline-item {
  display: flex; gap: 10px; position: relative; margin-bottom: 14px;
}
.timeline-item:last-child { margin-bottom: 0; }
.timeline-dot {
  width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; margin-top: 3px;
}
.dot-in  { background: #00B578; }
.dot-out { background: #e53935; }
.timeline-line {
  position: absolute; left: 5px; top: 16px;
  width: 2px; height: calc(100% + 2px); background: #f0f0f0;
}
.timeline-content { flex: 1; }
.tl-header { display: flex; align-items: center; gap: 8px; margin-bottom: 3px; }
.tl-type {
  font-size: 11px; padding: 1px 6px; border-radius: 6px; font-weight: 500;
}
.type-in  { background: #e8f5e9; color: #00B578; }
.type-out { background: #ffebee; color: #e53935; }
.tl-name  { font-size: 13px; font-weight: 500; color: #333; }
.tl-meta  { display: flex; gap: 10px; font-size: 11px; color: #999; flex-wrap: wrap; }
</style>
