# 新东方服务器部署方案（完整版）

> **项目**: 英语词汇学习助手 (iEnglish)
> **版本**: v1.4
> **更新日期**: 2026-01-31
> **状态**: ✅ 生产运行中，图片API已部署

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
| 静态文件访问 | 通过 `/api/images/*` 提供访问 | Nginx只代理`/api/*`，避免配置复杂化 |
| 数据迁移 | **通过 Git 仓库中转** | **阿里云↔新东方网络不互通，无法直接传输** |
| 数据库同步 | DBA手动执行SQL | 无外部数据库访问权限 |
| 测试环境数据库 | MySQL (非 PostgreSQL) | 与生产环境保持一致，减少迁移问题 |

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
git commit -m "feat: 导出 SQL 迁移数据"
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


# 6. 重新构建
npm run build


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

小程序代码位于 `wechat-miniapp/` 目录，API 地址通过 `config/env.js` 配置：

```javascript
// wechat-miniapp/config/env.js
const ENV = 'xdf'  // 当前使用新东方环境

config = {
  xdf: {
    apiUrl: 'https://ienglish.xdf.cn/api',
    debug: false,
    name: '新东方生产环境'
  }
}
```

### 9.2 图片URL处理

小程序会自动将API返回的图片路径转换为完整URL：

```javascript
// 小程序代码逻辑
if (vocabulary.imageUrl && vocabulary.imageUrl.startsWith('/')) {
  const baseUrl = (app.globalData.apiUrl || '').replace(/\/api$/, '')
  vocabulary.imageUrl = baseUrl + vocabulary.imageUrl
}

// 结果：
// API返回: /api/images/words/wedding.webp
// 转换后: https://ienglish.xdf.cn/api/images/words/wedding.webp
```

### 9.3 微信公众平台配置

| 类型 | 域名 |
|------|------|
| request 合法域名 | https://ienglish.xdf.cn |

### 9.4 小程序信息

| 项目 | 值 |
|------|-----|
| **AppID** | wx132f0943597b61b7 |
| **项目名** | vocab-assistant |
| **代码目录** | wechat-miniapp/ |

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
| 环境变量 | ~/apps/1word/web-admin/.env |
| 图片文件 | ~/apps/1word/web-admin/public/images/ |
| Nginx 配置 | /etc/nginx/sites-available/ienglish.xdf.cn |
| PM2 配置 | ~/.pm2/dump.pm2 |
| Node.js 二进制 | ~/node-v18.20.4-linux-x64/bin |

### 11.4 变更历史

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| 2026-01-30 | v1.3 | 新增本地开发工作流、数据迁移流程、图片API说明 | 新增本地开发工作流、数据迁移流程、图片API说明 |
| 2026-01-22 | v1.2 | 完善域名配置和SSL说明 |
| 2026-01-20 | v1.1 | 添加首次部署流程 |
| 2026-01-15 | v1.0 | 初始版本 |

---

**文档版本**: v1.4
**最后更新**: 2026-01-31
**维护者**: 王鹏
