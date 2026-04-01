// 数据库 CRUD 操作封装，全项目统一使用这些方法操作数据库
import { db } from './cloudbase.js'

/**
 * 新增一条记录，自动加上 created_at
 * @param {string} collection 集合名
 * @param {object} data 数据对象
 */
export async function add(collection, data) {
  try {
    const res = await db.collection(collection).add({
      ...data,
      created_at: new Date(),
    })
    return res
  } catch (e) {
    console.error(`[api.add] ${collection}`, e)
    throw e
  }
}

/**
 * 按 _id 查询单条记录
 * @param {string} collection 集合名
 * @param {string} id 记录ID
 */
export async function getById(collection, id) {
  try {
    const res = await db.collection(collection).doc(id).get()
    return res.data[0] || null
  } catch (e) {
    console.error(`[api.getById] ${collection}`, e)
    throw e
  }
}

/**
 * 分页查询列表
 * @param {string} collection 集合名
 * @param {object} where 查询条件
 * @param {string} orderBy 排序字段
 * @param {string} direction 排序方向 asc/desc
 * @param {number} pageSize 每页条数
 * @param {number} pageNum 页码（从1开始）
 */
export async function list(
  collection,
  where = {},
  orderBy = 'created_at',
  direction = 'desc',
  pageSize = 20,
  pageNum = 1
) {
  try {
    let query = db.collection(collection)
    if (Object.keys(where).length > 0) {
      query = query.where(where)
    }
    const res = await query
      .orderBy(orderBy, direction)
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .get()
    return res.data
  } catch (e) {
    console.error(`[api.list] ${collection}`, e)
    throw e
  }
}

/**
 * 更新记录，自动加上 updated_at
 * @param {string} collection 集合名
 * @param {string} id 记录ID
 * @param {object} data 要更新的字段
 */
export async function update(collection, id, data) {
  try {
    const res = await db.collection(collection).doc(id).update({
      ...data,
      updated_at: new Date(),
    })
    return res
  } catch (e) {
    console.error(`[api.update] ${collection}`, e)
    throw e
  }
}

/**
 * 删除记录
 * @param {string} collection 集合名
 * @param {string} id 记录ID
 */
export async function remove(collection, id) {
  try {
    const res = await db.collection(collection).doc(id).remove()
    return res
  } catch (e) {
    console.error(`[api.remove] ${collection}`, e)
    throw e
  }
}

/**
 * 统计数量
 * @param {string} collection 集合名
 * @param {object} where 查询条件
 */
export async function count(collection, where = {}) {
  try {
    let query = db.collection(collection)
    if (Object.keys(where).length > 0) {
      query = query.where(where)
    }
    const res = await query.count()
    return res.total
  } catch (e) {
    console.error(`[api.count] ${collection}`, e)
    throw e
  }
}

/**
 * 查询指定一级分类的到期预警提前天数
 * @param {string} categoryL1 一级分类名称（如"原料"）
 * @returns {number} 提前天数，找不到返回 30
 */
export async function getExpiryAdvanceDays(categoryL1) {
  try {
    const res = await db.collection('categories')
      .where({ name: categoryL1, level: 1 })
      .limit(1)
      .get()
    if (res.data && res.data.length > 0) {
      return res.data[0].expiry_advance_days ?? 30
    }
    return 30
  } catch (e) {
    console.error('[api.getExpiryAdvanceDays]', e)
    return 30
  }
}
