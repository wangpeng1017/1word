#!/bin/bash
# 配置应用环境变量并安装依赖

cd /root/word-app/web-admin

# 创建 .env 文件
cat > .env << 'EOF'
DATABASE_URL=postgresql://word_user:word_pass_2024@localhost:5432/word_app
JWT_SECRET=vocab_jwt_secret_2024_production
NEXT_PUBLIC_API_URL=http://8.130.182.148:3000
NODE_ENV=production
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_AUL5HsnQWN21BR8h_YbxChFzoaGO9Lb16sDGUYq3rCEVWKy
EOF

echo "Environment file created!"

# 设置 npm 镜像
npm config set registry https://registry.npmmirror.com

# 安装依赖
echo "Installing dependencies..."
npm install --legacy-peer-deps

# 推送数据库 schema
echo "Pushing database schema..."
npx prisma db push

# 构建应用
echo "Building application..."
npm run build

echo "Setup completed successfully!"
