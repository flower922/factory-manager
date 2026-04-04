<template>
  <div class="page">
    <NavBar title="申领审批">
      <template #right>
        <van-icon v-if="activeTab === 0" name="plus" size="20" @click="showApplyDialog = true" />
      </template>
    </NavBar>

    <van-tabs v-model:active="activeTab" @change="loadData">
      <van-tab title="我的申请" />
      <van-tab v-if="isAdmin" title="待我审批" />
    </van-tabs>

    <van-pull-refresh v-model="refreshing" @refresh="loadData">
      <van-list v-model:loading="listLoading" :finished="true">

        <!-- 我的申请列表 -->
        <template v-if="activeTab === 0">
          <div v-for="r in myApplies" :key="r._id" class="apply-row">
            <div class="apply-main">
              <div class="apply-name">{{ r.product_name }}</div>
              <div class="apply-meta">申请数量：{{ r.quantity }} · {{ formatDate(r.created_at) }}</div>
              <div class="apply-meta">用途：{{ r.note || '-' }}</div>
            </div>
            <van-tag :color="statusColor(r.apply_status)" round class="status-tag">
              {{ statusLabel(r.apply_status) }}
            </van-tag>
          </div>
          <EmptyState v-if="!listLoading && !myApplies.length" text="暂无申请记录" />
        </template>

        <!-- 待审批列表（管理员） -->
        <template v-if="activeTab === 1 && isAdmin">
          <div v-for="r in pendingApplies" :key="r._id" class="apply-row">
            <div class="apply-main">
              <div class="apply-name">{{ r.product_name }}</div>
              <div class="apply-meta">申请人：{{ r.operator }} · 数量：{{ r.quantity }}</div>
              <div class="apply-meta">用途：{{ r.note || '-' }}</div>
              <div class="apply-meta time">{{ formatDate(r.created_at) }}</div>
            </div>
            <div class="approve-btns">
              <van-button size="small" type="success" @click="approve(r)">✓ 通过</van-button>
              <van-button size="small" type="danger"  @click="openReject(r)">✗ 拒绝</van-button>
            </div>
          </div>
          <EmptyState v-if="!listLoading && !pendingApplies.length" text="暂无待审批申请" icon="like-o" />
        </template>

      </van-list>
    </van-pull-refresh>

    <!-- 新建申请弹窗 -->
    <van-dialog
      v-model:show="showApplyDialog"
      title="发起申领"
      show-cancel-button
      @confirm="submitApply"
    >
      <div class="dialog-form">
        <van-field
          v-model="applyForm.product_name"
          label="物品"
          placeholder="请选择"
          readonly is-link
          @click="showProductPicker = true"
        />
        <van-field v-model="applyForm.quantity" label="申请数量" type="digit" placeholder="请输入" />
        <van-field v-model="applyForm.note" label="用途说明" placeholder="请填写用途" />
      </div>
    </van-dialog>

    <!-- 拒绝原因弹窗 -->
    <van-dialog
      v-model:show="showRejectDialog"
      title="填写拒绝原因"
      show-cancel-button
      @confirm="confirmReject"
    >
      <div class="dialog-form">
        <van-field v-model="rejectReason" type="textarea" rows="3" placeholder="请填写拒绝原因" />
      </div>
    </van-dialog>

    <!-- 选择物品 -->
    <van-popup v-model:show="showProductPicker" position="bottom" round :style="{ height: '70%' }">
      <div class="popup-header">
        <span>选择物品</span>
        <van-icon name="cross" @click="showProductPicker = false" />
      </div>
      <van-search v-model="productSearchKw" placeholder="搜索物品" />
      <van-cell-group>
        <van-cell
          v-for="item in filteredProducts"
          :key="item._id"
          :title="item.name"
          :label="'库存：' + item.quantity + item.unit"
          @click="selectProduct(item)"
        />
      </van-cell-group>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { showToast } from 'vant'
import { NavBar, EmptyState } from '@/components'
import { list, add, update, getById } from '@/utils/api.js'

const activeTab   = ref(0)
const listLoading = ref(false)
const refreshing  = ref(false)
const myApplies     = ref([])
const pendingApplies= ref([])
const allProducts   = ref([])
const productSearchKw = ref('')

const showApplyDialog   = ref(false)
const showRejectDialog  = ref(false)
const showProductPicker = ref(false)
const rejectReason = ref('')
const rejectTarget = ref(null)

const applyForm = reactive({ product_id: '', product_name: '', quantity: '', note: '' })

// 当前用户信息
const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
const isAdmin = computed(() => currentUser.role === 'admin')

const filteredProducts = computed(() => {
  const kw = productSearchKw.value.trim()
  if (!kw) return allProducts.value
  return allProducts.value.filter(p => p.name?.includes(kw) || p.code?.includes(kw))
})

onMounted(async () => {
  try {
    allProducts.value = await list('products', {}, 'created_at', 'desc', 200, 1)
  } catch (e) { /* 静默 */ }
  loadData()
})

async function loadData() {
  listLoading.value = true
  refreshing.value  = false
  try {
    // 所有 source=apply 的记录
    const all = await list('stock_records', {}, 'created_at', 'desc', 100, 1)
    const applies = all.filter(r => r.source === 'apply')

    myApplies.value      = applies.filter(r => r.operator === currentUser.name)
    pendingApplies.value = applies.filter(r => r.apply_status === 'pending')
  } finally {
    listLoading.value = false
  }
}

function selectProduct(item) {
  applyForm.product_id   = item._id
  applyForm.product_name = item.name
  showProductPicker.value = false
}

async function submitApply() {
  if (!applyForm.product_id) { showToast('请选择物品'); return }
  if (!applyForm.quantity)   { showToast('请填写数量'); return }
  try {
    await add('stock_records', {
      product_id:   applyForm.product_id,
      product_name: applyForm.product_name,
      type:         'apply',
      quantity:     Number(applyForm.quantity),
      operator:     currentUser.name || '未知',
      source:       'apply',
      apply_status: 'pending',
      note:         applyForm.note,
    })
    showToast('申请已提交')
    Object.assign(applyForm, { product_id:'', product_name:'', quantity:'', note:'' })
    loadData()
  } catch (e) {
    showToast('提交失败')
  }
}

async function approve(record) {
  try {
    // 审批通过 → 扣减库存
    const product = await getById('products', record.product_id)
    if (product) {
      if (product.quantity < record.quantity) {
        showToast(`库存不足（当前 ${product.quantity}）`); return
      }
      await update('products', product._id, { quantity: product.quantity - record.quantity })
    }
    await update('stock_records', record._id, {
      apply_status: 'approved',
      approver:     currentUser.name || '管理员',
    })
    showToast('已审批通过')
    loadData()
  } catch (e) {
    showToast('操作失败')
  }
}

function openReject(record) {
  rejectTarget.value   = record
  rejectReason.value   = ''
  showRejectDialog.value = true
}

async function confirmReject() {
  if (!rejectReason.value.trim()) { showToast('请填写拒绝原因'); return }
  try {
    await update('stock_records', rejectTarget.value._id, {
      apply_status:  'rejected',
      reject_reason: rejectReason.value,
      approver:      currentUser.name || '管理员',
    })
    showToast('已拒绝')
    loadData()
  } catch (e) {
    showToast('操作失败')
  }
}

const statusColor = s => ({ pending:'#ff7a00', approved:'#00B578', rejected:'#e53935' }[s] || '#999')
const statusLabel = s => ({ pending:'待审批', approved:'已通过', rejected:'已拒绝' }[s] || s)

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 20px; }
.apply-row {
  display: flex; align-items: flex-start; gap: 10px;
  background: #fff; margin: 8px 12px; padding: 14px;
  border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.apply-main { flex: 1; }
.apply-name { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
.apply-meta { font-size: 12px; color: #888; margin-top: 3px; }
.apply-meta.time { color: #bbb; }
.status-tag { align-self: center; }
.approve-btns { display: flex; flex-direction: column; gap: 6px; align-self: center; }
.dialog-form { padding: 0 16px 8px; }
.popup-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; font-size: 16px; font-weight: 600; border-bottom: 1px solid #f0f0f0; }
</style>
