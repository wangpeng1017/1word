# 新东方服务器部署方案（完整版）

> **项目**: 英语词汇学习助手 (iEnglish)
> **版本**: v1.0
> **更新日期**: 2026-02-13
> **状态**: ✅ 生产运行中，Day词数修复+新学筛选修复+补卡Day显示误判修复已部署

---

## 📋 目录

- [一、环境信息](#一环境信息)
- [二、本地开发工作流（重要）](#二本地开发工作流重要)
- [三、首次部署流程](#三首次部署流程)
- [四、数据迁移流程](#四数据迁移流程)
- [五、更新部署流程](#五更新部署流程)
- [六、常见问题处理](#六常见问题处理)
- [七、运维管理](#七运维管理)
- [八、故障排查](#八故障排查)

---

## 一、环境信息

### 1.1 服务器配置

| 项目 | 值 |
|------|-----|
| **服务器 IP** | 内网: 172.20.234.44 / 公网: 47.94.235.91 |
| **操作系统** | Ubuntu 22.04.5 LTS |
| **CPU/内存** | 8核 / 48.85GB |
| **登录方式** | Web 堡垒机 (pandora.staff.xdf.cn) |
| **普通用户** | dontovertime |
| **切换 root** | `su - root` |

### 1.2 应用配置

| 项目 | 值 |
|------|-----|
| **技术栈** | Next.js 15.5.7 + Prisma + MySQL |
| **Node.js 版本** | v18.20.4 |
| **应用目录** | /home/dontovertime/apps/1word/web-admin |
| **应用端口** | 3000 |
| **进程管理** | PM2 (进程名: word-app) |
| **代码仓库** | https://github.com/wangpeng1017/1word.git |
| **备用仓库(Gitee)** | https://gitee.com/WANGPENG13/1word.git（GitHub 不可达时使用） |

### 1.3 数据库配置

#### 新东方生产数据库

| 项目 | 值 |
|------|-----|
| **类型** | MySQL (阿里云 RDS) |
| **主库地址** | rm-2zel9bu41o5s0v0j8.mysql.rds.aliyuncs.com:3306 |
| **从库地址** | rr-2zenk118a3dkqgu1f.mysql.rds.aliyuncs.com:3306 |
| **数据库名** | bdcxcx |
| **读写账号** | PRO_RDS_bdcxcx_RW / 4n8anApuMflp3cRr |
| **只读账号** | PRO_RDS_bdcxcx_RO / f9l5LDWLcu9wkjU8 |

#### 阿里云测试数据库

| 项目 | 值 |
|------|-----|
| **类型** | MySQL (本地安装) |
| **服务器** | 8.130.182.148:3306 |
| **数据库名** | word_app_mysql |
| **账号** | word_mysql / word_mysql_2024 |
| **用途** | 测试验证、数据导出源 |

> **重要**: 阿里云测试环境与新东方生产环境**网络不互通**，数据迁移必须通过 GitHub 中转。

### 1.4 域名配置

| 项目 | 值 | 状态 |
|------|-----|------|
| **目标域名** | ienglish.xdf.cn | ✅ 已配置 |
| **DNS 解析** | 腾讯 EO 边缘节点 IP | ✅ 正常 |
| **负载均衡** | 集团统一负载均衡 → 172.20.234.44:80 | ✅ 已配置 |
| **服务器监听** | Nginx 80 端口 → 应用 3000 端口 | ✅ 正常 |

#### 网络架构

```
用户请求
    ↓
腾讯 EO 防护（边缘节点）    ← DNS 解析指向此处，提供 CDN/WAF 防护
    ↓
集团负载均衡（反向代理）    ← 已配置 upstream: 172.20.234.44:80
    ↓
服务器 Nginx (80端口)       ← 内网 172.20.234.44
    ↓
Next.js 应用 (3000端口)
```

> **说明**: ping `ienglish.xdf.cn` 返回的是腾讯 EO 边缘节点 IP，不是服务器真实 IP，这是正常的。

### 1.5 关键架构决策

| 决策点 | 方案 | 原因 |
|--------|------|------|
| **容器化** | ❌ 不使用 Docker | 生产环境直接使用 PM2 管理 Node.js 进程 |
| **数据库** | 阿里云 RDS MySQL | 集团统一数据库服务，高可用、自动备份 |
| **进程管理** | PM2 | 自动重启、日志管理、零停机部署 |
| **反向代理** | Nginx | 集团统一负载均衡 + 本地 Nginx 转发 |
| 静态文件访问 | 通过 `/api/images/*` 提供访问 | Nginx只代理`/api/*`，避免配置复杂化 |
| 数据迁移 | **通过 Git 仓库中转** | **阿里云↔新东方网络不互通，无法直接传输** |
| 数据库同步 | DBA手动执行SQL | 无外部数据库访问权限 |
| 测试环境数据库 | MySQL (非 PostgreSQL) | 与生产环境保持一致，减少迁移问题 |

### 1.6 ⚠️ 迭代开发关键约束（AI 必须遵守！）

| 约束 | 说明 | 原因 |
|------|------|------|
| ❌ **不能修改表结构** | 禁止 `ALTER TABLE`、`CREATE TABLE`、`prisma db push` | 无 DBA 权限，生产数据库由 DBA 管理 |
| ❌ **不能直接连接生产环境** | AI 禁止 SSH 到 172.20.234.44 | 只能用户通过堡垒机 (pandora.staff.xdf.cn) 手动操作 |
| ✅ **只能修改代码逻辑** | 在现有表结构基础上开发新功能 | 保证生产稳定性 |
| ✅ **只能使用 `prisma generate`** | 仅生成 Prisma 客户端代码，不改数据库 | 安全操作 |

**开发部署流程**:
```
┌──────────────────┐  ┌──────────────────┐ ┌──────────────────┐
│ 1. 本地开发 │ ──▶ │ 2. git push │ ──▶ │ 3. 用户手动部署 │
│ (AI 协助) │ │  origin main │ │ (堡垒机 SSH) │
└──────────────────┘  └──────────────────┘ └──────────────────┘
          │
       ▼
       git pull → npm run build
      → pm2 restart word-app
```

**禁止行为**:
1. ❌ AI 自动执行 `ssh root@47.94.235.91` 或任何生产服务器连接
2. ❌ 执行任何 `ALTER TABLE`、`CREATE TABLE`、`DROP TABLE` 语句
3. ❌ 运行 `npx prisma db push` 或 `npx prisma migrate`
4. ❌ 修改 `prisma/schema.prisma` 中的字段定义（除非明确需求且有 DBA 配合）

---

## 二、本地开发工作流（重要）

### 2.1 GitHub 访问问题

**问题**: 本地访问 GitHub 需要翻墙，服务器可以直接访问。

| 环境 | GitHub 访问 | 解决方案 |
|------|-------------|----------|
| 本地开发机 | ❌ 需要翻墙 | 开启VPN后操作 |
| XDF 服务器 | ✅ 直连 | 无需VPN |

### 2.2 本地开发到部署流程

```bash
# ┌─────────────────────────────────────────────────────────┐
# │  本地开发阶段（需要翻墙）                                  │
# └─────────────────────────────────────────────────────────┘

# 1. 确保VPN已开启，测试GitHub连接
git ls-remote https://github.com/wangpeng1017/1word.git

# 2. 拉取最新代码
git pull origin main

# 3. 本地开发、测试
npm run dev

# 4. 提交代码
git add -A
git commit -m "feat: xxx"
git push origin main


# ┌─────────────────────────────────────────────────────────┐
# │  服务器部署阶段（通过Web堡垒机SSH，无需翻墙）              │
# └─────────────────────────────────────────────────────────┘

# 5. SSH登录到XDF服务器
# 通过 pandora.staff.xdf.cn 连接 dontovertime@172.20.234.44

# 6. 拉取并部署
cd ~/apps/1word/web-admin
git pull origin main
npm run build
pm2 restart word-app
```

### 2.3 大文件迁移流程（图片等）

当需要迁移大量图片或其他静态文件时：

```bash
# ┌─────────────────────────────────────────────────────────┐
# │  步骤1：原服务器推送到GitHub（需要翻墙）                    │
# └─────────────────────────────────────────────────────────┘

# 在原服务器（如阿里云 8.130.182.148）
cd /root/word-app
git add -f web-admin/public/images/
git commit -m "feat: 添加图片文件"
git push origin main


# ┌─────────────────────────────────────────────────────────┐
# │  步骤2：XDF服务器拉取（无需翻墙）                          │
# └─────────────────────────────────────────────────────────┘

# 在XDF服务器
cd ~/apps/1word
git pull origin main

# 验证文件
ls -la web-admin/public/images/words/ | wc -l
```

---

## 三、首次部署流程

### 3.1 安装 Node.js（无 sudo 权限）

```bash
# 1. 下载 Node.js 18 二进制包
cd ~
wget https://npmmirror.com/mirrors/node/v18.20.4/node-v18.20.4-linux-x64.tar.xz

# 2. 解压
tar -xf node-v18.20.4-linux-x64.tar.xz

# 3. 配置环境变量
echo 'export PATH="$HOME/node-v18.20.4-linux-x64/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# 4. 验证
node -v  # 应显示 v18.20.4
npm -v   # 应显示 10.7.0
```

### 3.2 克隆代码

```bash
# 1. 创建应用目录
mkdir -p ~/apps && cd ~/apps

# 2. 克隆代码
git clone https://github.com/wangpeng1017/1word.git

# 3. 进入项目目录
cd 1word/web-admin
```

### 3.3 配置环境变量

```bash
# 创建 .env 文件（使用 echo 方式避免 heredoc 问题）
echo 'DATABASE_URL="mysql://PRO_RDS_bdcxcx_RW:4n8anApuMflp3cRr@rm-2zel9bu41o5s0v0j8.mysql.rds.aliyuncs.com:3306/bdcxcx"' > .env
echo 'JWT_SECRET="xdf_vocab_jwt_secret_2024_production_secure_key"' >> .env
echo 'NEXT_PUBLIC_API_URL="https://ienglish.xdf.cn"' >> .env
echo 'NODE_ENV="production"' >> .env

# 验证
cat .env
```

### 3.4 安装依赖并构建

```bash
# 1. 设置 npm 镜像
npm config set registry https://registry.npmmirror.com

# 2. 安装依赖
npm install --legacy-peer-deps

# 3. 生成 Prisma Client
npx prisma generate

# 4. 同步数据库表结构（DBA已提前创建好表）
npx prisma db push

# 5. 构建应用
npm run build
```

### 3.5 安装 PM2 并启动应用

```bash
# 1. 全局安装 PM2
npm install -g pm2

# 2. 启动应用
pm2 start npm --name "word-app" -- start

# 3. 保存 PM2 配置
pm2 save

# 4. 设置开机自启
pm2 startup

# 5. 查看状态
pm2 status

# 6. 验证应用运行
curl -I http://127.0.0.1:3000
```

**预期结果**: 返回 `HTTP/1.1 200 OK`

---

## 四、数据迁移流程

### 4.1 迁移场景

从其他环境（如阿里云测试服务器）迁移业务数据到XDF生产环境。

### 4.2 数据库迁移

#### 步骤1：导出源数据

```bash
# 在源服务器（需要数据库访问权限）
mysqldump -h源数据库地址 -u用户名 -p密码 \
  bdcxcx vocabularies word_meanings word_audios word_images \
  questions question_options > data.sql
```

#### 步骤2：DBA执行导入

由于XDF环境数据库由专业DBA管理，提供SQL文件给DBA执行：

```sql
-- DBA在RDS上执行
USE bdcxcx;

-- 清空现有数据（可选）
TRUNCATE TABLE word_masteries;
TRUNCATE TABLE student_progress;
-- ... 其他需要重置的表

-- 导入新数据
source /path/to/data.sql;
```

### 4.3 重要：阿里云测试环境数据迁移必须通过 GitHub

**原因**: 阿里云测试环境 (8.130.182.148) 与新东方生产环境之间网络**不互通**，无法直接通过 scp/rsync/mysqldump 传输数据。

**唯一可行方案**: 通过 GitHub 仓库中转数据文件。

#### 数据迁移流程图

```
阿里云测试环境 (8.130.182.148)
    ↓ git push (需翻墙)
GitHub 仓库 (wangpeng1017/1word.git)
    ↓ git pull (无需翻墙)
新东方生产环境 (172.20.234.44)
```

#### 方式 1: 迁移 JSON 数据文件

```bash
# ===========================
# 步骤 1: 阿里云测试环境 - 导出并推送（本地执行，需翻墙）
# ===========================
ssh root@8.130.182.148
cd /root/word-app/web-admin

# 导出数据为 JSON（如已有导出脚本）
npx ts-node scripts/export-vocabularies.ts > exports/vocabularies.json
npx ts-node scripts/export-questions.ts > exports/questions.json
npx ts-node scripts/export-badges.ts > exports/badges.json

# 提交到 Git
cd /root/word-app
git add exports/
git commit -m "feat: 导出测试数据用于生产迁移"
git push origin main

# ===========================
# 步骤 2: 新东方生产环境 - 拉取并导入（通过堡垒机 SSH）
# ===========================
# 在新东方服务器
cd ~/apps/1word
git pull origin main

# 检查文件是否同步
ls -la web-admin/exports/

# 导入数据
cd web-admin
npx ts-node scripts/import-vocabularies.ts
npx ts-node scripts/import-questions.ts
npx ts-node scripts/import-badges.ts
```

#### 方式 2: 迁移 SQL 数据文件

```bash
# ===========================
# 步骤 1: 阿里云测试环境 - 导出 SQL 并推送
# ===========================
ssh root@8.130.182.148

# 导出 MySQL 数据
mysqldump -uword_mysql -pword_mysql_2024 word_app_mysql \
  --tables \
  vocabularies word_meanings word_audios word_images \
  questions question_options \
  badges student_badges achievements student_achievements \
  > /root/word-app/web-admin/exports/data-migration.sql

# 提交到 Git
cd /root/word-app
git add web-admin/exports/data-migration.sql
git commit -m "feat: 导出 SQL 迁移数据"https://ienglish.xdf.cn/admin/study-plans
git push origin main

# ===========================
# 步骤 2: 新东方生产环境 - 拉取并执行导入
# ===========================
# 在新东方服务器
cd ~/apps/1word
git pull origin main

# 转换数据库名并执行（需要 DBA 配合）
sed 's/word_app_mysql/bdcxcx/g' web-admin/exports/data-migration.sql > /tmp/xdf-import.sql

# 将 SQL 文件交给 DBA 执行，或自行在有权限的数据库上执行
mysql -h rm-2zel9bu41o5s0v0j8.mysql.rds.aliyuncs.com \
  -u PRO_RDS_bdcxcx_RW -p4n8anApuMflp3cRr \
  bdcxcx < /tmp/xdf-import.sql
```

#### 方式 3: 迁移图片文件

```bash
# ===========================
# 步骤 1: 阿里云测试环境 - 推送图片
# ===========================
ssh root@8.130.182.148
cd /root/word-app

# 强制添加图片文件到 Git
git add -f web-admin/public/images/
git commit -m "feat: 添加图片文件"
git push origin main

# ===========================
# 步骤 2: 新东方生产环境 - 拉取图片
# ===========================
# 在新东方服务器
cd ~/apps/1word
git pull origin main

# 验证图片文件
ls -la web-admin/public/images/words/ | wc -l
```

#### 阿里云测试环境数据库信息

| 项目 | 值 |
|------|-----|
| **服务器 IP** | 8.130.182.148 |
| **数据库类型** | MySQL 8.0 |
| **数据库名** | word_app_mysql |
| **用户名** | word_mysql |
| **密码** | word_mysql_2024 |
| **端口** | 3306 |

#### 数据量统计（截至 2026-01-31）

| 表名 | 记录数 |
|------|--------|
| vocabularies | 1996 |
| word_images | 1986 |
| word_audios | 2109 |
| questions | 5120 |
| badges | 10 |

### 4.4 图片文件迁移

**问题**: 服务器间无法直接scp/rsync传输

**解决方案**: 通过GitHub仓库中转（详见 4.3 节方式 3）

### 4.5 Schema同步问题处理

**问题**: Prisma期望camelCase字段（`createdAt`），但数据库是snake_case（`created_at`）

**解决方案**：

1. **检查Prisma Schema定义**：
```bash
cd ~/apps/1word/web-admin
grep -A 5 "createdAt|updatedAt" prisma/schema.prisma
```

2. **如果字段缺失，联系DBA执行**：
```sql
-- 添加缺失的时间戳字段（camelCase）
ALTER TABLE word_meanings ADD COLUMN createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE word_meanings ADD COLUMN updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
ALTER TABLE word_audios ADD COLUMN createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE word_images ADD COLUMN createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE questions ADD COLUMN createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3);
```

3. **重新生成Prisma Client**：
```bash
npx prisma generate
npm run build
pm2 restart word-app
```

**禁止**: 不要在生产环境运行 `npx prisma db pull`，这会覆盖schema中的关系定义。

---

## 五、更新部署流程

> **⚠️ 重要**: XDF 服务器使用 PM2 运行 `npm start`（生产模式），**必须先执行 `npm run build` 构建**，否则应用会使用旧代码！
> 
> 验证方式：`pm2 info word-app` 查看 `script args` 为 `start`

### 5.1 标准更新流程

```bash
# 1. 本地提交代码（需要翻墙）
git add -A
git commit -m "feat: xxx"
git push origin main


# 2. SSH到XDF服务器（通过堡垒机）
cd ~/apps/1word/web-admin


# 3. 拉取最新代码
git pull origin main


# 4. 检查是否需要更新依赖
git diff HEAD~1 package.json package-lock.json
# 如果有变化，执行：
npm install --legacy-peer-deps


# 5. 检查是否需要更新数据库
git diff HEAD~1 prisma/schema.prisma
# 如果有变化，联系DBA后执行：
npx prisma generate


# 6. 重新构建（⚠️ 必须执行！）
npm run build
# 说明：PM2 运行 npm start（生产模式），需要 .next 构建产物
# 如果不构建，应用会继续使用旧代码


# 7. 重启应用
pm2 restart word-app


# 8. 验证
pm2 logs word-app --lines 50
```

### 5.2 一键更新脚本

创建更新脚本 `~/update-app.sh`：

```bash
#!/bin/bash
set -e

APP_DIR="$HOME/apps/1word/web-admin"

echo "========== 开始更新 =========="
cd "$APP_DIR"

echo "[1/5] 拉取最新代码..."
git pull origin main

echo "[2/5] 检查依赖变化..."
if git diff HEAD~1 HEAD -- package.json | grep -q .; then
    echo "检测到依赖变化，安装中..."
    npm install --legacy-peer-deps
fi

echo "[3/5] 生成Prisma Client..."
npx prisma generate

echo "[4/5] 构建应用..."
npm run build

echo "[5/5] 重启应用..."
pm2 restart word-app

echo "========== 更新完成 =========="
pm2 status
```

使用方式：

```bash
chmod +x ~/update-app.sh
~/update-app.sh
```

### 5.3 回滚操作

```bash
# 查看最近提交
git log --oneline -5

# 回滚到指定版本
git reset --hard <commit-hash>

# 重新构建
npm run build
pm2 restart word-app
```

### 5.4 版本部署记录

> ⚠️ 每次部署前记录当前版本 hash，出问题时可立即回滚。

| 日期 | Commit | 改动摘要 | 回滚目标 |
|------|--------|---------|----------|
| 2026-02-19 | `c4d8ea9` | **修复学习类型"未知"Bug**: complete/route.ts session_id解析添加first-match保护 + learning-sessions正则精确匹配 | `09fc149` |
| 2026-02-13 | `09fc149` | **修复补卡Day显示误判**: 正则 `/_d(\d+)/` 误匹配随机后缀，改为 `/_d(\d+)_/` | `33cdead` |
| 2026-02-13 | `33cdead` | **修复新学筛选**: 覆盖 `_munknown_dnull` 和 `_mall_dnull` 模式记录 | `0ce2f04` |
| 2026-02-13 | `0ce2f04` | **修复Day页面词数**: 显示实际完成词数而非理论复习词数 | `d01c5f2` |
| 2026-02-12 | `d01c5f2` | **修复 Storage 超限**: daily-tasks API 只返回 1 个被选中的 question | `2c8db57` |
| 2026-02-11 | `2c8db57` | 错题本显示实际错误选项内容 + 小程序保存选项文字 | `d9100b6` |
| 2026-02-10 | `d9100b6` | 彻底修复 LISTENING 题在学习/复习/错题本中泄漏 | `82879e4` |
| 2026-02-10 | `82879e4` | 错题本显示修复 + 学生列表防御 + 手机号筛选 + 禁用听音选词 | `24c58f0` |
| 2026-02-10 | `24c58f0` | 修复答案洗牌参考系不一致导致正确答案被误判为错误 | `78a1157` |
| 2026-02-08 | `78a1157` | 防御性修复 timeSpent null 值 | `2ca71b2` |
| 2026-02-08 | `2ca71b2` | 修复 completedAt 和 timeSpent NOT NULL 约束冲突 | `10b9239` |
| 2026-02-07 | `10b9239` | 修复生产高中风险问题(连接池/N+1/ID碰撞/事务竞态) | — |

#### 小程序发版记录

| 日期 | Commit | 改动摘要 | 涉及文件 |
|------|--------|---------|---------|
| 2026-02-19 | `ede71d0` | **彻底修复 Storage 1MB 超限**: slimTasks 精简存储 + safeSetStorage 防护，恢复进度从 API 重新拉取 | `storage.js` `study.js` |
| 2026-02-14 | `e39c438` | 补卡走 createSession + createSession 传 mode/day + 错题 limit 300 + Day弹窗隐藏 0:00 | `study.js` `sync.js` `index.js` `wrong.js` |
| 2026-02-11 | `2c8db57` | 答题时保存选项实际内容到 answer 字段，配合错题本显示 | `study.js` |
| 2026-02-08 | `fa3a921` | 修复4个统计数据bug(弹窗数据覆盖/正确率分母/Day用时) | `study.js` `result.js` |
| 2026-02-08 | `a56fda8` | 区分今日学习/复习完成状态，修复 timeline Day 状态判断 | `study.js` `index.js` |
| 2026-02-07 | `944ab9f` | 防止已完成每日任务后重复进入学习 | `study.js` |
| 2026-02-07 | `becc845` | 学习进度保存修复 + 错题本音频修复 | `study.js` `wrong.js` |
| 2026-02-06 | `894c55f` | 延长复习计划时间表并优化交互 | `today-learn.js` |
| 2026-02-06 | `e951039` | 优化今日复习和学习页 UI 逻辑 | `index.js` `today-learn.js` |
| 2026-02-05 | `02dfea2` | 移除分批加载逻辑，解决任务提前结束问题 | `study.js` |
| 2026-02-05 | `41c0c69` | 重构今日复习逻辑为复习计划模式 | `today-learn.js` `study.js` |
| 2026-02-05 | `e77cb5b` | 修复体验版白屏问题 | `app.js` |

#### 本次快速回滚指令（2026-02-13 部署）

如果本次部署后出现问题，在 XDF 服务器执行：

```bash
cd ~/apps/1word/web-admin
git reset --hard d01c5f2
npm run build
pm2 restart word-app
```

回滚后验证：
```bash
pm2 logs word-app --lines 20
curl -s https://ienglish.xdf.cn/api/health | head -1
```

### 5.5 🔴 生产环境代码变更验证清单（强制！）

> **教训来源**：2026-02-11 部署后，`study-days` API 将今日新学完成的 `COMPLETED` 状态误匹配为复习完成，导致大面积学生 Day2 复习被错误标记为已完成。同时 `findFirst` 无排序随机命中未来计划，返回 0 个词。

#### 每次发版前，必须完成以下检查：

```
□ 1. 状态覆盖检查
  - 列出所有涉及的表和字段的可能状态值
  - 逐一确认代码对每种状态的处理是否正确
  - 特别检查 study_records.status 的 5 种值：
    COMPLETED / COMPLETED_NEW / COMPLETED_REVIEW / IN_PROGRESS / INTERRUPTED

□ 2. 查询安全检查
  - findFirst 是否有 orderBy？多条匹配时返回哪一条？
  - 生产中是否存在一对多数据异常？（如同一班级多个 ACTIVE 计划）
  - 日期/时区计算是否正确？

□ 3. 生产数据验证 SQL
  - 提供可在生产 MySQL 执行的验证 SQL
  - 用真实学生 ID（如 SH0721975154）验证
  - 部署前在生产库跑 SQL 确认数据状态

□ 4. 部署后验证
  - 用真实学生刷新小程序，确认功能正常
  - 检查 PM2 日志无报错：pm2 logs word-app --lines 50
  - 记录部署版本号到版本部署记录表
```

#### 关键数据状态枚举速查：

| 表 | 字段 | 可能值 | 说明 |
|---|------|--------|------|
| `study_records` | `status` | `IN_PROGRESS` / `INTERRUPTED` / `COMPLETED` / `COMPLETED_NEW` / `COMPLETED_REVIEW` | `COMPLETED` = mode=unknown 的旧会话 |
| `plan_classes` | `status` | `ACTIVE` / `COMPLETED` | 同一班级可能有多个 ACTIVE |
| `study_plans` | `status` | `LEARNING` / `MASTERED` | — |
| `word_masteries` | `isMastered` | `true` / `false` | — |
| `wrong_questions` | `status` | `ACTIVE` / `CONFIRMED` / `MASTERED` | — |

---

## 六、常见问题处理

### 6.1 小程序图片无法显示

**症状**: API正常，答题正常，但看不到词汇图片

**原因**: Nginx只代理`/api/*`请求，静态文件路径`/images/*`无法访问

**解决方案**: 已通过创建图片API接口解决

```bash
# 验证图片API是否正常
curl -I https://ienglish.xdf.cn/api/images/words/wedding.webp

# 预期返回: HTTP/1.1 200 OK
```

**技术实现**:
- 新增 `/api/images/[...path]` 路由
- API返回数据自动转换 `/images/` → `/api/images/`
- 图片通过API接口返回，走已有的代理通道

### 6.2 数据库字段不存在

**症状**: 日志显示 `Column 'xxx.createdAt' does not exist`

**解决方案**:

1. 检查Prisma Schema期望的字段名
2. 联系DBA执行ALTER TABLE添加字段
3. 重新生成Prisma Client

```bash
# 步骤3：重新生成
npx prisma generate
npm run build
pm2 restart word-app
```

### 6.3 Git推送失败

**症状**: `git push` 提示认证失败

**解决方案**: 使用Personal Access Token

```bash
# 1. 生成Token：GitHub Settings → Developer settings → Tokens
# 2. 设置远程URL
git remote set-url origin https://TOKEN@github.com/wangpeng1017/1word.git

# 3. 推送
git push origin main
```

### 6.4 小程序点击"开始学习"报错 Storage 超限

**症状**: 点击"开始学习"或"今日复习"弹出错误：
```
APP-SERVICE-SDK:setStorageSync:fail:entry size limit reached
```

**原因**: 微信小程序 `wx.setStorageSync` 单条存储限制 **1MB**。学习页面（`study.js`）在两处将完整 tasks 数组存入 Storage：
- `saveTodayWords(tasks)` -> `todayWords_{studentId}`（离线缓存）
- `saveStudyProgress({tasks, ...})` -> `currentSession_{studentId}`（进度保存，每次答题触发）

当单词量较大时，tasks 中嵌套的 questions、options、meanings 等数据序列化后超过 1MB。

**触发阈值估算**:

| 场景 | 每 task 大小 | 触发限制所需词数 |
|------|------------|----------------|
| 修复前（返回全部 questions） | ~3500 bytes | ~250 个 |
| 修复后（只返回 1 个 question） | ~1600 bytes | ~650 个 |

**已实施方案**（2026-02-12，后端修改，无需发版小程序）:

修改 `web-admin/app/api/students/[id]/daily-tasks/route.ts` 中的 `mapTasksForMiniapp` 函数：
- 后端已通过 `selectedQuestionId` 选好题目，API 只返回被选中的 **1 个 question**，而非全部 3-5 个
- 数据量减少约 **70%**，安全覆盖 600 词以下场景

**后续优化方向**（需发版小程序时一并处理）:
- `saveStudyProgress` 不再存储完整 tasks，只存进度元数据，恢复时从 API 重新拉取
- `saveTodayWords` 添加 try-catch，存储失败不阻塞学习流程
- 以上可彻底解决任意词量的 Storage 限制问题

---

## 七、运维管理

### 7.1 PM2 常用命令

```bash
# 查看应用状态
pm2 status

# 查看实时日志
pm2 logs word-app

# 查看最近 100 行日志
pm2 logs word-app --lines 100

# 重启应用
pm2 restart word-app

# 停止应用
pm2 stop word-app

# 删除应用
pm2 delete word-app

# 查看应用详细信息
pm2 show word-app

# 监控资源使用
pm2 monit
```

### 7.2 Nginx 管理（需 root）

```bash
# 查看 Nginx 状态
systemctl status nginx

# 重启 Nginx
systemctl restart nginx

# 重新加载配置（不中断服务）
systemctl reload nginx

# 测试配置语法
nginx -t

# 查看访问日志
tail -f /var/log/nginx/access.log

# 查看错误日志
tail -f /var/log/nginx/error.log
```

### 7.3 日志位置

| 日志类型 | 路径 |
|----------|------|
| PM2 应用日志 | ~/.pm2/logs/word-app-out.log |
| PM2 错误日志 | ~/.pm2/logs/word-app-error.log |
| Nginx 访问日志 | /var/log/nginx/access.log |
| Nginx 错误日志 | /var/log/nginx/error.log |

### 7.4 数据维护与备份操作

#### 手动备份表数据（mysqldump）

当数据库账号没有 `CREATE TABLE` 权限无法直接复制表时，使用此方法备份数据到文件：

```bash
# 1. 登录到服务器（bash环境）
# 2. 执行导出命令（将 table_name 替换为实际表名）
mysqldump -h rm-2zel9bu41o5s0v0j8.mysql.rds.aliyuncs.com -u PRO_RDS_bdcxcx_RW -p4n8anApuMflp3cRr bdcxcx table_name > table_name_backup.sql

# 示例：备份 word_audios 表
mysqldump -h rm-2zel9bu41o5s0v0j8.mysql.rds.aliyuncs.com -u PRO_RDS_bdcxcx_RW -p4n8anApuMflp3cRr bdcxcx word_audios > word_audios_backup.sql
```

#### 数据恢复

```bash
# 将备份文件导入回数据库
mysql -h rm-2zel9bu41o5s0v0j8.mysql.rds.aliyuncs.com -u PRO_RDS_bdcxcx_RW -p4n8anApuMflp3cRr bdcxcx < table_name_backup.sql
```

---

## 八、故障排查

### 8.1 应用无法启动

**症状**: `pm2 status` 显示 `errored` 或 `stopped`

**排查步骤**:

```bash
# 1. 查看错误日志
pm2 logs word-app --err --lines 50

# 2. 检查端口占用
netstat -tlnp | grep 3000

# 3. 检查环境变量
cd ~/apps/1word/web-admin
cat .env

# 4. 检查Node.js版本
node -v  # 应为 v18.x
```

**常见原因**:
- 端口 3000 被占用
- 环境变量配置错误
- 数据库连接失败
- 构建文件缺失（需重新 `npm run build`）

### 8.2 502 Bad Gateway

**症状**: 访问域名返回 502 错误

**排查步骤**:

```bash
# 1. 检查应用是否运行
pm2 status

# 2. 检查应用端口
curl -I http://127.0.0.1:3000

# 3. 检查 Nginx 配置
nginx -t

# 4. 查看 Nginx 错误日志
tail -50 /var/log/nginx/error.log
```

**解决方案**:
- 应用未运行: `pm2 restart word-app`
- Nginx 配置错误: 修复后 `systemctl reload nginx`

### 8.3 数据库连接失败

**症状**: 日志显示 `Can't reach database server` 或 `ECONNREFUSED`

**排查步骤**:

```bash
# 1. 检查数据库地址是否正确
cat ~/apps/1word/web-admin/.env | grep DATABASE_URL

# 2. 测试数据库连接
cd ~/apps/1word/web-admin
npx prisma db pull
```

**解决方案**:
- 联系 DBA 检查 RDS 白名单
- 检查数据库账号密码是否正确

---

## 九、微信小程序配置

### 9.1 小程序环境配置

小程序代码位于 `wechat-miniapp/` 目录，API 地址通过 `project.config.json` 配置：

```json
{
  "appid": "wx9e311c91d453f624",
  "projectname": "vocab-assistant"
}
```

### 9.2 生产环境配置要点

| 项目 | 配置值 | 说明 |
|------|--------|------|
| **AppID** | wx9e311c91d453f624 | 新东方生产环境小程序AppID |
| **API地址** | https://ienglish.xdf.cn/api | 生产环境API |
| **调试模式** | false | 生产环境关闭调试 |

### 9.3 切换生产环境步骤

如需将小程序切换到生产环境：

1. **修改 project.config.json**
```bash
cd wechat-miniapp
# 编辑 project.config.json，确认 appid 为 wx9e311c91d453f624
```

2. **修改 API 环境配置**
```javascript
// config/env.js 或 utils/config.js
const ENV = 'production'  // 或 'xdf'

config = {
  xdf: {
    apiUrl: 'https://ienglish.xdf.cn/api',
    debug: false
  }
}
```

3. **微信开发者工具重新编译**
   - 关闭当前项目
   - 重新打开项目
   - 点击"编译"按钮

### 9.4 图片URL处理

小程序会自动将API返回的图片路径转换为完整URL：

```javascript
// 小程序代码逻辑（pages/study/study.js）
if (vocabulary.imageUrl && vocabulary.imageUrl.startsWith('/')) {
  const baseUrl = (app.globalData.apiUrl || '').replace(/\/api$/, '')
  vocabulary.imageUrl = baseUrl + vocabulary.imageUrl
}

// 结果：
// API返回: /api/images/words/wedding.webp
// 转换后: https://ienglish.xdf.cn/api/images/words/wedding.webp
```

### 9.5 微信公众平台配置

| 类型 | 域名 | 状态 |
|------|------|------|
| request 合法域名 | https://ienglish.xdf.cn | ✅ 已配置 |
| uploadFile 合法域名 | https://ienglish.xdf.cn | ✅ 已配置 |
| downloadFile 合法域名 | https://ienglish.xdf.cn | ✅ 已配置 |

### 9.6 小程序信息

| 项目 | 值 |
|------|-----|
| **生产环境 AppID** | wx9e311c91d453f624 |
| **测试环境 AppID** | wx132f0943597b61b7 |
| **项目名** | vocab-assistant |
| **代码目录** | wechat-miniapp/ |

> **注意**: 生产环境与测试环境使用不同的 AppID，确保在发布前使用正确的 AppID。

---

## 十、联系方式

| 角色 | 负责内容 | 联系方式 |
|------|----------|----------|
| 应用负责人 | 代码开发、应用部署 | 王鹏 |
| IT 部门 | 域名解析、负载均衡 | （待填写） |
| DBA | 数据库管理、白名单 | （待填写） |

---

## 十一、附录

### 11.1 环境变量说明

| 变量名 | 说明 | 必填 | 示例 |
|--------|------|------|------|
| DATABASE_URL | MySQL 连接字符串 | 是 | mysql://user:pass@host:3306/db |
| JWT_SECRET | JWT 签名密钥 | 是 | 随机字符串（建议 32 位以上） |
| NEXT_PUBLIC_API_URL | API 地址（前端使用） | 是 | https://ienglish.xdf.cn |
| NODE_ENV | 环境标识 | 是 | production |

### 11.2 端口使用

| 端口 | 用途 | 访问方式 |
|------|------|----------|
| 3000 | Next.js 应用 | 内网访问 |
| 80 | Nginx HTTP | 公网访问 |
| 443 | Nginx HTTPS | 公网访问 |

### 11.3 关键文件路径

| 文件 | 路径 |
|------|------|
| 应用代码 | ~/apps/1word/web-admin |
| 小程序代码 | ~/apps/1word/wechat-miniapp |
| 环境变量 | ~/apps/1word/web-admin/.env |
| 图片文件 | ~/apps/1word/web-admin/public/images/ |
| Nginx 配置 | /etc/nginx/sites-available/ienglish.xdf.cn |
| PM2 配置 | ~/.pm2/dump.pm2 |
| Node.js 二进制 | ~/node-v18.20.4-linux-x64/bin |

### 11.4 数据库诊断命令

由于生产环境使用阿里云 RDS，无法通过 Docker 访问，需使用以下命令连接数据库：

> **重要**: 使用**主库地址**进行查询，从库可能存在数据同步延迟。

#### 查询数据库表结构
```bash
# 使用只读账号查看表结构（连接主库）
mysql -h rm-2zel9bu41o5s0v0j8.mysql.rds.aliyuncs.com -u PRO_RDS_bdcxcx_RO -pf9l5LDWLcu9wkjU8 bdcxcx -e "SHOW TABLES;"
```

#### 查询特定表
```bash
# 示例：查询词汇量测试表
mysql -h rm-2zel9bu41o5s0v0j8.mysql.rds.aliyuncs.com -u PRO_RDS_bdcxcx_RO -pf9l5LDWLcu9wkjU8 bdcxcx -e "SHOW TABLES LIKE 'vocabulary_quiz%';"
```

#### 执行复杂查询
```bash
# 示例：查询学生学习记录
# 第一步：查找学生ID
mysql -h rm-2zel9bu41o5s0v0j8.mysql.rds.aliyuncs.com -u PRO_RDS_bdcxcx_RO -pf9l5LDWLcu9wkjU8 bdcxcx -e "SELECT id FROM students WHERE student_no = '10002';"

# 第二步：用实际的 studentId 替换下面的 'STUDENT_ID_HERE'
mysql -h rm-2zel9bu41o5s0v0j8.mysql.rds.aliyuncs.com -u PRO_RDS_bdcxcx_RO -pf9l5LDWLcu9wkjU8 bdcxcx -e "
SELECT id, taskDate, totalWords, correctCount, wrongCount, accuracy 
FROM study_records 
WHERE studentId = 'STUDENT_ID_HERE' 
ORDER BY createdAt DESC 
LIMIT 10;
"
```

> **注意**: 
> - 只读账号 (`PRO_RDS_bdcxcx_RO`) 仅用于查询，不能修改数据
> - 数据修改需使用读写账号 (`PRO_RDS_bdcxcx_RW`) 或联系 DBA
> - **必须使用主库地址** (`rm-2zel9bu41o5s0v0j8`)，从库可能有数据延迟

### 11.5 部署记录

| 日期 | Commit | 变更内容 | 影响范围 | 回滚 Commit |
|------|--------|----------|---------|-------------|
| 2026-02-13 | `c780904` | **管理后台**: 修复学习类型"未知"显示(正则bug+兼容unknown/all模式)、删除重复任务日期列、修复page.tsx语法错误；**后端**: 修复session ID解析随机后缀覆盖mode标签bug | learning-sessions API、study-sessions API、learning-data页面 | `b51ae4e` |
| 2026-02-13 | 小程序发版 | **小程序**: 补卡时调用createSession生成带day标签的记录(移除`!day`条件)、隐藏用时00:00显示 | study.js、index.js | 回滚需发布旧版小程序 |
| 2026-02-13 | 数据修复 | 批量修复14条旧补卡记录ID(添加`_mnew_d{N}`标签)，使已完成补卡正确显示星星 | study_records表 | 需手动还原ID |
| 2026-02-11 | `b51ae4e` | 修复复习完成状态检测：completedWords校正、study-days查询放宽、当前天完成检查、前端传mode参数 | study-days API、completeSession API、小程序sync.js/study.js | `690005d` |
| 2026-02-10 | `690005d` | LISTENING过滤移入SQL + 错题limit改为300 | daily-tasks API、wrong-questions API | `603dd2c` |
| 2026-02-10 | `603dd2c` | 修复错题本排序bug | wrong-questions API | - |

#### 快速回滚指令

```bash
# 回滚 2026-02-13 后端变更（回到 b51ae4e）
cd /home/dontovertime/apps/1word/web-admin
git checkout b51ae4e -- app/api/statistics/learning-sessions/route.ts app/api/study-sessions/route.ts app/admin/learning-data/page.tsx
npm run build
pm2 restart word-app
```

> **注意**: 小程序已发版(2026-02-13)，包含 study.js 和 index.js 修改。后端回滚不影响小程序正常使用，但旧的管理后台类型显示bug会恢复。

### 11.6 变更历史

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| 2026-02-13 | v1.4 | 新增补卡星星修复、管理后台类型修复、session ID解析bug修复、小程序发版记录 |
| 2026-02-11 | v1.3 | 新增 11.5 部署记录表（含 v1.2 修复复习完成状态检测） |
| 2026-02-11 | v1.2 | 新增 5.4 版本部署记录表，含 commit hash 和快速回滚指令 |
| 2026-02-07 | v1.1 | 新增 1.6 节「迭代开发关键约束」，明确 AI 禁止修改表结构和直连生产 |
| 2026-02-06 | v1.0 | 明确生产环境架构：不使用 Docker，使用 PM2 + 阿里云 RDS |
| 2026-02-01 | v1.7 | 回滚读写分离配置（从库连接不可用） |
| 2026-02-01 | v1.6 | 新增读写分离配置，支持主从数据库 |
| 2026-02-01 | v1.5 | 更新生产环境小程序AppID为 wx9e311c91d453f624 |
| 2026-01-30 | v1.3 | 新增本地开发工作流、数据迁移流程、图片API说明 |
| 2026-01-22 | v1.2 | 完善域名配置和SSL说明 |
| 2026-01-20 | v1.1 | 添加首次部署流程 |
| 2026-01-15 | v1.0 | 初始版本 |

---

**文档版本**: v1.4
**最后更新**: 2026-02-13
**维护者**: 王鹏
