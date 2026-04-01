<template>
  <div class="page">
    <NavBar title="双人确认" />

    <van-loading v-if="loading" class="loading" />
    <template v-else-if="record">
      <!-- 待确认操作信息 -->
      <div class="info-card">
        <div class="info-bar"></div>
        <div class="info-body">
          <div class="info-name">{{ record.product_name }}</div>
          <div class="info-meta">操作人：{{ record.operator }}</div>
          <div class="info-meta">数量：{{ record.quantity }}{{ record.unit }}</div>
          <div class="info-meta">用途：{{ record.purpose || '-' }}</div>
          <div class="info-meta">时间：{{ formatDate(record.created_at) }}</div>
        </div>
      </div>

      <!-- 第一人确认状态 -->
      <div class="confirm-section">
        <div class="section-title">第一人确认</div>
        <div v-if="record.confirmed_1" class="confirm-ok">
          ✅ 第一人确认完成 · {{ record.confirmer_1 }} · {{ formatDate(record.confirmed_1_at) }}
        </div>
        <div v-else>
          <van-button type="primary" block round @click="confirm1" :loading="confirming1">
            我是第一人，点击确认
          </van-button>
        </div>
      </div>

      <!-- 第二人确认区域 -->
      <div class="confirm-section" v-if="record.confirmed_1">
        <div class="section-title">第二人确认</div>
        <div v-if="record.confirmed_2" class="confirm-ok">
          ✅ 双人确认完成 · {{ record.confirmer_2 }}
        </div>
        <template v-else>
          <van-button type="primary" block round @click="router.push('/scan?return=/poison/confirm/' + recordId)">
            扫码确认
          </van-button>
          <div class="or-divider">或</div>
          <van-field v-model="password" type="password" placeholder="输入密码确认" class="pwd-field" />
          <van-button plain type="primary" block round @click="confirm2ByPassword" :loading="confirming2">
            密码确认
          </van-button>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { NavBar } from '@/components'
import { getById, update } from '@/utils/api.js'

const route    = useRoute()
const router   = useRouter()
const recordId = route.params.id

const loading    = ref(true)
const confirming1= ref(false)
const confirming2= ref(false)
const record     = ref(null)
const password   = ref('')

const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')

onMounted(async () => {
  try {
    record.value = await getById('poison_records', recordId)
  } finally {
    loading.value = false
  }
})

async function confirm1() {
  confirming1.value = true
  try {
    await update('poison_records', recordId, {
      confirmed_1:    true,
      confirmer_1:    currentUser.name || '未知用户',
      confirmed_1_at: new Date(),
    })
    record.value = await getById('poison_records', recordId)
    showToast('第一人确认成功')
  } catch (e) {
    showToast('确认失败')
  } finally {
    confirming1.value = false
  }
}

async function confirm2ByPassword() {
  if (!password.value) { showToast('请输入密码'); return }
  // v1.0 简化：密码不为空即通过
  confirming2.value = true
  try {
    await update('poison_records', recordId, {
      confirmed_2:    true,
      confirmer_2:    currentUser.name || '未知用户',
      confirmer:      record.value.confirmer_1 + '、' + (currentUser.name || '未知用户'),
      confirmed_2_at: new Date(),
    })
    record.value = await getById('poison_records', recordId)
    showToast('双人确认完成')
  } catch (e) {
    showToast('确认失败')
  } finally {
    confirming2.value = false
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
.info-bar  { width: 5px; background: #ff7a00; flex-shrink: 0; }
.info-body { padding: 14px; }
.info-name { font-size: 17px; font-weight: 700; margin-bottom: 6px; }
.info-meta { font-size: 13px; color: #666; margin-top: 3px; }
.confirm-section { background: #fff; margin: 0 12px 12px; border-radius: 10px; padding: 16px; box-shadow: 0 1px 6px rgba(0,0,0,0.06); }
.section-title { font-size: 14px; font-weight: 600; margin-bottom: 12px; }
.confirm-ok { padding: 12px; background: #e8f5e9; border-radius: 8px; color: #2e7d32; font-size: 13px; }
.or-divider { text-align: center; color: #bbb; font-size: 12px; margin: 10px 0; }
.pwd-field { border: 1px solid #eee; border-radius: 8px; margin-bottom: 10px; }
</style>
