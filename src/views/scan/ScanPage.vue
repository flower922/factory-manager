<template>
  <div class="scan-page">
    <!-- 摄像头区域 -->
    <div class="camera-area">
      <div id="qr-reader" class="qr-reader"></div>

      <!-- 扫码框叠层 -->
      <div class="scan-overlay">
        <div class="scan-frame">
          <span class="corner tl"></span>
          <span class="corner tr"></span>
          <span class="corner bl"></span>
          <span class="corner br"></span>
          <div class="scan-line"></div>
        </div>
        <div class="scan-tip">将二维码放入框内，自动扫描</div>
      </div>

      <!-- 底部按钮 -->
      <div class="cam-btns">
        <div class="cam-btn" @click="toggleFlash">💡 开灯</div>
        <div class="cam-btn" @click="scanFromAlbum">🖼 相册</div>
      </div>
    </div>

    <!-- 手动输入区域 -->
    <div class="manual-area">
      <div class="manual-label">手动输入编码</div>
      <div class="manual-row">
        <van-field
          v-model="manualCode"
          placeholder="输入物品编码或库位编号"
          clearable
          class="manual-input"
          @keyup.enter="handleCode(manualCode)"
        />
        <van-button type="primary" size="small" @click="handleCode(manualCode)">查询</van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { list } from '@/utils/api.js'

const route  = useRoute()
const router = useRouter()

const manualCode = ref('')
let scanner = null
let Html5QrcodeClass = null

onMounted(async () => {
  try {
    const mod = await import('html5-qrcode')
    Html5QrcodeClass = mod.Html5Qrcode
    scanner = new Html5QrcodeClass('qr-reader')
    await scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      (decodedText) => { handleCode(decodedText) },
      () => { /* 扫描中，忽略错误日志 */ }
    )
  } catch (e) {
    // 摄像头不可用时静默降级，使用手动输入
    console.warn('[ScanPage] 摄像头初始化失败：', e?.message)
  }
})

onUnmounted(async () => {
  if (scanner) {
    try { await scanner.stop() } catch (e) { /* 忽略 */ }
  }
})

async function handleCode(code) {
  if (!code?.trim()) return
  const c = code.trim()
  const returnPath = route.query.return

  try {
    const products = await list('products', {}, 'created_at', 'desc', 200, 1)
    const product  = products.find(p => p.code === c)

    if (product) {
      if (returnPath) {
        router.push(returnPath + '?product_id=' + product._id)
      } else {
        router.push('/items/' + product._id)
      }
      return
    }

    const slots = await list('slots', {}, 'created_at', 'asc', 200, 1)
    const slot  = slots.find(s => s.slot_id === c)

    if (slot) {
      router.push('/map/slot/' + encodeURIComponent(slot.zone_name))
      return
    }

    showToast('未找到对应物品或库位')
  } catch (e) {
    showToast('查询失败')
  }
}

async function toggleFlash() {
  if (!scanner) { showToast('摄像头未启动'); return }
  try {
    const on = await scanner.isFlashOn?.()
    on ? scanner.disableTorch?.() : scanner.enableTorch?.()
  } catch (e) {
    showToast('当前设备不支持闪光灯')
  }
}

async function scanFromAlbum() {
  if (!Html5QrcodeClass) { showToast('功能初始化中'); return }
  const input = document.createElement('input')
  input.type  = 'file'
  input.accept= 'image/*'
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const reader = new Html5QrcodeClass('qr-reader')
      const result = await reader.scanFile(file, true)
      handleCode(result)
    } catch (err) {
      showToast('图片中未识别到二维码')
    }
  }
  input.click()
}
</script>

<style scoped>
.scan-page { height: 100vh; display: flex; flex-direction: column; background: #000; }
.camera-area { flex: 1; position: relative; overflow: hidden; }
.qr-reader { width: 100%; height: 100%; }

.scan-overlay {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  pointer-events: none;
}
.scan-frame {
  width: 220px; height: 220px;
  position: relative;
  border: 1px solid rgba(255,255,255,0.2);
}
.corner {
  position: absolute; width: 20px; height: 20px;
  border-color: #1A6DFF; border-style: solid;
}
.tl { top: 0; left: 0;  border-width: 3px 0 0 3px; }
.tr { top: 0; right: 0; border-width: 3px 3px 0 0; }
.bl { bottom: 0; left: 0;  border-width: 0 0 3px 3px; }
.br { bottom: 0; right: 0; border-width: 0 3px 3px 0; }
.scan-line {
  position: absolute; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, transparent, #1A6DFF, transparent);
  animation: scan 2s linear infinite;
}
@keyframes scan { from { top: 0; } to { top: 100%; } }
.scan-tip { margin-top: 20px; color: rgba(255,255,255,0.7); font-size: 13px; }
.cam-btns {
  position: absolute; bottom: 20px; left: 0; right: 0;
  display: flex; justify-content: center; gap: 40px;
}
.cam-btn {
  color: #fff; font-size: 13px; padding: 8px 20px;
  background: rgba(255,255,255,0.15); border-radius: 20px; cursor: pointer;
}
.manual-area { background: #fff; padding: 16px; }
.manual-label { font-size: 13px; color: #888; margin-bottom: 8px; }
.manual-row { display: flex; gap: 8px; align-items: center; }
.manual-input { flex: 1; border: 1px solid #eee; border-radius: 6px; }
</style>
