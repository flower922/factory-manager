<template>
  <div class="page">
    <NavBar :title="isEdit ? '编辑物品' : '新增物品'" />

    <van-form @submit="onSubmit">
      <van-cell-group inset class="form-group">
        <van-field
          v-model="form.name"
          label="物品名称"
          placeholder="如：乳化剂 AEO-9"
          :rules="[{ required: true, message: '请填写物品名称' }]"
        />
        <van-field v-model="form.code" label="物品编码" placeholder="如：YL-001">
          <template #button>
            <van-button size="small" type="primary" plain @click.prevent="autoGenCode">自动生成</van-button>
          </template>
        </van-field>
        <van-field
          v-model="form.category_l1" label="一级分类" placeholder="请选择"
          readonly is-link @click="showCatPicker = true"
          :rules="[{ required: true, message: '请选择分类' }]"
        />
        <van-field
          v-if="form.category_l1"
          v-model="form.category_l2" label="二级分类" placeholder="请选择（可选）"
          readonly is-link @click="showCatL2Picker = true"
        />
        <van-field v-model="form.spec" label="规格型号" placeholder="如：500ml/瓶" />
        <van-field
          v-model="form.quantity" label="数量" type="digit" placeholder="请输入数量"
          :rules="[{ required: true, message: '请填写数量' }]"
        >
          <template #button>
            <van-button size="small" plain @click.prevent="showUnitPicker = true">
              {{ form.unit || '选单位' }}
            </van-button>
          </template>
        </van-field>
        <van-field
          v-model="form.zone_name" label="存放区域" placeholder="请选择"
          readonly is-link @click="showZonePicker = true"
        />
        <van-field
          v-if="isStorageZone"
          v-model="form.slot_id" label="库位编号" placeholder="请选择"
          readonly is-link @click="showSlotPicker = true"
        />
        <van-field v-model="form.supplier" label="供应商" placeholder="可选" />
        <van-field
          v-model="form.produce_date" label="生产日期" placeholder="请选择"
          readonly is-link @click="showProducePicker = true"
        />
        <van-field
          v-model="form.expire_date" label="保质期至" placeholder="请选择"
          readonly is-link @click="showExpirePicker = true"
        />
        <van-field v-model="form.note" label="备注" type="textarea" rows="3" placeholder="可选" autosize />
      </van-cell-group>
      <div class="submit-btn">
        <van-button type="primary" block round size="large" native-type="submit" :loading="submitting">
          确认保存
        </van-button>
      </div>
    </van-form>

    <van-popup v-model:show="showCatPicker" position="bottom" round>
      <van-picker :columns="catL1Options" @confirm="onCatL1Confirm" @cancel="showCatPicker = false" />
    </van-popup>
    <van-popup v-model:show="showCatL2Picker" position="bottom" round>
      <van-picker :columns="catL2Options"
        @confirm="v => { form.category_l2 = v.selectedValues[0]; showCatL2Picker = false }"
        @cancel="showCatL2Picker = false" />
    </van-popup>
    <van-popup v-model:show="showUnitPicker" position="bottom" round>
      <van-picker :columns="unitOptions"
        @confirm="v => { form.unit = v.selectedValues[0]; showUnitPicker = false }"
        @cancel="showUnitPicker = false" />
    </van-popup>
    <van-popup v-model:show="showZonePicker" position="bottom" round>
      <van-picker :columns="zoneOptions" @confirm="onZoneConfirm" @cancel="showZonePicker = false" />
    </van-popup>
    <van-popup v-model:show="showSlotPicker" position="bottom" round>
      <van-picker :columns="slotOptions"
        @confirm="v => { form.slot_id = v.selectedValues[0]; showSlotPicker = false }"
        @cancel="showSlotPicker = false" />
    </van-popup>
    <van-popup v-model:show="showProducePicker" position="bottom" round>
      <van-date-picker
        @confirm="v => { form.produce_date = v.selectedValues.join('-'); showProducePicker = false }"
        @cancel="showProducePicker = false" />
    </van-popup>
    <van-popup v-model:show="showExpirePicker" position="bottom" round>
      <van-date-picker
        @confirm="v => { form.expire_date = v.selectedValues.join('-'); showExpirePicker = false }"
        @cancel="showExpirePicker = false" />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { NavBar } from '@/components'
import { add, update, getById, list } from '@/utils/api.js'

const route  = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)
const submitting = ref(false)

const form = reactive({
  name: '', code: '', category_l1: '', category_l2: '',
  spec: '', quantity: '', unit: '', zone_name: '', slot_id: '',
  supplier: '', produce_date: '', expire_date: '', note: ''
})

const showCatPicker     = ref(false)
const showCatL2Picker   = ref(false)
const showUnitPicker    = ref(false)
const showZonePicker    = ref(false)
const showSlotPicker    = ref(false)
const showProducePicker = ref(false)
const showExpirePicker  = ref(false)

const unitOptions = ['瓶','桶','袋','盒','台','包','个'].map(v => ({ text: v, value: v }))
const categories  = ref([])
const zones       = ref([])
const slots       = ref([])

const catL1Options = computed(() =>
  categories.value.filter(c => c.level === 1).map(c => ({ text: c.name, value: c.name }))
)
const catL2Options = computed(() =>
  categories.value.filter(c => c.level === 2 && c.parent_name === form.category_l1)
    .map(c => ({ text: c.name, value: c.name }))
)
const zoneOptions   = computed(() => zones.value.map(z => ({ text: z.name, value: z.name })))
const isStorageZone = computed(() => zones.value.find(z => z.name === form.zone_name)?.has_slots || false)
const slotOptions   = computed(() =>
  slots.value
    .filter(s => s.zone_name === form.zone_name && (s.status === 'empty' || s.slot_id === form.slot_id))
    .map(s => ({ text: `${s.slot_id}（${s.status === 'empty' ? '空' : '已占用'}）`, value: s.slot_id }))
)

onMounted(async () => {
  try {
    const [cats, zs, sls] = await Promise.all([
      list('categories', {}, 'created_at', 'asc', 50, 1),
      list('zones',      {}, 'created_at', 'asc', 50, 1),
      list('slots',      {}, 'created_at', 'asc', 100, 1)
    ])
    categories.value = cats
    zones.value      = zs
    slots.value      = sls
  } catch (e) { /* 静默 */ }

  if (isEdit.value) {
    try {
      const item = await getById('products', route.params.id)
      if (item) Object.assign(form, { ...item, quantity: String(item.quantity) })
    } catch (e) { showToast('加载失败') }
  }
})

function onCatL1Confirm(v) {
  form.category_l1 = v.selectedValues[0]
  form.category_l2 = ''
  showCatPicker.value = false
}
function onZoneConfirm(v) {
  form.zone_name = v.selectedValues[0]
  form.slot_id   = ''
  showZonePicker.value = false
}

async function autoGenCode() {
  if (!form.category_l1) { showToast('请先选择分类'); return }
  try {
    const cat    = categories.value.find(c => c.name === form.category_l1 && c.level === 1)
    const prefix = cat?.code_prefix || form.category_l1.slice(0, 2).toUpperCase()
    const all    = await list('products', {}, 'code', 'desc', 100, 1)
    const nums   = all.filter(p => p.code?.startsWith(prefix + '-'))
                      .map(p => parseInt(p.code.split('-')[1]) || 0)
    const next   = nums.length > 0 ? Math.max(...nums) + 1 : 1
    form.code = `${prefix}-${String(next).padStart(3, '0')}`
  } catch (e) { showToast('生成失败') }
}

async function onSubmit() {
  submitting.value = true
  try {
    const data = { ...form, quantity: Number(form.quantity), status: 'normal' }
    if (isEdit.value) {
      await update('products', route.params.id, data)
      showToast('保存成功')
    } else {
      await add('products', data)
      showToast('添加成功')
    }
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
.form-group { margin: 12px; }
.submit-btn { padding: 16px 12px; }
</style>
