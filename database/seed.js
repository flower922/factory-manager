/**
 * 数据库种子数据脚本
 * 运行方式：node database/seed.js
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

const app = cloudbase.init({ env: envId, secretId, secretKey })
const db = app.database()

// ===== 用户数据 =====
const users = [
  {
    username: 'admin',
    password_hash: 'admin123',
    name: '管理员',
    role: 'admin',
    phone: '13800000001',
    status: 'active',
    created_at: new Date(),
  },
  {
    username: 'user01',
    password_hash: '123456',
    name: '普通用户',
    role: 'user',
    phone: '13800000002',
    status: 'active',
    created_at: new Date(),
  },
]

// ===== 区域数据（36条）=====
const zones = [
  // 院子（多个）
  { name: '院子1', code: 'Y1', type: 'office', color: '#9E9E9E', has_slots: false, width: 120, height: 80 },
  { name: '院子2', code: 'Y2', type: 'office', color: '#9E9E9E', has_slots: false, width: 120, height: 80 },
  { name: '院子3', code: 'Y3', type: 'office', color: '#9E9E9E', has_slots: false, width: 120, height: 80 },
  // 办公区
  { name: '工具间', code: 'A', type: 'office', color: '#90CAF9', has_slots: false, width: 80, height: 60 },
  { name: '工程部', code: 'B', type: 'office', color: '#90CAF9', has_slots: false, width: 100, height: 60 },
  { name: '培训室', code: 'C', type: 'office', color: '#90CAF9', has_slots: false, width: 80, height: 60 },
  { name: '文印室', code: 'D', type: 'office', color: '#90CAF9', has_slots: false, width: 80, height: 60 },
  { name: '茶水间', code: 'E', type: 'office', color: '#90CAF9', has_slots: false, width: 60, height: 60 },
  { name: '储物室', code: 'F', type: 'office', color: '#90CAF9', has_slots: false, width: 80, height: 60 },
  { name: '厕1', code: 'G', type: 'office', color: '#CE93D8', has_slots: false, width: 50, height: 60 },
  { name: '厕2', code: 'H', type: 'office', color: '#CE93D8', has_slots: false, width: 50, height: 60 },
  { name: '办1', code: 'I', type: 'office', color: '#90CAF9', has_slots: false, width: 60, height: 120 },
  { name: '办2', code: 'J', type: 'office', color: '#90CAF9', has_slots: false, width: 80, height: 60 },
  { name: '办3', code: 'K', type: 'office', color: '#90CAF9', has_slots: false, width: 60, height: 60 },
  { name: '餐厅', code: 'L', type: 'office', color: '#FFCC80', has_slots: false, width: 120, height: 80 },
  { name: '前台', code: 'M', type: 'office', color: '#90CAF9', has_slots: false, width: 120, height: 80 },
  { name: '大门口', code: 'N', type: 'office', color: '#90CAF9', has_slots: false, width: 100, height: 60 },
  { name: '男更衣室', code: 'O', type: 'office', color: '#90CAF9', has_slots: false, width: 60, height: 80 },
  { name: '女更衣室', code: 'P', type: 'office', color: '#F48FB1', has_slots: false, width: 60, height: 80 },
  { name: '消防区', code: 'Q', type: 'office', color: '#EF9A9A', has_slots: false, width: 60, height: 60 },
  // 实验区
  { name: '实验办公区', code: 'R', type: 'lab', color: '#A5D6A7', has_slots: false, width: 120, height: 80 },
  { name: '微生物室', code: 'S', type: 'lab', color: '#A5D6A7', has_slots: false, width: 100, height: 80 },
  { name: '易制毒品室', code: 'T', type: 'lab', color: '#FFAB91', has_slots: false, width: 80, height: 80 },
  { name: '测试区', code: 'U', type: 'lab', color: '#A5D6A7', has_slots: false, width: 100, height: 160 },
  // 仓储区（has_slots=true）
  { name: '库房', code: 'A1', type: 'warehouse', color: '#00D4AA', has_slots: true, width: 200, height: 120 },
  { name: '小库房', code: 'B1', type: 'warehouse', color: '#00D4AA', has_slots: true, width: 100, height: 80 },
  { name: '冷库', code: 'C1', type: 'warehouse', color: '#4FC3F7', has_slots: true, width: 100, height: 80 },
  { name: '成品区', code: 'D1', type: 'warehouse', color: '#00D4AA', has_slots: true, width: 120, height: 200 },
  { name: '发货口', code: 'E1', type: 'warehouse', color: '#FFD54F', has_slots: false, width: 80, height: 60 },
  // 生产区
  { name: '物料通道', code: 'F1', type: 'production', color: '#B0BEC5', has_slots: false, width: 60, height: 80 },
  { name: '犬舍', code: 'G1', type: 'production', color: '#BCAAA4', has_slots: false, width: 80, height: 80 },
  { name: '换鞋区', code: 'H1', type: 'production', color: '#B0BEC5', has_slots: false, width: 80, height: 60 },
  { name: '风淋室', code: 'I1', type: 'production', color: '#B0BEC5', has_slots: false, width: 60, height: 60 },
  { name: '蒸煮区', code: 'J1', type: 'production', color: '#FFCC80', has_slots: false, width: 160, height: 80 },
  { name: '灌装区', code: 'K1', type: 'production', color: '#FFCC80', has_slots: false, width: 100, height: 80 },
  { name: '乳化区', code: 'L1', type: 'production', color: '#FFCC80', has_slots: false, width: 80, height: 80 },
  { name: '备料间', code: 'M1', type: 'production', color: '#FFCC80', has_slots: false, width: 120, height: 80 },
  { name: '清洗区', code: 'N1', type: 'production', color: '#B0BEC5', has_slots: false, width: 200, height: 60 },
]

// ===== 库位数据 =====
function makeSlots(zoneCode, zoneName, prefix, total) {
  const slots = []
  for (let i = 1; i <= total; i++) {
    const num = String(i).padStart(2, '0')
    slots.push({
      slot_id: `${prefix}-${num}`,
      zone_code: zoneCode,
      zone_name: zoneName,
      status: 'empty',
      item_count: 0,
      created_at: new Date(),
    })
  }
  return slots
}

const slots = [
  ...makeSlots('A1', '库房', 'A', 48),    // 6列×8行
  ...makeSlots('B1', '小库房', 'B', 12),  // 3列×4行
  ...makeSlots('C1', '冷库', 'C', 6),     // 2列×3行
  ...makeSlots('D1', '成品区', 'D', 20),  // 4列×5行
]

// ===== 分类数据 =====
const categories = [
  { name: '原料', level: 1, parent_id: '', code_prefix: 'YL', extra_fields: [], expiry_advance_days: 30, created_at: new Date() },
  { name: '试剂', level: 1, parent_id: '', code_prefix: 'SJ', extra_fields: ['开封有效期'], expiry_advance_days: 30, created_at: new Date() },
  { name: '成品', level: 1, parent_id: '', code_prefix: 'CP', extra_fields: [], expiry_advance_days: 30, created_at: new Date() },
  { name: '工具', level: 1, parent_id: '', code_prefix: 'GJ', extra_fields: [], expiry_advance_days: 0, created_at: new Date() },
  { name: '耗材', level: 1, parent_id: '', code_prefix: 'HM', extra_fields: [], expiry_advance_days: 0, created_at: new Date() },
  { name: '劳保', level: 1, parent_id: '', code_prefix: 'LB', extra_fields: [], expiry_advance_days: 365, created_at: new Date() },
]

// ===== 示例物品数据 =====
const now = new Date()
const products = [
  {
    code: 'YL-001',
    name: '乳化剂 AEO-9',
    category_l1: '原料',
    category_l2: '',
    spec: '25kg/桶',
    quantity: 20,
    unit: '桶',
    zone_name: '库房',
    slot_id: 'A-01',
    supplier: '',
    produce_date: '',
    expire_date: '',
    open_date: '',
    open_expire_days: 0,
    photo_url: '',
    note: '',
    is_controlled: false,
    status: 'normal',
    created_by: 'admin',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    code: 'SJ-001',
    name: '盐酸 分析纯',
    category_l1: '试剂',
    category_l2: '',
    spec: '500ml/瓶',
    quantity: 3,
    unit: '瓶',
    zone_name: '易制毒品室',
    slot_id: '',
    supplier: '',
    produce_date: '',
    // 3天前已过期
    expire_date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    open_date: '',
    open_expire_days: 0,
    photo_url: '',
    note: '',
    is_controlled: true,
    status: 'expired',
    created_by: 'admin',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    code: 'SJ-002',
    name: '牛肉膏蛋白胨培养基',
    category_l1: '试剂',
    category_l2: '',
    spec: '250g/盒',
    quantity: 10,
    unit: '盒',
    zone_name: '微生物室',
    slot_id: '',
    supplier: '',
    produce_date: '',
    // 5天后到期（即将到期）
    expire_date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    open_date: '',
    open_expire_days: 0,
    photo_url: '',
    note: '',
    is_controlled: false,
    status: 'expiring',
    created_by: 'admin',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    code: 'HM-001',
    name: 'A4打印纸',
    category_l1: '耗材',
    category_l2: '',
    spec: '70g A4 500张/包',
    quantity: 12,
    unit: '包',
    zone_name: '文印室',
    slot_id: '',
    supplier: '',
    produce_date: '',
    expire_date: '',
    open_date: '',
    open_expire_days: 0,
    photo_url: '',
    note: '',
    is_controlled: false,
    status: 'low_stock',
    created_by: 'admin',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    code: 'GJ-001',
    name: '数字万用表',
    category_l1: '工具',
    category_l2: '',
    spec: 'UT61E',
    quantity: 2,
    unit: '台',
    zone_name: '工程部',
    slot_id: '',
    supplier: '',
    produce_date: '',
    expire_date: '',
    open_date: '',
    open_expire_days: 0,
    photo_url: '',
    note: '',
    is_controlled: false,
    status: 'normal',
    created_by: 'admin',
    created_at: new Date(),
    updated_at: new Date(),
  },
]

// ===== 插入函数（非空则跳过）=====
async function seedCollection(name, data) {
  try {
    const res = await db.collection(name).limit(1).get()
    if (res.data && res.data.length > 0) {
      console.log(`⏭  ${name} 集合已有数据，跳过`)
      return
    }
    for (const item of data) {
      await db.collection(name).add(item)
    }
    console.log(`✅ ${name} 插入 ${data.length} 条`)
  } catch (e) {
    console.error(`❌ ${name} 插入失败`, e.message)
  }
}

async function main() {
  console.log('开始插入种子数据...\n')
  await seedCollection('users', users)
  await seedCollection('zones', zones)
  await seedCollection('slots', slots)
  await seedCollection('categories', categories)
  await seedCollection('products', products)
  console.log('\n✅ 种子数据插入完成！')
}

main()
