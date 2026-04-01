# 实物管家 - 项目开发规范

> Claude Code 每次启动时自动读取此文件，请严格遵守以下所有规范。

## 项目介绍

工厂实物管理H5网页应用，名为"实物管家"。让每一件物品找得到、管得住、用得好。
可独立使用，后期可通过 web-view 嵌入微信小程序。

## 技术栈

- 前端框架：Vue 3 + Vite
- UI组件库：Vant 4（按需引入）
- 状态管理：Pinia
- 路由：Vue Router 4
- 后端：腾讯云 CloudBase（云数据库 + 云函数 + 云存储 + 静态托管）
- 扫码：html5-qrcode
- Excel解析：SheetJS (xlsx)
- 厂区地图：SVG 自绘（不使用 Leaflet）

## CloudBase 环境

```javascript
// 环境ID，从 .env 文件读取
const envId = import.meta.env.VITE_CB_ENV_ID
```

初始化方式见 `src/utils/cloudbase.js`，全项目统一使用该文件导出的 `db`、`auth`、`app` 实例。

## 文件目录结构

```
warehouse-manager/
├── CLAUDE.md                    # 本文件
├── .env                         # 环境变量（不提交到git）
├── .gitignore
├── package.json
├── vite.config.js
├── index.html
├── database/                    # 数据库初始化脚本
│   ├── init.js                  # 创建集合
│   └── seed.js                  # 插入种子数据
├── cloudfunctions/              # 云函数（每个函数一个目录）
│   ├── stock-operation/
│   ├── check-expiry/
│   ├── generate-code/
│   └── get-statistics/
└── src/
    ├── App.vue
    ├── main.js
    ├── router/
    │   └── index.js             # 路由配置 + 权限守卫
    ├── stores/
    │   └── user.js              # 用户状态（Pinia）
    ├── utils/
    │   ├── cloudbase.js         # CloudBase SDK 初始化
    │   ├── api.js               # 数据库 CRUD 封装
    │   └── auth.js              # 登录/登出/权限判断
    ├── components/              # 公共组件
    │   ├── NavBar.vue
    │   ├── TabBar.vue
    │   ├── SearchBar.vue
    │   ├── StatCard.vue
    │   ├── StatusTag.vue
    │   ├── EmptyState.vue
    │   └── index.js             # 统一导出
    └── views/                   # 页面组件（按模块分目录）
        ├── login/
        │   ├── LoginPage.vue        # P01 登录页
        │   └── ForgotPassword.vue   # P02 忘记密码
        ├── home/
        │   └── HomePage.vue         # P03 首页看板
        ├── message/
        │   └── MessagePage.vue      # P04 消息中心
        ├── profile/
        │   └── ProfilePage.vue      # P05 个人中心
        ├── map/
        │   ├── FactoryMapSVG.vue    # 厂区地图SVG组件
        │   ├── MapOverview.vue      # P06 厂区总览地图
        │   ├── ZoneDetail.vue       # P07 区域详情
        │   └── SlotMap.vue          # P08 库位地图
        ├── items/
        │   ├── ItemList.vue         # P09 物品列表
        │   ├── ItemDetail.vue       # P10 物品详情
        │   ├── ItemForm.vue         # P11 新增/编辑物品
        │   ├── ItemImport.vue       # P12 Excel批量导入
        │   └── CategoryManage.vue   # P13 分类管理
        ├── stock/
        │   ├── StockIn.vue          # P14 入库登记
        │   ├── StockOut.vue         # P15 出库登记
        │   ├── StockRecords.vue     # P16 出入库记录
        │   ├── CheckCreate.vue      # P17 盘点任务创建
        │   ├── CheckExec.vue        # P18 盘点执行
        │   └── CheckReport.vue      # P19 盘点报告
        ├── expiry/
        │   ├── ExpiryList.vue       # P20 到期预警列表
        │   └── ExpiryHandle.vue     # P21 到期处理
        ├── scan/
        │   └── ScanPage.vue         # P22 扫码页
        └── poison/
            ├── PoisonLedger.vue     # P29 易制毒品台账
            ├── PoisonVerify.vue     # P30 用量核销
            └── PoisonConfirm.vue    # P31 双人确认
```

## 命名规范（必须严格遵守）

### 数据库字段：全部 snake_case
```
✅ slot_id, zone_code, product_name, created_at, expire_date, is_controlled
❌ slotId, zoneCode, productName, createdAt, expireDate, isControlled
```

### JavaScript 变量：小驼峰
```
✅ const slotId = record.slot_id
✅ const zoneName = data.zone_name
```

### 文件名：小写加横线
```
✅ scan-page.vue, stock-in.vue, factory-map.vue
❌ ScanPage.vue, stockIn.vue, FactoryMap.vue
```

### Vue 组件名：大驼峰
```
✅ export default { name: 'ScanPage' }
✅ <ScanPage />
```

## 数据库集合定义（10个集合）

### users — 用户表
```
_id             string      CloudBase自动生成
username        string      登录账号
password_hash   string      密码哈希
name            string      姓名
role            string      admin / user
phone           string      手机号
status          string      active / disabled
created_at      timestamp   创建时间
```

### zones — 区域表
```
_id             string      自动生成
name            string      区域名称（如"库房""微生物室"）
code            string      区域编码（如 A、B、C）
type            string      warehouse / production / lab / office
width           number      地图上的区域宽度
height          number      地图上的区域高度
color           string      显示颜色（如 #00D4AA）
has_slots       boolean     是否有库位
created_at      timestamp   创建时间
```

### slots — 库位表
```
_id             string      自动生成
slot_id         string      库位编号（如 A-01、B-03）
zone_code       string      所属区域编码
zone_name       string      所属区域名称
status          string      empty / occupied / full
item_count      number      存放物品数
created_at      timestamp   创建时间
```

### products — 物品表
```
_id             string      自动生成
code            string      物品编码（如 YL-001）
name            string      物品名称
category_l1     string      一级分类
category_l2     string      二级分类
spec            string      规格型号
quantity        number      当前库存数量
unit            string      单位（瓶/桶/袋/盒/台/包/个）
zone_name       string      存放区域
slot_id         string      存放库位
supplier        string      供应商
produce_date    string      生产日期
expire_date     string      保质期截止日
open_date       string      开封日期
open_expire_days number     开封后有效天数
photo_url       string      照片地址
note            string      备注
is_controlled   boolean     是否管控品（易制毒品）
status          string      normal / expiring / expired / low_stock
created_by      string      创建人
created_at      timestamp   创建时间
updated_at      timestamp   更新时间
```

### stock_records — 出入库记录表
```
_id             string      自动生成
product_id      string      物品ID
product_name    string      物品名称
type            string      in / out
quantity        number      数量
operator        string      操作人
source          string      purchase / return / transfer
destination     string      去向区域
doc_number      string      关联单据号
note            string      备注
created_at      timestamp   创建时间
```

### inventory_tasks — 盘点任务表
```
_id             string      自动生成
scope           string      盘点范围
zones           array       盘点区域列表
status          string      pending / doing / done
operator        string      盘点人
created_at      timestamp   创建时间
finished_at     timestamp   完成时间
```

### inventory_details — 盘点明细表
```
_id             string      自动生成
task_id         string      盘点任务ID
product_id      string      物品ID
product_name    string      物品名称
slot_id         string      库位
book_quantity   number      账面数量
actual_quantity number      实际数量
diff            number      差异
diff_reason     string      差异原因
created_at      timestamp   创建时间
```

### expiry_handles — 过期处理记录表
```
_id             string      自动生成
product_id      string      物品ID
product_name    string      物品名称
handle_type     string      destroy / return / downgrade / extend
handle_quantity number      处理数量
handler         string      处理人
note            string      处理说明
created_at      timestamp   创建时间
```

### poison_records — 易制毒品台账表
```
_id             string      自动生成
product_id      string      物品ID
product_name    string      物品名称
type            string      in / out / use
quantity        number      数量
unit            string      单位
operator        string      操作人
confirmer       string      确认人（双人确认）
purpose         string      用途
remaining       number      剩余量
note            string      备注
created_at      timestamp   创建时间
```

### categories — 分类表
```
_id                  string      自动生成
name                 string      分类名称
level                number      1 / 2
parent_id            string      父分类ID（二级分类时）
code_prefix          string      编码前缀（如 YL、SJ）
extra_fields         array       额外字段定义
expiry_advance_days  number      到期预警提前天数
created_at           timestamp   创建时间
```

## 代码风格要求

1. **简洁优先**：这是小型项目，不需要过度封装，不需要复杂的设计模式
2. **字段名零容忍**：数据库字段名必须与本文件定义完全一致，一个字母都不能改
3. **中文注释**：关键逻辑加中文注释，方便零基础成员理解
4. **Vant 4 组件**：优先使用 Vant 4 提供的组件，不要自己手写基础UI
5. **错误处理**：所有数据库操作和云函数调用必须 try-catch，失败时用 van-toast 提示用户
6. **时间戳**：所有 created_at 字段统一使用 `new Date()` 生成

## 厂区区域数据（种子数据用）

以下是基于厂区平面图的30+个区域，创建种子数据时使用：

```
院子(多个,gray), 工具间(office), 工程部(office), 培训室(office), 文印室(office),
茶水间(office), 储物室(office), 厕1(office), 厕2(office), 办1(office),
办2(office), 办3(office), 餐厅(office), 前台(office),
实验办公区(lab), 微生物室(lab), 易制毒品室(lab), 测试区(lab),
冷库(warehouse,has_slots), 小库房(warehouse,has_slots), 库房(warehouse,has_slots),
成品区(warehouse,has_slots), 发货口(warehouse), 物料通道(production),
犬舍(production), 大门口(office), 换鞋区(production),
男更衣室(office), 女更衣室(office), 风淋室(production),
消防区(office), 蒸煮区(production), 灌装区(production),
乳化区(production), 备料间(production), 清洗区(production)
```

## 分类初始数据

```
一级分类（level=1）：
- 原料（code_prefix: YL, expiry_advance_days: 30）
- 试剂（code_prefix: SJ, expiry_advance_days: 30, extra_fields: ["开封有效期"]）
- 成品（code_prefix: CP, expiry_advance_days: 30）
- 工具（code_prefix: GJ, expiry_advance_days: 0）
- 耗材（code_prefix: HM, expiry_advance_days: 0）
- 劳保（code_prefix: LB, expiry_advance_days: 365）
```
