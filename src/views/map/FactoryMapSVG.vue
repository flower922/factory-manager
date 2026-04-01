<template>
  <div class="map-container">
    <svg
      :viewBox="'0 0 1000 700'"
      width="100%"
      xmlns="http://www.w3.org/2000/svg"
      style="display:block;"
    >
      <g v-for="zone in zones" :key="zone.name">
        <rect
          :x="zone.x"
          :y="zone.y"
          :width="zone.w"
          :height="zone.h"
          :fill="getFill(zone.name)"
          stroke="#fff"
          stroke-width="1.5"
          rx="3"
          class="zone-rect"
          :class="{ highlight: highlightZone === zone.name }"
          @click="$emit('zone-click', zone.name)"
          style="cursor:pointer;"
        />
        <text
          :x="zone.x + zone.w / 2"
          :y="zone.y + zone.h / 2 + 1"
          text-anchor="middle"
          dominant-baseline="middle"
          :font-size="zone.w < 50 || zone.h < 30 ? 8 : zone.w < 80 ? 10 : 12"
          fill="#fff"
          font-weight="600"
          pointer-events="none"
          style="user-select:none;"
        >
          <!-- 小区域换行显示 -->
          <tspan v-if="zone.name.length <= 3">{{ zone.name }}</tspan>
          <template v-else>
            <tspan :x="zone.x + zone.w / 2" :dy="-6">{{ zone.name.slice(0, 3) }}</tspan>
            <tspan :x="zone.x + zone.w / 2" dy="14">{{ zone.name.slice(3) }}</tspan>
          </template>
        </text>
      </g>
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  // 键为区域名，值为 'green'|'yellow'|'red'|'gray'
  zoneColors: {
    type: Object,
    default: () => ({})
  },
  // 需要闪烁高亮的区域名
  highlightZone: {
    type: String,
    default: ''
  }
})

defineEmits(['zone-click'])

// 颜色映射
const colorMap = {
  green:  'rgba(0,181,120,0.85)',
  yellow: 'rgba(255,143,31,0.85)',
  red:    'rgba(250,81,81,0.85)',
  gray:   'rgba(154,154,176,0.55)'
}

function getFill(name) {
  const key = props.zoneColors[name] || 'green'
  return colorMap[key] || colorMap.green
}

// 厂区布局坐标（基于 viewBox 1000×700）
// 整体分为左侧办公区、右侧生产区，从上到下排列
const zones = [
  // ===== 第1行：顶部区域 =====
  { name: '院子',     x: 0,   y: 0,   w: 120, h: 60 },
  { name: '院子',     x: 125, y: 0,   w: 80,  h: 60 },  // 第二个院子
  { name: '工具间',   x: 210, y: 0,   w: 70,  h: 60 },
  { name: '工程部',   x: 285, y: 0,   w: 80,  h: 60 },
  { name: '培训室',   x: 370, y: 0,   w: 80,  h: 60 },
  { name: '文印室',   x: 455, y: 0,   w: 70,  h: 60 },
  { name: '茶水间',   x: 530, y: 0,   w: 70,  h: 60 },
  { name: '储物室',   x: 605, y: 0,   w: 70,  h: 60 },
  { name: '厕2',      x: 680, y: 0,   w: 50,  h: 60 },
  { name: '厕1',      x: 735, y: 0,   w: 50,  h: 60 },
  { name: '办1',      x: 790, y: 0,   w: 90,  h: 60 },

  // ===== 第2行 =====
  { name: '餐厅',     x: 0,   y: 65,  w: 130, h: 70 },
  { name: '前台',     x: 135, y: 65,  w: 80,  h: 70 },
  { name: '办2',      x: 220, y: 65,  w: 100, h: 70 },
  { name: '办3',      x: 325, y: 65,  w: 100, h: 70 },

  // ===== 第3行：实验区 =====
  { name: '实验办公区', x: 0,   y: 140, w: 140, h: 80 },
  { name: '微生物室',   x: 145, y: 140, w: 120, h: 80 },
  { name: '易制毒品室', x: 270, y: 140, w: 120, h: 80 },
  { name: '冷库',       x: 395, y: 140, w: 100, h: 80 },
  { name: '小库房',     x: 500, y: 140, w: 100, h: 80 },
  { name: '测试区',     x: 605, y: 140, w: 100, h: 80 },

  // ===== 第4行：库房+生产区 =====
  { name: '库房',       x: 0,   y: 225, w: 220, h: 120 },
  { name: '犬舍',       x: 225, y: 225, w: 80,  h: 120 },
  { name: '物料通道',   x: 310, y: 225, w: 80,  h: 120 },
  { name: '成品区',     x: 395, y: 225, w: 180, h: 120 },
  { name: '发货口',     x: 580, y: 225, w: 120, h: 120 },

  // ===== 第5行 =====
  { name: '大门口',     x: 0,   y: 350, w: 100, h: 60 },
  { name: '换鞋区',     x: 105, y: 350, w: 80,  h: 60 },
  { name: '男更衣室',   x: 190, y: 350, w: 100, h: 60 },
  { name: '女更衣室',   x: 295, y: 350, w: 100, h: 60 },
  { name: '风淋室',     x: 400, y: 350, w: 80,  h: 60 },
  { name: '消防区',     x: 485, y: 350, w: 80,  h: 60 },
  { name: '蒸煮区',     x: 570, y: 350, w: 130, h: 60 },

  // ===== 第6行：生产线 =====
  { name: '灌装区',     x: 0,   y: 415, w: 180, h: 80 },
  { name: '乳化区',     x: 185, y: 415, w: 180, h: 80 },
  { name: '备料间',     x: 370, y: 415, w: 120, h: 80 },

  // ===== 第7行：走廊 =====
  { name: '清洗区',     x: 0,   y: 500, w: 490, h: 60 },
]
</script>

<style scoped>
.map-container {
  width: 100%;
  overflow-x: auto;
  background: #f0f2f5;
  border-radius: 8px;
}

/* 悬停效果 */
.zone-rect {
  transition: transform 0.15s, filter 0.15s;
  transform-box: fill-box;
  transform-origin: center;
}
.zone-rect:hover {
  transform: scale(1.03);
  filter: brightness(1.15);
}

/* 闪烁高亮动画 */
.zone-rect.highlight {
  animation: blink 0.8s ease-in-out infinite alternate;
}
@keyframes blink {
  from { opacity: 1; }
  to   { opacity: 0.4; }
}
</style>
