<template>
  <van-empty :image="icon" :description="text" />
</template>

<script setup>
defineProps({
  text: { type: String, default: '暂无数据' },
  icon: { type: String, default: 'description' },
})
</script>
