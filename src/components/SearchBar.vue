<script setup>
import { ref } from 'vue'

const props = defineProps({
  placeholder: { type: String, default: '搜索' },
})

const emit = defineEmits(['search'])
const keyword = ref('')

function handleSearch() {
  emit('search', keyword.value.trim())
}
</script>

<template>
  <van-search
    v-model="keyword"
    :placeholder="placeholder"
    @search="handleSearch"
    @click-right-icon="handleSearch"
  />
</template>
