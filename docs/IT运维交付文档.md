# 1Word 智能词汇学习系统 - IT运维交付文档

> **交付日期**: 2026-01-09  
> **项目名称**: 智能词汇复习助手 (1word)  
> **版本**: v1.0

---

## 📋 项目概述

这是一个基于艾宾浩斯遗忘曲线的智能词汇学习系统,包含:
- **Web管理后台** (Next.js 15): 教师端管理系统
- **微信小程序**: 学生端学习应用
- **PostgreSQL数据库**: 数据存储

---

## 🏗️ 系统架构

```
┌─────────────────┐
│  微信小程序      │ (学生端)
│  wx132f0943...  │
└────────┬────────┘
         │ HTTPS API
         ▼
┌─────────────────────────────┐
│  Web管理后台 (Next.js)       │
│  端口: 3000                  │
│  进程管理: PM2               │
└────────┬────────────────────┘
         │ Prisma ORM
         ▼
┌─────────────────────────────┐
│  PostgreSQL 数据库           │
│  端口: 5432                  │
│  数据表: 31张                │
└─────────────────────────────┘
```

---

## 🖥️ 服务器信息

### 当前部署环境
| 项目 | 信息 |
|------|------|
| **服务器IP** | 8.130.182.148 (阿里云ECS) |
| **Web服务地址** | http://8.130.182.148:3000 |
| **数据库** | PostgreSQL 15 (主机直接部署) |
| **进程管理** | PM2 |
| **操作系统** | Linux |

### 端口占用
| 端口 | 服务 | 说明 |
|------|------|------|
| 3000 | Next.js Web应用 | 管理后台 + API接口 |
| 5432 | PostgreSQL | 数据库服务 |

---

## 🔧 关键配置文件

### 1. 环境变量 (`.env`)
```env
# 数据库连接
DATABASE_URL="postgresql://word_user:word_pass_2024@localhost:5432/word_app"

# JWT密钥 (务必保密)
JWT_SECRET="vocab_jwt_secret_2024_change_in_production"

# API地址 (小程序调用)
NEXT_PUBLIC_API_URL="http://8.130.182.148:3000"

# 运行环境
NODE_ENV="production"

# Vercel Blob存储Token (可选,用于图片存储)
BLOB_READ_WRITE_TOKEN="your_blob_token_here"
```

> [!CAUTION]
> **安全警告**: `.env` 文件包含敏感信息,务必设置正确的文件权限 (`chmod 600 .env`)

### 2. 数据库配置
```bash
# PostgreSQL用户信息
用户名: word_user
密码: word_pass_2024
数据库名: word_app
```

### 3. PM2 进程配置
```bash
# 查看当前运行的进程
pm2 list

# 应该看到名为 "word-app" 的进程
```

---

## 🚀 日常运维操作

### 启动/停止服务

```bash
# 启动服务
pm2 start word-app

# 停止服务
pm2 stop word-app

# 重启服务
pm2 restart word-app

# 查看服务状态
pm2 status word-app

# 查看实时日志
pm2 logs word-app

# 查看最近100行日志
pm2 logs word-app --lines 100
```

### 代码更新部署

```bash
# 1. 进入项目目录
cd /root/word-app  # 或实际部署路径

# 2. 拉取最新代码
git pull origin main

# 3. 安装依赖 (如有package.json变更)
cd web-admin
npm install

# 4. 数据库迁移 (如有schema变更)
npx prisma generate
npx prisma db push

# 5. 构建项目
npm run build

# 6. 重启服务
pm2 restart word-app

# 7. 验证服务状态
pm2 logs word-app --lines 50
```

### 数据库维护

```bash
# 连接数据库
psql -U word_user -d word_app

# 备份数据库
pg_dump -U word_user word_app > backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复数据库
psql -U word_user word_app < backup_20260109.sql

# 查看数据库大小
psql -U word_user -d word_app -c "SELECT pg_size_pretty(pg_database_size('word_app'));"
```

---

## 📊 监控指标

### 需要关注的指标

| 指标 | 正常范围 | 检查命令 |
|------|----------|----------|
| **CPU使用率** | < 70% | `top` 或 `htop` |
| **内存使用率** | < 80% | `free -h` |
| **磁盘空间** | > 20% 可用 | `df -h` |
| **数据库连接数** | < 100 | `psql -U word_user -d word_app -c "SELECT count(*) FROM pg_stat_activity;"` |
| **PM2进程状态** | online | `pm2 status` |

### 日志位置

```bash
# PM2日志
~/.pm2/logs/word-app-out.log    # 标准输出
~/.pm2/logs/word-app-error.log  # 错误日志

# PostgreSQL日志 (根据实际配置)
/var/log/postgresql/postgresql-15-main.log
```

---

## ⚠️ 常见问题处理

### 1. 服务无法启动

**症状**: `pm2 start` 失败或服务立即崩溃

**排查步骤**:
```bash
# 1. 查看错误日志
pm2 logs word-app --err --lines 100

# 2. 检查端口占用
netstat -tlnp | grep 3000

# 3. 检查数据库连接
psql -U word_user -d word_app -c "SELECT 1;"

# 4. 检查环境变量
cd /root/word-app/web-admin
cat .env
```

### 2. 数据库连接失败

**症状**: 日志中出现 "connection refused" 或 "authentication failed"

**解决方案**:
```bash
# 1. 检查PostgreSQL服务状态
systemctl status postgresql

# 2. 启动PostgreSQL (如已停止)
systemctl start postgresql

# 3. 验证数据库用户权限
psql -U postgres -c "\du"

# 4. 检查pg_hba.conf配置
cat /etc/postgresql/15/main/pg_hba.conf
```

### 3. 内存不足

**症状**: 服务频繁重启,系统响应缓慢

**解决方案**:
```bash
# 1. 查看内存使用
free -h

# 2. 重启PM2进程
pm2 restart word-app

# 3. 清理系统缓存 (谨慎操作)
sync && echo 3 > /proc/sys/vm/drop_caches

# 4. 考虑升级服务器配置
```

### 4. 磁盘空间不足

**症状**: 无法写入日志,数据库操作失败

**解决方案**:
```bash
# 1. 查看磁盘使用
df -h

# 2. 查找占用空间最大的目录
du -h --max-depth=1 /root | sort -hr | head -10

# 3. 清理PM2日志
pm2 flush

# 4. 清理旧的数据库备份
find /root -name "backup_*.sql" -mtime +30 -delete

# 5. 清理npm缓存
npm cache clean --force

# 6. 清理系统日志 (谨慎操作)
journalctl --vacuum-time=7d
```

> [!IMPORTANT]
> **不建议手动删除业务数据!** 应该使用自动化清理策略,详见下方"磁盘空间管理策略"

---

## 💾 磁盘空间管理策略

### 自动清理脚本

创建自动清理脚本 `/root/scripts/disk-cleanup.sh`:

```bash
#!/bin/bash
# 磁盘空间自动清理脚本

LOG_FILE="/var/log/disk-cleanup.log"
THRESHOLD=80  # 磁盘使用率阈值 (%)

echo "=== 磁盘清理开始: $(date) ===" >> $LOG_FILE

# 1. 检查磁盘使用率
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

if [ $DISK_USAGE -lt $THRESHOLD ]; then
  echo "磁盘使用率 ${DISK_USAGE}% 正常,无需清理" >> $LOG_FILE
  exit 0
fi

echo "磁盘使用率 ${DISK_USAGE}% 超过阈值,开始清理..." >> $LOG_FILE

# 2. 清理PM2日志 (保留最近7天)
echo "清理PM2日志..." >> $LOG_FILE
pm2 flush
find ~/.pm2/logs -name "*.log" -mtime +7 -delete

# 3. 清理旧的数据库备份 (保留最近30天)
echo "清理旧备份..." >> $LOG_FILE
find /root/backups -name "*.sql.gz" -mtime +30 -delete
find /root/backups -name "*.tar.gz" -mtime +30 -delete

# 4. 清理系统日志 (保留最近7天)
echo "清理系统日志..." >> $LOG_FILE
journalctl --vacuum-time=7d

# 5. 清理npm缓存
echo "清理npm缓存..." >> $LOG_FILE
npm cache clean --force

# 6. 清理临时文件
echo "清理临时文件..." >> $LOG_FILE
find /tmp -type f -mtime +7 -delete

# 7. 再次检查磁盘使用率
DISK_USAGE_AFTER=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
echo "清理后磁盘使用率: ${DISK_USAGE_AFTER}%" >> $LOG_FILE

# 8. 如果仍然超过90%,发送告警
if [ $DISK_USAGE_AFTER -gt 90 ]; then
  echo "警告: 磁盘使用率仍然过高 (${DISK_USAGE_AFTER}%),需要人工介入!" >> $LOG_FILE
  # 这里可以添加邮件或短信告警
fi

echo "=== 磁盘清理完成: $(date) ===" >> $LOG_FILE
```

### 配置定时清理任务

> [!CAUTION]
> **重要提醒**: 以下定时任务仅清理**日志和缓存**,不会删除业务数据。但建议先手动测试脚本,确认无误后再启用定时任务。

```bash
# 编辑crontab
crontab -e

# 可选: 每天凌晨3点自动清理日志和缓存 (不删除业务数据)
# 建议先手动执行测试,确认无误后再取消注释
# 0 3 * * * /root/scripts/disk-cleanup.sh

# 可选: 每小时检查磁盘使用率,仅在紧急情况(>90%)时清理
# 0 * * * * USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//'); [ $USAGE -gt 90 ] && /root/scripts/disk-cleanup.sh
```

**推荐做法**: 
- 不要启用自动定时清理
- 当收到磁盘空间告警时,手动执行: `bash /root/scripts/disk-cleanup.sh`
- 定期(如每月)手动检查并清理

### 数据归档方案 (可选)

> [!WARNING]
> **数据归档会删除数据库中的历史记录**,请务必:
> 1. 先备份完整数据库
> 2. 与业务方确认归档策略
> 3. 手动执行,不要设置自动任务

如果业务数据增长过快,可以归档1年前的历史数据:

```bash
# 创建归档脚本 /root/scripts/archive-data.sh
#!/bin/bash

ARCHIVE_DATE=$(date -d '1 year ago' +%Y-%m-%d)
ARCHIVE_DIR="/root/archives"
mkdir -p $ARCHIVE_DIR

# 1. 归档6个月前的学习记录
psql -U word_user -d word_app <<EOF
-- 导出旧数据到临时表
CREATE TABLE study_records_archive AS 
SELECT * FROM study_records 
WHERE created_at < '$ARCHIVE_DATE';

-- 删除已归档的数据
DELETE FROM study_records 
WHERE created_at < '$ARCHIVE_DATE';

-- 导出归档数据
\copy study_records_archive TO '$ARCHIVE_DIR/study_records_$(date +%Y%m%d).csv' CSV HEADER;

-- 删除临时表
DROP TABLE study_records_archive;
EOF

# 2. 压缩归档文件
gzip $ARCHIVE_DIR/study_records_$(date +%Y%m%d).csv

echo "数据归档完成: $ARCHIVE_DATE 之前的数据已归档"
```

### 磁盘空间监控告警

```bash
# 创建监控脚本 /root/scripts/disk-monitor.sh
#!/bin/bash

THRESHOLD=85
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')

if [ $DISK_USAGE -gt $THRESHOLD ]; then
  echo "警告: 磁盘使用率 ${DISK_USAGE}% 超过阈值 ${THRESHOLD}%"
  echo "时间: $(date)"
  echo "详细信息:"
  df -h
  echo ""
  echo "占用空间最大的目录:"
  du -h --max-depth=1 /root | sort -hr | head -5
  
  # 这里可以添加邮件或短信告警
fi
```

> [!TIP]
> **最佳实践**: 
> - 定期检查 `/var/log/disk-cleanup.log` 了解清理情况
> - 根据实际情况调整备份保留天数
> - 对于重要数据,归档到其他存储而不是直接删除

---

## 🔐 安全注意事项

> [!WARNING]
> 以下事项关系到系统安全,务必重视

### 必须修改的默认配置

1. **数据库密码**
   ```bash
   # 修改PostgreSQL密码
   psql -U postgres
   ALTER USER word_user WITH PASSWORD 'new_strong_password';
   
   # 同步更新.env文件中的DATABASE_URL
   ```

2. **JWT密钥**
   ```bash
   # 生成新的随机密钥
   openssl rand -base64 32
   
   # 更新.env中的JWT_SECRET
   ```

3. **防火墙配置**
   ```bash
   # 仅允许必要端口
   ufw allow 22/tcp    # SSH
   ufw allow 3000/tcp  # Web服务
   ufw enable
   
   # 数据库端口5432不应对外开放
   ```

### 文件权限

```bash
# 设置.env文件权限
chmod 600 /root/word-app/web-admin/.env

# 设置数据库备份目录权限
chmod 700 /root/backups
```

---

## 📦 备份策略

### 推荐备份方案

```bash
# 创建备份脚本 /root/scripts/backup.sh
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 1. 备份数据库
pg_dump -U word_user word_app | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# 2. 备份上传的文件 (如有)
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /root/word-app/web-admin/public/uploads

# 3. 删除30天前的备份
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "备份完成: $DATE"
```

### 配置定时备份

```bash
# 编辑crontab
crontab -e

# 添加每天凌晨2点自动备份
0 2 * * * /root/scripts/backup.sh >> /var/log/backup.log 2>&1
```

---

## 📞 技术支持联系方式

### 紧急联系

| 角色 | 联系方式 | 负责范围 |
|------|----------|----------|
| **开发负责人** | [待填写] | 代码问题、功能异常 |
| **数据库管理员** | [待填写] | 数据库性能、备份恢复 |
| **运维负责人** | [待填写] | 服务器、网络问题 |

### 问题上报流程

1. **发现问题** → 记录现象、时间、影响范围
2. **初步排查** → 查看日志、检查服务状态
3. **联系支持** → 提供详细信息、日志截图
4. **问题解决** → 记录解决方案、更新文档

---

## 📚 相关文档

- [README.md](file:///e:/trae/1word/README.md) - 项目总览
- [部署指南.md](file:///e:/trae/1word/docs/部署指南.md) - 详细部署说明
- [PRD.md](file:///e:/trae/1word/docs/PRD.md) - 产品需求文档
- [web-admin说明.md](file:///e:/trae/1word/docs/web-admin说明.md) - 管理后台说明

---

## 🔄 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v1.0 | 2026-01-09 | 初始交付版本 |

---

## ✅ 交付清单

- [x] 源代码 (GitHub: wangpeng1017/1word)
- [x] 数据库Schema (31张表)
- [x] 环境配置文件示例 (.env.example)
- [x] 部署脚本 (deploy-production.sh)
- [x] Docker配置 (docker-compose.yml)
- [x] 技术文档
- [x] 运维手册 (本文档)

---

> **最后更新**: 2026-01-09  
> **文档维护**: 开发团队
