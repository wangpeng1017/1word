# 智能词汇复习助手 - 项目文档

## 变更记录 (Changelog)

- **2025-12-15 10:29:09**: 初始化项目 AI 上下文，生成根级和模块级文档

---

## 项目愿景

基于艾宾浩斯遗忘曲线的智能词汇学习系统，帮助学生高效记忆英语单词。系统包含微信小程序（学生端）和 Web 管理后台（教师端），实现词汇管理、学习计划生成、智能复习提醒、学习数据统计等功能。

**核心价值**：
- 科学的复习算法（1天、2天、4天、7天、15天间隔）
- 多维度学习数据分析与导出
- 积分成就系统激励学习
- 离线模式支持随时随地学习

---

## 架构总览

本项目采用前后端分离架构，包含两个主要模块：

- **web-admin**: Next.js 15 全栈应用，提供教师管理后台和 RESTful API
- **wechat-miniapp**: 微信小程序原生开发，提供学生学习端

**技术栈**：
- 后端：Next.js 15 App Router + Prisma ORM + PostgreSQL
- 前端：React 18 + Ant Design 5 + Tailwind CSS
- 小程序：原生 WXML/WXSS/JavaScript
- 认证：JWT Token
- 部署：Vercel (Demo) / 阿里云 (生产)

---

## 模块结构图

```mermaid
graph TD
    A["(根) 智能词汇复习助手"] --> B["web-admin"];
    A --> C["wechat-miniapp"];
    A --> D["docs"];

    B --> B1["app - Next.js 路由"];
    B --> B2["lib - 业务逻辑"];
    B --> B3["prisma - 数据库"];
    B --> B4["scripts - 工具脚本"];
    B --> B5["types - 类型定义"];

    C --> C1["pages - 小程序页面"];
    C --> C2["utils - 工具函数"];
    C --> C3["config - 配置"];

    click B "./web-admin/CLAUDE.md" "查看 web-admin 模块文档"
    click C "./wechat-miniapp/CLAUDE.md" "查看 wechat-miniapp 模块文档"
```

---

## 模块索引

| 模块路径 | 语言 | 职责描述 | 文档链接 |
|---------|------|---------|---------|
| `web-admin/` | TypeScript | Web 管理后台 + RESTful API，提供词汇管理、学生管理、数据统计、导出等功能 | [查看文档](./web-admin/CLAUDE.md) |
| `wechat-miniapp/` | JavaScript | 微信小程序学生端，提供每日学习、答题、错题本、积分成就等功能 | [查看文档](./wechat-miniapp/CLAUDE.md) |
| `docs/` | Markdown | 统一文档目录，存放产品需求、技术说明等文档 | - |

---

## 运行与开发

### 环境要求

- Node.js 18+
- PostgreSQL 14+
- 微信开发者工具（小程序开发）

### Web 管理后台启动

```bash
cd web-admin
npm install
cp .env.example .env  # 配置数据库连接和 JWT 密钥
npx prisma generate
npx prisma db push
npm run dev  # 访问 http://localhost:3000
```

### 微信小程序启动

1. 使用微信开发者工具打开 `wechat-miniapp` 目录
2. 修改 `config/env.js` 中的 `apiUrl` 为后端地址
3. 修改 `project.config.json` 中的 `appid`
4. 点击"编译"运行

### 常用脚本

```bash
# Web 后台
npm run db:push          # 同步数据库 Schema
npm run db:init          # 初始化数据库数据
npm run data:import-all  # 导入词汇音标和音频
npm run test:e2e         # 运行 E2E 测试

# 数据库管理
node scripts/init-db.js              # 初始化数据库
node scripts/init-achievements.js    # 初始化成就系统
node scripts/generate-test-data.js   # 生成测试数据
```

---

## 测试策略

### 已有测试

- **E2E 测试**: `web-admin/tests/e2e/` - 使用 Playwright 测试学生登录和词汇学习流程
- **性能测试**: `scripts/benchmark-pagination.js` - 分页查询性能基准测试

### 测试覆盖

- ✅ 学生登录流程
- ✅ 词汇列表分页性能
- ⚠️ 缺少单元测试（API 路由、业务逻辑）
- ⚠️ 缺少小程序端测试

### 运行测试

```bash
cd web-admin
npm run test:e2e              # 运行 E2E 测试
npm run perf:test-all         # 运行性能测试
```

---

## 编码规范

### TypeScript/JavaScript

- 使用 TypeScript 严格模式（web-admin）
- 使用 ESLint + Next.js 配置
- 函数命名：驼峰命名法（camelCase）
- 组件命名：帕斯卡命名法（PascalCase）
- 文件命名：kebab-case（API 路由除外）

### 数据库

- 使用 Prisma Schema 定义模型
- 表名：小写下划线（snake_case）
- 字段名：驼峰命名法（camelCase）
- 主键统一使用 `id: String`（UUID）
- 时间字段：`createdAt`、`updatedAt`

### API 设计

- RESTful 风格
- 统一响应格式：`{ success: boolean, data?: any, error?: string }`
- 使用 JWT Bearer Token 认证
- 路径：`/api/{resource}/{id?}/{action?}`

---

## AI 使用指引

### ⚠️ 生产环境关键约束（必须遵守！）

| 约束 | 说明 | 原因 |
|------|------|------|
| ❌ **不能修改表结构** | 禁止 `ALTER TABLE`、`CREATE TABLE`、`prisma db push` | 无 DBA 权限，生产数据库由 DBA 管理 |
| ❌ **不能直接连接生产环境** | 禁止 SSH 到 172.20.234.44 | 只能用户通过堡垒机手动操作 |
| ✅ **只能修改代码逻辑** | 在现有表结构基础上开发 | 保证生产稳定性 |
| ✅ **只能使用 `prisma generate`** | 仅生成客户端代码，不改数据库 | 安全操作 |

**部署流程**:
```
1. 本地开发 → git push origin main
2. 用户通过堡垒机 SSH 到服务器
3. git pull → npm run build → pm2 restart word-app
```

**生产环境信息**: 详见 [docs/XDF_部署方案_完整版.md](./docs/XDF_部署方案_完整版.md)

---

### 项目上下文

在与 AI 协作时，请提供以下上下文：

1. **当前模块**：明确是 web-admin 还是 wechat-miniapp
2. **相关文件**：涉及的具体文件路径
3. **业务场景**：词汇管理、学习计划、数据统计等
4. **数据模型**：参考 `prisma/schema.prisma`

### 常见任务

- **添加新 API**：在 `app/api/` 下创建路由，参考现有 API 结构
- **修改数据模型**：编辑 `prisma/schema.prisma`，运行 `npx prisma db push`
- **添加新页面**：在 `app/admin/` 下创建页面组件
- **调试小程序**：检查 `utils/request.js` 的请求日志

### 关键业务逻辑

- **艾宾浩斯算法**：`lib/ebbinghaus.ts` - 复习间隔计算
- **题目分配**：`lib/question-type-allocator.ts` - 4 种题型智能分配
- **成就检查**：`lib/achievement-checker.ts` - 积分和成就解锁
- **报告生成**：`lib/report-generator.ts` - Excel/PDF/Word 导出

---

## 数据库核心表

| 表名 | 用途 | 关键字段 |
|-----|------|---------|
| `users` | 用户账号 | email, phone, password, role |
| `teachers` | 教师信息 | user_id, school, subject |
| `students` | 学生信息 | user_id, student_no, class_id, wechat_id |
| `classes` | 班级 | name, grade, teacher_id |
| `vocabularies` | 词汇库 | word, phonetic, primary_meaning, difficulty |
| `questions` | 题目 | vocabularyId, type, content, correctAnswer |
| `study_plans` | 学习计划 | studentId, vocabularyId, reviewCount, nextReviewAt |
| `daily_tasks` | 每日任务 | studentId, vocabularyId, taskDate, status |
| `study_records` | 学习记录 | studentId, taskDate, accuracy, totalTime |
| `wrong_questions` | 错题记录 | studentId, vocabularyId, questionId |
| `word_masteries` | 单词掌握度 | studentId, vocabularyId, isMastered, isDifficult |
| `vocabulary_packs` | 词汇库模板 | name, totalDays, totalWords |
| `proficiency_tests` | 熟练度测试 | name, vocabularyIds, passScore |
| `student_points` | 学生积分 | studentId, totalPoints, level |
| `achievements` | 成就定义 | name, type, condition, points |

---

## 开发进度

### 已完成 ✅

- 项目初始化与数据库设计
- 用户认证系统（教师/学生）
- 词汇管理 CRUD + 批量导入
- 题目管理（4 种题型）
- 学生管理 + 班级管理
- 学习计划生成（基于艾宾浩斯曲线）
- 微信小程序基础框架
- 小程序登录、首页、答题页面
- 积分成就系统
- 数据统计与导出（Excel/PDF/Word）

### 进行中 🚧

- 小程序离线模式
- 智能复习算法优化
- 性能优化（大数据量分页）

### 待开发 📋

- 小程序进度保存与恢复
- 导出模板自定义
- 多租户支持
- 移动端 Web 版本

---

## 部署说明

### Demo 环境

- **平台**: Vercel
- **数据库**: Vercel Postgres / Supabase
- **域名**: 自动分配

### 生产环境

- **平台**: 阿里云
- **服务**: ECS + RDS (PostgreSQL) + OSS (文件存储)
- **域名**: 需备案

### 环境变量

```env
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
JWT_SECRET="your-secret-key"
BLOB_READ_WRITE_TOKEN="vercel-blob-token"  # 音频文件存储
```

---

## 相关资源

- [产品需求文档](./产品需求文档.md)
- [Web 后台说明](./docs/web-admin说明.md)
- [Prisma 文档](https://www.prisma.io/docs)
- [Next.js 文档](https://nextjs.org/docs)
- [微信小程序文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
