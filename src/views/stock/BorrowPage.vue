<template>
  <div class="page">
    <NavBar title="借用/归还" />

    <van-tabs v-model:active="activeTab">
      <van-tab title="借出登记" />
      <van-tab title="归还登记" />
    </van-tabs>

    <!-- 借出登记 -->
    <van-form v-if="activeTab === 0" @submit="onBorrowSubmit">
      <div class="select-row">
        <van-button plain block @click="showItemPicker = true">
          {{ borrowForm.product_name || '点击选择工具/耗材' }}
        </van-button>
      </div>
      <div v-if="borrowItem" class="selected-bar">
        ✅ {{ borrowItem.name }} · 当前库存：{{ borrowItem.quantity }}{{ borrowItem.unit }}
      </div>

      <van-cell-group inset class="form-group">
        <van-field
          v-model="borrowForm.operator"
          label="借用人"
          placeholder="请输入姓名"
          :rules="[{ required: true, message: '请填写借用人' }]"
        />
        <van-field
          v-model="borrowForm.quantity"
          label="借用数量"
          type="digit"
          placeholder="请输入"
          :rules="[{ required: true, message: '请填写数量' }]"
        />
        <van-field
          v-model="borrowForm.return_date"
          label="预计归还"
          placeholder="请选择日期"
          readonly is-link
          @click="showReturnDatePicker = true"
        />
        <van-field v-model="borrowForm.note" label="用途说明" placeholder="可选" />
      </van-cell-group>

      <div class="submit-btn">
        <van-button type="primary" block round size="large" native-type="submit" :loading="submitting">
          确认借出
        </van-button>
      </div>
    </van-form>

    <!-- 归还登记 -->
    <van-form v-else @submit="onReturnSubmit">
      <div class="select-row">
        <van-button plain block @click="showReturnItemPicker = true">
          {{ returnForm.product_name || '点击选择归还的物品' }}
        </van-button>
      </div>
      <div v-if="returnItem" class="selected-bar">
        ✅ {{ returnItem.name }} · 当前库存：{{ returnItem.quantity }}{{ returnItem.unit }}
      </div>

      <van-cell-group inset class="form-group">
        <van-field
          v-model="returnForm.operator"
          label="归还人"
          placeholder="请输入姓名"
          :rules="[{ required: true, message: '请填写归还人' }]"
        />
        <van-field
          v-model="returnForm.quantity"
          label="归还数量"
          type="digit"
          placeholder="请输入"
          :rules="[{ required: true, message: '请填写数量' }]"
        />
        <van-field v-model="returnForm.note" label="备注" placeholder="可选" />
      </van-cell-group>

      <div class="submit-btn">
        <van-button type="primary" block round size="large" native-type="submit" :loading="submitting">
          确认归还
        </van-button>
      </div>
    </van-form>

    <!-- 选择工具弹窗（借出） -->
    <van-popup v-model:show="showItemPicker" position="bottom" round :style="{ height: '70%' }">
      <div class="popup-header">
        <span>选择工具/耗材</span>
        <van-icon name="cross" @click="showItemPicker = false" />
      </div>
      <van-search v-model="searchKw" placeholder="搜索物品" />
      <van-cell-group>
        <van-cell
          v-for="item in filteredItems"
          :key="item._id"
          :title="item.name"
          :label="item.code + ' · 库存：' + item.quantity + item.unit"
          @click="selectBorrowItem(item)"
        />
        <EmptyState v-if="!filteredItems.length" text="未找到工具/耗材" />
      </van-cell-group>
    </van-popup>

    <!-- 选择物品弹窗（归还） -->
    <van-popup v-model:show="showReturnItemPicker" position="bottom" round :style="{ height: '70%' }">
      <div class="popup-header">
        <span>选择归还物品</span>
        <van-icon name="cross" @click="showReturnItemPicker = false" />
      </div>
      <van-search v-model="returnSearchKw" placeholder="搜索物品" />
      <van-cell-group>
        <van-cell
          v-for="item in filteredReturnItems"
          :key="item._id"
          :title="item.name"
          :label="item.code + ' · 库存：' + item.quantity + item.unit"
          @click="selectReturnItem(item)"
        />
        <EmptyState v-if="!filteredReturnItems.length" text="未找到物品" />
      </van-cell-group>
    </van-popup>

    <!-- 归还日期选择 -->
    <van-popup v-model:show="showReturnDatePicker" position="bottom" round>
      <van-date-picker
        @confirm="v => { borrowForm.return_date = v.selectedValues.join('-'); showReturnDatePicker = false }"
        @cancel="showReturnDatePicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { showToast } from 'vant'
import { NavBar, EmptyState } from '@/components'
import { list, add, update, getById } from '@/utils/api.js'

const route = useRoute()
const activeTab = ref(0)
const submitting = ref(false)

// 所有工具耗材
const allItems   = ref([])
const searchKw   = ref('')
const returnSearchKw = ref('')

const showItemPicker       = ref(false)
const showReturnItemPicker = ref(false)
const showReturnDatePicker = ref(false)

// 借出表单
const borrowItem = ref(null)
const borrowForm = reactive({
  product_id: '', product_name: '', quantity: '1',
  operator: '', return_date: '', note: ''
})

// 归还表单
const returnItem = ref(null)
const returnForm = reactive({
  product_id: '', product_name: '', quantity: '1',
  operator: '', note: ''
})

// 只显示工具和耗材
const filteredItems = computed(() => {
  const kw = searchKw.value.trim()
  return allItems.value.filter(p =>
    ['工具', '耗材'].includes(p.category_l1) &&
    (!kw || p.name?.includes(kw) || p.code?.includes(kw))
  )
})

const filteredReturnItems = computed(() => {
  const kw = returnSearchKw.value.trim()
  return allItems.value.filter(p =>
    !kw || p.name?.includes(kw) || p.code?.includes(kw)
  )
})

onMounted(async () => {
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}')
  borrowForm.operator = user.name || ''
  returnForm.operator = user.name || ''

  try {
    allItems.value = await list('products', {}, 'created_at', 'desc', 200, 1)
  } catch (e) { /* 静默 */ }

  // 从物品详情页跳转时自动填充
  if (route.query.product_id) {
    try {
      const item = await getById('products', route.query.product_id)
      if (item) selectBorrowItem(item)
    } catch (e) { /* 静默 */ }
  }
})

function selectBorrowItem(item) {
  borrowItem.value = item
  borrowForm.product_id   = item._id
  borrowForm.product_name = item.name
  showItemPicker.value = false
}

function selectReturnItem(item) {
  returnItem.value = item
  returnForm.product_id   = item._id
  returnForm.product_name = item.name
  showReturnItemPicker.value = false
}

async function onBorrowSubmit() {
  if (!borrowItem.value) { showToast('请选择物品'); return }
  const qty = Number(borrowForm.quantity)
  if (qty > borrowItem.value.quantity) { showToast('库存不足'); return }
  submitting.value = true
  try {
    await update('products', borrowItem.value._id, { quantity: borrowItem.value.quantity - qty })
    await add('stock_records', {
      product_id:   borrowItem.value._id,
      product_name: borrowItem.value.name,
      type:         'out',
      quantity:     qty,
      operator:     borrowForm.operator,
      source:       'borrow',
      note:         `借用 · 预计归还：${borrowForm.return_date || '未填'} · ${borrowForm.note}`,
    })
    showToast('借出登记成功')
    // 重置表单
    borrowItem.value = null
    Object.assign(borrowForm, { product_id:'', product_name:'', quantity:'1', return_date:'', note:'' })
    allItems.value = await list('products', {}, 'created_at', 'desc', 200, 1)
  } catch (e) {
    showToast('操作失败，请重试')
  } finally {
    submitting.value = false
  }
}

async function onReturnSubmit() {
  if (!returnItem.value) { showToast('请选择物品'); return }
  const qty = Number(returnForm.quantity)
  submitting.value = true
  try {
    await update('products', returnItem.value._id, { quantity: returnItem.value.quantity + qty })
    await add('stock_records', {
      product_id:   returnItem.value._id,
      product_name: returnItem.value.name,
      type:         'in',
      quantity:     qty,
      operator:     returnForm.operator,
      source:       'return',
      note:         `归还 · ${returnForm.note}`,
    })
    showToast('归还登记成功')
    returnItem.value = null
    Object.assign(returnForm, { product_id:'', product_name:'', quantity:'1', note:'' })
    allItems.value = await list('products', {}, 'created_at', 'desc', 200, 1)
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
.selected-bar { margin: 0 12px 8px; padding: 10px 14px; background: #e8f5e9; border-radius: 8px; color: #2e7d32; font-size: 13px; }
.form-group { margin: 0 12px 12px; }
.submit-btn { padding: 16px 12px; }
.popup-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; font-size: 16px; font-weight: 600; border-bottom: 1px solid #f0f0f0; }
</style>
