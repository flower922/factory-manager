/**
 * 浏览器控制台版种子数据脚本
 * 使用方法：
 * 1. 先运行 npm run dev，打开浏览器
 * 2. 在浏览器地址栏输入 http://localhost:5173
 * 3. 按 F12 打开开发者工具，点击"Console"（控制台）标签
 * 4. 把下面所有代码复制粘贴进去，按 Enter 运行
 * 5. 看到"种子数据插入完成"表示成功
 */

;(async () => {
  // 从页面上下文获取已初始化的 cloudbase 实例
  const { db } = await import('/src/utils/cloudbase.js')

  const now = new Date()

  const users = [
    { username: 'admin', password_hash: 'admin123', name: '管理员', role: 'admin', phone: '13800000001', status: 'active', created_at: now },
    { username: 'user01', password_hash: '123456', name: '普通用户', role: 'user', phone: '13800000002', status: 'active', created_at: now },
  ]

  const zones = [
    { name: '院子1', code: 'Y1', type: 'office', color: '#9E9E9E', has_slots: false, width: 120, height: 80, created_at: now },
    { name: '院子2', code: 'Y2', type: 'office', color: '#9E9E9E', has_slots: false, width: 120, height: 80, created_at: now },
    { name: '院子3', code: 'Y3', type: 'office', color: '#9E9E9E', has_slots: false, width: 120, height: 80, created_at: now },
    { name: '工具间', code: 'A', type: 'office', color: '#90CAF9', has_slots: false, width: 80, height: 60, created_at: now },
    { name: '工程部', code: 'B', type: 'office', color: '#90CAF9', has_slots: false, width: 100, height: 60, created_at: now },
    { name: '培训室', code: 'C', type: 'office', color: '#90CAF9', has_slots: false, width: 80, height: 60, created_at: now },
    { name: '文印室', code: 'D', type: 'office', color: '#90CAF9', has_slots: false, width: 80, height: 60, created_at: now },
    { name: '茶水间', code: 'E', type: 'office', color: '#90CAF9', has_slots: false, width: 60, height: 60, created_at: now },
    { name: '储物室', code: 'F', type: 'office', color: '#90CAF9', has_slots: false, width: 80, height: 60, created_at: now },
    { name: '厕1', code: 'G', type: 'office', color: '#CE93D8', has_slots: false, width: 50, height: 60, created_at: now },
    { name: '厕2', code: 'H', type: 'office', color: '#CE93D8', has_slots: false, width: 50, height: 60, created_at: now },
    { name: '办1', code: 'I', type: 'office', color: '#90CAF9', has_slots: false, width: 60, height: 120, created_at: now },
    { name: '办2', code: 'J', type: 'office', color: '#90CAF9', has_slots: false, width: 80, height: 60, created_at: now },
    { name: '办3', code: 'K', type: 'office', color: '#90CAF9', has_slots: false, width: 60, height: 60, created_at: now },
    { name: '餐厅', code: 'L', type: 'office', color: '#FFCC80', has_slots: false, width: 120, height: 80, created_at: now },
    { name: '前台', code: 'M', type: 'office', color: '#90CAF9', has_slots: false, width: 120, height: 80, created_at: now },
    { name: '大门口', code: 'N', type: 'office', color: '#90CAF9', has_slots: false, width: 100, height: 60, created_at: now },
    { name: '男更衣室', code: 'O', type: 'office', color: '#90CAF9', has_slots: false, width: 60, height: 80, created_at: now },
    { name: '女更衣室', code: 'P', type: 'office', color: '#F48FB1', has_slots: false, width: 60, height: 80, created_at: now },
    { name: '消防区', code: 'Q', type: 'office', color: '#EF9A9A', has_slots: false, width: 60, height: 60, created_at: now },
    { name: '实验办公区', code: 'R', type: 'lab', color: '#A5D6A7', has_slots: false, width: 120, height: 80, created_at: now },
    { name: '微生物室', code: 'S', type: 'lab', color: '#A5D6A7', has_slots: false, width: 100, height: 80, created_at: now },
    { name: '易制毒品室', code: 'T', type: 'lab', color: '#FFAB91', has_slots: false, width: 80, height: 80, created_at: now },
    { name: '测试区', code: 'U', type: 'lab', color: '#A5D6A7', has_slots: false, width: 100, height: 160, created_at: now },
    { name: '库房', code: 'A1', type: 'warehouse', color: '#00D4AA', has_slots: true, width: 200, height: 120, created_at: now },
    { name: '小库房', code: 'B1', type: 'warehouse', color: '#00D4AA', has_slots: true, width: 100, height: 80, created_at: now },
    { name: '冷库', code: 'C1', type: 'warehouse', color: '#4FC3F7', has_slots: true, width: 100, height: 80, created_at: now },
    { name: '成品区', code: 'D1', type: 'warehouse', color: '#00D4AA', has_slots: true, width: 120, height: 200, created_at: now },
    { name: '发货口', code: 'E1', type: 'warehouse', color: '#FFD54F', has_slots: false, width: 80, height: 60, created_at: now },
    { name: '物料通道', code: 'F1', type: 'production', color: '#B0BEC5', has_slots: false, width: 60, height: 80, created_at: now },
    { name: '犬舍', code: 'G1', type: 'production', color: '#BCAAA4', has_slots: false, width: 80, height: 80, created_at: now },
    { name: '换鞋区', code: 'H1', type: 'production', color: '#B0BEC5', has_slots: false, width: 80, height: 60, created_at: now },
    { name: '风淋室', code: 'I1', type: 'production', color: '#B0BEC5', has_slots: false, width: 60, height: 60, created_at: now },
    { name: '蒸煮区', code: 'J1', type: 'production', color: '#FFCC80', has_slots: false, width: 160, height: 80, created_at: now },
    { name: '灌装区', code: 'K1', type: 'production', color: '#FFCC80', has_slots: false, width: 100, height: 80, created_at: now },
    { name: '乳化区', code: 'L1', type: 'production', color: '#FFCC80', has_slots: false, width: 80, height: 80, created_at: now },
    { name: '备料间', code: 'M1', type: 'production', color: '#FFCC80', has_slots: false, width: 120, height: 80, created_at: now },
    { name: '清洗区', code: 'N1', type: 'production', color: '#B0BEC5', has_slots: false, width: 200, height: 60, created_at: now },
  ]

  // 生成库位
  function makeSlots(zoneCode, zoneName, prefix, total) {
    return Array.from({ length: total }, (_, i) => ({
      slot_id: `${prefix}-${String(i + 1).padStart(2, '0')}`,
      zone_code: zoneCode,
      zone_name: zoneName,
      status: 'empty',
      item_count: 0,
      created_at: now,
    }))
  }
  const slots = [
    ...makeSlots('A1', '库房', 'A', 48),
    ...makeSlots('B1', '小库房', 'B', 12),
    ...makeSlots('C1', '冷库', 'C', 6),
    ...makeSlots('D1', '成品区', 'D', 20),
  ]

  const categories = [
    { name: '原料', level: 1, parent_id: '', code_prefix: 'YL', extra_fields: [], expiry_advance_days: 30, created_at: now },
    { name: '试剂', level: 1, parent_id: '', code_prefix: 'SJ', extra_fields: ['开封有效期'], expiry_advance_days: 30, created_at: now },
    { name: '成品', level: 1, parent_id: '', code_prefix: 'CP', extra_fields: [], expiry_advance_days: 30, created_at: now },
    { name: '工具', level: 1, parent_id: '', code_prefix: 'GJ', extra_fields: [], expiry_advance_days: 0, created_at: now },
    { name: '耗材', level: 1, parent_id: '', code_prefix: 'HM', extra_fields: [], expiry_advance_days: 0, created_at: now },
    { name: '劳保', level: 1, parent_id: '', code_prefix: 'LB', extra_fields: [], expiry_advance_days: 365, created_at: now },
  ]

  const products = [
    { code: 'YL-001', name: '乳化剂 AEO-9', category_l1: '原料', category_l2: '', spec: '25kg/桶', quantity: 20, unit: '桶', zone_name: '库房', slot_id: 'A-01', supplier: '', produce_date: '', expire_date: '', open_date: '', open_expire_days: 0, photo_url: '', note: '', is_controlled: false, status: 'normal', created_by: 'admin', created_at: now, updated_at: now },
    { code: 'SJ-001', name: '盐酸 分析纯', category_l1: '试剂', category_l2: '', spec: '500ml/瓶', quantity: 3, unit: '瓶', zone_name: '易制毒品室', slot_id: '', supplier: '', produce_date: '', expire_date: new Date(now.getTime() - 3 * 86400000).toISOString().slice(0, 10), open_date: '', open_expire_days: 0, photo_url: '', note: '', is_controlled: true, status: 'expired', created_by: 'admin', created_at: now, updated_at: now },
    { code: 'SJ-002', name: '牛肉膏蛋白胨培养基', category_l1: '试剂', category_l2: '', spec: '250g/盒', quantity: 10, unit: '盒', zone_name: '微生物室', slot_id: '', supplier: '', produce_date: '', expire_date: new Date(now.getTime() + 5 * 86400000).toISOString().slice(0, 10), open_date: '', open_expire_days: 0, photo_url: '', note: '', is_controlled: false, status: 'expiring', created_by: 'admin', created_at: now, updated_at: now },
    { code: 'HM-001', name: 'A4打印纸', category_l1: '耗材', category_l2: '', spec: '70g A4 500张/包', quantity: 12, unit: '包', zone_name: '文印室', slot_id: '', supplier: '', produce_date: '', expire_date: '', open_date: '', open_expire_days: 0, photo_url: '', note: '', is_controlled: false, status: 'low_stock', created_by: 'admin', created_at: now, updated_at: now },
    { code: 'GJ-001', name: '数字万用表', category_l1: '工具', category_l2: '', spec: 'UT61E', quantity: 2, unit: '台', zone_name: '工程部', slot_id: '', supplier: '', produce_date: '', expire_date: '', open_date: '', open_expire_days: 0, photo_url: '', note: '', is_controlled: false, status: 'normal', created_by: 'admin', created_at: now, updated_at: now },
  ]

  // 插入函数（非空则跳过）
  async function seedCollection(name, data) {
    const res = await db.collection(name).limit(1).get()
    if (res.data && res.data.length > 0) {
      console.log(`⏭ ${name} 已有数据，跳过`)
      return
    }
    for (const item of data) {
      await db.collection(name).add(item)
    }
    console.log(`✅ ${name} 插入 ${data.length} 条`)
  }

  console.log('开始插入种子数据...')
  await seedCollection('users', users)
  await seedCollection('zones', zones)
  await seedCollection('slots', slots)
  await seedCollection('categories', categories)
  await seedCollection('products', products)
  console.log('🎉 种子数据插入完成！')
})()
