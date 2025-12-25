# 阿里云部署指南

## 服务器信息

- **IP**: 47.92.96.143
- **系统**: CentOS 7
- **配置**: 2核2G
- **应用目录**: /root/word-app
- **访问地址**: http://47.92.96.143:3000

---

## 快速更新部署

代码更新到 GitHub 后，执行以下命令：

```bash
# 1. 拉取最新代码
ssh root@47.92.96.143 "cd /root/word-app && git pull origin main"

# 2. 安装依赖（如有新增）
ssh root@47.92.96.143 "cd /root/word-app/web-admin && npm install --legacy-peer-deps"

# 3. 同步数据库（如有变更）
ssh root@47.92.96.143 "cd /root/word-app/web-admin && npx prisma db push"

# 4. 重新构建
ssh root@47.92.96.143 "cd /root/word-app/web-admin && npm run build"

# 5. 重启应用
ssh root@47.92.96.143 "pkill -f 'next start'; cd /root/word-app/web-admin && nohup npm start > /tmp/app.log 2>&1 &"

# 6. 验证
curl -s -o /dev/null -w "%{http_code}" http://47.92.96.143:3000
```

### 一键更新脚本

```bash
ssh root@47.92.96.143 "cd /root/word-app && git pull origin main && cd web-admin && npm install --legacy-peer-deps && npx prisma db push && npm run build && pkill -f 'next start'; nohup npm start > /tmp/app.log 2>&1 &"
```

---

## 首次部署步骤

### 1. 安装 Node.js 18

```bash
# CentOS 7 需要使用 unofficial build（兼容旧版 glibc）
cd /tmp
curl -L -o node18.tar.xz 'https://registry.npmmirror.com/-/binary/node-unofficial-builds/v18.20.4/node-v18.20.4-linux-x64-glibc-217.tar.xz'
tar -xf node18.tar.xz
mv node-v18.20.4-linux-x64-glibc-217 /usr/local/node
ln -sf /usr/local/node/bin/node /usr/bin/node
ln -sf /usr/local/node/bin/npm /usr/bin/npm
ln -sf /usr/local/node/bin/npx /usr/bin/npx
node -v  # 应显示 v18.20.4
```

### 2. 安装 PostgreSQL 15

```bash
yum install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-7-x86_64/pgdg-redhat-repo-latest.noarch.rpm
yum install -y postgresql15-server
/usr/pgsql-15/bin/postgresql-15-setup initdb
systemctl enable postgresql-15
systemctl start postgresql-15
```

### 3. 创建数据库

```bash
sudo -u postgres psql -c "CREATE USER word_user WITH PASSWORD 'word_pass_2024';"
sudo -u postgres psql -c "CREATE DATABASE word_app OWNER word_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE word_app TO word_user;"
```

### 4. 克隆代码

```bash
cd /root
git clone https://github.com/wangpeng1017/1word.git word-app
```

### 5. 配置环境变量

```bash
cat > /root/word-app/web-admin/.env << 'EOF'
DATABASE_URL=postgresql://word_user:word_pass_2024@localhost:5432/word_app
JWT_SECRET=vocab_jwt_secret_2024_production
NEXT_PUBLIC_API_URL=http://47.92.96.143:3000
NODE_ENV=production
EOF
```

### 6. 安装依赖并构建

```bash
cd /root/word-app/web-admin
npm config set registry https://registry.npmmirror.com
npm install --legacy-peer-deps
npx prisma db push
npm run build
```

### 7. 启动应用

```bash
nohup npm start > /tmp/app.log 2>&1 &
```

---

## 常用运维命令

```bash
# 查看应用状态
ssh root@47.92.96.143 "ps aux | grep next"

# 查看应用日志
ssh root@47.92.96.143 "tail -100 /tmp/app.log"

# 重启应用
ssh root@47.92.96.143 "pkill -f 'next start'; cd /root/word-app/web-admin && nohup npm start > /tmp/app.log 2>&1 &"

# 查看磁盘空间
ssh root@47.92.96.143 "df -h /"

# 查看内存使用
ssh root@47.92.96.143 "free -h"
```

---

## 环境变量说明

| 变量 | 说明 | 必填 |
|------|------|------|
| DATABASE_URL | PostgreSQL 连接字符串 | 是 |
| JWT_SECRET | JWT 签名密钥 | 是 |
| NEXT_PUBLIC_API_URL | API 地址 | 是 |
| NODE_ENV | 环境标识 | 是 |
| CRON_SECRET | 定时任务密钥 | 否 |

---

## 注意事项

1. **不使用 Docker** - 服务器配置较小(2核2G)，直接部署节省资源
2. **构建内存** - Next.js 构建需要较多内存，如遇问题可增加 swap
3. **npm 镜像** - 使用 npmmirror.com 加速依赖下载
4. **Node.js 版本** - 必须使用 18+，CentOS 7 需用 unofficial build
