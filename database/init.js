/**
 * 数据库集合初始化脚本
 * 运行方式：node database/init.js
 * 需要先设置环境变量：
 *   set CB_ENV_ID=你的环境ID
 *   set CB_SECRET_ID=你的SecretId
 *   set CB_SECRET_KEY=你的SecretKey
 */

const cloudbase = require('@cloudbase/node-sdk')

const envId = process.env.CB_ENV_ID
const secretId = process.env.CB_SECRET_ID
const secretKey = process.env.CB_SECRET_KEY

if (!envId || !secretId || !secretKey) {
  console.error('❌ 请先设置环境变量：CB_ENV_ID、CB_SECRET_ID、CB_SECRET_KEY')
  process.exit(1)
}

const app = cloudbase.init({
  env: envId,
  secretId,
  secretKey,
})

const db = app.database()

// 需要创建的10个集合
const collections = [
  'users',
  'zones',
  'slots',
  'products',
  'stock_records',
  'inventory_tasks',
  'inventory_details',
  'expiry_handles',
  'poison_records',
  'categories',
]

async function main() {
  console.log('开始初始化数据库集合...\n')

  for (const name of collections) {
    try {
      await db.createCollection(name)
      console.log(`✅ 创建集合成功：${name}`)
    } catch (e) {
      // 集合已存在时跳过，不报错
      if (e.message && e.message.includes('already exists')) {
        console.log(`⏭  集合已存在，跳过：${name}`)
      } else {
        console.error(`❌ 创建集合失败：${name}`, e.message)
      }
    }
  }

  console.log('\n✅ 初始化完成！')
}

main()
