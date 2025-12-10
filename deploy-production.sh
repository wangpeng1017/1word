#!/bin/bash

echo "=== 开始部署到阿里云生产环境 ==="

# 1. 确认当前分支
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
  echo "错误：只能从main分支部署到生产环境"
  echo "当前分支：$BRANCH"
  exit 1
fi

# 2. 确认代码已提交
if [ -n "$(git status --porcelain)" ]; then
  echo "错误：有未提交的更改"
  git status
  exit 1
fi

# 3. 确认部署
read -p "确认部署到生产环境？(yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "取消部署"
  exit 0
fi

# 4. 执行部署
SERVER="root@47.92.96.143"
REMOTE_DIR="/root/word-app"

echo "1. 创建远程目录..."
ssh $SERVER "mkdir -p $REMOTE_DIR"

echo "2. 上传项目文件..."
scp -r web-admin/src $SERVER:$REMOTE_DIR/web-admin/
scp -r web-admin/prisma $SERVER:$REMOTE_DIR/web-admin/
scp -r web-admin/public $SERVER:$REMOTE_DIR/web-admin/
scp web-admin/package.json $SERVER:$REMOTE_DIR/web-admin/
scp web-admin/package-lock.json $SERVER:$REMOTE_DIR/web-admin/
scp web-admin/tsconfig.json $SERVER:$REMOTE_DIR/web-admin/
scp web-admin/tailwind.config.ts $SERVER:$REMOTE_DIR/web-admin/
scp web-admin/Dockerfile $SERVER:$REMOTE_DIR/web-admin/
scp web-admin/.dockerignore $SERVER:$REMOTE_DIR/web-admin/

echo "3. 上传docker-compose配置..."
scp docker-compose.yml $SERVER:$REMOTE_DIR/
scp .env.server $SERVER:$REMOTE_DIR/.env

echo "4. 上传数据文件（如果需要）..."
if [ -f "web-admin/database-export.json" ]; then
  scp web-admin/database-export.json $SERVER:$REMOTE_DIR/
  scp web-admin/import-database.js $SERVER:$REMOTE_DIR/
fi

echo "5. 在服务器上构建和启动..."
ssh $SERVER "cd $REMOTE_DIR && docker compose up -d --build"

echo "6. 等待服务启动..."
sleep 30

echo "7. 检查服务状态..."
ssh $SERVER "cd $REMOTE_DIR && docker compose ps"

echo ""
echo "=== 部署完成 ==="
echo "应用地址: http://47.92.96.143:3000"
echo ""
echo "查看日志: ssh $SERVER 'cd $REMOTE_DIR && docker compose logs -f'"
