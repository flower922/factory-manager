# 部署说明

## 前置准备

### 1. 安装腾讯云 CLI
```bash
npm install -g @cloudbase/cli
```

### 2. 登录腾讯云
```bash
tcb login
```
浏览器会弹出腾讯云授权页面，扫码或账号登录后即可。

### 3. 配置 .env 文件
打开项目根目录的 `.env` 文件，将 `your-env-id-here` 替换为你的真实 CloudBase 环境ID：
```
VITE_CB_ENV_ID=你的真实环境ID
```
环境ID 在腾讯云 CloudBase 控制台 → 环境 → 环境ID 处查看。

---

## 一键部署（推荐）

```bash
bash deploy.sh
```

---

## 手动分步部署

### 步骤1：构建前端
```bash
npm run build
```

### 步骤2：部署静态文件
```bash
tcb hosting deploy ./dist -e 你的环境ID
```

### 步骤3：初始化数据库（第一次部署时）
```bash
# 设置环境变量
set CB_ENV_ID=你的环境ID
set CB_SECRET_ID=你的SecretId
set CB_SECRET_KEY=你的SecretKey

# 创建集合
node database/init.js

# 插入种子数据
node database/seed.js
```

### 步骤4：部署云函数
```bash
tcb fn deploy stock-operation -e 你的环境ID --dir ./cloudfunctions/stock-operation
tcb fn deploy check-expiry -e 你的环境ID --dir ./cloudfunctions/check-expiry
tcb fn deploy generate-code -e 你的环境ID --dir ./cloudfunctions/generate-code
tcb fn deploy get-statistics -e 你的环境ID --dir ./cloudfunctions/get-statistics
```

### 步骤5：设置云函数定时触发（可选）
在 CloudBase 控制台 → 云函数 → check-expiry → 触发器，
添加定时触发器，Cron 表达式 `0 8 * * *`（每天早上8点自动检查过期）。

---

## 访问地址
部署完成后访问：`https://你的环境ID.tcloudbaseapp.com`
