# 功能迁移指南

## 新增功能概述

本次更新包含三个主要功能改进：

1. **题目管理独立化** - 题目管理变为单独菜单，支持CRUD和批量导入
2. **学生强制班级归属** - 学生必须有明确的年级和班级
3. **学习计划批量下发** - 支持批量给多个班级发送学习计划

## 数据库迁移步骤

### 1. 准备工作

确保已配置正确的 `DATABASE_URL` 环境变量。

### 2. 生成 Prisma Client

```bash
cd web-admin
npx prisma generate
```

### 3. 推送 Schema 变更

**⚠️ 重要：此操作会修改数据库结构**

```bash
npx prisma db push
```

这将：
- 创建 `plan_classes` 表（班级学习计划）
- 修改 `students` 表，将 `class_id` 和 `grade` 改为必填
- 添加相关索引

### 4. 数据迁移

如果数据库中已有学生数据，需要运行迁移脚本为存量学生分配班级：

```bash
npx tsx scripts/migrate-student-class.ts
```

脚本会：
- 查找所有未分配班级的学生
- 创建"未分配班级"作为默认班级（如果不存在）
- 将学生分配到默认班级
- 输出需要手动处理的学生列表

**⚠️ 迁移后请登录管理后台为学生手动分配正确的班级！**

### 5. 安装依赖

确保安装了 Excel 处理库：

```bash
npm install xlsx
```

### 6. 验证构建

```bash
npm run build
```

## 功能使用说明

### 1. 题目管理

路径：管理后台 → 题目管理

功能：
- 增删改查题目
- 批量 Excel 导入
- 下载导入模板

Excel 导入格式：
```
word | type | content | correctAnswer | options | sentence | audioUrl
apple | ENGLISH_TO_CHINESE | apple | 苹果 | A.苹果|B.香蕉|C.橙子|D.梨 | | 
```

题型选项：
- `ENGLISH_TO_CHINESE` - 英选汉
- `CHINESE_TO_ENGLISH` - 汉选英
- `LISTENING` - 听音选词
- `FILL_IN_BLANK` - 选词填空

### 2. 学生管理

新建或编辑学生时，必须指定：
- 班级（下拉选择）
- 年级（自动从班级带入）

### 3. 学习计划批量下发

路径：管理后台 → 学习计划 → 批量生成班级学习计划

步骤：
1. 选择一个或多个班级
2. 选择一个或多个词汇
3. 指定开始日期和结束日期（可选）
4. 点击确定，系统将为选中班级的所有学生创建学习计划

特点：
- 支持多班级批量下发
- 自动去重（幂等操作）
- 统一管理班级维度的计划

## API 变更

### 新增 API

1. **题目管理**
   - `GET /api/questions` - 获取题目列表
   - `POST /api/questions` - 创建题目
   - `PUT /api/questions` - 更新题目
   - `DELETE /api/questions?ids=xxx` - 删除题目
   - `POST /api/questions/import` - 批量导入

2. **班级学习计划**
   - `GET /api/plan-classes` - 获取班级计划列表
   - `POST /api/plan-classes` - 批量创建班级计划
   - `PUT /api/plan-classes` - 更新班级计划
   - `DELETE /api/plan-classes?ids=xxx` - 删除班级计划

### Schema 变更

1. **Student 模型**
```prisma
model Student {
  // 变更前
  classId  String?  @map("class_id")
  grade    String?

  // 变更后
  classId  String   @map("class_id")  // 必填
  grade    String   // 必填
  
  // 新增索引
  @@index([classId])
  @@index([grade])
}
```

2. **新增 PlanClass 模型**
```prisma
model PlanClass {
  id           String           @id @default(cuid())
  classId      String
  vocabularyId String
  status       StudyPlanStatus  @default(PENDING)
  startDate    DateTime         @db.Date
  endDate      DateTime?        @db.Date
  // ...
}
```

## 回滚方案

如需回滚到旧版本：

1. 恢复数据库快照（推荐在迁移前备份）
2. 或手动执行：

```sql
-- 恢复 Student 表结构
ALTER TABLE students ALTER COLUMN class_id DROP NOT NULL;
ALTER TABLE students ALTER COLUMN grade DROP NOT NULL;

-- 删除 PlanClass 表
DROP TABLE IF EXISTS plan_classes;
```

## 注意事项

- 迁移前务必**备份数据库**
- 确保所有学生都已正确分配班级后再上线
- 新建学生时必须选择班级，否则无法保存
- 学习计划改为班级维度，旧的 per-student 计划仍保留在 `study_plans` 表

## 故障排查

### 问题：数据库连接失败

检查 `web-admin/.env` 中的 `DATABASE_URL` 是否正确：

```env
DATABASE_URL="postgresql://user:password@host:port/database"
```

### 问题：学生创建失败

确保：
1. 已运行 `npx prisma db push`
2. 数据库中存在至少一个班级
3. 学生表单中已选择班级

### 问题：Excel 导入失败

检查：
1. Excel 格式是否正确（参考模板）
2. 词汇是否存在于数据库
3. 题型字段是否为有效值

## 技术支持

如遇问题，请提供：
1. 错误截图或日志
2. 数据库版本
3. 浏览器版本
4. 操作步骤
