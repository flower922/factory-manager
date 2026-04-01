<template>
  <div
    class="stat-card"
    :style="{ '--card-color': color }"
    :class="{ clickable }"
    @click="clickable && $emit('click')"
  >
    <van-icon v-if="icon" :name="icon" size="20" :color="color" class="stat-icon" />
    <div class="stat-value" :style="{ color }">{{ value }}</div>
    <div class="stat-label">{{ label }}</div>
  </div>
</template>

<script setup>
defineProps({
  label:     { type: String, required: true },
  value:     { type: [Number, String], default: 0 },
  color:     { type: String, default: '#1A6DFF' },
  icon:      { type: String, default: '' },
  clickable: { type: Boolean, default: false }
})

defineEmits(['click'])
</script>

<style scoped>
.stat-card {
  background: #fff;
  border-radius: 10px;
  padding: 14px 10px 10px;
  text-align: center;
  flex: 1;
  box-shadow: 0 1px 6px rgba(0,0,0,0.06);
}
.stat-card.clickable {
  cursor: pointer;
}
.stat-card.clickable:active {
  opacity: 0.8;
}
.stat-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 4px;
}
.stat-label {
  font-size: 12px;
  color: #999;
}
.stat-icon {
  margin-bottom: 4px;
}
</style>
