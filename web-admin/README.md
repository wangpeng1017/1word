# 智能词汇复习助手 - Web管理后台

## 部署到Vercel

### 1. 准备工作

确保已安装依赖：
```bash
npm install
```

### 2. 配置环境变量

在Vercel项目设置中添加以下环境变量：

```
DATABASE_URL=你的PostgreSQL数据库连接字符串
JWT_SECRET=你的JWT密钥（随机字符串）
NEXT_PUBLIC_API_URL=https://你的域名.vercel.app
```

### 3. 数据库设置

#### 使用Vercel Postgres（推荐）

1. 在Vercel项目中添加Postgres存储
2. Vercel会自动设置`DATABASE_URL`环境变量
3. 运行数据库迁移：
```bash
npx prisma generate
npx prisma db push
```

#### 使用Supabase

1. 在 [Supabase](https://supabase.com) 创建项目
2. 获取PostgreSQL连接字符串
3. 在Vercel环境变量中设置`DATABASE_URL`

### 4. 部署

#### 方式1：通过Vercel Dashboard
1. 登录 [Vercel](https://vercel.com)
2. 点击 "Import Project"
3. 选择GitHub仓库
4. 设置Root Directory为 `web-admin`
5. 添加环境变量
6. 点击Deploy

#### 方式2：通过Vercel CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

### 5. 初始化数据库

部署成功后，在Vercel项目设置中运行：
```bash
npx prisma db push
```

### 6. 创建管理员账号

使用API测试工具（如Postman）调用注册接口：

```
POST https://你的域名.vercel.app/api/auth/register
Content-Type: application/json

{
  "email": "teacher@example.com",
  "password": "your-password",
  "name": "张老师",
  "role": "TEACHER"
}
```

## 本地开发

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑.env文件，填入数据库连接信息

# 生成Prisma客户端
npx prisma generate

# 推送数据库Schema
npx prisma db push

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

## 📚 文档索引

### 核心功能文档

- [**题目管理功能文档**](./docs/testword.md) - 题目系统完整文档，包含4种题型设计、API接口、数据模型、批量导入等
- [**测试数据创建报告**](./测试数据创建完成-testword版.md) - 基于testword.md的200个题目初始化说明

### Vercel Blob集成文档

- [**Vercel Blob集成总览**](./docs/VERCEL_BLOB_INTEGRATION_SUMMARY.md) - Vercel Blob存储集成完整方案
- [**Vercel Blob设置指南**](./docs/VERCEL_BLOB_SETUP.md) - 详细配置步骤
- [**音频上传指南**](./docs/AUDIO_UPLOAD_TO_BLOB.md) - 音频文件上传到Blob的实现
- [**上传功能指南**](./docs/UPLOAD_GUIDE.md) - 通用文件上传功能说明
- [**上传测试清单**](./docs/UPLOAD_TEST_CHECKLIST.md) - 上传功能测试检查项

### 数据初始化脚本

```bash
# 基于testword.md初始化数据（50词汇+200题目）
node scripts/init-from-testword.js

# 验证数据完整性
node scripts/verify-current-data.js

# 检查题目详情
node scripts/check-questions.js
```

## API文档

详见主项目README.md
