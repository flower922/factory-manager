<template>
  <div class="page">
    <NavBar title="发起采购申请" />

    <van-form @submit="onSubmit">
      <van-cell-group inset class="form-group">
        <!-- 申请物品 -->
        <van-field
          :model-value="selectedProduct?.name || ''"
          label="申请物品"
          placeholder="请选择物品"
          readonly is-link
          :rules="[{ validator: () => !!selectedProduct, message: '请选择物品' }]"
          @click="showProductPicker = true"
        />
        <van-field
          v-if="selectedProduct"
          :model-value="'当前库存：' + selectedProduct.quantity + (selectedProduct.unit || '')"
          label="库存情况"
          readonly
        />

        <!-- 申请数量 -->
        <van-field
          v-model="form.quantity"
          label="申请数量"
          type="digit"
          placeholder="请输入数量"
          :rules="[{ required: true, message: '请填写数量' }]"
        >
          <template #button>
            <span style="color:#999;font-size:13px;">{{ selectedProduct?.unit || '' }}</span>
          </template>
        </van-field>

        <!-- 供应商 -->
        <van-field
          :model-value="selectedSupplier?.name || ''"
          label="供应商"
          placeholder="请选择供应商（可选）"
          readonly is-link
          @click="showSupplierPicker = true"
        />

        <!-- 预计到货日期 -->
        <van-field
          :model-value="form.expected_date"
          label="预计到货"
          placeholder="请选择日期（可选）"
          readonly is-link
          @click="showDatePicker = true"
        />

        <!-- 申请原因 -->
        <van-field
          v-model="form.reason"
          label="申请原因"
          type="textarea"
          rows="3"
          placeholder="请填写申请原因"
          show-word-limit
          maxlength="200"
        />
      </van-cell-group>

      <div class="submit-btn">
        <van-button type="primary" block round size="large" native-type="submit" :loading="submitting">
          提交申请
        </van-button>
      </div>
    </van-form>

    <!-- 选择物品弹窗 -->
    <van-popup v-model:show="showProductPicker" position="bottom" round :style="{ height: '70%' }">
      <div class="popup-header">
        <span>选择物品</span>
        <van-icon name="cross" @click="showProductPicker = false" />
      </div>
      <van-search v-model="productKw" placeholder="搜索物品" @input="() => {}" />
      <van-cell-group>
        <van-cell
          v-for="p in filteredProducts"
          :key="p._id"
          :title="p.name"
          :label="p.code + '  ·  库存：' + p.quantity + (p.unit || '')"
          @click="selectProduct(p)"
        />
        <EmptyState v-if="!filteredProducts.length" text="未找到物品" />
      </van-cell-group>
    </van-popup>

    <!-- 选择供应商弹窗 -->
    <van-popup v-model:show="showSupplierPicker" position="bottom" round :style="{ height: '60%' }">
      <div class="popup-header">
        <span>选择供应商</span>
        <van-icon name="cross" @click="showSupplierPicker = false" />
      </div>
      <van-cell-group>
        <van-cell
          v-for="s in suppliers"
          :key="s._id"
          :title="s.name"
          :label="s.contact_name || ''"
          @click="selectSupplier(s)"
        />
        <EmptyState v-if="!suppliers.length" text="暂无供应商" />
      </van-cell-group>
    </van-popup>

    <!-- 日期选择 -->
    <van-popup v-model:show="showDatePicker" position="bottom" round>
      <van-date-picker
        v-model="dateCurrent"
        title="选择预计到货日期"
        :min-date="minDate"
        @confirm="onDateConfirm"
        @cancel="showDatePicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { NavBar, EmptyState } from '@/components'
import { list, add } from '@/utils/api.js'
import { getCurrentUser } from '@/utils/auth.js'

const router      = useRouter()
const currentUser = getCurrentUser()

const showProductPicker  = ref(false)
const showSupplierPicker = ref(false)
const showDatePicker     = ref(false)
const submitting         = ref(false)
const productKw          = ref('')
const selectedProduct    = ref(null)
const selectedSupplier   = ref(null)
const allProducts        = ref([])
const suppliers          = ref([])
const minDate            = new Date()
const dateCurrent        = ref([
  String(new Date().getFullYear()),
  String(new Date().getMonth() + 1).padStart(2, '0'),
  String(new Date().getDate()).padStart(2, '0'),
])

const form = reactive({
  quantity: '',
  expected_date: '',
  reason: '',
})

const filteredProducts = computed(() => {
  const kw = productKw.value.trim()
  if (!kw) return allProducts.value
  return allProducts.value.filter(p => p.name?.includes(kw) || p.code?.includes(kw))
})

onMounted(async () => {
  try {
    const [prods, sups] = await Promise.all([
      list('products', {}, 'created_at', 'desc', 100, 1),
      list('suppliers', { status: 'active' }, 'created_at', 'desc', 100, 1),
    ])
    allProducts.value = prods
    suppliers.value   = sups
  } catch (e) { /* 静默 */ }
})

function selectProduct(p) {
  selectedProduct.value = p
  showProductPicker.value = false
}

function selectSupplier(s) {
  selectedSupplier.value = s
  showSupplierPicker.value = false
}

function onDateConfirm(v) {
  form.expected_date = v.selectedValues.join('-')
  showDatePicker.value = false
}

async function onSubmit() {
  if (!selectedProduct.value) { showToast('请选择申请物品'); return }
  if (!form.quantity) { showToast('请填写申请数量'); return }
  submitting.value = true
  try {
    await add('purchase_requests', {
      product_id:    selectedProduct.value._id,
      product_name:  selectedProduct.value.name,
      quantity:      Number(form.quantity),
      unit:          selectedProduct.value.unit || '',
      supplier_id:   selectedSupplier.value?._id || '',
      supplier_name: selectedSupplier.value?.name || '',
      reason:        form.reason,
      status:        'pending',
      requester:     currentUser?.name || '',
      approver:      '',
      expected_date: form.expected_date,
      note:          '',
      created_at:    new Date(),
    })
    showToast('申请已提交')
    router.back()
  } catch (e) {
    showToast('提交失败，请重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 30px; }
.form-group { margin: 12px; }
.submit-btn { padding: 16px 12px; }
.popup-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 16px; font-size: 16px; font-weight: 600; border-bottom: 1px solid #f0f0f0;
}
</style>
