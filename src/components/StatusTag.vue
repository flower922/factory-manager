<template>
  <van-tag :color="cfg.bg" :text-color="cfg.text" round>{{ cfg.label }}</van-tag>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, required: true },
})

const statusMap = {
  normal:     { label: '正常',    bg: '#e8f5e9', text: '#2e7d32' },
  expiring:   { label: '即将到期', bg: '#fff3e0', text: '#e65100' },
  expired:    { label: '已过期',  bg: '#ffebee', text: '#c62828' },
  low_stock:  { label: '库存低',  bg: '#fff3e0', text: '#e65100' },
  controlled: { label: '管控品',  bg: '#f3e5f5', text: '#6a1b9a' },
  empty:      { label: '空',      bg: '#f5f5f5', text: '#757575' },
  occupied:   { label: '已占用',  bg: '#e3f2fd', text: '#1565c0' },
  full:       { label: '已满',    bg: '#fff3e0', text: '#e65100' },
}

const cfg = computed(() => statusMap[props.status] || { label: props.status, bg: '#f5f5f5', text: '#333' })
</script>
