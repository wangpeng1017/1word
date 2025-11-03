# 获取 DATABASE_URL 并初始化数据库

## 问题原因
本地缺少 `DATABASE_URL` 环境变量，需要从Vercel获取。

## 解决步骤

### 步骤1：从Vercel Dashboard获取DATABASE_URL

1. 访问：https://vercel.com/wangpeng10170414-1653s-projects/11word/settings/environment-variables

2. 找到 `DATABASE_URL` 变量

3. 点击右侧的 "..." → "Copy Value" 复制值

### 步骤2：创建本地环境变量文件

在 `web-admin` 目录下创建 `.env.local` 文件：

```bash
cd /e/trae/1单词/web-admin
touch .env.local
```

然后用编辑器打开 `.env.local`，添加：

```env
DATABASE_URL="你从Vercel复制的数据库连接字符串"
JWT_SECRET="vocab_jwt_secret_2024"
```

**注意**：DATABASE_URL 格式类似：
```
postgresql://username:password@host:5432/database?sslmode=require
```

### 步骤3：运行数据库初始化

```bash
cd /e/trae/1单词/web-admin

# 推送数据库结构
npm run db:push

# 初始化数据
npm run db:init
```

---

## 🚀 快捷方法：使用Vercel CLI自动拉取

如果上面的方法太麻烦，使用Vercel CLI自动拉取所有环境变量：

```bash
cd /e/trae/1单词

# 确保已登录
vercel login

# 链接项目（选择正确的项目）
vercel link

# 自动拉取环境变量到 .env.local
vercel env pull web-admin/.env.local

# 进入web-admin目录
cd web-admin

# 运行初始化
npm run db:push
npm run db:init
```

---

## ✅ 成功标志

运行 `npm run db:init` 后，应该看到：

```
开始初始化数据库...
✅ 系统配置创建成功
✅ 管理员账号创建成功
   邮箱: admin@vocab.com
   密码: admin123456
✅ 数据库初始化完成！
```

---

## 🎯 初始化完成后

1. 访问：https://11word.vercel.app/login
2. 使用管理员账号登录：
   - 邮箱：`admin@vocab.com`
   - 密码：`admin123456`
3. 查看后台：https://11word.vercel.app/dashboard

---

## ⚠️ 如果还是报错

### 检查DATABASE_URL格式

确保DATABASE_URL包含：
- 协议：`postgresql://`
- 用户名和密码
- 主机地址
- 端口：`:5432`
- 数据库名
- SSL模式：`?sslmode=require`

### 测试数据库连接

```bash
cd web-admin
npx prisma db pull
```

如果成功，说明数据库连接正常。

---

## 📞 需要帮助？

如果遇到问题，请提供：
1. 错误信息截图
2. DATABASE_URL 格式（隐藏密码）
3. Vercel项目的Storage标签截图
