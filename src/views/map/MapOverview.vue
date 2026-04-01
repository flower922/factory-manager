<template>
  <div class="page">
    <!-- 顶部导航 -->
    <van-nav-bar title="厂区地图" fixed placeholder />

    <!-- 搜索栏 -->
    <SearchBar placeholder="输入物品名称，定位到区域" @search="onSearch" />

    <!-- 图例栏 -->
    <div class="legend">
      <span class="legend-item"><i class="dot green"></i>正常</span>
      <span class="legend-item"><i class="dot yellow"></i>即将到期</span>
      <span class="legend-item"><i class="dot red"></i>有过期品</span>
      <span class="legend-item"><i class="dot gray"></i>非管理区</span>
    </div>

    <!-- 厂区SVG地图 -->
    <div class="map-wrap">
      <FactoryMapSVG
        :zoneColors="zoneColors"
        :highlightZone="highlightZone"
        @zone-click="onZoneClick"
      />
    </div>

    <!-- 底部TabBar -->
    <TabBar />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import FactoryMapSVG from './FactoryMapSVG.vue'
import { SearchBar, TabBar } from '@/components'
import { list } from '@/utils/api.js'

const router = useRouter()

// 非管理区域（不统计物品状态，直接显示灰色）
const NON_MANAGED = new Set([
  '院子', '大门口', '犬舍', '物料通道', '发货口',
  '厕1', '厕2', '走廊', '换鞋区', '风淋室', '消防区'
])

const zoneColors = ref({})
const highlightZone = ref('')

// 页面加载时从数据库统计各区域状态
onMounted(async () => {
  try {
    const products = await list('products', {}, 'created_at', 'desc', 100, 1)
    buildZoneColors(products)
  } catch (e) {
    // CloudBase未配置时静默失败，显示默认绿色
  }
})

function buildZoneColors(products) {
  const zoneStatus = {}
  for (const p of products) {
    const zone = p.zone_name
    if (!zone) continue
    if (NON_MANAGED.has(zone)) {
      zoneStatus[zone] = 'gray'
      continue
    }
    // 优先级：red > yellow > green
    const cur = zoneStatus[zone]
    if (p.status === 'expired') {
      zoneStatus[zone] = 'red'
    } else if (p.status === 'expiring' && cur !== 'red') {
      zoneStatus[zone] = 'yellow'
    } else if (!cur) {
      zoneStatus[zone] = 'green'
    }
  }
  NON_MANAGED.forEach(n => { zoneStatus[n] = 'gray' })
  zoneColors.value = zoneStatus
}

// 搜索：找到物品所在区域并高亮
async function onSearch(keyword) {
  if (!keyword) {
    highlightZone.value = ''
    return
  }
  try {
    const res = await list('products', {}, 'created_at', 'desc', 100, 1)
    const found = res.find(p =>
      p.name?.includes(keyword) || p.code?.includes(keyword)
    )
    if (found?.zone_name) {
      highlightZone.value = found.zone_name
      showToast(`已定位到：${found.zone_name}`)
    } else {
      showToast('未找到该物品')
      highlightZone.value = ''
    }
  } catch (e) {
    showToast('查询失败')
  }
}

// 点击区域跳转详情
function onZoneClick(zoneName) {
  router.push('/map/zone/' + encodeURIComponent(zoneName))
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f6fa;
  padding-bottom: 60px;
}
.legend {
  display: flex;
  gap: 16px;
  padding: 8px 16px;
  background: #fff;
  font-size: 12px;
  color: #555;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.dot.green  { background: rgba(0,181,120,0.85); }
.dot.yellow { background: rgba(255,143,31,0.85); }
.dot.red    { background: rgba(250,81,81,0.85); }
.dot.gray   { background: rgba(154,154,176,0.55); }
.map-wrap {
  padding: 12px;
}
</style>
