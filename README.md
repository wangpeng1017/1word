# 智能词汇复习助手 (1word)

基于艾宾浩斯遗忘曲线的智能词汇学习系统，包含微信小程序（学生端）和Web管理后台（教师端）。

> **当前部署**: 阿里云 ECS (http://8.130.182.148:3000)
> **数据库**: PostgreSQL (阿里云主机部署)
> **状态**: 生产环境运行中

## 项目结构

```
1word/
├── web-admin/              # Web管理后台 (Next.js 15)
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
├── docs/                  # 项目文档
│   ├── PRD.md             # 产品需求文档
│   ├── 部署指南.md        # 部署说明
│   └── web-admin说明.md   # 管理后台说明
└── README.md              # 本文件
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
DATABASE_URL="postgresql://word_user:password@localhost:5432/word_app"
JWT_SECRET="your-jwt-secret"
NEXT_PUBLIC_API_URL="http://localhost:3000"
NODE_ENV="development"
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
- ✅ 智能复习计划
- ✅ 学习数据记录
- 🚧 数据导出（Excel/PDF/Word）
- 🚧 统计报表

### 微信小程序
- ✅ 用户登录
- ✅ 首页（学习统计、今日任务）
- ✅ 答题功能（4种题型）
- ✅ 错题本
- ✅ 学习记录
- ✅ 成就系统
- ✅ 音效动画
- 🚧 离线模式

## 数据库设计

主要数据表（共31张）：
- `users` - 用户表
- `teachers` - 教师信息
- `students` - 学生信息
- `classes` - 班级
- `vocabularies` - 词汇
- `word_meanings` - 词汇释义
- `word_audios` - 词汇音频
- `word_images` - 词汇图片
- `questions` - 题目
- `question_options` - 题目选项
- `question_answers` - 答题记录
- `study_plans` - 学习计划
- `daily_tasks` - 每日任务
- `study_records` - 学习记录
- `wrong_questions` - 错题记录
- `word_masteries` - 单词掌握度
- `vocabulary_packs` - 词汇包
- `achievements` - 成就系统
- ...等

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

### 题目
- `GET /api/questions` - 获取题目列表
- `POST /api/questions` - 创建题目
- `GET /api/questions/[id]` - 获取题目详情
- `PUT /api/questions/[id]` - 更新题目
- `DELETE /api/questions/[id]` - 删除题目

### 学生管理
- `GET /api/students` - 获取学生列表
- `POST /api/students` - 创建学生
- `POST /api/students/import` - 批量导入学生

### 班级管理
- `GET /api/classes` - 获取班级列表
- `POST /api/classes` - 创建班级

## 部署

### 生产环境（阿里云）

**服务器信息**:
- 地址: 8.130.182.148
- Web服务端口: 3000
- 数据库: PostgreSQL (主机直接部署)
- 进程管理: PM2

**部署流程**:
```bash
# 1. 拉取代码
git pull origin main

# 2. 安装依赖
cd web-admin && npm install

# 3. 构建项目
npm run build

# 4. 重启服务
pm2 restart word-app

# 5. 查看日志
pm2 logs word-app
```

**定时任务配置**:
```bash
# 使用 crontab 配置定时任务
crontab -e

# 示例：每天凌晨0点重置学生积分
0 0 * * * curl -X POST http://localhost:3000/api/cron/reset-points -H "Authorization: Bearer \\$CRON_SECRET"

# 示例：每周日凌晨3点归档数据
0 3 * * 0 curl -X POST http://localhost:3000/api/cron/data-archive -H "Authorization: Bearer \\$CRON_SECRET"
```

## 开发进度

### 已完成功能 ✅
- [x] 项目初始化
- [x] 数据库设计（31张表）
- [x] 认证系统
- [x] 词库管理API
- [x] 题目管理API
- [x] 学生管理API
- [x] 班级管理API
- [x] 智能复习计划
- [x] 微信小程序基础结构
- [x] 登录页面
- [x] 首页
- [x] 答题页面（4种题型）
- [x] 错题本页面
- [x] 学习记录
- [x] 成就系统
- [x] 音效动画

### 进行中功能 🚧
- [ ] 数据统计与导出
- [ ] UI/UX优化

### 待开发功能 ⚪
- [ ] 离线模式
- [ ] 导出模板自定义

## 文档

### 核心文档
- [PRD.md](docs/PRD.md) - 产品需求文档（单一真相来源）
- [XDF_部署方案_完整版.md](docs/XDF_部署方案_完整版.md) - **新东方服务器完整部署方案**
- [web-admin说明.md](docs/web-admin说明.md) - 管理后台架构说明

### 更多文档
查看 [docs/_INDEX.md](docs/_INDEX.md) 获取完整文档索引

## 许可证

MIT License
