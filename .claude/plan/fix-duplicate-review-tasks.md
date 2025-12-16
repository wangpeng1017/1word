# 修复复习任务重复出现问题

## 任务概述
修复小程序完成复习后返回首页，又出现重复任务的 Bug。

## 问题分析
**现象**：完成 10 个单词复习后返回首页，又出现 5 个单词（实际是同样的 10 个单词）

**根本原因**：
1. `POST /api/students/[id]/daily-tasks` 查询 `study_plans` 时，只检查 `nextReviewAt <= endOfToday`
2. 艾宾浩斯曲线第一次复习间隔可能仍在当天
3. 已完成的词汇被重新查出来，创建了新的 `daily_tasks`
4. 代码还会重置 COMPLETED 状态的任务为 PENDING

## 解决方案
1. 在查询 `study_plans` 前，获取今日已完成的词汇 ID
2. 查询时排除这些已完成的词汇
3. 只重置 IN_PROGRESS 状态的任务，不重置 COMPLETED 状态

## 修改文件
- `web-admin/app/api/students/[id]/daily-tasks/route.ts`

## 修改内容
```typescript
// 1. 获取今日已完成的词汇ID（避免重复生成任务）
const completedVocabIds = existingTasks
  .filter(t => t.status === 'COMPLETED')
  .map(t => t.vocabularyId)

// 2. 查询时排除已完成的词汇
const reviewPlans = await prisma.study_plans.findMany({
  where: {
    // ... 其他条件
    ...(completedVocabIds.length > 0 && {
      vocabularyId: { notIn: completedVocabIds },
    }),
  },
})

// 3. 只重置 IN_PROGRESS 状态的任务
if (existingTask.status === 'IN_PROGRESS') {
  taskIdsToReset.push(existingTask.id)
}
```

## 预期结果
- 完成复习后返回首页，不会再出现重复任务
- 已完成的词汇不会被重新加入复习队列
- 中断的任务（IN_PROGRESS）仍可恢复
