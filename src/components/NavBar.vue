<template>
  <van-nav-bar
    :title="title"
    :left-arrow="leftArrow"
    :right-text="rightText"
    :right-icon="rightIcon"
    fixed
    placeholder
    @click-left="handleLeft"
    @click-right="$emit('clickRight')"
  />
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
  title:     { type: String, required: true },
  leftArrow: { type: Boolean, default: true },
  rightText: { type: String, default: '' },
  rightIcon: { type: String, default: '' }
})

const emit = defineEmits(['clickLeft', 'clickRight'])

function handleLeft() {
  emit('clickLeft')
  if (props.leftArrow) {
    router.back()
  }
}
</script>
