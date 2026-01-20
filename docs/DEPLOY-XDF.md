# 新东方客户部署指南

## 部署信息汇总

| 项目 | 值 |
|-----|-----|
| 域名 | `ienglish.xdf.cn` |
| MySQL 主库 | `rm-2ze2n9xofwd6lu1oz.mysql.rds.aliyuncs.com:3306` |
| MySQL 从库 | `rr-2zeq2q9s94k4858jn.mysql.rds.aliyuncs.com:3306` |
| 数据库名 | `zytbydt` |
| 读写账号 | `PRO_RDS_zytbydt_RW` / `YpgtW4A9lAvdTRbs` |
| 只读账号 | `PRO_RDS_zytbydt_RO` / `OQGqTrJtyFlYRHcX` |
| 堡垒机 | `172.20.234.44` (Web Terminal) |

---

## 📋 部署前准备

### 1. 确认服务器信息

通过堡垒机连接到内网服务器后，需要向客户确认：
- **应用服务器 IP**：部署 Next.js 应用的服务器地址
- **服务器端口**：应用监听端口（默认 3000）
- **Node.js 版本**：需要 Node.js 18+

### 2. 确认网络连通性

在应用服务器上测试 MySQL 连接：
```bash
# 测试主库连接
mysql -h rm-2ze2n9xofwd6lu1oz.mysql.rds.aliyuncs.com -P 3306 -u PRO_RDS_zytbydt_RW -p'YpgtW4A9lAvdTRbs' -e "SELECT 1"

# 测试从库连接
mysql -h rr-2zeq2q9s94k4858jn.mysql.rds.aliyuncs.com -P 3306 -u PRO_RDS_zytbydt_RO -p'OQGqTrJtyFlYRHcX' -e "SELECT 1"
```

---

## 🚀 堡垒机网页终端执行步骤

### Step 1: 连接到应用服务器

通过堡垒机 Web Terminal 连接到部署应用的内网服务器。

### Step 2: 检查 Node.js 环境

```bash
# 检查 Node.js 版本（需要 18+）
node -v

# 如果没有 Node.js，安装它
# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 检查 npm
npm -v

# 安装 PM2（进程管理器）
npm install -g pm2
```

### Step 3: 创建项目目录并上传代码

```bash
# 创建项目目录
mkdir -p /opt/word-app
cd /opt/word-app

# 方式1：如果可以访问 Git
git clone <你的代码仓库地址> .

# 方式2：如果不能访问外网，需要手动上传代码包
# 在本地打包：tar -czvf word-app.tar.gz web-admin/
# 通过堡垒机 SFTP 上传
# 然后解压：tar -xzvf word-app.tar.gz
```

### Step 4: 配置环境变量

```bash
cd /opt/word-app/web-admin

# 创建 .env 文件
cat > .env << 'EOF'
# MySQL 主库连接（读写）
DATABASE_URL="mysql://PRO_RDS_zytbydt_RW:YpgtW4A9lAvdTRbs@rm-2ze2n9xofwd6lu1oz.mysql.rds.aliyuncs.com:3306/zytbydt"

# JWT 密钥（生产环境请修改为更复杂的密钥）
JWT_SECRET="xdf_vocab_jwt_secret_2024_production_secure_key"

# API 地址（小程序使用此地址）
NEXT_PUBLIC_API_URL="https://ienglish.xdf.cn"

# Node 环境
NODE_ENV="production"
EOF
```

### Step 5: 安装依赖并构建

```bash
cd /opt/word-app/web-admin

# 安装依赖
npm install

# 生成 Prisma 客户端
npx prisma generate

# 推送数据库表结构（这会在 MySQL 中创建所有表）
npx prisma db push

# 构建生产版本
npm run build
```

### Step 6: 初始化管理员账号

```bash
# 创建初始化脚本
cat > init-admin.js << 'EOF'
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('admin123', 10)

  const user = await prisma.user.upsert({
    where: { email: 'admin@xdf.cn' },
    update: {},
    create: {
      id: 'admin-001',
      email: 'admin@xdf.cn',
      phone: '13800000000',
      password,
      name: '管理员',
      role: 'ADMIN',
      is_active: true,
      updated_at: new Date()
    }
  })

  console.log('管理员账号创建成功:')
  console.log('  邮箱:', user.email)
  console.log('  密码: admin123')

  await prisma.$disconnect()
}

main()
EOF

# 执行初始化
node init-admin.js
```

### Step 7: 启动应用

```bash
cd /opt/word-app/web-admin

# 使用 PM2 启动
pm2 start npm --name "word-app" -- start

# 查看状态
pm2 status

# 查看日志
pm2 logs word-app

# 设置开机自启
pm2 save
pm2 startup
```

### Step 8: 配置 Nginx 反向代理（如果需要）

```bash
# 安装 Nginx
sudo yum install -y nginx  # CentOS
# sudo apt install -y nginx  # Ubuntu

# 配置 Nginx
sudo cat > /etc/nginx/conf.d/word-app.conf << 'EOF'
server {
    listen 80;
    server_name ienglish.xdf.cn;

    # 重定向到 HTTPS（如果已配置 SSL）
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 📱 微信小程序配置

### 1. 服务器域名配置

在微信公众平台 → 开发管理 → 开发设置 → 服务器域名，添加：

| 类型 | 域名 |
|-----|------|
| request 合法域名 | `https://ienglish.xdf.cn` |
| socket 合法域名 | `wss://ienglish.xdf.cn` (如需要) |
| uploadFile 合法域名 | `https://ienglish.xdf.cn` |
| downloadFile 合法域名 | `https://ienglish.xdf.cn` |

### 2. 小程序代码配置

小程序环境已配置为 `xdf`，API 地址为 `https://ienglish.xdf.cn/api`

文件位置：`wechat-miniapp/config/env.js`

### 3. 小程序发布

1. 使用微信开发者工具打开 `wechat-miniapp` 目录
2. 确认 `config/env.js` 中 `ENV = 'xdf'`
3. 上传代码并提交审核

---

## ⚠️ 常见问题排查

### 1. 数据库连接失败

```bash
# 检查 MySQL 连接
mysql -h rm-2ze2n9xofwd6lu1oz.mysql.rds.aliyuncs.com -P 3306 -u PRO_RDS_zytbydt_RW -p

# 检查 .env 文件
cat /opt/word-app/web-admin/.env

# 检查 Prisma 连接
cd /opt/word-app/web-admin
npx prisma db pull  # 如果能成功，说明连接正常
```

### 2. 应用启动失败

```bash
# 查看 PM2 日志
pm2 logs word-app --lines 100

# 检查端口占用
netstat -tlnp | grep 3000

# 重启应用
pm2 restart word-app
```

### 3. Nginx 502 错误

```bash
# 检查 Next.js 是否运行
pm2 status

# 检查 Nginx 配置
sudo nginx -t

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log
```

### 4. HTTPS 证书配置

如果需要配置 HTTPS，联系客户获取 SSL 证书，然后：

```bash
# 将证书文件放到
# /etc/nginx/ssl/ienglish.xdf.cn.pem
# /etc/nginx/ssl/ienglish.xdf.cn.key

# 修改 Nginx 配置添加 HTTPS
```

---

## 📞 技术支持

如遇问题，请检查：
1. 服务器日志：`pm2 logs word-app`
2. Nginx 日志：`/var/log/nginx/error.log`
3. 数据库连接
4. 防火墙端口（80, 443, 3000）
