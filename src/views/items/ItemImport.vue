<template>
  <div class="page">
    <NavBar title="批量导入" />

    <!-- 上传区域 -->
    <div class="upload-card" v-if="!excelData.length">
      <div class="upload-icon">📥</div>
      <div class="upload-title">上传 Excel 文件</div>
      <div class="upload-hint">支持 .xlsx / .xls / .csv 格式</div>
      <van-uploader :before-read="onFileSelect" accept=".xlsx,.xls,.csv" :max-count="1" style="margin:16px 0;">
        <van-button type="primary" round>选择文件</van-button>
      </van-uploader>
      <div class="template-link" @click="downloadTemplate">📄 下载标准导入模板</div>
    </div>

    <!-- 字段映射 -->
    <template v-if="excelData.length && !mappingDone">
      <div class="section-title">字段映射</div>
      <van-cell-group inset>
        <van-field
          v-for="f in fieldDefs" :key="f.key"
          :label="f.label + (f.required ? ' *' : '')"
          :model-value="mapping[f.key]"
          readonly is-link
          @click="openMapPicker(f.key)"
          :placeholder="f.required ? '必须映射' : '可选'"
        />
      </van-cell-group>
      <div class="btn-row">
        <van-button type="primary" block round @click="applyMapping">预览数据</van-button>
      </div>
    </template>

    <!-- 数据预览 -->
    <template v-if="mappingDone">
      <div class="section-title">数据预览（前5行）</div>
      <div class="preview-table">
        <div v-for="(row, i) in previewRows" :key="i" :class="['preview-row', row._valid ? '' : 'row-error']">
          <div class="row-num">{{ i + 1 }}</div>
          <div class="row-content">
            <div class="row-name">{{ row.name || '（无名称）' }}</div>
            <div class="row-meta">数量：{{ row.quantity }} · 分类：{{ row.category_l1 || '-' }}</div>
            <div v-if="!row._valid" class="row-err-msg">✗ {{ row._errMsg }}</div>
            <div v-else class="row-ok">✓ 通过</div>
          </div>
        </div>
      </div>
      <div class="btn-row">
        <van-button plain round block style="margin-bottom:10px;" @click="reset">重新选择文件</van-button>
        <van-button type="primary" block round :disabled="!validRows.length" :loading="importing" @click="doImport">
          确认导入（{{ validRows.length }} 条有效）
        </van-button>
      </div>
    </template>

    <van-popup v-model:show="showMapPicker" position="bottom" round>
      <van-picker :columns="columnOptions" @confirm="onMapConfirm" @cancel="showMapPicker = false" />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { NavBar } from '@/components'
import { add } from '@/utils/api.js'

const router = useRouter()

const excelData   = ref([])
const headers     = ref([])
const mapping     = ref({})
const mappingDone = ref(false)
const importing   = ref(false)

const fieldDefs = [
  { key: 'name',        label: '物品名称', required: true },
  { key: 'quantity',    label: '数量',     required: true },
  { key: 'code',        label: '物品编码', required: false },
  { key: 'category_l1', label: '一级分类', required: false },
  { key: 'spec',        label: '规格型号', required: false },
  { key: 'zone_name',   label: '存放区域', required: false },
  { key: 'supplier',    label: '供应商',   required: false },
  { key: 'produce_date',label: '生产日期', required: false },
  { key: 'expire_date', label: '保质期至', required: false },
]

const showMapPicker = ref(false)
const currentMapKey = ref('')
const columnOptions = computed(() => headers.value.map(h => ({ text: h, value: h })))

const mappedRows = computed(() => {
  if (!mappingDone.value) return []
  return excelData.value.slice(1).map(row => {
    const obj = {}
    for (const f of fieldDefs) {
      const col = mapping.value[f.key]
      const idx = col ? headers.value.indexOf(col) : -1
      obj[f.key] = idx >= 0 ? String(row[idx] ?? '').trim() : ''
    }
    let valid = true, errMsg = ''
    if (!obj.name) { valid = false; errMsg = '名称为空' }
    else if (!obj.quantity || isNaN(Number(obj.quantity))) { valid = false; errMsg = '数量非数字' }
    return { ...obj, quantity: Number(obj.quantity) || 0, _valid: valid, _errMsg: errMsg }
  }).filter(r => r.name || r.quantity)
})

const previewRows = computed(() => mappedRows.value.slice(0, 5))
const validRows   = computed(() => mappedRows.value.filter(r => r._valid))

async function onFileSelect(file) {
  try {
    const XLSX = await import(/* @vite-ignore */ 'xlsx')
    const data = await file.arrayBuffer()
    const wb   = XLSX.read(data)
    const ws   = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
    if (!rows || rows.length < 2) { showToast('文件无数据'); return false }
    headers.value   = rows[0].map(String)
    excelData.value = rows
    autoMapping()
  } catch (e) { showToast('文件解析失败') }
  return false
}

function autoMapping() {
  const aliasMap = {
    name:         ['物品名称','名称','品名'],
    quantity:     ['数量','库存'],
    code:         ['编码','物品编码','编号'],
    category_l1:  ['一级分类','分类','类别'],
    spec:         ['规格','规格型号','型号'],
    zone_name:    ['区域','存放区域','位置'],
    supplier:     ['供应商','厂家'],
    produce_date: ['生产日期'],
    expire_date:  ['保质期','到期日','有效期'],
  }
  const map = {}
  for (const [key, aliases] of Object.entries(aliasMap)) {
    const found = headers.value.find(h => aliases.includes(h))
    if (found) map[key] = found
  }
  mapping.value = map
}

function openMapPicker(key) { currentMapKey.value = key; showMapPicker.value = true }
function onMapConfirm(v)    { mapping.value[currentMapKey.value] = v.selectedValues[0]; showMapPicker.value = false }

function applyMapping() {
  const missing = fieldDefs.filter(f => f.required && !mapping.value[f.key])
  if (missing.length) { showToast(`请映射：${missing.map(f=>f.label).join('、')}`); return }
  mappingDone.value = true
}

async function doImport() {
  importing.value = true
  try {
    for (const row of validRows.value) {
      const { _valid, _errMsg, ...data } = row
      await add('products', { ...data, status: 'normal' })
    }
    showToast(`成功导入 ${validRows.value.length} 条`)
    router.push('/items')
  } catch (e) {
    showToast('导入失败，请重试')
  } finally {
    importing.value = false
  }
}

function reset() { excelData.value = []; headers.value = []; mapping.value = {}; mappingDone.value = false }

async function downloadTemplate() {
  try {
    const XLSX = await import(/* @vite-ignore */ 'xlsx')
    const tpl  = [['物品名称','数量','物品编码','一级分类','规格型号','存放区域','供应商','生产日期','保质期至'],
                  ['乳化剂示例',20,'YL-001','原料','500ml/桶','库房','某供应商','2024-01-01','2025-01-01']]
    const ws = XLSX.utils.aoa_to_sheet(tpl)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '导入模板')
    XLSX.writeFile(wb, '实物导入模板.xlsx')
  } catch (e) { showToast('生成模板失败') }
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 30px; }
.upload-card { margin: 20px 16px; background: #fff; border-radius: 12px; padding: 40px 20px; text-align: center; box-shadow: 0 1px 6px rgba(0,0,0,0.06); }
.upload-icon  { font-size: 48px; margin-bottom: 12px; }
.upload-title { font-size: 16px; font-weight: 600; margin-bottom: 6px; }
.upload-hint  { font-size: 12px; color: #999; }
.template-link { color: #1A6DFF; font-size: 13px; cursor: pointer; margin-top: 8px; }
.section-title { padding: 12px 16px 6px; font-size: 14px; font-weight: 600; color: #333; }
.btn-row { padding: 16px 12px; }
.preview-table { margin: 0 12px; }
.preview-row { display: flex; gap: 10px; padding: 10px 12px; background: #fff; border-radius: 8px; margin-bottom: 8px; border-left: 3px solid #00B578; }
.preview-row.row-error { border-left-color: #e53935; background: #fff8f8; }
.row-num { font-size: 12px; color: #999; min-width: 20px; padding-top: 2px; }
.row-name { font-size: 14px; font-weight: 600; }
.row-meta { font-size: 12px; color: #888; margin-top: 2px; }
.row-err-msg { font-size: 12px; color: #e53935; margin-top: 2px; }
.row-ok { font-size: 12px; color: #00B578; margin-top: 2px; }
</style>
