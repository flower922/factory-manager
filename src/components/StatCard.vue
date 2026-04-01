<script setup>
const props = defineProps({
  label: { type: String, required: true },
  value: { type: [Number, String], required: true },
  color: { type: String, default: '#1A6DFF' },
  icon: { type: String, default: '' },
  clickable: { type: Boolean, default: false },
})

const emit = defineEmits(['click'])

function handleClick() {
  if (props.clickable) {
    emit('click')
  }
}
</script>

<template>
  <div
    class="stat-card"
    :class="{ clickable }"
    @click="handleClick"
  >
    <van-icon v-if="icon" :name="icon" :color="color" size="20" class="card-icon" />
    <div class="card-value" :style="{ color }">{{ value }}</div>
    <div class="card-label">{{ label }}</div>
  </div>
</template>

<style scoped>
.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px 12px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.stat-card.clickable {
  cursor: pointer;
}
.card-icon {
  margin-bottom: 4px;
}
.card-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}
.card-label {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>
