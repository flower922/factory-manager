<template>
  <div class="page">
    <NavBar :title="title" />

    <!-- 图例 -->
    <div class="legend">
      <span class="legend-item"><i class="dot blue"></i>已占用</span>
      <span class="legend-item"><i class="dot orange"></i>已满</span>
      <span class="legend-item"><i class="dot gray"></i>空位</span>
    </div>

    <!-- 库位网格 -->
    <van-loading v-if="loading" class="loading" />
    <div v-else class="grid">
      <div
        v-for="slot in slots"
        :key="slot._id"
        :class="['slot-cell', slot.status]"
        @click="onSlotClick(slot)"
      >
        <div class="slot-id">{{ slot.slot_id }}</div>
        <div class="slot-count">{{ slot.item_count }}件</div>
      </div>
    </div>

    <!-- 底部弹出：库位物品列表 -->
    <van-popup
      v-model:show="popupShow"
      position="bottom"
      round
      :style="{ maxHeight: '60vh' }"
    >
      <div class="popup-header">
        <span class="popup-title">库位 {{ activeSlot?.slot_id }}</span>
        <van-icon name="cross" @click="popupShow = false" />
      </div>
      <EmptyState v-if="!slotItems.length" text="该库位为空" />
      <van-cell-group v-else>
        <van-cell
          v-for="item in slotItems"
          :key="item._id"
          :title="item.name"
          :label="item.code + '  ·  ' + item.quantity + item.unit"
          is-link
          @click="onItemClick(item)"
        >
          <template #right-icon>
            <StatusTag :status="item.status" />
          </template>
        </van-cell>
      </van-cell-group>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { NavBar, StatusTag, EmptyState } from '@/components'
import { list } from '@/utils/api.js'

const route = useRoute()
const router = useRouter()

const zoneCode = decodeURIComponent(route.params.code || '')
const loading = ref(true)
const slots = ref([])
const allProducts = ref([])
const popupShow = ref(false)
const activeSlot = ref(null)

const title = computed(() => zoneCode ? `${zoneCode} · 库位地图` : '库位地图')

// 当前弹出库位的物品列表
const slotItems = computed(() => {
  if (!activeSlot.value) return []
  return allProducts.value.filter(p => p.slot_id === activeSlot.value.slot_id)
})

onMounted(async () => {
  try {
    const [slotsRes, productsRes] = await Promise.all([
      list('slots', {}, 'created_at', 'asc', 100, 1),
      list('products', {}, 'created_at', 'desc', 100, 1)
    ])
    // 按区域过滤库位
    slots.value = slotsRes.filter(s =>
      s.zone_name === zoneCode || s.zone_code === zoneCode
    )
    allProducts.value = productsRes
  } catch (e) {
    showToast('加载失败')
  } finally {
    loading.value = false
  }
})

function onSlotClick(slot) {
  activeSlot.value = slot
  if (slot.status === 'empty') {
    showToast('该库位为空')
    return
  }
  popupShow.value = true
}

function onItemClick(item) {
  popupShow.value = false
  router.push('/items/' + item._id)
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 20px; }
.loading { display: flex; justify-content: center; padding: 60px; }
.legend {
  display: flex;
  gap: 16px;
  padding: 8px 16px;
  background: #fff;
  font-size: 12px;
  color: #555;
}
.legend-item { display: flex; align-items: center; gap: 4px; }
.dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }
.dot.blue   { background: #4a90e2; }
.dot.orange { background: #FF7A00; }
.dot.gray   { background: #ccc; }

.grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  padding: 12px;
}
.slot-cell {
  aspect-ratio: 1;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 1.5px solid transparent;
  transition: transform 0.1s;
}
.slot-cell:active { transform: scale(0.95); }
.slot-cell.empty    { background: #f5f5f5; border-color: #ddd; }
.slot-cell.occupied { background: #e3f2fd; border-color: #4a90e2; }
.slot-cell.full     { background: #fff3e0; border-color: #FF7A00; }
.slot-id   { font-size: 11px; font-weight: 600; color: #333; }
.slot-count{ font-size: 10px; color: #888; margin-top: 2px; }

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid #f0f0f0;
}
</style>
