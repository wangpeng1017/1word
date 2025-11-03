# 智能词汇复习助手

基于艾宾浩斯遗忘曲线的智能词汇学习系统，包含微信小程序（学生端）和Web管理后台（教师端）。

## 项目结构

```
intelligent-vocab-assistant/
├── web-admin/              # Web管理后台 (Next.js)
│   ├── app/               # Next.js App Router
│   ├── lib/               # 工具函数
│   ├── types/             # TypeScript类型定义
│   ├── prisma/            # 数据库Schema
│   └── package.json
├── wechat-miniapp/        # 微信小程序
│   ├── pages/             # 页面
│   ├── utils/             # 工具函数
│   ├── app.js             # 小程序入口
│   └── project.config.json
└── 产品需求文档.md         # 产品需求文档
```

## 技术栈

### Web管理后台
- **框架**: Next.js 15 (React 18)
- **UI库**: Ant Design 5
- **语言**: TypeScript
- **数据库**: PostgreSQL
- **ORM**: Prisma
- **认证**: JWT
- **样式**: Tailwind CSS

### 微信小程序
- **开发方式**: 原生开发 (WXML + WXSS + JavaScript)
- **特性**: 离线模式、进度保存、数据同步

## 快速开始

### 1. Web管理后台

#### 安装依赖
```bash
cd web-admin
npm install
```

#### 配置环境变量
复制 `.env.example` 到 `.env` 并配置：
```env
DATABASE_URL="postgresql://username:password@localhost:5432/vocab_assistant"
JWT_SECRET="your-secret-key"
```

#### 初始化数据库
```bash
npx prisma generate
npx prisma db push
```

#### 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000

### 2. 微信小程序

#### 配置
1. 在微信开发者工具中导入 `wechat-miniapp` 目录
2. 修改 `app.js` 中的 `apiUrl` 为你的后端地址
3. 修改 `project.config.json` 中的 `appid`

#### 运行
在微信开发者工具中点击"编译"即可

## 核心功能

### Web管理后台
- ✅ 用户认证（教师登录/注册）
- ✅ 词库管理（CRUD、批量导入）
- ✅ 题目管理（4种题型）
- ✅ 学生管理（批量导入、班级分配）
- ✅ 班级管理
- 🚧 学习数据统计
- 🚧 数据导出（Excel/PDF/Word）
- 🚧 智能复习计划配置

### 微信小程序
- ✅ 用户登录
- ✅ 首页（学习统计、今日任务）
- 🚧 答题功能（4种模式）
- 🚧 错题本
- 🚧 学习记录
- 🚧 离线模式
- 🚧 进度保存与恢复

## 数据库设计

主要数据表：
- `users` - 用户表
- `teachers` - 教师信息
- `students` - 学生信息
- `classes` - 班级
- `vocabularies` - 词汇
- `questions` - 题目
- `study_plans` - 学习计划
- `daily_tasks` - 每日任务
- `study_records` - 学习记录
- `wrong_questions` - 错题记录
- `word_masteries` - 单词掌握度

## API接口

### 认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `GET /api/auth/me` - 获取当前用户信息

### 词库
- `GET /api/vocabularies` - 获取词汇列表
- `POST /api/vocabularies` - 创建词汇
- `GET /api/vocabularies/[id]` - 获取词汇详情
- `PUT /api/vocabularies/[id]` - 更新词汇
- `DELETE /api/vocabularies/[id]` - 删除词汇
- `POST /api/vocabularies/[id]/questions` - 添加题目

### 学生管理
- `GET /api/students` - 获取学生列表
- `POST /api/students` - 创建学生
- `POST /api/students/import` - 批量导入学生

### 班级管理
- `GET /api/classes` - 获取班级列表
- `POST /api/classes` - 创建班级

## 开发进度

### 阶段一：MVP（进行中）
- [x] 项目初始化
- [x] 数据库设计
- [x] 认证系统
- [x] 词库管理API
- [x] 学生管理API
- [x] 微信小程序基础结构
- [x] 登录页面
- [x] 首页
- [ ] 答题页面
- [ ] 错题本页面
- [ ] 个人中心页面

### 阶段二：功能完善（待开始）
- [ ] 数据统计与导出
- [ ] 智能复习算法
- [ ] 完整答题模式
- [ ] 进度保存功能

### 阶段三：高级功能（待开始）
- [ ] 离线模式
- [ ] 导出模板自定义
- [ ] UI/UX优化
- [ ] 性能优化

## 部署

### Demo阶段
- **平台**: Vercel
- **数据库**: Vercel Postgres / Supabase

### 生产阶段
- **平台**: 阿里云
- **服务**: ECS + RDS + OSS

## 贡献

欢迎提交Issue和Pull Request！

## 许可证

MIT License
