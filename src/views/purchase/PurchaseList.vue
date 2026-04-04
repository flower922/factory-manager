<template>
  <div class="page">
    <NavBar title="采购申请">
      <template #right>
        <van-icon name="plus" size="20" @click="router.push('/purchase/apply')" />
      </template>
    </NavBar>

    <!-- Tab -->
    <van-tabs v-model:active="activeTab" @change="loadData(true)">
      <van-tab title="我的申请" />
      <van-tab v-if="isAdmin" title="待审批" />
    </van-tabs>

    <!-- 列表 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="loadData"
      >
        <div
          v-for="item in records"
          :key="item._id"
          class="card"
        >
          <div class="card-header">
            <span class="product-name">{{ item.product_name }}</span>
            <span :class="['status-badge', 'status-' + item.status]">{{ statusLabel(item.status) }}</span>
          </div>
          <div class="card-body">
            <div class="info-row">
              <span class="info-label">数量</span>
              <span>{{ item.quantity }}{{ item.unit }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">供应商</span>
              <span>{{ item.supplier_name || '—' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">申请人</span>
              <span>{{ item.requester }}</span>
            </div>
            <div v-if="item.expected_date" class="info-row">
              <span class="info-label">预计到货</span>
              <span>{{ item.expected_date }}</span>
            </div>
            <div v-if="item.reason" class="info-row">
              <span class="info-label">原因</span>
              <span>{{ item.reason }}</span>
            </div>
          </div>
          <!-- 管理员审批按钮 -->
          <div v-if="isAdmin && item.status === 'pending'" class="card-actions">
            <van-button size="small" type="primary" @click="approve(item)">审批通过</van-button>
            <van-button size="small" type="danger" plain @click="reject(item)">驳回</van-button>
          </div>
          <!-- 已审批可标记到货 -->
          <div v-if="item.status === 'approved'" class="card-actions">
            <van-button size="small" type="success" @click="markReceived(item)">标记已到货</van-button>
          </div>
        </div>
        <EmptyState v-if="!loading && !records.length" text="暂无采购申请" />
      </van-list>
    </van-pull-refresh>

    <!-- 驳回原因弹窗 -->
    <van-dialog
      v-model:show="showRejectDialog"
      title="驳回原因"
      show-cancel-button
      :before-close="onRejectConfirm"
    >
      <div style="padding: 12px 16px;">
        <van-field
          v-model="rejectNote"
          type="textarea"
          rows="3"
          placeholder="请填写驳回原因"
        />
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { NavBar, EmptyState } from '@/components'
import { list, update, add, getById } from '@/utils/api.js'
import { getCurrentUser, isAdmin as checkAdmin } from '@/utils/auth.js'

const router    = useRouter()
const isAdmin   = checkAdmin()
const currentUser = getCurrentUser()

const activeTab  = ref(0)
const records    = ref([])
const loading    = ref(false)
const finished   = ref(false)
const refreshing = ref(false)
const pageNum    = ref(1)

const showRejectDialog = ref(false)
const rejectNote       = ref('')
const rejectTarget     = ref(null)

const statusLabel = (s) => ({ pending: '待审批', approved: '已审批', received: '已到货', rejected: '已驳回' }[s] || s)

onMounted(() => { loadData(true) })

async function loadData(reset = false) {
  if (reset) { pageNum.value = 1; finished.value = false; records.value = [] }
  if (finished.value) return
  loading.value = true
  try {
    // Tab0=我的申请，Tab1=待审批(admin)
    let where = {}
    if (activeTab.value === 0) {
      where = { requester: currentUser?.name || '' }
    } else {
      where = { status: 'pending' }
    }
    const res = await list('purchase_requests', where, 'created_at', 'desc', 20, pageNum.value)
    records.value.push(...res)
    if (res.length < 20) finished.value = true
    else pageNum.value++
  } catch (e) {
    showToast('加载失败')
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

function onRefresh() { loadData(true) }

async function approve(item) {
  try {
    await update('purchase_requests', item._id, { status: 'approved', approver: currentUser?.name || '' })
    item.status = 'approved'
    showToast('已审批通过')
  } catch (e) { showToast('操作失败') }
}

function reject(item) {
  rejectTarget.value = item
  rejectNote.value = ''
  showRejectDialog.value = true
}

async function onRejectConfirm(action) {
  if (action === 'cancel') return true
  try {
    await update('purchase_requests', rejectTarget.value._id, {
      status: 'rejected',
      approver: currentUser?.name || '',
      note: rejectNote.value,
    })
    rejectTarget.value.status = 'rejected'
    showToast('已驳回')
    return true
  } catch (e) {
    showToast('操作失败')
    return false
  }
}

async function markReceived(item) {
  try {
    await update('purchase_requests', item._id, { status: 'received' })
    item.status = 'received'

    // 触发入库：更新 products.quantity + 写 stock_records
    if (item.product_id) {
      const product = await getById('products', item.product_id)
      if (product) {
        await update('products', product._id, { quantity: (product.quantity || 0) + Number(item.quantity) })
      }
    }
    await add('stock_records', {
      product_id:   item.product_id,
      product_name: item.product_name,
      type:         'in',
      quantity:     Number(item.quantity),
      operator:     currentUser?.name || '',
      source:       'purchase',
      doc_number:   item._id,
      note:         '采购到货入库',
      created_at:   new Date(),
    })

    showToast('已标记到货并入库')
  } catch (e) { showToast('操作失败') }
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 20px; }
.card {
  background: #fff; margin: 10px 12px; border-radius: 12px;
  padding: 14px; box-shadow: 0 1px 6px rgba(0,0,0,0.06);
}
.card-header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;
}
.product-name { font-size: 15px; font-weight: 600; color: #333; }
.status-badge {
  font-size: 12px; padding: 2px 8px; border-radius: 10px; font-weight: 500;
}
.status-pending  { background: #fff3e0; color: #ff7a00; }
.status-approved { background: #e3f2fd; color: #1A6DFF; }
.status-received { background: #e8f5e9; color: #00B578; }
.status-rejected { background: #ffebee; color: #e53935; }
.card-body { font-size: 13px; color: #555; }
.info-row { display: flex; gap: 8px; margin-bottom: 4px; }
.info-label { color: #999; min-width: 56px; }
.card-actions { margin-top: 10px; display: flex; gap: 8px; justify-content: flex-end; }
</style>
