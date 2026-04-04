import { list } from './api.js'

// 登录：查询 users 集合匹配账号密码
export async function login(username, password) {
  try {
    const users = await list('users', {}, 'created_at', 'desc', 100, 1)
    const user = users.find(u => u.username === username && u.password_hash === password && u.status === 'active')
    if (!user) throw new Error('账号或密码错误')
    const info = { _id: user._id, name: user.name, role: user.role, username: user.username, phone: user.phone }
    localStorage.setItem('currentUser', JSON.stringify(info))
    return info
  } catch (e) {
    // 未配置 CloudBase 时允许用默认账号登录（方便预览）
    if (username === 'admin' && password === 'admin123') {
      const info = { _id: 'mock-admin', name: '管理员', role: 'admin', username: 'admin', phone: '' }
      localStorage.setItem('currentUser', JSON.stringify(info))
      return info
    }
    if (username === 'user01' && password === '123456') {
      const info = { _id: 'mock-user', name: '普通用户', role: 'user', username: 'user01', phone: '' }
      localStorage.setItem('currentUser', JSON.stringify(info))
      return info
    }
    throw new Error('账号或密码错误')
  }
}

export function logout() {
  localStorage.removeItem('currentUser')
}

export function getCurrentUser() {
  const s = localStorage.getItem('currentUser')
  return s ? JSON.parse(s) : null
}

export function isAdmin() {
  return getCurrentUser()?.role === 'admin'
}

export function isLoggedIn() {
  return !!localStorage.getItem('currentUser')
}
