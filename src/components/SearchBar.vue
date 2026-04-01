<template>
  <van-search
    v-model="keyword"
    :placeholder="placeholder"
    show-action
    @search="handleSearch"
    @keyup.enter="handleSearch"
  >
    <template #action>
      <div @click="handleSearch">搜索</div>
    </template>
  </van-search>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  placeholder: { type: String, default: '请输入关键词' }
})

const emit = defineEmits(['search'])

const keyword = ref('')

function handleSearch() {
  emit('search', keyword.value.trim())
}
</script>
