<template>
  <div class="page">
    <NavBar title="入库登记" />

    <!-- 选择物品按钮 -->
    <div class="select-row">
      <van-button type="primary" icon="scan" style="flex:1;" @click="router.push('/scan?return=/stock/in')">扫码入库</van-button>
      <van-button plain icon="search" style="flex:1;" @click="showItemPicker = true">手动选择</van-button>
    </div>

    <!-- 已选物品提示 -->
    <div v-if="selectedItem" class="selected-bar">
      ✅ 已选择：{{ selectedItem.name }}（{{ selectedItem.code }}）
    </div>

    <!-- 表单 -->
    <van-form @submit="onSubmit">
      <van-cell-group inset class="form-group">
        <van-field
          :model-value="selectedItem?.name || ''"
          label="物品名称"
          readonly
          placeholder="请先选择物品"
          :rules="[{ validator: () => !!selectedItem, message: '请选择物品' }]"
        />
        <van-field
          v-model="form.quantity"
          label="入库数量"
          type="digit"
          placeholder="请输入"
          :rules="[{ required: true, message: '请填写数量' }]"
        />
        <van-field
          v-model="form.source_label"
          label="来源"
          placeholder="请选择"
          readonly is-link
          @click="showSourcePicker = true"
        />
        <van-field v-model="form.doc_number" label="关联单据号" placeholder="可选" />
        <van-field v-model="form.note" label="备注" placeholder="可选" />
      </van-cell-group>
      <div class="submit-btn">
        <van-button type="primary" block round size="large" native-type="submit" :loading="submitting">
          确认入库
        </van-button>
      </div>
    </van-form>

    <!-- 手动选择物品弹窗 -->
    <van-popup v-model:show="showItemPicker" position="bottom" round :style="{ height: '70%' }">
      <div class="popup-header">
        <span>选择物品</span>
        <van-icon name="cross" @click="showItemPicker = false" />
      </div>
      <van-search v-model="searchKw" placeholder="搜索物品名称/编码" @search="filterItems" @input="filterItems" />
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

    <!-- 来源 Picker -->
    <van-popup v-model:show="showSourcePicker" position="bottom" round>
      <van-picker
        :columns="sourceOptions"
        @confirm="v => { form.source = v.selectedValues[0]; form.source_label = v.selectedOptions[0].text; showSourcePicker = false }"
        @cancel="showSourcePicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showDialog } from 'vant'
import { NavBar, EmptyState } from '@/components'
import { list, add, update, getById } from '@/utils/api.js'

const route  = useRoute()
const router = useRouter()

const selectedItem   = ref(null)
const allItems       = ref([])
const searchKw       = ref('')
const showItemPicker = ref(false)
const showSourcePicker = ref(false)
const submitting     = ref(false)

const form = reactive({
  quantity: '', source: 'purchase', source_label: '采购入库', doc_number: '', note: ''
})

const sourceOptions = [
  { text: '采购入库', value: 'purchase' },
  { text: '退还入库', value: 'return' },
  { text: '调拨入库', value: 'transfer' },
]

const filteredItems = computed(() => {
  const kw = searchKw.value.trim()
  if (!kw) return allItems.value
  return allItems.value.filter(p => p.name?.includes(kw) || p.code?.includes(kw))
})

onMounted(async () => {
  try {
    allItems.value = await list('products', {}, 'created_at', 'desc', 100, 1)
  } catch (e) { /* 静默 */ }

  // 从扫码页返回时，通过 query.product_id 自动填充
  if (route.query.product_id) {
    try {
      const item = await getById('products', route.query.product_id)
      if (item) selectedItem.value = item
    } catch (e) { /* 静默 */ }
  }
})

function filterItems() { /* 由 computed 响应式处理 */ }

function selectItem(item) {
  selectedItem.value = item
  showItemPicker.value = false
}

async function onSubmit() {
  if (!selectedItem.value) { showToast('请选择物品'); return }
  submitting.value = true
  try {
    const item    = selectedItem.value
    const qty     = Number(form.quantity)
    const newQty  = item.quantity + qty

    // 更新物品库存
    await update('products', item._id, { quantity: newQty })

    // 新增出入库记录
    await add('stock_records', {
      product_id:   item._id,
      product_name: item.name,
      type:         'in',
      quantity:     qty,
      operator:     JSON.parse(localStorage.getItem('currentUser') || '{}').name || '未知',
      source:       form.source,
      doc_number:   form.doc_number,
      note:         form.note,
    })

    showToast('入库成功')
    // 提示是否继续
    try {
      await showDialog({ title: '入库成功', message: `${item.name} 已入库 ${qty}${item.unit}，是否继续入库？`, confirmButtonText: '继续入库', cancelButtonText: '返回' })
      selectedItem.value = null
      Object.assign(form, { quantity: '', source: 'purchase', source_label: '采购入库', doc_number: '', note: '' })
      allItems.value = await list('products', {}, 'created_at', 'desc', 100, 1)
    } catch (e) {
      router.back()
    }
  } catch (e) {
    showToast('入库失败，请重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 30px; }
.select-row { display: flex; gap: 10px; padding: 12px; }
.selected-bar { margin: 0 12px 8px; padding: 10px 14px; background: #e8f5e9; border-radius: 8px; color: #2e7d32; font-size: 13px; }
.form-group { margin: 0 12px 12px; }
.submit-btn { padding: 16px 12px; }
.popup-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; font-size: 16px; font-weight: 600; border-bottom: 1px solid #f0f0f0; }
</style>
