# 新东方环境完整部署流程

> 创建时间: 2025-01-27
> 适用环境: 新东方阿里云服务器 172.20.234.44

---

## 📋 环境信息汇总

| 项目 | 值 |
|------|-----|
| **服务器 IP** | 内网: 172.20.234.44 |
| **用户** | dontovertime |
| **应用目录** | /home/dontovertime/apps/1word/web-admin |
| **PM2 进程名** | word-app |
| **应用端口** | 3000 |
| **Node 版本** | 建议 18+ |

### 数据库信息

| 项目 | 值 |
|------|-----|
| **主库地址** | rm-2zel9bu41o5s0v0j8.mysql.rds.aliyuncs.com:3306 |
| **从库地址** | rr-2zenk118a3dkqgu1f.mysql.rds.aliyuncs.com:3306 |
| **数据库名** | bdcxcx |
| **读写账号** | PRO_RDS_bdcxcx_RW |
| **读写密码** | 4n8anApuMflp3cRr |
| **只读账号** | PRO_RDS_bdcxcx_RO |
| **只读密码** | f9l5LDWLcu9wkjU8 |

---

## 📊 数据迁移统计

从测试环境 (8.130.182.148) 迁移的数据量：

| 表名 | 记录数 | 说明 |
|------|-------|------|
| users | 11 | 用户账号 |
| teachers | 0 | 教师信息 |
| students | 10 | 学生信息 |
| classes | 1 | 班级信息 |
| vocabularies | 1996 | 词汇数据 |
| word_images | 1986 | 词汇图片 |
| word_audios | 2109 | 词汇音频 |
| word_meanings | 3995 | 词汇释义 |
| questions | 5120 | 练习题目 |
| question_options | 20480 | 题目选项 |
| vocabulary_packs | 1 | 词汇库 |
| vocabulary_pack_days | 10 | 词汇库天数 |
| vocabulary_pack_day_words | 100 | 每日词汇 |
| vocabulary_quiz_questions | 50 | 词汇量测试题 |

**SQL 文件**: `docs/xdf_import_data.sql` (5.1MB)

---

## 🚀 部署步骤

### 步骤 1: 上传数据库文件到服务器

在**本地**执行（需要能访问新东方服务器）：

```bash
# 方式1: 如果可以直接 SCP 到服务器
scp docs/xdf_import_data.sql dontovertime@172.20.234.44:/home/dontovertime/

# 方式2: 如果通过堡垒机，先上传到堡垒机，再转传到服务器
# 或者使用堡垒机的文件上传功能
```

### 步骤 2: 测试数据库连接和权限

在**新东方服务器**上执行：

```bash
# 测试连接
mysql -h rm-2zel9bu41o5s0v0j8.mysql.rds.aliyuncs.com -P 3306 -u PRO_RDS_bdcxcx_RW -p4n8anApuMflp3cRr bdcxcx -e "SELECT 1 AS test;"

# 检查权限
mysql -h rm-2zel9bu41o5s0v0j8.mysql.rds.aliyuncs.com -P 3306 -u PRO_RDS_bdcxcx_RW -p4n8anApuMflp3cRr bdcxcx -e "SHOW GRANTS;"

# 查看现有表
mysql -h rm-2zel9bu41o5s0v0j8.mysql.rds.aliyuncs.com -P 3306 -u PRO_RDS_bdcxcx_RW -p4n8anApuMflp3cRr bdcxcx -e "SHOW TABLES;"
```

### 步骤 3: 导入数据库（会覆盖现有数据）

⚠️ **警告**: 此操作会删除现有表并重新创建，请确认后再执行！

```bash
# 导入数据（包含表结构和数据）
mysql -h rm-2zel9bu41o5s0v0j8.mysql.rds.aliyuncs.com -P 3306 -u PRO_RDS_bdcxcx_RW -p4n8anApuMflp3cRr bdcxcx < /home/dontovertime/xdf_import_data.sql

# 验证导入结果
mysql -h rm-2zel9bu41o5s0v0j8.mysql.rds.aliyuncs.com -P 3306 -u PRO_RDS_bdcxcx_RW -p4n8anApuMflp3cRr bdcxcx -e "
SELECT 'vocabularies' as tbl, COUNT(*) as cnt FROM vocabularies UNION ALL
SELECT 'questions', COUNT(*) FROM questions UNION ALL
SELECT 'users', COUNT(*) FROM users;
"
```

### 步骤 4: 准备代码目录

```bash
# 确保目录存在
mkdir -p /home/dontovertime/apps/1word

# 如果是首次部署，克隆代码
cd /home/dontovertime/apps
git clone https://github.com/wangpeng1017/1word.git

# 如果已有代码，拉取最新
cd /home/dontovertime/apps/1word
git pull origin main
```

### 步骤 5: 配置环境变量

```bash
# 进入 web-admin 目录
cd /home/dontovertime/apps/1word/web-admin

# 创建生产环境配置文件
cat > .env << 'EOF'
# 新东方生产环境配置
DATABASE_URL="mysql://PRO_RDS_bdcxcx_RW:4n8anApuMflp3cRr@rm-2zel9bu41o5s0v0j8.mysql.rds.aliyuncs.com:3306/bdcxcx"

# JWT 密钥
JWT_SECRET="xdf_vocab_jwt_secret_2024_production_secure_key"

# API 地址
NEXT_PUBLIC_API_URL="https://ienglish.xdf.cn"

# Node 环境
NODE_ENV="production"
EOF

# 验证配置
cat .env
```

### 步骤 6: 安装依赖并构建

```bash
cd /home/dontovertime/apps/1word/web-admin

# 安装依赖
npm install --legacy-peer-deps

# 生成 Prisma Client
npx prisma generate

# 构建应用
npm run build
```

### 步骤 7: 配置 PM2 并启动

```bash
# 如果已有旧进程，先停止
pm2 stop word-app 2>/dev/null || true
pm2 delete word-app 2>/dev/null || true

# 启动新应用
cd /home/dontovertime/apps/1word/web-admin
pm2 start npm --name "word-app" -- start

# 保存 PM2 配置
pm2 save

# 查看状态
pm2 status

# 查看日志
pm2 logs word-app --lines 50
```

---

## ✅ 验证部署

### 1. 检查应用状态

```bash
pm2 status
# 确认 word-app 状态为 online
```

### 2. 检查端口监听

```bash
netstat -tlnp | grep 3000
# 或
ss -tlnp | grep 3000
```

### 3. 测试 API

```bash
# 测试健康检查
curl http://localhost:3000/api/health

# 测试登录接口
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@word.app","password":"admin123"}'
```

### 4. 测试数据库连接

```bash
curl http://localhost:3000/api/stats/overview
```

---

## 🔧 常用运维命令

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs word-app --lines 100

# 重启应用
pm2 restart word-app

# 停止应用
pm2 stop word-app

# 查看详细信息
pm2 show word-app

# 监控
pm2 monit
```

---

## 🔄 后续更新流程

代码更新时执行：

```bash
cd /home/dontovertime/apps/1word

# 1. 拉取最新代码
git pull origin main

# 2. 进入 web-admin
cd web-admin

# 3. 安装依赖（如有新增）
npm install --legacy-peer-deps

# 4. 同步数据库结构（如有变更）
npx prisma db push

# 5. 重新构建
npm run build

# 6. 重启应用
pm2 restart word-app

# 7. 查看日志确认启动成功
pm2 logs word-app --lines 20
```

---

## ⚠️ 故障排查

### 问题1: 数据库连接失败

```bash
# 测试网络连通性
telnet rm-2zel9bu41o5s0v0j8.mysql.rds.aliyuncs.com 3306

# 检查 DNS 解析
nslookup rm-2zel9bu41o5s0v0j8.mysql.rds.aliyuncs.com
```

### 问题2: PM2 启动失败

```bash
# 查看错误日志
pm2 logs word-app --err --lines 50

# 直接启动测试
cd /home/dontovertime/apps/1word/web-admin
npm start
```

### 问题3: 构建失败

```bash
# 清理缓存重新构建
rm -rf .next node_modules
npm install --legacy-peer-deps
npm run build
```

### 问题4: 表不存在错误

如果出现 `Table 'bdcxcx.xxx' doesn't exist`：

```bash
# 方式1: 使用 Prisma 重建表结构
cd /home/dontovertime/apps/1word/web-admin
npx prisma db push

# 方式2: 重新导入 SQL 文件
mysql -h rm-2zel9bu41o5s0v0j8.mysql.rds.aliyuncs.com -P 3306 -u PRO_RDS_bdcxcx_RW -p4n8anApuMflp3cRr bdcxcx < /home/dontovertime/xdf_import_data.sql
```

---

## 📝 默认管理员账号

| 字段 | 值 |
|------|-----|
| 邮箱 | admin@word.app |
| 密码 | admin123 |
| 角色 | ADMIN |

首次登录后请修改密码！
