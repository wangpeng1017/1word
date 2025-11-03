#!/bin/bash
# 快速部署脚本

echo "🚀 准备部署..."

cd /e/trae/1单词

# 添加所有更改
git add .

# 提交
git commit -m "Fix Ant Design SSR and remove invalid package"

# 推送
git push origin main

echo "✅ 代码已推送！"
echo "⏳ 等待Vercel自动部署（约2-3分钟）..."
echo ""
echo "📝 部署完成后访问："
echo "   https://11word.vercel.app/"
echo ""
