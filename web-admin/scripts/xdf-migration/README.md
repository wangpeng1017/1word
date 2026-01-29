# 新东方数据迁移指南

> MySQL (阿里云 8.130.182.148) → MySQL (新东方 RDS)

## 📋 环境信息

| 项目 | 源环境（阿里云） | 目标环境（新东方） |
|------|------------------|-------------------|
| 服务器 | 8.130.182.148 | 47.94.235.91 (内网 172.20.234.44) |
| 数据库 | MySQL 本地 | MySQL RDS |
| 数据库地址 | 127.0.0.1:3306 | rm-2zel9bu41o5s0v0j8.mysql.rds.aliyuncs.com:3306 |
| 域名 | word.aifly.me | ienglish.xdf.cn |

---

## 🚀 快速迁移步骤

### 步骤 1：在阿里云服务器导出数据

```bash
# 1. 登录阿里云服务器
ssh root@8.130.182.148

# 2. 进入项目目录
cd /root/word-app/web-admin

# 3. 拉取最新代码（确保有迁移脚本）
git pull origin main

# 4. 执行导出脚本
node scripts/xdf-migration/export-data.js

# 导出完成后，文件位于: /tmp/xdf-migration-data.json
```

### 步骤 2：传输数据文件

```bash
# 在本地执行（从阿里云下载）
scp root@8.130.182.148:/tmp/xdf-migration-data.json ./

# 然后通过堡垒机上传到新东方服务器
# 目标路径: ~/apps/1word/web-admin/xdf-migration-data.json
```

### 步骤 3：在新东方服务器导入数据

```bash
# 1. 登录新东方服务器（通过堡垒机 pandora.staff.xdf.cn）
# 用户: dontovertime

# 2. 进入项目目录
cd ~/apps/1word/web-admin

# 3. 确保数据文件存在
ls -la xdf-migration-data.json

# 4. 拉取最新代码
git pull origin main

# 5. 安装依赖（如有新增）
npm install --legacy-peer-deps

# 6. 同步数据库 Schema
npx prisma generate
npx prisma db push --accept-data-loss

# 7. 执行导入脚本
node scripts/xdf-migration/import-data.js

# 8. 验证迁移结果
node scripts/xdf-migration/verify-data.js

# 9. 重新构建并重启
npm run build
pm2 restart word-app
```

---

## 📁 脚本说明

| 脚本 | 用途 | 执行位置 |
|------|------|----------|
| `export-data.js` | 导出所有数据到 JSON | 阿里云服务器 |
| `import-data.js` | 从 JSON 导入数据 | 新东方服务器 |
| `verify-data.js` | 验证迁移结果 | 新东方服务器 |

---

## 📊 迁移的数据表

### P0 - 核心数据（必须迁移）

| 表名 | 说明 |
|------|------|
| users | 用户账号 |
| teachers | 教师信息 |
| classes | 班级信息 |
| students | 学生信息 |
| vocabularies | 词汇数据 |
| questions | 题目 |
| question_options | 题目选项 |
| vocabulary_packs | 词汇库 |
| vocabulary_pack_days | 词汇库天数 |
| vocabulary_pack_day_words | 每天词汇 |

### P1 - 业务数据

| 表名 | 说明 |
|------|------|
| plan_classes | 班级学习计划 |
| study_plans | 学生学习进度 |
| study_records | 学习记录 |
| word_masteries | 词汇掌握度 |
| wrong_questions | 错题记录 |

### P2 - 可选数据

| 表名 | 说明 |
|------|------|
| achievements | 成就定义 |
| badges | 勋章定义 |
| student_points | 学生积分 |
| operation_logs | 操作日志 |

---

## ⚠️ 注意事项

1. **RDS 白名单**：确保新东方服务器 IP 已添加到 RDS 白名单
   - 公网 IP: `47.94.235.91`
   - 内网 IP: `172.20.234.44`

2. **脚本可重复执行**：使用 upsert，不会产生重复数据

3. **数据量大时**：如果导入卡住，可修改 `import-data.js` 中的 `BATCH_SIZE` 从 100 降低到 50

---

## 🔧 故障排查

### 问题 1：导出脚本报错

```bash
# 检查数据库连接
cd /root/word-app/web-admin
cat .env | grep DATABASE_URL
npx prisma db pull
```

### 问题 2：RDS 连接失败

```bash
# 测试 RDS 连通性
nc -zv rm-2zel9bu41o5s0v0j8.mysql.rds.aliyuncs.com 3306
```

### 问题 3：导入失败 - 外键约束

导入顺序已按外键依赖关系排列，如仍报错，检查对应的父表数据是否已导入。

---

## ✅ 迁移完成检查清单

- [ ] 导出脚本执行成功
- [ ] 数据文件已传输到新东方服务器
- [ ] 导入脚本执行成功
- [ ] 验证脚本显示数据正确
- [ ] 应用已重新构建和重启
- [ ] 管理后台可正常登录
- [ ] 班级、学生数据正确
- [ ] 词汇库数据完整
- [ ] 小程序可正常登录

---

**脚本版本**: v2.0 (MySQL → MySQL)
**更新日期**: 2026-01-29
