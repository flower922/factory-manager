<template>
  <div class="page">
    <NavBar title="盘点历史" />

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="loadData"
      >
        <div
          v-for="task in tasks"
          :key="task._id"
          class="card"
          @click="onCardClick(task)"
        >
          <div class="card-header">
            <span class="scope">{{ task.scope || '全部区域' }}</span>
            <span :class="['status-badge', 'status-' + task.status]">{{ statusLabel(task.status) }}</span>
          </div>
          <div class="card-meta">
            <span>操作人：{{ task.operator }}</span>
            <span>创建：{{ formatDate(task.created_at) }}</span>
          </div>
          <div v-if="task.finished_at" class="card-meta">
            <span>完成：{{ formatDate(task.finished_at) }}</span>
          </div>
          <div v-if="task.zones && task.zones.length" class="zone-tags">
            <van-tag v-for="z in task.zones" :key="z" plain type="primary" style="margin-right:4px;margin-top:4px;">{{ z }}</van-tag>
          </div>
        </div>
        <EmptyState v-if="!loading && !tasks.length" text="暂无盘点记录" />
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { NavBar, EmptyState } from '@/components'
import { list } from '@/utils/api.js'

const router     = useRouter()
const tasks      = ref([])
const loading    = ref(false)
const finished   = ref(false)
const refreshing = ref(false)
const pageNum    = ref(1)

const statusLabel = (s) => ({ pending: '待开始', doing: '进行中', done: '已完成' }[s] || s)

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
    const res = await list('inventory_tasks', {}, 'created_at', 'desc', 20, pageNum.value)
    tasks.value.push(...res)
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
  tasks.value = []
  loadData()
}

function onCardClick(task) {
  if (task.status === 'done') {
    router.push('/stock/check/report/' + task._id)
  } else {
    router.push('/stock/check/exec/' + task._id)
  }
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 20px; }
.card {
  background: #fff; margin: 10px 12px; border-radius: 12px;
  padding: 14px; box-shadow: 0 1px 6px rgba(0,0,0,0.06); cursor: pointer;
}
.card:active { opacity: 0.8; }
.card-header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;
}
.scope { font-size: 15px; font-weight: 600; color: #333; }
.status-badge {
  font-size: 12px; padding: 2px 8px; border-radius: 10px; font-weight: 500;
}
.status-pending { background: #f5f5f5; color: #999; }
.status-doing   { background: #e3f2fd; color: #1A6DFF; }
.status-done    { background: #e8f5e9; color: #00B578; }
.card-meta {
  display: flex; gap: 16px; font-size: 12px; color: #999; margin-bottom: 4px;
}
.zone-tags { margin-top: 6px; }
</style>
