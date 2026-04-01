<template>
  <div class="page">
    <NavBar title="分类管理" right-icon="plus" @click-right="openAddDialog()" />

    <van-loading v-if="loading" class="loading" />
    <van-collapse v-else v-model="activeCollapse">
      <van-collapse-item
        v-for="cat in treeData"
        :key="cat._id"
        :name="cat._id"
      >
        <template #title>
          <div class="cat-row" @touchstart="startLongPress(cat)" @touchend="cancelLongPress" @touchmove="cancelLongPress">
            <div :class="['cat-icon', catColor(cat.name)]">{{ catEmoji(cat.name) }}</div>
            <div class="cat-info">
              <span class="cat-name">{{ cat.name }}</span>
              <span class="cat-prefix">{{ cat.code_prefix }}</span>
            </div>
            <div class="cat-right">
              <span class="cat-sub">子分类 {{ cat.children.length }} 个</span>
              <span class="cat-count">{{ productCount[cat.name] || 0 }} 件</span>
            </div>
          </div>
        </template>
        <!-- 二级分类列表 -->
        <div
          v-for="sub in cat.children"
          :key="sub._id"
          class="sub-row"
          @touchstart="startLongPress(sub)"
          @touchend="cancelLongPress"
          @touchmove="cancelLongPress"
        >
          <span class="sub-name">{{ sub.name }}</span>
          <span class="sub-count">{{ productCount[sub.name] || 0 }} 件</span>
        </div>
        <div v-if="!cat.children.length" class="sub-empty">暂无子分类</div>
      </van-collapse-item>
    </van-collapse>

    <!-- 新增/编辑弹窗 -->
    <van-dialog
      v-model:show="showDialog"
      :title="editTarget ? '编辑分类' : '新增分类'"
      show-cancel-button
      @confirm="onDialogConfirm"
    >
      <div class="dialog-form">
        <van-field v-model="form.name" label="分类名称" placeholder="请输入" :rules="[{required:true}]" />
        <van-field
          v-model="form.level_label" label="级别" placeholder="请选择" readonly is-link
          @click="showLevelPicker = true"
        />
        <van-field
          v-if="form.level === 2"
          v-model="form.parent_name" label="父分类" placeholder="请选择" readonly is-link
          @click="showParentPicker = true"
        />
        <van-field v-if="form.level === 1" v-model="form.code_prefix" label="编码前缀" placeholder="如：YL" />
        <van-field v-if="form.level === 1" v-model="form.expiry_advance_days_str" label="预警提前天数" type="digit" placeholder="0" />
      </div>
    </van-dialog>

    <!-- 长按操作菜单 -->
    <van-action-sheet
      v-model:show="showActionSheet"
      :actions="actionSheetActions"
      cancel-text="取消"
      @select="onActionSelect"
    />

    <!-- 级别 Picker -->
    <van-popup v-model:show="showLevelPicker" position="bottom" round>
      <van-picker
        :columns="[{text:'一级分类',value:1},{text:'二级分类',value:2}]"
        @confirm="v => { form.level = v.selectedValues[0]; form.level_label = v.selectedOptions[0].text; showLevelPicker = false }"
        @cancel="showLevelPicker = false"
      />
    </van-popup>

    <!-- 父分类 Picker -->
    <van-popup v-model:show="showParentPicker" position="bottom" round>
      <van-picker
        :columns="l1Options"
        @confirm="v => { form.parent_name = v.selectedValues[0]; showParentPicker = false }"
        @cancel="showParentPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import { NavBar } from '@/components'
import { list, add, remove, count } from '@/utils/api.js'

const loading        = ref(true)
const categories     = ref([])
const productCount   = ref({})   // 分类名 → 物品数量
const activeCollapse = ref([])

// 树形数据：一级分类 + 子分类
const treeData = computed(() => {
  const l1 = categories.value.filter(c => c.level === 1)
  const l2 = categories.value.filter(c => c.level === 2)
  return l1.map(c => ({
    ...c,
    children: l2.filter(s => s.parent_name === c.name || s.parent_id === c._id)
  }))
})
const l1Options = computed(() =>
  categories.value.filter(c => c.level === 1).map(c => ({ text: c.name, value: c.name }))
)

const catColorMap = { 原料:'bg-blue', 试剂:'bg-purple', 成品:'bg-green', 工具:'bg-orange', 耗材:'bg-gray', 劳保:'bg-pink' }
const catEmojiMap = { 原料:'🧪', 试剂:'🔬', 成品:'📦', 工具:'🔧', 耗材:'📎', 劳保:'🦺' }
const catColor = n => catColorMap[n] || 'bg-gray'
const catEmoji = n => catEmojiMap[n] || '📂'

// 弹窗 & 表单
const showDialog  = ref(false)
const editTarget  = ref(null)
const form = ref({ name:'', level:1, level_label:'一级分类', parent_name:'', code_prefix:'', expiry_advance_days_str:'0' })
const showLevelPicker  = ref(false)
const showParentPicker = ref(false)

// 长按
const showActionSheet     = ref(false)
const actionTarget        = ref(null)
const actionSheetActions  = [{ name: '编辑', color: '#1A6DFF' }, { name: '删除', color: '#ee0a24' }]
let longPressTimer = null

function startLongPress(cat) {
  longPressTimer = setTimeout(() => { actionTarget.value = cat; showActionSheet.value = true }, 600)
}
function cancelLongPress() { clearTimeout(longPressTimer) }

async function onActionSelect(action) {
  showActionSheet.value = false
  if (action.name === '编辑') {
    openAddDialog(actionTarget.value)
  } else if (action.name === '删除') {
    const cnt = await count('products', { category_l1: actionTarget.value.name })
    if (cnt > 0) { showToast(`该分类下有 ${cnt} 件物品，无法删除`); return }
    try {
      await showConfirmDialog({ title: '确认删除', message: `删除分类"${actionTarget.value.name}"？` })
      await remove('categories', actionTarget.value._id)
      showToast('删除成功')
      await loadData()
    } catch (e) { /* 取消 */ }
  }
}

function openAddDialog(cat = null) {
  editTarget.value = cat
  if (cat) {
    form.value = {
      name: cat.name, level: cat.level, level_label: cat.level === 1 ? '一级分类' : '二级分类',
      parent_name: cat.parent_name || '', code_prefix: cat.code_prefix || '',
      expiry_advance_days_str: String(cat.expiry_advance_days || 0)
    }
  } else {
    form.value = { name:'', level:1, level_label:'一级分类', parent_name:'', code_prefix:'', expiry_advance_days_str:'0' }
  }
  showDialog.value = true
}

async function onDialogConfirm() {
  if (!form.value.name) { showToast('请填写分类名称'); return }
  try {
    const data = {
      name: form.value.name,
      level: form.value.level,
      parent_name: form.value.parent_name,
      code_prefix: form.value.code_prefix,
      expiry_advance_days: Number(form.value.expiry_advance_days_str) || 0,
    }
    await add('categories', data)
    showToast('保存成功')
    await loadData()
  } catch (e) { showToast('操作失败') }
}

async function loadData() {
  loading.value = true
  try {
    const [cats, products] = await Promise.all([
      list('categories', {}, 'created_at', 'asc', 50, 1),
      list('products', {}, 'created_at', 'desc', 200, 1)
    ])
    categories.value = cats
    // 统计每个分类的物品数
    const cntMap = {}
    for (const p of products) {
      if (p.category_l1) cntMap[p.category_l1] = (cntMap[p.category_l1] || 0) + 1
      if (p.category_l2) cntMap[p.category_l2] = (cntMap[p.category_l2] || 0) + 1
    }
    productCount.value = cntMap
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 30px; }
.loading { display: flex; justify-content: center; padding: 60px; }
.cat-row { display: flex; align-items: center; gap: 10px; }
.cat-icon {
  width: 32px; height: 32px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;
}
.cat-info { flex: 1; display: flex; flex-direction: column; }
.cat-name   { font-size: 14px; font-weight: 600; }
.cat-prefix { font-size: 11px; color: #999; }
.cat-right  { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.cat-sub    { font-size: 11px; color: #aaa; }
.cat-count  { font-size: 12px; color: #1A6DFF; font-weight: 600; }
.sub-row { display: flex; justify-content: space-between; padding: 10px 16px 10px 42px; border-bottom: 1px solid #f5f5f5; }
.sub-name  { font-size: 13px; color: #555; }
.sub-count { font-size: 12px; color: #999; }
.sub-empty { padding: 10px 42px; font-size: 12px; color: #bbb; }
.dialog-form { padding: 0 12px; }
.bg-blue   { background: #e3f2fd; }
.bg-purple { background: #f3e5f5; }
.bg-green  { background: #e8f5e9; }
.bg-orange { background: #fff3e0; }
.bg-gray   { background: #f5f5f5; }
.bg-pink   { background: #fce4ec; }
</style>
