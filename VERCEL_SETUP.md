# Vercel 部署配置指南

## 📋 配置清单

### 1. 项目设置

访问您的项目：https://vercel.com/wangpeng10170414-1653s-projects/11word

#### Root Directory 设置
1. 进入项目 Settings → General
2. 找到 "Root Directory"
3. 设置为：`web-admin`
4. 点击 Save

### 2. 环境变量配置

进入 Settings → Environment Variables，添加以下变量：

#### 必需的环境变量

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DATABASE_URL` | 自动生成 | Vercel Postgres会自动注入 |
| `JWT_SECRET` | `vocab_jwt_secret_2024_change_in_production` | JWT加密密钥（建议改为随机字符串） |
| `NEXT_PUBLIC_API_URL` | `https://11word.vercel.app` | 你的Vercel域名 |

#### 可选的环境变量

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `ADMIN_EMAIL` | `admin@vocab.com` | 默认管理员邮箱 |
| `ADMIN_PASSWORD` | `admin123456` | 默认管理员密码 |

### 3. 数据库设置

#### 如果已连接Vercel Postgres
✅ `DATABASE_URL` 已自动配置，跳过此步骤

#### 如果未连接数据库
1. 在项目页面点击 "Storage" 标签
2. 点击 "Create Database"
3. 选择 "Postgres"
4. 点击 "Continue"
5. 数据库创建后，`DATABASE_URL` 会自动添加到环境变量

### 4. 部署流程

#### 首次部署
1. 确保所有环境变量已配置
2. 点击 "Deployments" 标签
3. 点击右上角 "Redeploy"
4. 等待部署完成

#### 初始化数据库
部署成功后，需要初始化数据库表结构：

**方式1：使用Vercel CLI（推荐）**
```bash
# 安装Vercel CLI
npm i -g vercel

# 登录
vercel login

# 链接项目
vercel link

# 运行数据库推送
vercel env pull .env.local
cd web-admin
npm run db:push

# 初始化数据（创建默认配置和管理员账号）
npm run db:init
```

**方式2：手动执行**
1. 克隆项目到本地
2. 在Vercel项目设置中下载环境变量
3. 运行：
```bash
cd web-admin
npm install
npx prisma db push
node scripts/init-db.js
```

### 5. 验证部署

#### 检查API是否正常
访问：`https://11word.vercel.app/api/auth/login`

应该返回类似：
```json
{
  "success": false,
  "error": "密码不能为空"
}
```

#### 测试注册接口
使用Postman或curl：
```bash
curl -X POST https://11word.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456",
    "name": "测试教师",
    "role": "TEACHER"
  }'
```

### 6. 创建测试账号

#### 创建教师账号
```bash
curl -X POST https://11word.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@test.com",
    "password": "123456",
    "name": "张老师",
    "role": "TEACHER"
  }'
```

#### 创建学生账号
```bash
curl -X POST https://11word.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "2024001",
    "password": "123456",
    "name": "张三",
    "role": "STUDENT"
  }'
```

### 7. 配置微信小程序

修改 `wechat-miniapp/app.js` 第3行：
```javascript
apiUrl: 'https://11word.vercel.app/api',
```

### 8. 常见问题

#### Q: 部署失败，提示找不到Prisma Client
**A:** 确保 `package.json` 中有 `postinstall` 脚本：
```json
"postinstall": "prisma generate"
```

#### Q: 数据库连接失败
**A:** 
1. 检查 `DATABASE_URL` 环境变量是否正确
2. 确保Vercel Postgres已创建并连接
3. 在Vercel项目中查看 Storage 标签

#### Q: API返回500错误
**A:** 
1. 在Vercel Deployments中查看日志
2. 检查是否运行了 `prisma db push`
3. 确认所有环境变量已设置

#### Q: 如何查看数据库内容
**A:** 
1. 在Vercel项目的 Storage 标签中
2. 点击你的Postgres数据库
3. 点击 "Data" 标签查看表内容
4. 或使用 "Query" 标签执行SQL

### 9. 下一步

- [ ] 配置自定义域名（可选）
- [ ] 设置生产环境的JWT_SECRET
- [ ] 创建初始词库数据
- [ ] 测试所有API接口
- [ ] 配置微信小程序合法域名

## 🔗 相关链接

- Vercel项目：https://vercel.com/wangpeng10170414-1653s-projects/11word
- 生产环境：https://11word.vercel.app
- Vercel文档：https://vercel.com/docs

## 📞 需要帮助？

如果遇到问题，请检查：
1. Vercel部署日志
2. 浏览器控制台
3. 微信开发者工具Console
