<template>
  <div class="page">
    <NavBar title="维修记录">
      <template #right>
        <van-icon name="plus" size="20" @click="router.push('/repair/add')" />
      </template>
    </NavBar>

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="loadData"
      >
        <van-cell
          v-for="r in records"
          :key="r._id"
          :title="r.product_name"
          :label="r.issue_desc ? r.issue_desc.substring(0, 40) + (r.issue_desc.length > 40 ? '…' : '') : ''"
          @click="showDetail(r)"
        >
          <template #right-icon>
            <div class="right-col">
              <span :class="['status-badge', 'status-' + r.status]">{{ statusLabel(r.status) }}</span>
              <span class="repair-date">{{ r.repair_date || '' }}</span>
            </div>
          </template>
        </van-cell>
        <EmptyState v-if="!loading && !records.length" text="暂无维修记录" />
      </van-list>
    </van-pull-refresh>

    <!-- 详情弹窗 -->
    <van-popup
      v-model:show="showDetailPopup"
      position="bottom"
      round
      :style="{ height: '60%' }"
    >
      <div v-if="currentRecord" class="detail-popup">
        <div class="detail-header">
          <span>维修详情</span>
          <van-icon name="cross" @click="showDetailPopup = false" />
        </div>
        <van-cell-group>
          <van-cell title="物品" :value="currentRecord.product_name" />
          <van-cell title="故障描述" :value="currentRecord.issue_desc" />
          <van-cell title="状态" :value="statusLabel(currentRecord.status)" />
          <van-cell title="维修人" :value="currentRecord.repairer || '—'" />
          <van-cell title="维修费用" :value="currentRecord.repair_cost ? '¥' + currentRecord.repair_cost : '—'" />
          <van-cell title="维修日期" :value="currentRecord.repair_date || '—'" />
          <van-cell v-if="currentRecord.note" title="备注" :value="currentRecord.note" />
          <van-cell title="记录时间" :value="formatDate(currentRecord.created_at)" />
        </van-cell-group>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { NavBar, EmptyState } from '@/components'
import { list } from '@/utils/api.js'

const router          = useRouter()
const records         = ref([])
const loading         = ref(false)
const finished        = ref(false)
const refreshing      = ref(false)
const pageNum         = ref(1)
const showDetailPopup = ref(false)
const currentRecord   = ref(null)

const statusLabel = (s) => ({ repairing: '维修中', done: '已完成' }[s] || s)

function formatDate(d) {
  if (!d) return '—'
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`
}

onMounted(() => { loadData() })

async function loadData() {
  if (finished.value) return
  loading.value = true
  try {
    const res = await list('repair_records', {}, 'created_at', 'desc', 20, pageNum.value)
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

function onRefresh() {
  pageNum.value = 1
  finished.value = false
  records.value = []
  loadData()
}

function showDetail(r) {
  currentRecord.value = r
  showDetailPopup.value = true
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 20px; }
.right-col { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.status-badge {
  font-size: 11px; padding: 2px 6px; border-radius: 8px;
}
.status-repairing { background: #fff3e0; color: #ff7a00; }
.status-done      { background: #e8f5e9; color: #00B578; }
.repair-date { font-size: 11px; color: #bbb; }
.detail-popup { height: 100%; display: flex; flex-direction: column; }
.detail-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 16px; font-size: 16px; font-weight: 600; border-bottom: 1px solid #f0f0f0;
}
</style>
