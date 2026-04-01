<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, required: true },
})

// 状态映射：颜色和文字
const statusMap = {
  normal:    { color: 'success', text: '正常' },
  expiring:  { color: 'warning', text: '即将到期' },
  expired:   { color: 'danger',  text: '已过期' },
  low_stock: { color: 'warning', text: '库存低' },
  controlled:{ color: 'primary', text: '管控品' },  // van-tag primary 是蓝色，这里用自定义
  empty:     { color: 'default', text: '空' },
  occupied:  { color: 'primary', text: '已占用' },
  full:      { color: 'warning', text: '已满' },
}

const config = computed(() => statusMap[props.status] || { color: 'default', text: props.status })

// 管控品用紫色，van-tag 不支持直接用 purple，需要自定义
const isControlled = computed(() => props.status === 'controlled')
</script>

<template>
  <van-tag
    v-if="!isControlled"
    :type="config.color"
    plain
  >
    {{ config.text }}
  </van-tag>
  <!-- 管控品单独用紫色 -->
  <van-tag
    v-else
    color="#9C27B0"
    text-color="#fff"
  >
    {{ config.text }}
  </van-tag>
</template>
