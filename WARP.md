# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

智能词汇复习助手：基于艾宾浩斯遗忘曲线的智能词汇学习系统，包含微信小程序（学生端）和Web管理后台（教师端）。

## Repository Structure

- **web-admin/** - Next.js 15 管理后台（教师端）
  - Next.js App Router with TypeScript
  - Ant Design 5 UI 组件库
  - PostgreSQL + Prisma ORM
  - JWT 认证
- **wechat-miniapp/** - 微信小程序（学生端）
  - 原生微信小程序开发
  - 离线模式、进度保存、数据同步

## Development Commands

### Web Admin (web-admin/)

```bash
# Install dependencies
cd web-admin && npm install

# Database operations
npm run db:push              # Push schema to database
npm run db:init              # Initialize database with seed data
npx prisma generate          # Generate Prisma client
npx prisma studio            # Open Prisma Studio GUI

# Development
npm run dev                  # Start dev server (localhost:3000)
npm run build                # Build for production
npm start                    # Start production server

# Linting and Testing
npm run lint                 # Run ESLint
npm run test:e2e             # Run Playwright E2E tests (chromium only)
```

### WeChat MiniApp (wechat-miniapp/)

- 使用微信开发者工具打开 `wechat-miniapp/` 目录
- 在工具中点击"编译"运行
- 测试阶段选择"测试号"或"使用测试号"
- 修改 `app.js` 中的 `apiUrl` 为实际后端地址
- 真机测试：点击"预览"并用微信扫码

## Architecture

### Database Schema (Prisma)

核心数据模型：

- **用户与权限**：User（用户）、Teacher（教师）、Student（学生）、Class（班级）
- **词库系统**：Vocabulary（词汇）、WordAudio（音频）、WordImage（图片）
- **题目系统**：Question（题目，4种题型：英选汉/汉选英/听音选词/选词填空）、QuestionOption（选项）
- **学习计划**：StudyPlan（学习计划）、DailyTask（每日任务）
- **学习数据**：StudyRecord（学习记录）、WrongQuestion（错题记录）、WordMastery（单词掌握度）

### Ebbinghaus Algorithm (lib/ebbinghaus.ts)

艾宾浩斯复习间隔：1天、2天、4天、7天、15天
- `calculateNextReviewDate()` - 计算下次复习时间
- `isMastered()` - 连续3次复习正确率100%视为掌握
- `isDifficult()` - 累计错误≥3次标记为重点难点

### API Routes (app/api/)

- **认证**：`/api/auth/{register,login,me}` - 注册、登录、获取用户信息
- **词库**：`/api/vocabularies` - CRUD操作、题目管理
- **学生**：`/api/students` - 学生管理、批量导入
- **班级**：`/api/classes` - 班级CRUD
- **健康检查**：`/api/health` - 服务状态

认证使用 JWT（lib/auth.ts），请求头需包含 `Authorization: Bearer <token>`

### Frontend Architecture (web-admin/app/)

- Next.js App Router with React Server Components
- `providers.tsx` - Ant Design ConfigProvider wrapper
- `dashboard/` - 教师仪表盘
- `students/` - 学生管理（含批量导入）
- `login/` & `setup/` - 认证与初始设置

### WeChat MiniApp Architecture

- `pages/` - 页面组件（index首页、login登录、study答题、wrong错题本、profile个人中心）
- `utils/` - 工具函数（request.js网络请求、storage.js本地存储、util.js通用工具）
- 全局配置在 `app.js`，需配置 `apiUrl` 指向后端

## Environment Variables

```env
DATABASE_URL="postgresql://username:password@localhost:5432/vocab_assistant"
JWT_SECRET="your-secret-key"
NEXT_PUBLIC_API_URL="http://localhost:3000"  # For production: https://yourdomain.com
```

## Deployment

### Web Admin
- **Demo**: Vercel + Vercel Postgres/Supabase
- **Production**: 阿里云 ECS + RDS + OSS
- Vercel 部署需设置 Root Directory 为 `web-admin`

### WeChat MiniApp
- 正式发布需在微信公众平台配置服务器域名（必须HTTPS）
- AppID 配置在 `project.config.json`

## Development Status

当前阶段：MVP（进行中）
- ✅ 认证系统、词库管理API、学生管理API
- ✅ 微信小程序登录和首页
- 🚧 小程序答题功能、错题本、个人中心
- 🚧 数据统计与导出、智能复习算法优化
