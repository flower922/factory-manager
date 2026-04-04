<template>
  <div class="page">
    <NavBar title="报废申请" />

    <van-form @submit="onSubmit">
      <van-cell-group inset class="form-group">
        <!-- 选择物品 -->
        <van-field
          :model-value="selectedProduct?.name || ''"
          label="选择物品"
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

        <!-- 报废数量 -->
        <van-field
          v-model="form.quantity"
          label="报废数量"
          type="digit"
          placeholder="请输入"
          :rules="[{ required: true, message: '请填写数量' }]"
        >
          <template #button>
            <span style="color:#999;font-size:13px;">{{ selectedProduct?.unit || '' }}</span>
          </template>
        </van-field>

        <!-- 报废原因 -->
        <van-field
          v-model="form.reason"
          label="报废原因"
          type="textarea"
          rows="3"
          placeholder="请填写报废原因（必填）"
          :rules="[{ required: true, message: '请填写报废原因' }]"
          show-word-limit
          maxlength="200"
        />

        <!-- 经手人 -->
        <van-field
          v-model="form.handler"
          label="经手人"
          placeholder="请填写"
        />

        <!-- 照片备注 -->
        <van-field
          v-model="form.note"
          label="备注"
          placeholder="照片说明或其他备注（可选）"
        />
      </van-cell-group>

      <div class="submit-btn">
        <van-button type="danger" block round size="large" native-type="submit" :loading="submitting">
          提交报废申请
        </van-button>
      </div>
    </van-form>

    <!-- 选择物品弹窗 -->
    <van-popup v-model:show="showProductPicker" position="bottom" round :style="{ height: '70%' }">
      <div class="popup-header">
        <span>选择物品</span>
        <van-icon name="cross" @click="showProductPicker = false" />
      </div>
      <van-search v-model="productKw" placeholder="搜索物品名称/编码" @input="() => {}" />
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { NavBar, EmptyState } from '@/components'
import { list, add, update } from '@/utils/api.js'
import { getCurrentUser } from '@/utils/auth.js'

const router      = useRouter()
const currentUser = getCurrentUser()

const showProductPicker = ref(false)
const submitting        = ref(false)
const productKw         = ref('')
const selectedProduct   = ref(null)
const allProducts       = ref([])

const form = reactive({
  quantity: '',
  reason:   '',
  handler:  currentUser?.name || '',
  note:     '',
})

const filteredProducts = computed(() => {
  const kw = productKw.value.trim()
  if (!kw) return allProducts.value
  return allProducts.value.filter(p => p.name?.includes(kw) || p.code?.includes(kw))
})

onMounted(async () => {
  try {
    allProducts.value = await list('products', {}, 'created_at', 'desc', 200, 1)
  } catch (e) { /* 静默 */ }
})

function selectProduct(p) {
  selectedProduct.value = p
  showProductPicker.value = false
}

async function onSubmit() {
  if (!selectedProduct.value) { showToast('请选择物品'); return }
  const qty = Number(form.quantity)
  if (qty <= 0) { showToast('数量必须大于0'); return }
  if (qty > selectedProduct.value.quantity) {
    showToast('报废数量不能超过当前库存')
    return
  }
  submitting.value = true
  try {
    const product = selectedProduct.value

    // 扣减库存
    await update('products', product._id, {
      quantity: product.quantity - qty,
    })

    // 写出库记录
    await add('stock_records', {
      product_id:   product._id,
      product_name: product.name,
      type:         'out',
      quantity:     qty,
      operator:     form.handler,
      source:       'scrap',
      destination:  '报废',
      doc_number:   '',
      note:         form.reason,
      created_at:   new Date(),
    })

    // 写报废记录
    await add('scrap_records', {
      product_id:   product._id,
      product_name: product.name,
      quantity:     qty,
      reason:       form.reason,
      handler:      form.handler,
      note:         form.note,
      created_at:   new Date(),
    })

    showToast('报废申请已提交')
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
