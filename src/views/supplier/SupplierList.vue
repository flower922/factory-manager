<template>
  <div class="page">
    <NavBar title="供应商管理">
      <template #right>
        <van-icon name="plus" size="20" @click="openAddDialog" />
      </template>
    </NavBar>

    <!-- 搜索 -->
    <van-search v-model="keyword" placeholder="搜索供应商名称" @input="filterList" @clear="filterList" />

    <!-- 列表 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="loadData"
      >
        <van-cell
          v-for="s in filtered"
          :key="s._id"
          :title="s.name"
          :label="(s.contact_name || '') + (s.contact_name && s.phone ? '  ·  ' : '') + (s.phone || '')"
          @contextmenu.prevent="onLongPress(s)"
          @touchstart="startLongPress(s)"
          @touchend="cancelLongPress"
          @touchmove="cancelLongPress"
        >
          <template #right-icon>
            <van-tag :type="s.status === 'active' ? 'success' : 'default'">
              {{ s.status === 'active' ? '启用' : '停用' }}
            </van-tag>
          </template>
        </van-cell>
        <EmptyState v-if="!loading && !filtered.length" text="暂无供应商" />
      </van-list>
    </van-pull-refresh>

    <!-- 长按操作菜单 -->
    <van-action-sheet
      v-model:show="showAction"
      :actions="actionItems"
      cancel-text="取消"
      @select="onActionSelect"
    />

    <!-- 新增/编辑弹窗 -->
    <van-dialog
      v-model:show="showDialog"
      :title="editTarget ? '编辑供应商' : '新增供应商'"
      show-cancel-button
      :before-close="onDialogConfirm"
    >
      <div class="dialog-form">
        <van-cell-group inset>
          <van-field v-model="form.name" label="名称" placeholder="必填" required />
          <van-field v-model="form.contact_name" label="联系人" placeholder="可选" />
          <van-field v-model="form.phone" label="电话" placeholder="可选" type="tel" />
          <van-field v-model="form.address" label="地址" placeholder="可选" />
          <van-field v-model="form.note" label="备注" placeholder="可选" />
          <van-field label="状态" is-link readonly :model-value="form.status === 'active' ? '启用' : '停用'" @click="showStatusPicker = true" />
        </van-cell-group>
      </div>
    </van-dialog>

    <!-- 状态选择 -->
    <van-popup v-model:show="showStatusPicker" position="bottom" round>
      <van-picker
        :columns="statusOptions"
        @confirm="v => { form.status = v.selectedValues[0]; showStatusPicker = false }"
        @cancel="showStatusPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import { NavBar, EmptyState } from '@/components'
import { list, add, update, remove } from '@/utils/api.js'

const keyword     = ref('')
const allList     = ref([])
const loading     = ref(false)
const finished    = ref(false)
const refreshing  = ref(false)
const showAction  = ref(false)
const showDialog  = ref(false)
const showStatusPicker = ref(false)
const editTarget  = ref(null)
let longPressTimer = null

const form = reactive({ name: '', contact_name: '', phone: '', address: '', note: '', status: 'active' })

const statusOptions = [
  { text: '启用', value: 'active' },
  { text: '停用', value: 'inactive' },
]

const actionItems = [
  { name: '编辑', color: '#1A6DFF' },
  { name: '删除', color: '#e53935' },
]

// 当前长按的供应商
const currentSupplier = ref(null)

const filtered = computed(() => {
  const kw = keyword.value.trim()
  if (!kw) return allList.value
  return allList.value.filter(s => s.name?.includes(kw))
})

onMounted(() => { loadData() })

async function loadData() {
  if (finished.value) return
  loading.value = true
  try {
    const res = await list('suppliers', {}, 'created_at', 'desc', 100, 1)
    allList.value = res
    finished.value = true
  } catch (e) {
    showToast('加载失败')
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

function onRefresh() {
  finished.value = false
  allList.value = []
  loadData()
}

function filterList() { /* computed 响应式处理 */ }

function startLongPress(supplier) {
  longPressTimer = setTimeout(() => { onLongPress(supplier) }, 600)
}
function cancelLongPress() {
  if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null }
}
function onLongPress(supplier) {
  currentSupplier.value = supplier
  showAction.value = true
}

function onActionSelect(action) {
  if (action.name === '编辑') openEditDialog(currentSupplier.value)
  if (action.name === '删除') confirmDelete(currentSupplier.value)
}

function openAddDialog() {
  editTarget.value = null
  Object.assign(form, { name: '', contact_name: '', phone: '', address: '', note: '', status: 'active' })
  showDialog.value = true
}

function openEditDialog(supplier) {
  editTarget.value = supplier
  Object.assign(form, {
    name: supplier.name || '',
    contact_name: supplier.contact_name || '',
    phone: supplier.phone || '',
    address: supplier.address || '',
    note: supplier.note || '',
    status: supplier.status || 'active',
  })
  showDialog.value = true
}

async function onDialogConfirm(action) {
  if (action === 'cancel') return true
  if (!form.name.trim()) { showToast('名称不能为空'); return false }
  try {
    if (editTarget.value) {
      await update('suppliers', editTarget.value._id, { ...form })
      const idx = allList.value.findIndex(s => s._id === editTarget.value._id)
      if (idx !== -1) allList.value[idx] = { ...allList.value[idx], ...form }
      showToast('修改成功')
    } else {
      const res = await add('suppliers', { ...form, created_at: new Date() })
      allList.value.unshift({ _id: res.id, ...form, created_at: new Date() })
      showToast('添加成功')
    }
    return true
  } catch (e) {
    showToast('操作失败')
    return false
  }
}

async function confirmDelete(supplier) {
  try {
    await showConfirmDialog({ title: '删除确认', message: `确定删除"${supplier.name}"？` })
    await remove('suppliers', supplier._id)
    allList.value = allList.value.filter(s => s._id !== supplier._id)
    showToast('已删除')
  } catch (e) { /* 取消或失败 */ }
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 20px; }
.dialog-form { padding: 8px 0; }
</style>
