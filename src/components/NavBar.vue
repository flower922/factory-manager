<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  title: { type: String, required: true },
  leftArrow: { type: Boolean, default: true },
  rightText: { type: String, default: '' },
  rightIcon: { type: String, default: '' },
})

const emit = defineEmits(['clickLeft', 'clickRight'])
const router = useRouter()

function handleClickLeft() {
  emit('clickLeft')
  router.back()
}

function handleClickRight() {
  emit('clickRight')
}
</script>

<template>
  <van-nav-bar
    :title="title"
    :left-arrow="leftArrow"
    :right-text="rightText"
    :right-icon="rightIcon"
    @click-left="handleClickLeft"
    @click-right="handleClickRight"
  />
</template>
