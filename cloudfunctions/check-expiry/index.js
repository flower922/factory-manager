'use strict'

const cloudbase = require('@cloudbase/node-sdk')

exports.main = async (event, context) => {
  const app = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV })
  const db = app.database()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  try {
    // 1. 查询所有分类的预警天数，建立映射表
    const catRes = await db.collection('categories').limit(100).get()
    const advanceMap = {}
    for (const cat of catRes.data) {
      advanceMap[cat.name] = cat.expiry_advance_days || 0
    }

    // 2. 查询所有有 expire_date 的物品（分批查询，每次100条）
    let skip = 0
    const pageSize = 100
    let updatedCount = 0
    let expiredCount = 0
    let expiringCount = 0

    while (true) {
      const res = await db.collection('products')
        .where({ expire_date: db.command.neq('') })
        .skip(skip)
        .limit(pageSize)
        .get()

      if (!res.data || res.data.length === 0) break

      for (const product of res.data) {
        const expireDate = new Date(product.expire_date)
        expireDate.setHours(0, 0, 0, 0)

        // 该分类的预警天数
        const advanceDays = advanceMap[product.category_l1] || 30
        const warnDate = new Date(today.getTime() + advanceDays * 24 * 60 * 60 * 1000)

        let newStatus = 'normal'

        // 判断过期状态
        if (expireDate < today) {
          newStatus = 'expired'
        } else if (expireDate < warnDate) {
          newStatus = 'expiring'
        }

        // 检查开封有效期（优先级更高）
        if (product.open_date && product.open_expire_days > 0) {
          const openDate = new Date(product.open_date)
          const openExpire = new Date(openDate.getTime() + product.open_expire_days * 24 * 60 * 60 * 1000)
          if (openExpire < today) {
            newStatus = 'expired'
          }
        }

        // 只更新状态有变化的物品
        if (newStatus !== product.status) {
          await db.collection('products').doc(product._id).update({
            status: newStatus,
            updated_at: new Date(),
          })
          updatedCount++
        }

        if (newStatus === 'expired') expiredCount++
        else if (newStatus === 'expiring') expiringCount++
      }

      if (res.data.length < pageSize) break
      skip += pageSize
    }

    return { success: true, updated_count: updatedCount, expired: expiredCount, expiring: expiringCount }
  } catch (e) {
    return { success: false, error: e.message || '检查失败' }
  }
}
