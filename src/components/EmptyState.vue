<script setup>
defineProps({
  text: { type: String, default: '暂无数据' },
  icon: { type: String, default: 'info-o' },
})
</script>

<template>
  <van-empty :description="text" :image="icon" />
</template>
