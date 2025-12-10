#!/bin/bash

# 阿里云服务器部署脚本
SERVER="root@47.92.96.143"
REMOTE_DIR="/root/word-app"

echo "=== 开始部署到阿里云服务器 ==="

# 1. 创建远程目录
echo "1. 创建远程目录..."
ssh $SERVER "mkdir -p $REMOTE_DIR"

# 2. 上传项目文件
echo "2. 上传项目文件..."
scp -r web-admin/src $SERVER:$REMOTE_DIR/web-admin/
scp -r web-admin/prisma $SERVER:$REMOTE_DIR/web-admin/
scp -r web-admin/public $SERVER:$REMOTE_DIR/web-admin/
scp web-admin/package.json $SERVER:$REMOTE_DIR/web-admin/
scp web-admin/package-lock.json $SERVER:$REMOTE_DIR/web-admin/
scp web-admin/next.config.ts $SERVER:$REMOTE_DIR/web-admin/
scp web-admin/tsconfig.json $SERVER:$REMOTE_DIR/web-admin/
scp web-admin/tailwind.config.ts $SERVER:$REMOTE_DIR/web-admin/
scp web-admin/postcss.config.mjs $SERVER:$REMOTE_DIR/web-admin/
scp web-admin/Dockerfile $SERVER:$REMOTE_DIR/web-admin/
scp web-admin/.dockerignore $SERVER:$REMOTE_DIR/web-admin/

# 3. 上传docker-compose配置
echo "3. 上传docker-compose配置..."
scp docker-compose.yml $SERVER:$REMOTE_DIR/
scp .env.server $SERVER:$REMOTE_DIR/.env

# 4. 上传数据导入脚本和数据
echo "4. 上传数据文件..."
scp web-admin/database-export.json $SERVER:$REMOTE_DIR/
scp web-admin/import-database.js $SERVER:$REMOTE_DIR/

# 5. 在服务器上构建和启动
echo "5. 在服务器上构建和启动..."
ssh $SERVER "cd $REMOTE_DIR && docker compose up -d --build"

# 6. 等待服务启动
echo "6. 等待服务启动..."
sleep 30

# 7. 导入数据
echo "7. 导入数据..."
ssh $SERVER "cd $REMOTE_DIR && docker exec word-app node /app/import-database.js"

# 8. 检查服务状态
echo "8. 检查服务状态..."
ssh $SERVER "cd $REMOTE_DIR && docker compose ps"

echo ""
echo "=== 部署完成 ==="
echo "应用地址: http://47.92.96.143:3000"
echo ""
echo "查看日志: ssh $SERVER 'cd $REMOTE_DIR && docker compose logs -f'"
