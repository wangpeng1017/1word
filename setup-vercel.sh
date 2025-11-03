#!/bin/bash
# Vercel 快速配置脚本

echo "🚀 智能词汇复习助手 - Vercel 配置脚本"
echo "=========================================="
echo ""

# 检查是否安装了Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ 未检测到 Vercel CLI"
    echo "📦 正在安装 Vercel CLI..."
    npm install -g vercel
fi

echo "✅ Vercel CLI 已就绪"
echo ""

# 登录Vercel
echo "🔐 登录 Vercel..."
vercel login

echo ""
echo "🔗 链接项目..."
vercel link --project=11word

echo ""
echo "📥 拉取环境变量..."
vercel env pull .env.local

echo ""
echo "📂 进入项目目录..."
cd web-admin

echo ""
echo "📦 安装依赖..."
npm install

echo ""
echo "🗄️  推送数据库结构..."
npm run db:push

echo ""
echo "🎯 初始化数据库..."
npm run db:init

echo ""
echo "=========================================="
echo "✅ 配置完成！"
echo ""
echo "📝 默认管理员账号："
echo "   邮箱: admin@vocab.com"
echo "   密码: admin123456"
echo ""
echo "🌐 访问地址: https://11word.vercel.app"
echo ""
echo "📱 下一步："
echo "   1. 修改 wechat-miniapp/app.js 中的 apiUrl"
echo "   2. 在微信开发者工具中打开小程序项目"
echo "   3. 开始测试！"
echo ""
