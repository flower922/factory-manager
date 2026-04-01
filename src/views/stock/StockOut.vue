<template>
  <div class="page">
    <NavBar title="出库登记" />

    <div class="select-row">
      <van-button type="primary" icon="scan" style="flex:1;" @click="router.push('/scan?return=/stock/out')">扫码出库</van-button>
      <van-button plain icon="search" style="flex:1;" @click="showItemPicker = true">手动选择</van-button>
    </div>

    <!-- 管控品警告 -->
    <van-notice-bar v-if="selectedItem?.is_controlled" color="#ff6900" background="#fff7e6" left-icon="warning-o">
      ⚠ 该物品为管控品，请谨慎操作
    </van-notice-bar>

    <div v-if="selectedItem" class="selected-bar">
      ✅ 已选择：{{ selectedItem.name }}（{{ selectedItem.code }}）
    </div>

    <van-form @submit="onSubmit">
      <van-cell-group inset class="form-group">
        <van-field :model-value="selectedItem?.name || ''" label="物品名称" readonly placeholder="请先选择物品" />
        <van-field
          v-model="form.quantity"
          label="出库数量"
          type="digit"
          placeholder="请输入"
          :rules="[{ required: true, message: '请填写数量' }]"
        >
          <template #extra>
            <span v-if="selectedItem" class="stock-hint">当前库存：{{ selectedItem.quantity }}{{ selectedItem.unit }}</span>
          </template>
        </van-field>
        <!-- 库存不足提示 -->
        <div v-if="overStock" class="over-stock-tip">⚠ 库存不足，当前库存 {{ selectedItem.quantity }}{{ selectedItem.unit }}</div>

        <van-field v-model="form.operator" label="领用人" placeholder="请输入" :rules="[{ required: true, message: '请填写领用人' }]" />
        <van-field v-model="form.note" label="用途说明" placeholder="可选" />
        <van-field
          v-model="form.destination"
          label="去向区域"
          placeholder="请选择"
          readonly is-link
          @click="showZonePicker = true"
        />
      </van-cell-group>
      <div class="submit-btn">
        <van-button type="primary" block round size="large" native-type="submit" :loading="submitting" :disabled="overStock">
          确认出库
        </van-button>
      </div>
    </van-form>

    <!-- 手动选择物品弹窗 -->
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
          :label="item.code + ' · 库存：' + item.quantity + item.unit"
          @click="selectItem(item)"
        />
        <EmptyState v-if="!filteredItems.length" text="未找到物品" />
      </van-cell-group>
    </van-popup>

    <!-- 去向区域 Picker -->
    <van-popup v-model:show="showZonePicker" position="bottom" round>
      <van-picker
        :columns="zoneOptions"
        @confirm="v => { form.destination = v.selectedValues[0]; showZonePicker = false }"
        @cancel="showZonePicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { NavBar, EmptyState } from '@/components'
import { list, add, update, getById } from '@/utils/api.js'

const route  = useRoute()
const router = useRouter()

const selectedItem   = ref(null)
const allItems       = ref([])
const allZones       = ref([])
const searchKw       = ref('')
const showItemPicker = ref(false)
const showZonePicker = ref(false)
const submitting     = ref(false)

const form = reactive({ quantity: '', operator: '', note: '', destination: '' })

const filteredItems = computed(() => {
  const kw = searchKw.value.trim()
  if (!kw) return allItems.value
  return allItems.value.filter(p => p.name?.includes(kw) || p.code?.includes(kw))
})

const zoneOptions = computed(() => allZones.value.map(z => ({ text: z.name, value: z.name })))

// 是否超出库存
const overStock = computed(() =>
  selectedItem.value && Number(form.quantity) > selectedItem.value.quantity
)

onMounted(async () => {
  // 默认领用人为当前登录用户
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}')
  form.operator = user.name || ''

  try {
    const [items, zones] = await Promise.all([
      list('products', {}, 'created_at', 'desc', 100, 1),
      list('zones',    {}, 'created_at', 'asc',  50, 1),
    ])
    allItems.value = items
    allZones.value = zones
  } catch (e) { /* 静默 */ }

  if (route.query.product_id) {
    try {
      const item = await getById('products', route.query.product_id)
      if (item) selectedItem.value = item
    } catch (e) { /* 静默 */ }
  }
})

function selectItem(item) { selectedItem.value = item; showItemPicker.value = false }

async function onSubmit() {
  if (!selectedItem.value) { showToast('请选择物品'); return }
  if (overStock.value)     { showToast('库存不足'); return }
  submitting.value = true
  try {
    const item   = selectedItem.value
    const qty    = Number(form.quantity)
    const newQty = item.quantity - qty

    await update('products', item._id, { quantity: newQty })
    await add('stock_records', {
      product_id:   item._id,
      product_name: item.name,
      type:         'out',
      quantity:     qty,
      operator:     form.operator,
      destination:  form.destination,
      note:         form.note,
    })

    // 管控品额外写台账
    if (item.is_controlled) {
      await add('poison_records', {
        product_id:   item._id,
        product_name: item.name,
        type:         'out',
        quantity:     qty,
        unit:         item.unit,
        operator:     form.operator,
        purpose:      form.note,
        remaining:    newQty,
      })
    }

    showToast('出库成功')
    router.back()
  } catch (e) {
    showToast('出库失败，请重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 30px; }
.select-row { display: flex; gap: 10px; padding: 12px; }
.selected-bar { margin: 0 12px 8px; padding: 10px 14px; background: #e8f5e9; border-radius: 8px; color: #2e7d32; font-size: 13px; }
.stock-hint { font-size: 12px; color: #999; margin-left: 8px; }
.over-stock-tip { margin: 0 12px; padding: 8px 12px; color: #e53935; background: #ffebee; border-radius: 6px; font-size: 13px; }
.form-group { margin: 0 12px 12px; }
.submit-btn { padding: 16px 12px; }
.popup-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; font-size: 16px; font-weight: 600; border-bottom: 1px solid #f0f0f0; }
</style>
