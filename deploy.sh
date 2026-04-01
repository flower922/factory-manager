#!/bin/bash
# 部署脚本：构建并部署到腾讯云 CloudBase
# 使用前请确保已安装 tcb CLI 并登录：
#   npm install -g @cloudbase/cli
#   tcb login

set -e

ENV_ID=$(grep VITE_CB_ENV_ID .env | cut -d '=' -f2)

if [ -z "$ENV_ID" ] || [ "$ENV_ID" = "your-env-id-here" ]; then
  echo "❌ 请先在 .env 文件中填写真实的 VITE_CB_ENV_ID"
  exit 1
fi

echo "🔨 开始构建..."
npm run build
echo "✅ 构建完成"

echo "🚀 部署静态文件到 CloudBase 静态托管..."
tcb hosting deploy ./dist -e "$ENV_ID"
echo "✅ 静态文件部署完成"

echo "☁️  部署云函数..."
for func in stock-operation check-expiry generate-code get-statistics; do
  echo "  → 部署 $func"
  tcb fn deploy "$func" -e "$ENV_ID" --dir "./cloudfunctions/$func"
done

echo ""
echo "🎉 全部部署完成！"
echo "访问地址：https://$ENV_ID.tcloudbaseapp.com"
