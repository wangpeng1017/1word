# 新东方服务器部署方案（完整版）

> **项目**: 英语词汇学习助手 (iEnglish)
> **版本**: v1.0
> **更新日期**: 2026-01-21
> **状态**: 应用已部署，待域名配置

---

## 📋 目录

- [一、环境信息](#一环境信息)
- [二、首次部署流程](#二首次部署流程)
- [三、域名与 SSL 配置](#三域名与-ssl-配置)
- [四、更新部署流程](#四更新部署流程)
- [五、运维管理](#五运维管理)
- [六、故障排查](#六故障排查)

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

| 项目 | 值 |
|------|-----|
| **类型** | MySQL (阿里云 RDS) |
| **主库地址** | rm-2zel9bu41o5s0v0j8.mysql.rds.aliyuncs.com:3306 |
| **从库地址** | rr-2zenk118a3dkqgu1f.mysql.rds.aliyuncs.com:3306 |
| **数据库名** | bdcxcx |
| **读写账号** | PRO_RDS_bdcxcx_RW / 4n8anApuMflp3cRr |
| **只读账号** | PRO_RDS_bdcxcx_RO / f9l5LDWLcu9wkjU8 |

### 1.4 域名配置

| 项目 | 值 | 状态 |
|------|-----|------|
| **目标域名** | ienglish.xdf.cn | ⏳ 待配置 |
| **当前解析** | 120.222.144.189 | ❌ 未指向本服务器 |
| **需要解析到** | 47.94.235.91 或通过网关转发 | - |

---

## 二、首次部署流程

### 2.1 安装 Node.js（无 sudo 权限）

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

### 2.2 克隆代码

```bash
# 1. 创建应用目录
mkdir -p ~/apps && cd ~/apps

# 2. 克隆代码
git clone https://github.com/wangpeng1017/1word.git

# 3. 进入项目目录
cd 1word/web-admin
```

### 2.3 配置环境变量

```bash
# 创建 .env 文件（使用 echo 方式避免 heredoc 问题）
echo 'DATABASE_URL="mysql://PRO_RDS_bdcxcx_RW:4n8anApuMflp3cRr@rm-2zel9bu41o5s0v0j8.mysql.rds.aliyuncs.com:3306/bdcxcx"' > .env
echo 'JWT_SECRET="xdf_vocab_jwt_secret_2024_production_secure_key"' >> .env
echo 'NEXT_PUBLIC_API_URL="https://ienglish.xdf.cn"' >> .env
echo 'NODE_ENV="production"' >> .env

# 验证
cat .env
```

### 2.4 安装依赖并构建

```bash
# 1. 设置 npm 镜像
npm config set registry https://registry.npmmirror.com

# 2. 安装依赖
npm install --legacy-peer-deps

# 3. 生成 Prisma Client
npx prisma generate

# 4. 同步数据库表结构
npx prisma db push

# 5. 构建应用
npm run build
```

### 2.5 安装 PM2 并启动应用

```bash
# 1. 全局安装 PM2
npm install -g pm2

# 2. 启动应用
pm2 start npm --name "word-app" -- start

# 3. 保存 PM2 配置
pm2 save

# 4. 查看状态
pm2 status

# 5. 验证应用运行
curl -I http://127.0.0.1:3000
```

**预期结果**: 返回 `HTTP/1.1 200 OK`

---

## 三、域名与 SSL 配置

### 3.1 配置 Nginx 反向代理（需 root 权限）

```bash
# 1. 切换到 root
su - root

# 2. 安装 Nginx
apt update && apt install nginx -y

# 3. 创建配置文件（使用 echo 避免 heredoc 问题）
echo 'server {
    listen 80;
    server_name ienglish.xdf.cn;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}' > /etc/nginx/sites-available/ienglish.xdf.cn

# 4. 启用配置
ln -s /etc/nginx/sites-available/ienglish.xdf.cn /etc/nginx/sites-enabled/

# 5. 测试并重启
nginx -t && systemctl reload nginx

# 6. 验证 Nginx 状态
systemctl status nginx
```

### 3.2 域名解析配置（需联系 IT）

#### 当前状态

```bash
# 检查域名解析
nslookup ienglish.xdf.cn

# 当前结果：
# Address: 120.222.144.189  ← 未指向本服务器
```

#### 配置方案

**方案 A：通过公司网关（推荐）**

如果 `120.222.144.189` 是公司统一网关，需要 IT 在网关配置：

```
转发规则：
ienglish.xdf.cn → 内网 172.20.234.44:80
```

**方案 B：直接修改 DNS**

如果没有统一网关，需要 IT 修改 DNS A 记录：

```
域名：ienglish.xdf.cn
记录类型：A
记录值：47.94.235.91  ← 服务器公网 IP
```

#### 验证域名生效

```bash
# 方法 1：nslookup
nslookup ienglish.xdf.cn

# 方法 2：curl 测试
curl -I http://ienglish.xdf.cn

# 预期结果：返回 200 OK
```

### 3.3 配置 SSL 证书（域名生效后）

#### 方式一：使用 Let's Encrypt 免费证书

```bash
# 1. 安装 certbot
apt install certbot python3-certbot-nginx -y

# 2. 自动申请并配置 SSL
certbot --nginx -d ienglish.xdf.cn

# 3. 设置自动续期
systemctl enable certbot.timer
systemctl start certbot.timer

# 4. 验证
curl -I https://ienglish.xdf.cn
```

#### 方式二：使用公司统一证书

如果公司有 `*.xdf.cn` 泛域名证书，联系 IT 获取证书文件后：

```bash
# 1. 创建证书目录
mkdir -p /etc/nginx/ssl

# 2. 上传证书文件
# ienglish.xdf.cn.pem  ← 证书文件
# ienglish.xdf.cn.key  ← 私钥文件

# 3. 修改 Nginx 配置
cat > /etc/nginx/sites-available/ienglish.xdf.cn << 'EOF'
# HTTP -> HTTPS 重定向
server {
    listen 80;
    server_name ienglish.xdf.cn;
    return 301 https://$server_name$request_uri;
}

# HTTPS 主配置
server {
    listen 443 ssl http2;
    server_name ienglish.xdf.cn;

    ssl_certificate     /etc/nginx/ssl/ienglish.xdf.cn.pem;
    ssl_certificate_key /etc/nginx/ssl/ienglish.xdf.cn.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 4. 重新加载 Nginx
nginx -t && systemctl reload nginx
```

---

## 四、更新部署流程

### 4.1 代码更新（普通用户）

```bash
# 1. 进入项目目录
cd ~/apps/1word/web-admin

# 2. 拉取最新代码
git pull origin main

# 3. 安装新依赖（如有）
npm install --legacy-peer-deps

# 4. 同步数据库（如有 schema 变更）
npx prisma generate
npx prisma db push

# 5. 重新构建
npm run build

# 6. 重启应用
pm2 restart word-app

# 7. 查看日志确认启动成功
pm2 logs word-app --lines 50
```

### 4.2 一键更新脚本

创建更新脚本 `~/update-app.sh`：

```bash
#!/bin/bash
set -e

APP_DIR="$HOME/apps/1word/web-admin"

echo "========== 开始更新 =========="
cd "$APP_DIR"

echo "[1/5] 拉取最新代码..."
git pull origin main

echo "[2/5] 安装依赖..."
npm install --legacy-peer-deps

echo "[3/5] 同步数据库..."
npx prisma generate
npx prisma db push --accept-data-loss

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

---

## 五、运维管理

### 5.1 PM2 常用命令

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

### 5.2 Nginx 管理（需 root）

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

### 5.3 数据库管理

```bash
# 查看数据库连接
cd ~/apps/1word/web-admin
npx prisma studio  # 启动可视化管理界面（端口 5555）

# 执行数据库迁移
npx prisma migrate dev

# 重置数据库（危险！）
npx prisma migrate reset
```

### 5.4 日志位置

| 日志类型 | 路径 |
|----------|------|
| PM2 应用日志 | ~/.pm2/logs/word-app-out.log |
| PM2 错误日志 | ~/.pm2/logs/word-app-error.log |
| Nginx 访问日志 | /var/log/nginx/access.log |
| Nginx 错误日志 | /var/log/nginx/error.log |

---

## 六、故障排查

### 6.1 应用无法启动

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

# 4. 手动启动测试
npm start

# 5. 检查 Node.js 版本
node -v  # 应为 v18.x
```

**常见原因**:
- 端口 3000 被占用
- 环境变量配置错误
- 数据库连接失败
- 构建文件缺失（需重新 `npm run build`）

---

### 6.2 502 Bad Gateway

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
- 如果应用未运行: `pm2 restart word-app`
- 如果 Nginx 配置错误: 修复后 `systemctl reload nginx`

---

### 6.3 数据库连接失败

**症状**: 日志显示 `Can't reach database server` 或 `ECONNREFUSED`

**排查步骤**:

```bash
# 1. 检查数据库地址是否正确
cat ~/apps/1word/web-admin/.env | grep DATABASE_URL

# 2. 测试数据库连接
cd ~/apps/1word/web-admin
npx prisma db pull  # 尝试拉取 schema

# 3. 检查 RDS 白名单
# 需要确认 RDS 白名单包含服务器 IP: 47.94.235.91
```

**解决方案**:
- 联系 DBA 将服务器 IP 加入 RDS 白名单
- 检查数据库账号密码是否正确

---

### 6.4 域名无法访问

**症状**: 浏览器无法打开 `http://ienglish.xdf.cn`

**排查步骤**:

```bash
# 1. 检查域名解析
nslookup ienglish.xdf.cn

# 2. 检查 Nginx 是否监听 80 端口
netstat -tlnp | grep :80

# 3. 检查防火墙
ufw status  # 如果启用，需开放 80/443 端口

# 4. 本地测试
curl -I http://127.0.0.1
```

**解决方案**:
- 域名未解析: 联系 IT 配置 DNS
- 防火墙阻止: `ufw allow 80/tcp && ufw allow 443/tcp`
- Nginx 未启动: `systemctl start nginx`

---

### 6.5 SSL 证书错误

**症状**: HTTPS 访问提示证书无效

**排查步骤**:

```bash
# 1. 检查证书有效期
openssl x509 -in /etc/nginx/ssl/ienglish.xdf.cn.pem -noout -dates

# 2. 检查证书域名
openssl x509 -in /etc/nginx/ssl/ienglish.xdf.cn.pem -noout -subject

# 3. 测试 SSL 配置
nginx -t
```

**解决方案**:
- 证书过期: 重新申请或续期
- 域名不匹配: 使用正确的证书
- Let's Encrypt 自动续期失败: `certbot renew --dry-run`

---

## 七、性能优化建议

### 7.1 Nginx 缓存配置

```nginx
# 在 /etc/nginx/sites-available/ienglish.xdf.cn 中添加

# 静态资源缓存
location /_next/static {
    proxy_pass http://127.0.0.1:3000;
    add_header Cache-Control "public, max-age=31536000, immutable";
}

location /public {
    proxy_pass http://127.0.0.1:3000;
    add_header Cache-Control "public, max-age=86400";
}

# Gzip 压缩
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
gzip_min_length 1000;
```

### 7.2 PM2 集群模式

```bash
# 停止当前应用
pm2 delete word-app

# 以集群模式启动（利用多核 CPU）
pm2 start npm --name "word-app" -i max -- start

# 保存配置
pm2 save
```

### 7.3 数据库连接池优化

在 `prisma/schema.prisma` 中：

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")

  // 连接池配置
  relationMode = "prisma"
  pool_timeout = 20
  connection_limit = 10
}
```

---

## 八、安全加固建议

### 8.1 修改 SSH 端口（可选）

```bash
# 编辑 SSH 配置
sudo nano /etc/ssh/sshd_config

# 修改端口（如改为 2222）
Port 2222

# 重启 SSH
sudo systemctl restart sshd
```

### 8.2 配置防火墙

```bash
# 启用 UFW
sudo ufw enable

# 允许必要端口
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# 查看状态
sudo ufw status
```

### 8.3 定期备份

创建备份脚本 `~/backup.sh`：

```bash
#!/bin/bash
BACKUP_DIR="$HOME/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# 备份代码
tar -czf "$BACKUP_DIR/code_$DATE.tar.gz" ~/apps/1word

# 备份数据库（导出 schema）
cd ~/apps/1word/web-admin
npx prisma db pull > "$BACKUP_DIR/schema_$DATE.prisma"

# 删除 7 天前的备份
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete

echo "备份完成: $BACKUP_DIR"
```

设置定时任务：

```bash
# 编辑 crontab
crontab -e

# 添加每天凌晨 2 点备份
0 2 * * * /home/dontovertime/backup.sh
```

---

## 九、联系方式

| 角色 | 负责内容 | 联系方式 |
|------|----------|----------|
| 应用负责人 | 代码开发、应用部署 | 王鹏 |
| IT 部门 | 域名解析、SSL 证书 | （待填写） |
| DBA | 数据库管理、白名单 | （待填写） |

---

## 十、附录

### 10.1 环境变量说明

| 变量名 | 说明 | 必填 | 示例 |
|--------|------|------|------|
| DATABASE_URL | MySQL 连接字符串 | 是 | mysql://user:pass@host:3306/db |
| JWT_SECRET | JWT 签名密钥 | 是 | 随机字符串（建议 32 位以上） |
| NEXT_PUBLIC_API_URL | API 地址（前端使用） | 是 | https://ienglish.xdf.cn |
| NODE_ENV | 环境标识 | 是 | production |

### 10.2 端口使用

| 端口 | 用途 | 访问方式 |
|------|------|----------|
| 3000 | Next.js 应用 | 内网访问 |
| 80 | Nginx HTTP | 公网访问 |
| 443 | Nginx HTTPS | 公网访问 |
| 5555 | Prisma Studio | 本地访问（按需启动） |

### 10.3 关键文件路径

| 文件 | 路径 |
|------|------|
| 应用代码 | ~/apps/1word/web-admin |
| 环境变量 | ~/apps/1word/web-admin/.env |
| Nginx 配置 | /etc/nginx/sites-available/ienglish.xdf.cn |
| PM2 配置 | ~/.pm2/dump.pm2 |
| Node.js 二进制 | ~/node-v18.20.4-linux-x64/bin |

---

**文档版本**: v1.0
**最后更新**: 2026-01-21
**维护者**: 王鹏
