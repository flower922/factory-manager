<template>
  <div class="page">
    <NavBar title="添加维修记录" />

    <van-form @submit="onSubmit">
      <van-cell-group inset class="form-group">
        <!-- 选择物品 -->
        <van-field
          :model-value="selectedProduct?.name || ''"
          label="选择物品"
          placeholder="请选择"
          readonly is-link
          :rules="[{ validator: () => !!selectedProduct, message: '请选择物品' }]"
          @click="showProductPicker = true"
        />

        <!-- 故障描述 -->
        <van-field
          v-model="form.issue_desc"
          label="故障描述"
          type="textarea"
          rows="3"
          placeholder="请描述故障情况（必填）"
          :rules="[{ required: true, message: '请填写故障描述' }]"
          show-word-limit
          maxlength="300"
        />

        <!-- 维修状态 -->
        <van-field label="维修状态">
          <template #input>
            <van-radio-group v-model="form.status" direction="horizontal">
              <van-radio name="repairing">维修中</van-radio>
              <van-radio name="done">已完成</van-radio>
            </van-radio-group>
          </template>
        </van-field>

        <!-- 维修人 -->
        <van-field
          v-model="form.repairer"
          label="维修人"
          placeholder="请填写"
        />

        <!-- 维修费用 -->
        <van-field
          v-model="form.repair_cost"
          label="维修费用"
          type="number"
          placeholder="请填写（可选）"
        >
          <template #button>
            <span style="color:#999;font-size:13px;">元</span>
          </template>
        </van-field>

        <!-- 维修日期 -->
        <van-field
          :model-value="form.repair_date"
          label="维修日期"
          placeholder="请选择"
          readonly is-link
          @click="showDatePicker = true"
        />

        <!-- 备注 -->
        <van-field v-model="form.note" label="备注" placeholder="可选" />
      </van-cell-group>

      <div class="submit-btn">
        <van-button type="primary" block round size="large" native-type="submit" :loading="submitting">
          保存记录
        </van-button>
      </div>
    </van-form>

    <!-- 选择物品弹窗 -->
    <van-popup v-model:show="showProductPicker" position="bottom" round :style="{ height: '70%' }">
      <div class="popup-header">
        <span>选择物品</span>
        <van-icon name="cross" @click="showProductPicker = false" />
      </div>
      <van-search v-model="productKw" placeholder="搜索物品名称" @input="() => {}" />
      <van-cell-group>
        <van-cell
          v-for="p in filteredProducts"
          :key="p._id"
          :title="p.name"
          :label="p.code + (p.zone_name ? '  ·  ' + p.zone_name : '')"
          @click="selectProduct(p)"
        />
        <EmptyState v-if="!filteredProducts.length" text="未找到物品" />
      </van-cell-group>
    </van-popup>

    <!-- 日期选择 -->
    <van-popup v-model:show="showDatePicker" position="bottom" round>
      <van-date-picker
        v-model="dateCurrent"
        title="选择维修日期"
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

const showProductPicker = ref(false)
const showDatePicker    = ref(false)
const submitting        = ref(false)
const productKw         = ref('')
const selectedProduct   = ref(null)
const allProducts       = ref([])

// 今天日期字符串
const today = (() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
})()

const dateCurrent = ref(today.split('-'))

const form = reactive({
  issue_desc:  '',
  status:      'repairing',
  repairer:    currentUser?.name || '',
  repair_cost: '',
  repair_date: today,
  note:        '',
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

function onDateConfirm(v) {
  form.repair_date = v.selectedValues.join('-')
  showDatePicker.value = false
}

async function onSubmit() {
  if (!selectedProduct.value) { showToast('请选择物品'); return }
  submitting.value = true
  try {
    await add('repair_records', {
      product_id:  selectedProduct.value._id,
      product_name: selectedProduct.value.name,
      issue_desc:  form.issue_desc,
      repair_cost: form.repair_cost ? Number(form.repair_cost) : 0,
      repairer:    form.repairer,
      repair_date: form.repair_date,
      status:      form.status,
      note:        form.note,
      created_at:  new Date(),
    })
    showToast('记录已保存')
    router.back()
  } catch (e) {
    showToast('保存失败，请重试')
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
