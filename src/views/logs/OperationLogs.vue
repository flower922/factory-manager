<template>
  <div class="page">
    <NavBar title="操作日志" />

    <!-- 时间筛选 -->
    <van-tabs v-model:active="timeTab" @change="loadLogs">
      <van-tab title="近7天" />
      <van-tab title="近30天" />
      <van-tab title="全部" />
    </van-tabs>

    <!-- 用户筛选 -->
    <van-search v-model="userFilter" placeholder="按操作人搜索" @search="loadLogs" @clear="loadLogs" />

    <van-pull-refresh v-model="refreshing" @refresh="loadLogs">
      <van-list v-model:loading="loading" :finished="true">
        <div v-for="log in filteredLogs" :key="log._id" class="log-row">
          <div :class="['action-dot', actionColor(log.action)]"></div>
          <div class="log-body">
            <div class="log-main">
              <span :class="['action-tag', actionColor(log.action)]">{{ actionLabel(log.action) }}</span>
              <span class="log-target">{{ log.target_name }}</span>
            </div>
            <div class="log-detail">{{ log.detail }}</div>
            <div class="log-meta">{{ log.user_name }} · {{ formatDate(log.created_at) }}</div>
          </div>
        </div>
        <EmptyState v-if="!loading && !filteredLogs.length" text="暂无操作日志" icon="description" />
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { NavBar, EmptyState } from '@/components'
import { list } from '@/utils/api.js'

const timeTab    = ref(0)
const userFilter = ref('')
const loading    = ref(false)
const refreshing = ref(false)
const allLogs    = ref([])

onMounted(loadLogs)

async function loadLogs() {
  loading.value   = true
  refreshing.value = false
  try {
    allLogs.value = await list('operation_logs', {}, 'created_at', 'desc', 200, 1)
  } catch (e) { /* 静默 */ } finally {
    loading.value = false
  }
}

const filteredLogs = computed(() => {
  const now  = new Date()
  const days = [7, 30, Infinity][timeTab.value]
  const cutoff = new Date(now - days * 86400000)
  const kw = userFilter.value.trim()
  return allLogs.value.filter(log => {
    const inTime = days === Infinity || new Date(log.created_at) >= cutoff
    const inUser = !kw || log.user_name?.includes(kw)
    return inTime && inUser
  })
})

const colorMap = { in: 'green', out: 'red', update: 'blue', delete: 'gray', login: 'purple', apply: 'orange' }
const labelMap = { in: '入库', out: '出库', update: '修改', delete: '删除', login: '登录', apply: '申领' }
const actionColor = a => colorMap[a] || 'gray'
const actionLabel = a => labelMap[a] || a

function formatDate(d) {
  if (!d) return ''
  const dt = new Date(d)
  return `${dt.getMonth()+1}-${dt.getDate()} ${dt.getHours()}:${String(dt.getMinutes()).padStart(2,'0')}`
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 20px; }
.log-row {
  display: flex; gap: 10px; align-items: flex-start;
  background: #fff; margin: 6px 12px; padding: 12px;
  border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.action-dot {
  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 5px;
}
.log-body { flex: 1; }
.log-main { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.action-tag {
  font-size: 11px; padding: 1px 7px; border-radius: 10px; font-weight: 600;
}
.log-target { font-size: 13px; font-weight: 600; color: #333; }
.log-detail { font-size: 12px; color: #666; margin-bottom: 4px; }
.log-meta   { font-size: 11px; color: #bbb; }

.green  { background: #e8f5e9; color: #2e7d32; }
.red    { background: #fff0f0; color: #e53935; }
.blue   { background: #e3f2fd; color: #1565c0; }
.gray   { background: #f5f5f5; color: #888; }
.purple { background: #f3e5f5; color: #6a1b9a; }
.orange { background: #fff8f0; color: #e65100; }
.action-dot.green  { background: #00B578; }
.action-dot.red    { background: #e53935; }
.action-dot.blue   { background: #1A6DFF; }
.action-dot.gray   { background: #bbb; }
.action-dot.purple { background: #9c27b0; }
.action-dot.orange { background: #ff7a00; }
</style>
