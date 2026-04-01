// CloudBase SDK 初始化，全项目统一使用此文件导出的实例
import cloudbase from '@cloudbase/js-sdk'

const envId = import.meta.env.VITE_CB_ENV_ID
const isConfigured = envId && envId !== 'your-env-id-here' && envId !== 'placeholder-env-id'

if (!isConfigured) {
  console.warn('[CloudBase] 警告：未配置真实环境ID，数据库功能不可用')
}

// 初始化 CloudBase 应用实例（用英文占位符，避免 btoa 中文报错）
let app, db, auth

try {
  app  = cloudbase.init({ env: isConfigured ? envId : 'placeholder-env-id' })
  db   = app.database()
  auth = app.auth({ persistence: 'local' })
} catch (e) {
  console.warn('[CloudBase] 初始化失败，页面将以离线模式运行', e)
  db   = null
  auth = null
  app  = null
}

export { app, db, auth }
