'use strict'

const cloudbase = require('@cloudbase/node-sdk')

exports.main = async (event, context) => {
  const { category_l1 } = event

  if (!category_l1) return { success: false, error: '缺少参数：category_l1' }

  const app = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV })
  const db = app.database()

  try {
    // 1. 查询该分类的编码前缀
    const catRes = await db.collection('categories')
      .where({ name: category_l1, level: 1 })
      .limit(1)
      .get()

    if (!catRes.data || catRes.data.length === 0) {
      return { success: false, error: `未找到分类：${category_l1}` }
    }

    const prefix = catRes.data[0].code_prefix // 如 "YL"

    // 2. 查询该前缀下编码最大的物品
    const prodRes = await db.collection('products')
      .where({ code: db.RegExp({ regexp: `^${prefix}-`, flags: 'i' }) })
      .orderBy('code', 'desc')
      .limit(1)
      .get()

    let nextNum = 1

    if (prodRes.data && prodRes.data.length > 0) {
      const lastCode = prodRes.data[0].code // 如 "YL-023"
      const parts = lastCode.split('-')
      if (parts.length === 2) {
        const num = parseInt(parts[1], 10)
        if (!isNaN(num)) nextNum = num + 1
      }
    }

    // 3. 补零到3位
    const code = `${prefix}-${String(nextNum).padStart(3, '0')}`

    return { success: true, code }
  } catch (e) {
    return { success: false, error: e.message || '生成失败' }
  }
}
