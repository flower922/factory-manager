// 登录认证封装
import { db } from './cloudbase.js'

const USER_KEY = 'currentUser'

/**
 * 登录：从 users 集合查询匹配的用户，比对密码，成功则存入 localStorage
 * 注意：v1.0 使用明文密码比对，后续版本再加密
 * @param {string} username 账号
 * @param {string} password 密码
 */
export async function login(username, password) {
  try {
    const res = await db.collection('users').where({ username, status: 'active' }).limit(1).get()
    if (!res.data || res.data.length === 0) {
      throw new Error('账号不存在或已被禁用')
    }
    const user = res.data[0]
    // v1.0 明文比对密码
    if (user.password_hash !== password) {
      throw new Error('密码错误')
    }
    // 存入 localStorage（不存密码字段）
    const { password_hash, ...safeUser } = user
    localStorage.setItem(USER_KEY, JSON.stringify(safeUser))
    return safeUser
  } catch (e) {
    console.error('[auth.login]', e)
    throw e
  }
}

/**
 * 登出：清除 localStorage 中的用户信息
 */
export function logout() {
  localStorage.removeItem(USER_KEY)
}

/**
 * 获取当前登录用户信息，未登录返回 null
 */
export function getCurrentUser() {
  const str = localStorage.getItem(USER_KEY)
  if (!str) return null
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}

/**
 * 判断当前用户是否为 admin 角色
 */
export function isAdmin() {
  const user = getCurrentUser()
  return user?.role === 'admin'
}

/**
 * 判断是否已登录
 */
export function isLoggedIn() {
  return !!getCurrentUser()
}
