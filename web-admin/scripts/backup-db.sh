#!/bin/bash

# 加载环境变量
if [ -f ../.env ]; then
  export $(cat ../.env | grep -v '#' | awk '/=/ {print $1}')
fi

# 提取数据库连接信息
# 假设 format: mysql://USER:PASSWORD@HOST:PORT/DATABASE
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

BACKUP_DIR="../backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
echo "正在备份数据库 $DB_NAME ..."
mysqldump -u$DB_USER -p$DB_PASS -h$DB_HOST -P$DB_PORT $DB_NAME > $FILENAME

if [ $? -eq 0 ]; then
  echo "✅ 备份成功: $FILENAME"
  # 压缩备份
  gzip $FILENAME
  echo "📦 已压缩: $FILENAME.gz"
  
  # 清理超过30天的备份
  find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete
else
  echo "❌ 备份失败"
  exit 1
fi
