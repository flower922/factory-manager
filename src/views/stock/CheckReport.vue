<template>
  <div class="page">
    <NavBar title="盘点报告" :left-arrow="false" />

    <van-loading v-if="loading" class="loading" />
    <template v-else>
      <!-- 统计卡片 -->
      <div class="stat-row">
        <StatCard label="盘点总数" :value="details.length" color="#1A6DFF" />
        <StatCard label="账实相符" :value="okCount"   color="#00B578" />
        <StatCard label="有差异"   :value="diffCount" color="#e53935" />
      </div>

      <!-- 差异明细 -->
      <div class="card">
        <div class="card-title">差异明细</div>
        <EmptyState v-if="!diffDetails.length" text="无差异，盘点结果完全一致" icon="like-o" />
        <div v-else>
          <div v-for="d in diffDetails" :key="d._id" class="diff-row">
            <div class="diff-name">{{ d.product_name }}</div>
            <div class="diff-change">
              账面 {{ d.book_quantity }} → 实际 {{ d.actual_quantity }}
              <span :class="d.diff > 0 ? 'text-blue' : 'text-red'">（{{ d.diff > 0 ? '+' : '' }}{{ d.diff }}）</span>
            </div>
            <div v-if="d.diff_reason" class="diff-reason">原因：{{ d.diff_reason }}</div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="btn-group">
        <van-button
          v-if="diffDetails.length"
          type="primary" block round
          :loading="adjusting"
          @click="adjustStock"
        >确认调整库存</van-button>
        <van-button plain block round style="margin-top:10px;" @click="router.push('/home')">
          {{ diffDetails.length ? '暂不调整' : '返回首页' }}
        </van-button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { NavBar, StatCard, EmptyState } from '@/components'
import { list, update } from '@/utils/api.js'

const route  = useRoute()
const router = useRouter()
const taskId = route.params.id

const loading  = ref(true)
const adjusting= ref(false)
const details  = ref([])

const diffDetails = computed(() => details.value.filter(d => d.diff !== 0))
const okCount     = computed(() => details.value.filter(d => d.diff === 0).length)
const diffCount   = computed(() => diffDetails.value.length)

onMounted(async () => {
  try {
    const res = await list('inventory_details', {}, 'created_at', 'asc', 200, 1)
    details.value = res.filter(d => d.task_id === taskId)
  } finally {
    loading.value = false
  }
})

async function adjustStock() {
  adjusting.value = true
  try {
    for (const d of diffDetails.value) {
      await update('products', d.product_id, { quantity: d.actual_quantity })
    }
    showToast('库存已调整')
    router.push('/home')
  } catch (e) {
    showToast('调整失败，请重试')
  } finally {
    adjusting.value = false
  }
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 30px; }
.loading { display: flex; justify-content: center; padding: 60px; }
.stat-row { display: flex; gap: 10px; padding: 12px; }
.card { background: #fff; margin: 0 12px 12px; border-radius: 10px; padding: 14px; box-shadow: 0 1px 6px rgba(0,0,0,0.06); }
.card-title { font-size: 14px; font-weight: 600; margin-bottom: 12px; }
.diff-row { padding: 10px 0; border-bottom: 1px solid #f5f5f5; }
.diff-name   { font-size: 14px; font-weight: 600; }
.diff-change { font-size: 13px; color: #555; margin-top: 4px; }
.diff-reason { font-size: 12px; color: #999; margin-top: 2px; }
.text-blue { color: #1A6DFF; font-weight: 600; }
.text-red  { color: #e53935; font-weight: 600; }
.btn-group { padding: 0 12px; }
</style>
