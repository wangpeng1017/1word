#!/bin/bash
# 后台构建和启动应用

cd /root/word-app/web-admin

# 记录开始时间
echo "Build started at $(date)" > /tmp/build.log

# 推送数据库 schema
echo "Pushing database schema..." >> /tmp/build.log 2>&1
npx prisma db push >> /tmp/build.log 2>&1

# 删除旧的构建目录
echo "Removing old build..." >> /tmp/build.log 2>&1
rm -rf .next

# 重新构建
echo "Building application..." >> /tmp/build.log 2>&1
npm run build >> /tmp/build.log 2>&1

if [ -d ".next" ] && [ -f ".next/BUILD_ID" ]; then
    echo "Build completed successfully!" >> /tmp/build.log 2>&1
    echo "Starting application..." >> /tmp/build.log 2>&1
    nohup npm start > /tmp/app.log 2>&1 &
    echo "Application started with PID: $!" >> /tmp/build.log 2>&1
else
    echo "Build failed!" >> /tmp/build.log 2>&1
fi

echo "Script finished at $(date)" >> /tmp/build.log 2>&1
