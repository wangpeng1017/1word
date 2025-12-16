# 学习计划与复习逻辑修复计划

## 任务概述
修复学习计划生成与学生复习之间的逻辑问题，确保系统稳定性。

## 问题清单
1. study_plans 唯一约束包含 reviewCount，导致查询错误
2. reviewCount 在多处被重复更新
3. 每日任务生成逻辑分散在多个入口
4. 掌握状态异步更新可能失败
5. 小程序使用 POST 获取任务不合理
6. 日期时区处理不一致

---

## 执行步骤

### 步骤 1: 修改数据库 Schema ✅ 已完成
**文件**: `web-admin/prisma/schema.prisma`
**操作**:
- 修改 study_plans 的唯一约束从 `[studentId, vocabularyId, reviewCount]` 改为 `[studentId, vocabularyId]`
- 删除冗余的 `@@index([studentId, vocabularyId])`

### 步骤 2: 清理重复数据并同步数据库 ✅ 已完成
**操作**:
- 编写脚本清理可能存在的重复 study_plans 记录
- 执行 `npx prisma db push` 同步 Schema
- 清理脚本: `scripts/cleanup-duplicate-study-plans.js`
- 清理结果: 发现 8219 组重复记录，已全部清理

### 步骤 3: 修复 update-mastery API ✅ 已完成
**文件**: `web-admin/app/api/review-plan/update-mastery/route.ts`
**操作**:
- 移除 reviewCount 更新逻辑（统一由 study-records 处理）
- 修复 findUnique 查询使用正确的唯一约束
- 只保留掌握度更新功能

### 步骤 4: 修复 study-records API ✅ 已完成
**文件**: `web-admin/app/api/study-records/route.ts`
**操作**:
- 将 updateMasteriesAsync 改为同步执行
- 确保掌握状态在事务中正确更新
- 统一日期处理使用 UTC

### 步骤 5: 统一每日任务生成逻辑 ✅ 已完成
**文件**: `web-admin/app/api/daily-tasks/route.ts`
**操作**:
- 删除 generateDailyTasks 函数
- GET 请求只返回已有任务，不自动生成
- 统一由 `/api/students/[id]/daily-tasks` 处理任务生成

### 步骤 6: 优化小程序 API 调用 ✅ 已完成
**文件**: `wechat-miniapp/pages/study/study.js`
**操作**:
- 修改 loadTasks 函数
- 先 GET 获取已有任务
- 无任务时再 POST 生成

### 步骤 7: 添加日期工具函数 ✅ 已完成
**文件**: `web-admin/lib/date-utils.ts` (新建)
**操作**:
- 创建统一的日期处理工具函数
- getTodayUTC(): 获取今天 UTC 0点
- getDateRangeUTC(date): 获取某天的 UTC 时间范围

### 步骤 8: 更新相关 API 使用统一日期处理 ✅ 已完成
**文件**:
- `web-admin/app/api/students/[id]/daily-tasks/route.ts`
- `web-admin/app/api/daily-tasks/route.ts`
- `web-admin/app/api/study-records/route.ts`

---

## 预期结果
- study_plans 每个学生每个单词只有一条记录
- reviewCount 只在 study-records 中更新
- 每日任务生成入口统一
- 掌握状态同步更新，不会丢失
- 小程序 API 调用更合理
- 日期处理统一，无时区问题

---

## 回滚方案
如果出现问题，可以：
1. 恢复 Schema 的原唯一约束
2. 恢复各 API 文件的原始版本
3. 数据库数据为测试数据，可重新初始化
