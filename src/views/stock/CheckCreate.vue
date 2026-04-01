<template>
  <div class="page">
    <NavBar title="创建盘点任务" />
    <van-form @submit="onSubmit">
      <van-cell-group inset class="form-group">
        <van-field name="scope" label="盘点范围">
          <template #input>
            <van-radio-group v-model="form.scope" direction="horizontal">
              <van-radio name="zone">按区域</van-radio>
              <van-radio name="all">全厂盘点</van-radio>
            </van-radio-group>
          </template>
        </van-field>

        <!-- 按区域时显示多选 -->
        <template v-if="form.scope === 'zone'">
          <van-cell title="选择区域" />
          <div class="zone-check-wrap">
            <van-checkbox-group v-model="form.zones">
              <van-checkbox
                v-for="z in allZones"
                :key="z._id"
                :name="z.name"
                shape="square"
                class="zone-check-item"
              >{{ z.name }}</van-checkbox>
            </van-checkbox-group>
          </div>
        </template>

        <van-field v-model="form.operator" label="盘点人" placeholder="请输入" :rules="[{ required: true, message: '请填写盘点人' }]" />
        <van-field v-model="form.note" label="备注" placeholder="可选" />
      </van-cell-group>
      <div class="submit-btn">
        <van-button type="primary" block round size="large" native-type="submit" :loading="submitting">
          创建盘点任务
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { NavBar } from '@/components'
import { list, add } from '@/utils/api.js'

const router = useRouter()
const submitting = ref(false)
const allZones   = ref([])
const form = reactive({ scope: 'all', zones: [], operator: '', note: '' })

onMounted(async () => {
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}')
  form.operator = user.name || ''
  try {
    allZones.value = await list('zones', {}, 'created_at', 'asc', 50, 1)
  } catch (e) { /* 静默 */ }
})

async function onSubmit() {
  if (form.scope === 'zone' && !form.zones.length) { showToast('请选择至少一个区域'); return }
  submitting.value = true
  try {
    const res = await add('inventory_tasks', {
      scope:    form.scope,
      zones:    form.scope === 'all' ? [] : form.zones,
      status:   'doing',
      operator: form.operator,
      note:     form.note,
    })
    showToast('创建成功')
    router.replace('/stock/check/exec/' + res.id)
  } catch (e) {
    showToast('创建失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 30px; }
.form-group { margin: 12px; }
.submit-btn { padding: 16px 12px; }
.zone-check-wrap { padding: 10px 16px; display: flex; flex-wrap: wrap; gap: 8px; }
.zone-check-item { width: calc(33% - 8px); }
</style>
