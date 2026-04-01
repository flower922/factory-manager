// CloudBase SDK 初始化，全项目统一使用此文件导出的实例
import cloudbase from '@cloudbase/js-sdk'

const envId = import.meta.env.VITE_CB_ENV_ID

if (!envId || envId === '你的环境ID在这里填') {
  console.warn('[CloudBase] 警告：未配置环境ID，请在 .env 文件中填写 VITE_CB_ENV_ID')
}

// 初始化应用实例
const app = cloudbase.init({
  env: envId,
})

// 认证实例
const auth = app.auth({ persistence: 'local' })

// 数据库实例
const db = app.database()

export { app, auth, db }
