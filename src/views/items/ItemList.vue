<template>
  <div class="page">
    <van-nav-bar title="物品列表" fixed placeholder>
      <template #right>
        <van-icon name="plus" size="20" @click="router.push('/items/add')" />
      </template>
    </van-nav-bar>

    <!-- 搜索栏 -->
    <van-search
      v-model="keyword"
      placeholder="搜索物品名称/编码"
      @search="onSearch"
      @clear="onClear"
    />

    <!-- 分类筛选 -->
    <van-tabs v-model:active="activeTab" @change="onTabChange" shrink>
      <van-tab v-for="cat in categories" :key="cat" :title="cat" />
    </van-tabs>

    <!-- 物品列表 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="listLoading"
        :finished="finished"
        finished-text="没有更多了"
        @load="loadMore"
      >
        <van-cell
          v-for="item in items"
          :key="item._id"
          :title="item.name"
          :label="item.code + '  ·  ' + (item.zone_name || '未设置位置')"
          is-link
          @click="router.push('/items/' + item._id)"
        >
          <template #icon>
            <div :class="['cat-icon', catColor(item.category_l1)]">
              {{ catEmoji(item.category_l1) }}
            </div>
          </template>
          <template #right-icon>
            <div class="right-col">
              <span class="qty">{{ item.quantity }}{{ item.unit }}</span>
              <StatusTag :status="item.status || 'normal'" />
            </div>
          </template>
        </van-cell>
        <EmptyState v-if="!listLoading && !items.length" text="暂无物品" />
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { StatusTag, EmptyState } from '@/components'
import { list } from '@/utils/api.js'

const route  = useRoute()
const router = useRouter()

const categories = ['全部', '原料', '试剂', '成品', '工具', '耗材', '劳保']
const activeTab  = ref(0)
const keyword    = ref(route.query.keyword || '')

const items       = ref([])
const pageNum     = ref(1)
const listLoading = ref(false)
const finished    = ref(false)
const refreshing  = ref(false)

// 分类颜色和emoji
const catColorMap = { 原料:'bg-blue', 试剂:'bg-purple', 成品:'bg-green', 工具:'bg-orange', 耗材:'bg-gray', 劳保:'bg-pink' }
const catEmojiMap = { 原料:'🧪', 试剂:'🔬', 成品:'📦', 工具:'🔧', 耗材:'📎', 劳保:'🦺' }
const catColor = c => catColorMap[c] || 'bg-gray'
const catEmoji = c => catEmojiMap[c] || '📦'

onMounted(() => {
  loadItems(true)
})

async function loadItems(reset = false) {
  if (reset) {
    pageNum.value = 1
    finished.value = false
    items.value = []
  }
  listLoading.value = true
  try {
    const where = buildWhere()
    const res = await list('products', where, 'created_at', 'desc', 20, pageNum.value)
    if (reset) {
      items.value = res
    } else {
      items.value.push(...res)
    }
    if (res.length < 20) finished.value = true
  } catch (e) {
    // 静默失败
  } finally {
    listLoading.value = false
    refreshing.value  = false
  }
}

function buildWhere() {
  const where = {}
  if (route.query.zone) where.zone_name = route.query.zone
  const cat = categories[activeTab.value]
  if (cat !== '全部') where.category_l1 = cat
  return where
}

async function loadMore() {
  pageNum.value++
  await loadItems(false)
}
function onRefresh()  { loadItems(true) }
function onSearch()   { loadItems(true) }
function onClear()    { keyword.value = ''; loadItems(true) }
function onTabChange(){ loadItems(true) }
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 20px; }
.cat-icon {
  width: 36px; height: 36px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; margin-right: 10px; flex-shrink: 0;
}
.bg-blue   { background: #e3f2fd; }
.bg-purple { background: #f3e5f5; }
.bg-green  { background: #e8f5e9; }
.bg-orange { background: #fff3e0; }
.bg-gray   { background: #f5f5f5; }
.bg-pink   { background: #fce4ec; }
.right-col { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.qty { font-size: 13px; font-weight: 600; color: #333; }
</style>
