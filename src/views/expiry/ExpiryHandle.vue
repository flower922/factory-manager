<template>
  <div class="page">
    <NavBar title="到期处理" />

    <van-loading v-if="loading" class="loading" />
    <template v-else-if="item">
      <!-- 物品信息卡 -->
      <div class="item-card">
        <div class="item-card-bar"></div>
        <div class="item-card-body">
          <div class="item-name">{{ item.name }}</div>
          <div class="item-meta">编码：{{ item.code }} · 位置：{{ item.zone_name }}</div>
          <div class="item-meta">到期日：<span class="text-red">{{ item.expire_date }}</span></div>
          <div class="item-meta">剩余库存：{{ item.quantity }}{{ item.unit }}</div>
        </div>
      </div>

      <!-- 处理表单 -->
      <van-form @submit="onSubmit">
        <van-cell-group inset class="form-group">
          <van-field
            v-model="form.handle_type_label"
            label="处理方式"
            placeholder="请选择"
            readonly is-link
            @click="showTypePicker = true"
            :rules="[{ required: true, message: '请选择处理方式' }]"
          />
          <van-field
            v-model="form.handle_quantity"
            label="处理数量"
            type="digit"
            :placeholder="'最多 ' + item.quantity + item.unit"
            :rules="[{ required: true, message: '请填写数量' }]"
          />
          <van-field v-model="form.handler" label="处理人" placeholder="请输入"
            :rules="[{ required: true, message: '请填写处理人' }]" />
          <van-field v-model="form.note" label="处理说明" type="textarea" rows="3" placeholder="可选" autosize />
        </van-cell-group>
        <div class="submit-btn">
          <van-button type="primary" block round size="large" native-type="submit" :loading="submitting">
            确认处理
          </van-button>
        </div>
      </van-form>

      <van-popup v-model:show="showTypePicker" position="bottom" round>
        <van-picker :columns="typeOptions"
          @confirm="v => { form.handle_type = v.selectedValues[0]; form.handle_type_label = v.selectedOptions[0].text; showTypePicker = false }"
          @cancel="showTypePicker = false" />
      </van-popup>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { NavBar } from '@/components'
import { getById, add, update } from '@/utils/api.js'

const route  = useRoute()
const router = useRouter()

const loading    = ref(true)
const submitting = ref(false)
const item       = ref(null)
const showTypePicker = ref(false)

const form = reactive({
  handle_type: 'destroy', handle_type_label: '销毁',
  handle_quantity: '', handler: '', note: ''
})

const typeOptions = [
  { text: '销毁',    value: 'destroy'   },
  { text: '退货',    value: 'return'    },
  { text: '降级使用', value: 'downgrade' },
  { text: '延期',    value: 'extend'    },
]

onMounted(async () => {
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}')
  form.handler = user.name || ''
  try {
    item.value = await getById('products', route.params.id)
    if (item.value) form.handle_quantity = String(item.value.quantity)
  } finally {
    loading.value = false
  }
})

async function onSubmit() {
  submitting.value = true
  try {
    const qty = Number(form.handle_quantity)
    await add('expiry_handles', {
      product_id:      item.value._id,
      product_name:    item.value.name,
      handle_type:     form.handle_type,
      handle_quantity: qty,
      handler:         form.handler,
      note:            form.note,
    })

    // 销毁或退货时扣减库存
    if (['destroy', 'return'].includes(form.handle_type)) {
      const newQty = Math.max(0, item.value.quantity - qty)
      await update('products', item.value._id, {
        quantity: newQty,
        status:   newQty === 0 ? 'normal' : item.value.status
      })
    } else if (form.handle_type === 'extend') {
      await update('products', item.value._id, { status: 'normal' })
    }

    showToast('处理成功')
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
.loading { display: flex; justify-content: center; padding: 60px; }
.item-card { display: flex; background: #fff; margin: 12px; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 6px rgba(0,0,0,0.06); }
.item-card-bar { width: 5px; background: #e53935; flex-shrink: 0; }
.item-card-body { padding: 14px; }
.item-name { font-size: 17px; font-weight: 700; margin-bottom: 6px; }
.item-meta { font-size: 13px; color: #666; margin-top: 3px; }
.text-red  { color: #e53935; font-weight: 600; }
.form-group { margin: 0 12px 12px; }
.submit-btn { padding: 16px 12px; }
</style>
