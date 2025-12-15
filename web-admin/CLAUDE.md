# Web 管理后台模块文档

[根目录](../CLAUDE.md) > **web-admin**

## 变更记录 (Changelog)

- **2025-12-15 10:29:09**: 初始化模块文档

---

## 模块职责

Web 管理后台是基于 Next.js 15 的全栈应用，提供：

1. **教师管理端**：词汇管理、学生管理、班级管理、学习数据统计
2. **RESTful API**：为微信小程序提供后端服务
3. **数据导出**：支持 Excel、PDF、Word 格式的学习报告导出
4. **智能算法**：艾宾浩斯遗忘曲线、题型智能分配、成就系统

---

## 入口与启动

### 主入口文件

- **应用入口**: `app/layout.tsx` - 根布局组件
- **首页**: `app/page.tsx` - 重定向到登录或管理后台
- **管理后台**: `app/admin/layout.tsx` - 管理后台布局
- **登录页**: `app/login/page.tsx` - 教师登录页面

### 启动命令

```bash
npm run dev          # 开发模式 (http://localhost:3000)
npm run build        # 生产构建
npm run start        # 生产模式启动
npm run lint         # 代码检查
```

### 环境配置

创建 `.env` 文件：

```env
DATABASE_URL="postgresql://user:password@localhost:5432/vocab_assistant"
JWT_SECRET="your-secret-key-change-in-production"
BLOB_READ_WRITE_TOKEN="vercel-blob-token"  # 可选，用于音频存储
```

---

## 对外接口

### API 路由结构

所有 API 位于 `app/api/` 目录，采用 Next.js App Router 约定。

#### 认证相关 (`/api/auth`)

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息
- `POST /api/auth/change-password` - 修改密码

#### 词汇管理 (`/api/vocabularies`)

- `GET /api/vocabularies` - 获取词汇列表（支持分页、搜索、筛选）
- `POST /api/vocabularies` - 创建词汇
- `GET /api/vocabularies/[id]` - 获取词汇详情
- `PUT /api/vocabularies/[id]` - 更新词汇
- `DELETE /api/vocabularies/[id]` - 删除词汇
- `POST /api/vocabularies/import` - 批量导入词汇（Excel）
- `POST /api/vocabularies/[id]/questions` - 为词汇添加题目
- `POST /api/vocabularies/[id]/audios` - 上传音频
- `POST /api/vocabularies/[id]/files` - 上传图片

#### 题目管理 (`/api/questions`)

- `GET /api/questions` - 获取题目列表
- `POST /api/questions` - 创建题目
- `PUT /api/questions/[id]` - 更新题目
- `DELETE /api/questions/[id]` - 删除题目
- `POST /api/questions/import` - 批量导入题目
- `GET /api/questions/optimized` - 优化查询（带词汇信息）

#### 学生管理 (`/api/students`)

- `GET /api/students` - 获取学生列表
- `POST /api/students` - 创建学生
- `GET /api/students/[id]` - 获取学生详情
- `PUT /api/students/[id]` - 更新学生信息
- `DELETE /api/students/[id]` - 删除学生
- `POST /api/students/import` - 批量导入学生（Excel）
- `GET /api/students/[id]/daily-tasks` - 获取学生每日任务
- `GET /api/students/[id]/wrong-questions` - 获取学生错题

#### 班级管理 (`/api/classes`)

- `GET /api/classes` - 获取班级列表
- `POST /api/classes` - 创建班级
- `GET /api/classes/[id]` - 获取班级详情
- `PUT /api/classes/[id]` - 更新班级
- `DELETE /api/classes/[id]` - 删除班级

#### 学习计划 (`/api/study-plans`, `/api/plan-classes`)

- `GET /api/study-plans` - 获取学习计划列表
- `POST /api/study-plans` - 创建学习计划
- `POST /api/study-plans/generate` - 生成学习计划
- `POST /api/study-plans/add-words` - 添加单词到学习计划
- `GET /api/plan-classes` - 获取班级计划列表
- `POST /api/plan-classes` - 创建班级计划

#### 词汇库模板 (`/api/vocabulary-packs`)

- `GET /api/vocabulary-packs` - 获取词汇库列表
- `POST /api/vocabulary-packs` - 创建词汇库
- `GET /api/vocabulary-packs/[id]` - 获取词汇库详情
- `PUT /api/vocabulary-packs/[id]` - 更新词汇库
- `DELETE /api/vocabulary-packs/[id]` - 删除词汇库
- `GET /api/vocabulary-packs/[id]/days` - 获取每日配置
- `POST /api/vocabulary-packs/[id]/generate-plans` - 为班级生成计划

#### 学习数据 (`/api/study-records`, `/api/daily-tasks`)

- `GET /api/study-records` - 获取学习记录
- `POST /api/study-records` - 创建学习记录
- `GET /api/daily-tasks` - 获取每日任务
- `POST /api/daily-tasks` - 创建每日任务
- `GET /api/daily-tasks/stats` - 获取任务统计

#### 错题与掌握度 (`/api/wrong-questions`, `/api/word-mastery`)

- `GET /api/wrong-questions` - 获取错题列表
- `POST /api/wrong-questions` - 记录错题
- `GET /api/word-mastery` - 获取单词掌握度
- `POST /api/word-mastery` - 更新掌握度

#### 熟练度测试 (`/api/proficiency-tests`, `/api/test-records`)

- `GET /api/proficiency-tests` - 获取测试列表
- `POST /api/proficiency-tests` - 创建测试
- `GET /api/proficiency-tests/[id]` - 获取测试详情
- `POST /api/proficiency-tests/[id]/start` - 开始测试
- `GET /api/test-records` - 获取测试记录
- `POST /api/test-records` - 提交测试结果

#### 积分成就 (`/api/points`, `/api/achievements`)

- `GET /api/points` - 获取学生积分
- `POST /api/points` - 更新积分
- `GET /api/points/history` - 获取积分历史
- `GET /api/achievements` - 获取成就列表
- `POST /api/achievements/unlock` - 解锁成就
- `GET /api/leaderboard` - 获取排行榜

#### 数据统计与导出 (`/api/statistics`, `/api/export`)

- `GET /api/statistics/overview` - 获取总览统计
- `GET /api/statistics/[studentId]` - 获取学生统计
- `GET /api/statistics/rankings` - 获取排名统计
- `POST /api/statistics/[studentId]/export` - 导出学生报告
- `POST /api/statistics/batch-export` - 批量导出报告
- `POST /api/export/student-report` - 导出学生报告（多格式）

#### 系统管理 (`/api/settings`, `/api/cron`)

- `GET /api/settings` - 获取系统配置
- `POST /api/settings` - 更新系统配置
- `POST /api/cron/reset-points` - 定时重置积分
- `POST /api/cron/data-archive` - 定时归档数据

---

## 关键依赖与配置

### 核心依赖

```json
{
  "next": "15.5.7",
  "react": "^18.3.1",
  "antd": "^5.21.0",
  "@prisma/client": "^5.20.0",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "exceljs": "^4.4.0",
  "docx": "^8.5.0",
  "jspdf": "^2.5.2"
}
```

### 配置文件

- `next.config.js` - Next.js 配置（已禁用 TypeScript 和 ESLint 构建检查）
- `tsconfig.json` - TypeScript 配置
- `tailwind.config.ts` - Tailwind CSS 配置
- `postcss.config.js` - PostCSS 配置
- `.eslintrc.json` - ESLint 配置
- `prisma/schema.prisma` - 数据库 Schema

### Prisma 配置

数据库使用 PostgreSQL，通过 Prisma ORM 管理。

**主要模型**：
- `users`, `teachers`, `students` - 用户体系
- `classes` - 班级
- `vocabularies`, `questions`, `question_options` - 词汇与题目
- `vocabulary_packs`, `vocabulary_pack_days` - 词汇库模板
- `study_plans`, `plan_classes` - 学习计划
- `daily_tasks`, `study_records` - 学习数据
- `wrong_questions`, `word_masteries` - 错题与掌握度
- `proficiency_tests`, `test_records` - 熟练度测试
- `student_points`, `achievements` - 积分成就

---

## 数据模型

详见 `prisma/schema.prisma`，核心关系：

```
users (用户)
  ├─ teachers (教师) → classes (班级)
  └─ students (学生) → study_plans (学习计划)
                     → daily_tasks (每日任务)
                     → study_records (学习记录)
                     → wrong_questions (错题)
                     → word_masteries (掌握度)

vocabularies (词汇)
  ├─ questions (题目) → question_options (选项)
  ├─ word_audios (音频)
  ├─ word_images (图片)
  └─ word_meanings (多词性释义)

vocabulary_packs (词汇库)
  └─ vocabulary_pack_days (每日配置)
       └─ vocabulary_pack_day_words (词汇关联)
```

---

## 测试与质量

### 测试文件

- `tests/e2e/student-login-vocab.spec.ts` - E2E 测试（Playwright）

### 运行测试

```bash
npm run test:e2e              # 运行 E2E 测试
npm run perf:benchmark        # 性能基准测试
```

### 代码质量工具

- **ESLint**: 代码规范检查
- **TypeScript**: 类型检查（构建时已禁用严格检查）
- **Prettier**: 代码格式化（未配置）

---

## 常见问题 (FAQ)

### 1. 如何初始化数据库？

```bash
npx prisma generate      # 生成 Prisma Client
npx prisma db push       # 同步 Schema 到数据库
node scripts/init-db.js  # 初始化测试数据
```

### 2. 如何导入词汇数据？

```bash
node scripts/import-phonetic-and-audio.js  # 导入音标和音频
node scripts/quick-import-data.js          # 快速导入测试数据
```

### 3. 如何添加新的 API 路由？

在 `app/api/` 下创建目录和 `route.ts` 文件，例如：

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { successResponse, errorResponse } from '@/lib/response'

export async function GET(request: NextRequest) {
  try {
    // 业务逻辑
    return successResponse({ message: 'Hello' })
  } catch (error) {
    return errorResponse('Error message')
  }
}
```

### 4. 如何修改数据库 Schema？

1. 编辑 `prisma/schema.prisma`
2. 运行 `npx prisma db push` 同步到数据库
3. 运行 `npx prisma generate` 更新 Prisma Client

### 5. 音频文件存储在哪里？

- **开发环境**: 本地文件系统（未实现）
- **生产环境**: Vercel Blob Storage（通过 `@vercel/blob` 包）

---

## 相关文件清单

### 核心业务逻辑 (`lib/`)

- `auth.ts` - JWT 认证（密码加密、Token 生成验证）
- `ebbinghaus.ts` - 艾宾浩斯遗忘曲线算法
- `question-type-allocator.ts` - 题型智能分配
- `achievement-checker.ts` - 成就检查与解锁
- `report-generator.ts` - 报告生成（Excel/PDF/Word）
- `task-interrupt-detector.ts` - 任务中断检测
- `id-generator.ts` - ID 生成器
- `prisma.ts` - Prisma Client 单例
- `response.ts` - 统一响应格式

### 工具脚本 (`scripts/`)

- `init-db.js` - 初始化数据库
- `init-achievements.js` - 初始化成就系统
- `generate-test-data.js` - 生成测试数据
- `benchmark-pagination.js` - 分页性能测试
- `import-phonetic-and-audio.js` - 导入音标和音频
- `fetch-ecdict-data.js` - 从 ECDICT 获取词汇数据
- `upload-audio-to-blob.js` - 上传音频到 Blob Storage
- `migrate-audio-to-blob.js` - 迁移音频到 Blob Storage
- `add-indexes.js` - 添加数据库索引

### 页面组件 (`app/admin/`)

- `page.tsx` - 管理后台首页（数据总览）
- `vocabularies/page.tsx` - 词汇管理页面
- `questions/page.tsx` - 题目管理页面
- `students/page.tsx` - 学生管理页面
- `classes/page.tsx` - 班级管理页面
- `study-plans/page.tsx` - 学习计划页面
- `vocabulary-packs/page.tsx` - 词汇库管理页面
- `statistics/page.tsx` - 数据统计页面
- `proficiency-tests/page.tsx` - 熟练度测试页面
- `settings/page.tsx` - 系统设置页面

### 类型定义 (`types/`)

- `index.ts` - 通用类型定义（用户、词汇、题目、学生等）
- `plan-classes.ts` - 班级计划相关类型

---

## 性能优化

### 已实现

- ✅ 数据库索引优化（`scripts/add-indexes.js`）
- ✅ 分页查询优化（游标分页）
- ✅ Prisma 查询优化（select 指定字段）

### 待优化

- ⚠️ 大数据量导出（流式处理）
- ⚠️ 音频文件 CDN 加速
- ⚠️ API 响应缓存

---

## 部署注意事项

### Vercel 部署

1. 连接 GitHub 仓库
2. 配置环境变量（`DATABASE_URL`, `JWT_SECRET`）
3. 自动部署

### 阿里云部署

1. 构建生产版本：`npm run build`
2. 启动服务：`npm run start`
3. 使用 PM2 管理进程
4. 配置 Nginx 反向代理

### 数据库迁移

生产环境建议使用 Prisma Migrate：

```bash
npx prisma migrate dev --name init  # 开发环境
npx prisma migrate deploy           # 生产环境
```
