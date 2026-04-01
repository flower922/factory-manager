'use strict'

const cloudbase = require('@cloudbase/node-sdk')

exports.main = async (event, context) => {
  const app = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV })
  const db = app.database()
  const _ = db.command

  try {
    // 本月开始时间
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // 并行查询所有统计数据
    const [
      totalRes,
      monthInRes,
      monthOutRes,
      expiredRes,
      expiringRes,
      lowStockRes,
      warningListRes,
    ] = await Promise.all([
      db.collection('products').count(),
      db.collection('stock_records').where({ type: 'in', created_at: _.gte(monthStart) }).count(),
      db.collection('stock_records').where({ type: 'out', created_at: _.gte(monthStart) }).count(),
      db.collection('products').where({ status: 'expired' }).count(),
      db.collection('products').where({ status: 'expiring' }).count(),
      db.collection('products').where({ status: 'low_stock' }).count(),
      db.collection('products')
        .where({ status: _.in(['expired', 'expiring']) })
        .orderBy('expire_date', 'asc')
        .limit(5)
        .field({ _id: true, name: true, zone_name: true, expire_date: true, status: true })
        .get(),
    ])

    return {
      success: true,
      data: {
        total_products: totalRes.total,
        month_in: monthInRes.total,
        month_out: monthOutRes.total,
        expired_count: expiredRes.total,
        expiring_count: expiringRes.total,
        low_stock_count: lowStockRes.total,
        expiring_list: warningListRes.data,
      },
    }
  } catch (e) {
    return { success: false, error: e.message || '统计失败' }
  }
}
