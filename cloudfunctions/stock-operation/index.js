'use strict'

const cloudbase = require('@cloudbase/node-sdk')

// 云函数入口
exports.main = async (event, context) => {
  const { product_id, type, quantity, operator, source, destination, doc_number, note } = event

  // 参数校验
  if (!product_id) return { success: false, error: '缺少参数：product_id' }
  if (!type || !['in', 'out'].includes(type)) return { success: false, error: 'type 必须为 in 或 out' }
  if (!quantity || !Number.isInteger(quantity) || quantity <= 0) return { success: false, error: 'quantity 必须为正整数' }
  if (!operator) return { success: false, error: '缺少参数：operator' }

  const app = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV })
  const db = app.database()

  try {
    // 查询物品当前信息
    const productRes = await db.collection('products').doc(product_id).get()
    if (!productRes.data || productRes.data.length === 0) {
      return { success: false, error: '物品不存在' }
    }
    const product = productRes.data[0]

    let newQuantity

    if (type === 'out') {
      // 出库：检查库存是否充足
      if (product.quantity < quantity) {
        return { success: false, error: `库存不足，当前库存为 ${product.quantity}` }
      }
      newQuantity = product.quantity - quantity
    } else {
      // 入库：直接增加
      newQuantity = product.quantity + quantity
    }

    // 更新物品库存
    await db.collection('products').doc(product_id).update({
      quantity: newQuantity,
      updated_at: new Date(),
    })

    // 插入出入库记录
    await db.collection('stock_records').add({
      product_id,
      product_name: product.name,
      type,
      quantity,
      operator,
      source: source || '',
      destination: destination || '',
      doc_number: doc_number || '',
      note: note || '',
      created_at: new Date(),
    })

    return { success: true, new_quantity: newQuantity }
  } catch (e) {
    return { success: false, error: e.message || '操作失败' }
  }
}
