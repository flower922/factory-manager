<template>
  <div class="page">
    <van-nav-bar :title="'盘点执行'" fixed placeholder>
      <template #right>
        <van-icon name="scan" size="20" @click="router.push('/scan')" />
      </template>
    </van-nav-bar>

    <!-- 蓝色提示条 -->
    <div class="info-bar">
      <span>盘点范围：{{ taskInfo }}</span>
      <span>共 {{ items.length }} 件</span>
    </div>

    <!-- 进度 -->
    <div class="progress-bar">
      <span>已盘 {{ doneCount }} / {{ items.length }}</span>
      <van-progress :percentage="progressPct" stroke-width="6" style="flex:1; margin: 0 12px;" />
    </div>

    <!-- 物品列表 -->
    <van-loading v-if="loading" class="loading" />
    <div v-else class="item-list">
      <div v-for="(item, idx) in items" :key="item._id" class="check-row">
        <div class="check-info">
          <div class="check-name">{{ item.name }}</div>
          <div class="check-meta">{{ item.code }} · {{ item.slot_id || item.zone_name }}</div>
          <div class="check-book">账面：{{ item.quantity }}{{ item.unit }}</div>
        </div>
        <div class="check-input-wrap">
          <van-field
            v-model="actuals[idx]"
            type="digit"
            placeholder="实际"
            class="check-input"
            @input="onActualInput(idx)"
          />
          <!-- 差异显示 -->
          <div v-if="actuals[idx] !== ''" :class="['diff-tag', getDiff(idx) === 0 ? 'diff-ok' : 'diff-err']"
            @click="getDiff(idx) !== 0 && openReasonDialog(idx)">
            {{ getDiff(idx) === 0 ? '✓' : (getDiff(idx) > 0 ? '+' : '') + getDiff(idx) }}
          </div>
        </div>
      </div>
    </div>

    <div class="submit-btn">
      <van-button type="primary" block round size="large" :loading="submitting" @click="onSubmit">
        提交盘点结果
      </van-button>
    </div>

    <!-- 差异原因弹窗 -->
    <van-dialog v-model:show="showReasonDialog" title="填写差异原因" show-cancel-button @confirm="confirmReason">
      <div style="padding: 12px 16px;">
        <van-field v-model="currentReason" type="textarea" rows="3" placeholder="请说明差异原因" />
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getById, list, add, update } from '@/utils/api.js'

const route  = useRoute()
const router = useRouter()
const taskId = route.params.id

const loading    = ref(true)
const submitting = ref(false)
const task       = ref(null)
const items      = ref([])
const actuals    = ref([])   // 每行对应实际数量（字符串）
const reasons    = ref([])   // 每行对应差异原因

const showReasonDialog = ref(false)
const currentReasonIdx = ref(0)
const currentReason    = ref('')

const taskInfo = computed(() => {
  if (!task.value) return ''
  if (task.value.scope === 'all') return '全厂盘点'
  return task.value.zones?.join('、') || ''
})

const doneCount   = computed(() => actuals.value.filter(v => v !== '').length)
const progressPct = computed(() => items.value.length ? Math.round(doneCount.value / items.value.length * 100) : 0)

function getDiff(idx) {
  const actual = Number(actuals.value[idx])
  const book   = items.value[idx]?.quantity || 0
  return actual - book
}

onMounted(async () => {
  try {
    task.value  = await getById('inventory_tasks', taskId)
    // 加载需要盘点的物品
    let products
    if (task.value?.scope === 'all') {
      products = await list('products', {}, 'created_at', 'desc', 200, 1)
    } else {
      products = await list('products', {}, 'created_at', 'desc', 200, 1)
      if (task.value?.zones?.length) {
        products = products.filter(p => task.value.zones.includes(p.zone_name))
      }
    }
    items.value   = products
    actuals.value = products.map(() => '')
    reasons.value = products.map(() => '')
  } finally {
    loading.value = false
  }
})

function onActualInput() { /* 由 v-model 响应 */ }

function openReasonDialog(idx) {
  currentReasonIdx.value = idx
  currentReason.value    = reasons.value[idx]
  showReasonDialog.value = true
}
function confirmReason() {
  reasons.value[currentReasonIdx.value] = currentReason.value
}

async function onSubmit() {
  submitting.value = true
  try {
    // 写入盘点明细
    for (let i = 0; i < items.value.length; i++) {
      if (actuals.value[i] === '') continue
      const item   = items.value[i]
      const actual = Number(actuals.value[i])
      await add('inventory_details', {
        task_id:         taskId,
        product_id:      item._id,
        product_name:    item.name,
        slot_id:         item.slot_id || '',
        book_quantity:   item.quantity,
        actual_quantity: actual,
        diff:            actual - item.quantity,
        diff_reason:     reasons.value[i],
      })
    }
    // 更新任务状态
    await update('inventory_tasks', taskId, { status: 'done', finished_at: new Date() })
    showToast('提交成功')
    router.replace('/stock/check/report/' + taskId)
  } catch (e) {
    showToast('提交失败，请重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 80px; }
.info-bar { background: #1A6DFF; color: #fff; padding: 10px 16px; display: flex; justify-content: space-between; font-size: 13px; }
.progress-bar { display: flex; align-items: center; padding: 10px 16px; background: #fff; font-size: 12px; color: #888; gap: 8px; }
.loading { display: flex; justify-content: center; padding: 60px; }
.item-list { padding: 8px 12px; }
.check-row { display: flex; align-items: center; gap: 10px; background: #fff; border-radius: 8px; padding: 12px; margin-bottom: 8px; }
.check-info { flex: 1; }
.check-name { font-size: 14px; font-weight: 600; }
.check-meta { font-size: 12px; color: #999; margin-top: 2px; }
.check-book { font-size: 12px; color: #888; margin-top: 2px; }
.check-input-wrap { display: flex; align-items: center; gap: 6px; }
.check-input { width: 70px; border: 1px solid #ddd; border-radius: 6px; text-align: center; }
.diff-tag { min-width: 28px; height: 28px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; }
.diff-ok  { background: #e8f5e9; color: #2e7d32; }
.diff-err { background: #ffebee; color: #e53935; cursor: pointer; }
.submit-btn { position: fixed; bottom: 0; left: 0; right: 0; padding: 12px 16px; background: #fff; box-shadow: 0 -2px 8px rgba(0,0,0,0.06); }
</style>
