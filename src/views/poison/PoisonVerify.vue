<template>
  <div class="page">
    <NavBar title="用量核销" />

    <van-loading v-if="loading" class="loading" />
    <template v-else-if="record">
      <!-- 领用信息卡 -->
      <div class="info-card">
        <div class="info-bar"></div>
        <div class="info-body">
          <div class="info-name">{{ record.product_name }}</div>
          <div class="info-meta">领用人：{{ record.operator }}</div>
          <div class="info-meta">领用量：<strong>{{ record.quantity }}{{ record.unit }}</strong></div>
          <div class="info-meta">时间：{{ formatDate(record.created_at) }}</div>
        </div>
      </div>

      <!-- 核销表单 -->
      <van-cell-group inset class="form-group">
        <van-field v-model="consumed" label="实际消耗量" type="digit" :placeholder="'单位：' + record.unit"
          @input="onInput" />
        <van-field v-model="returned" label="剩余归还量" type="digit" :placeholder="'单位：' + record.unit"
          @input="onInput" />

        <!-- 数量校验提示 -->
        <div v-if="consumed !== '' || returned !== ''" :class="['match-tip', matched ? 'tip-ok' : 'tip-err']">
          {{ matched ? '✓ 数量匹配' : '⚠ 数量不匹配，请填写差异说明' }}
        </div>

        <van-field
          v-if="!matched && (consumed !== '' || returned !== '')"
          v-model="diffNote"
          label="差异说明"
          type="textarea"
          rows="2"
          placeholder="必填"
          :rules="[{ required: true, message: '请填写差异说明' }]"
        />
      </van-cell-group>

      <div class="submit-btn">
        <van-button type="primary" block round size="large" :loading="submitting" @click="onSubmit">
          提交核销
        </van-button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { NavBar } from '@/components'
import { getById, update } from '@/utils/api.js'

const route  = useRoute()
const router = useRouter()

const loading    = ref(true)
const submitting = ref(false)
const record     = ref(null)
const consumed   = ref('')
const returned   = ref('')
const diffNote   = ref('')

// 消耗 + 归还 是否等于领用量
const matched = computed(() => {
  if (consumed.value === '' && returned.value === '') return true
  return Number(consumed.value) + Number(returned.value) === (record.value?.quantity || 0)
})

onMounted(async () => {
  try {
    record.value = await getById('poison_records', route.params.id)
  } finally {
    loading.value = false
  }
})

function onInput() { /* 由 computed 响应 */ }

async function onSubmit() {
  if (!matched.value && !diffNote.value.trim()) { showToast('请填写差异说明'); return }
  submitting.value = true
  try {
    await update('poison_records', route.params.id, {
      actual_consumed: Number(consumed.value),
      actual_returned: Number(returned.value),
      diff_note:       diffNote.value,
      verified:        true,
    })
    showToast('核销成功')
    router.back()
  } catch (e) {
    showToast('提交失败')
  } finally {
    submitting.value = false
  }
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleString('zh-CN')
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 30px; }
.loading { display: flex; justify-content: center; padding: 60px; }
.info-card { display: flex; background: #fff; margin: 12px; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 6px rgba(0,0,0,0.06); }
.info-bar  { width: 5px; background: #e53935; flex-shrink: 0; }
.info-body { padding: 14px; }
.info-name { font-size: 17px; font-weight: 700; margin-bottom: 6px; }
.info-meta { font-size: 13px; color: #666; margin-top: 3px; }
.form-group { margin: 0 12px 12px; }
.match-tip { padding: 8px 16px; font-size: 13px; font-weight: 600; }
.tip-ok  { color: #00B578; }
.tip-err { color: #e53935; }
.submit-btn { padding: 16px 12px; }
</style>
