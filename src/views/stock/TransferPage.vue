<template>
  <div class="page">
    <NavBar title="移库操作" />

    <van-form @submit="onSubmit">
      <!-- 选择物品 -->
      <div class="select-row">
        <van-button plain block @click="showItemPicker = true">
          {{ selectedItem ? selectedItem.name : '点击选择物品' }}
        </van-button>
      </div>

      <!-- 当前位置信息 -->
      <div v-if="selectedItem" class="current-location">
        <van-icon name="location-o" color="#1A6DFF" />
        当前位置：{{ selectedItem.zone_name || '未设置' }}
        <span v-if="selectedItem.slot_id">· {{ selectedItem.slot_id }}</span>
        <span class="stock-info">库存：{{ selectedItem.quantity }}{{ selectedItem.unit }}</span>
      </div>

      <van-cell-group inset class="form-group">
        <van-field
          v-model="form.zone_name"
          label="移入区域"
          placeholder="请选择"
          readonly is-link
          @click="showZonePicker = true"
          :rules="[{ required: true, message: '请选择移入区域' }]"
        />
        <van-field
          v-if="isStorageZone"
          v-model="form.slot_id"
          label="移入库位"
          placeholder="请选择"
          readonly is-link
          @click="showSlotPicker = true"
        />
        <van-field
          v-model="form.quantity"
          label="移库数量"
          type="digit"
          placeholder="请输入"
          :rules="[{ required: true, message: '请填写数量' }]"
        />
        <van-field
          v-model="form.operator"
          label="操作人"
          placeholder="请输入"
          :rules="[{ required: true, message: '请填写操作人' }]"
        />
        <van-field v-model="form.note" label="备注" placeholder="可选" />
      </van-cell-group>

      <!-- 移库预览 -->
      <div v-if="selectedItem && form.zone_name" class="transfer-preview">
        <div class="preview-from">
          <van-icon name="location-o" />
          {{ selectedItem.zone_name || '未知' }}{{ selectedItem.slot_id ? ' · ' + selectedItem.slot_id : '' }}
        </div>
        <div class="preview-arrow">→</div>
        <div class="preview-to">
          <van-icon name="location-o" color="#1A6DFF" />
          {{ form.zone_name }}{{ form.slot_id ? ' · ' + form.slot_id : '' }}
        </div>
      </div>

      <div class="submit-btn">
        <van-button type="primary" block round size="large" native-type="submit" :loading="submitting">
          确认移库
        </van-button>
      </div>
    </van-form>

    <!-- 选择物品弹窗 -->
    <van-popup v-model:show="showItemPicker" position="bottom" round :style="{ height: '70%' }">
      <div class="popup-header">
        <span>选择物品</span>
        <van-icon name="cross" @click="showItemPicker = false" />
      </div>
      <van-search v-model="searchKw" placeholder="搜索物品名称/编码" />
      <van-cell-group>
        <van-cell
          v-for="item in filteredItems"
          :key="item._id"
          :title="item.name"
          :label="item.code + ' · ' + (item.zone_name || '无位置') + ' · 库存：' + item.quantity + item.unit"
          @click="selectItem(item)"
        />
        <EmptyState v-if="!filteredItems.length" text="未找到物品" />
      </van-cell-group>
    </van-popup>

    <!-- 区域选择 -->
    <van-popup v-model:show="showZonePicker" position="bottom" round>
      <van-picker
        :columns="zoneOptions"
        @confirm="onZoneConfirm"
        @cancel="showZonePicker = false"
      />
    </van-popup>

    <!-- 库位选择 -->
    <van-popup v-model:show="showSlotPicker" position="bottom" round>
      <van-picker
        :columns="slotOptions"
        @confirm="v => { form.slot_id = v.selectedValues[0]; showSlotPicker = false }"
        @cancel="showSlotPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { NavBar, EmptyState } from '@/components'
import { list, add, update } from '@/utils/api.js'

const router = useRouter()
const submitting = ref(false)

const allItems = ref([])
const allZones = ref([])
const allSlots = ref([])
const searchKw = ref('')

const showItemPicker = ref(false)
const showZonePicker = ref(false)
const showSlotPicker = ref(false)

const selectedItem = ref(null)
const form = reactive({ zone_name: '', slot_id: '', quantity: '', operator: '', note: '' })

const filteredItems = computed(() => {
  const kw = searchKw.value.trim()
  if (!kw) return allItems.value
  return allItems.value.filter(p => p.name?.includes(kw) || p.code?.includes(kw))
})

const zoneOptions = computed(() => allZones.value.map(z => ({ text: z.name, value: z.name })))

const isStorageZone = computed(() =>
  allZones.value.find(z => z.name === form.zone_name)?.has_slots || false
)

const slotOptions = computed(() =>
  allSlots.value
    .filter(s => s.zone_name === form.zone_name && s.status === 'empty')
    .map(s => ({ text: `${s.slot_id}（空）`, value: s.slot_id }))
)

onMounted(async () => {
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}')
  form.operator = user.name || ''
  try {
    const [items, zones, slots] = await Promise.all([
      list('products', {}, 'created_at', 'desc', 200, 1),
      list('zones',    {}, 'created_at', 'asc',  50, 1),
      list('slots',    {}, 'created_at', 'asc',  200, 1),
    ])
    allItems.value = items
    allZones.value = zones
    allSlots.value = slots
  } catch (e) { /* 静默 */ }
})

function selectItem(item) {
  selectedItem.value = item
  form.quantity = String(item.quantity)
  showItemPicker.value = false
}

function onZoneConfirm(v) {
  form.zone_name = v.selectedValues[0]
  form.slot_id   = ''
  showZonePicker.value = false
}

async function onSubmit() {
  if (!selectedItem.value) { showToast('请选择物品'); return }
  if (form.zone_name === selectedItem.value.zone_name) { showToast('移入区域与当前区域相同'); return }

  const qty = Number(form.quantity)
  if (qty > selectedItem.value.quantity) { showToast('移库数量超过库存'); return }

  submitting.value = true
  try {
    const oldZone = selectedItem.value.zone_name
    const item    = selectedItem.value

    // 更新物品位置
    await update('products', item._id, {
      zone_name: form.zone_name,
      slot_id:   form.slot_id || '',
    })

    // 写两条出入库记录
    await add('stock_records', {
      product_id:   item._id,
      product_name: item.name,
      type:         'out',
      quantity:     qty,
      operator:     form.operator,
      source:       'transfer',
      destination:  form.zone_name,
      note:         `移库：从 ${oldZone} 移出 · ${form.note}`,
    })
    await add('stock_records', {
      product_id:   item._id,
      product_name: item.name,
      type:         'in',
      quantity:     qty,
      operator:     form.operator,
      source:       'transfer',
      note:         `移库：从 ${oldZone} 移入 · ${form.note}`,
    })

    showToast('移库成功')
    router.back()
  } catch (e) {
    showToast('操作失败，请重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 30px; }
.select-row { padding: 12px; }
.current-location {
  margin: 0 12px 8px;
  padding: 10px 14px;
  background: #e3f2fd;
  border-radius: 8px;
  font-size: 13px;
  color: #1565c0;
  display: flex;
  align-items: center;
  gap: 6px;
}
.stock-info { margin-left: auto; color: #888; font-size: 12px; }
.form-group { margin: 0 12px 12px; }
.transfer-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 0 12px 12px;
  padding: 14px;
  background: #fff;
  border-radius: 10px;
  font-size: 13px;
}
.preview-from { color: #888; display: flex; align-items: center; gap: 4px; }
.preview-arrow { font-size: 20px; color: #1A6DFF; font-weight: 700; }
.preview-to { color: #1A6DFF; font-weight: 600; display: flex; align-items: center; gap: 4px; }
.submit-btn { padding: 16px 12px; }
.popup-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; font-size: 16px; font-weight: 600; border-bottom: 1px solid #f0f0f0; }
</style>
