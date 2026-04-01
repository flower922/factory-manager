// 数据库 CRUD 操作封装，全项目统一使用这些方法操作数据库
import { db, isConfigured } from './cloudbase.js'

// 未配置真实环境ID时，所有操作静默返回空数据，不报错
function noDb() { return !isConfigured || !db }

export async function add(collection, data) {
  if (noDb()) return { id: 'mock-' + Date.now() }
  try {
    return await db.collection(collection).add({ ...data, created_at: new Date() })
  } catch (e) { console.warn(`[api.add] ${collection}`, e); throw e }
}

export async function getById(collection, id) {
  if (noDb()) return null
  try {
    const res = await db.collection(collection).doc(id).get()
    return res.data[0] || null
  } catch (e) { console.warn(`[api.getById] ${collection}`, e); return null }
}

export async function list(
  collection, where = {}, orderBy = 'created_at',
  direction = 'desc', pageSize = 20, pageNum = 1
) {
  if (noDb()) return []
  try {
    const skip = (pageNum - 1) * pageSize
    let query = db.collection(collection)
    if (Object.keys(where).length > 0) query = query.where(where)
    const res = await query.orderBy(orderBy, direction).skip(skip).limit(pageSize).get()
    return res.data || []
  } catch (e) { console.warn(`[api.list] ${collection}`, e); return [] }
}

export async function update(collection, id, data) {
  if (noDb()) return {}
  try {
    return await db.collection(collection).doc(id).update({ ...data, updated_at: new Date() })
  } catch (e) { console.warn(`[api.update] ${collection}`, e); throw e }
}

export async function remove(collection, id) {
  if (noDb()) return {}
  try {
    return await db.collection(collection).doc(id).remove()
  } catch (e) { console.warn(`[api.remove] ${collection}`, e); throw e }
}

export async function count(collection, where = {}) {
  if (noDb()) return 0
  try {
    let query = db.collection(collection)
    if (Object.keys(where).length > 0) query = query.where(where)
    const res = await query.count()
    return res.total || 0
  } catch (e) { console.warn(`[api.count] ${collection}`, e); return 0 }
}

export async function getExpiryAdvanceDays(categoryL1) {
  if (noDb()) return 30
  try {
    const res = await db.collection('categories').where({ name: categoryL1, level: 1 }).limit(1).get()
    return res.data?.[0]?.expiry_advance_days ?? 30
  } catch (e) { return 30 }
}
