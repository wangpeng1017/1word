# Daily Tasks 问题分析与修复计划

## 问题根因

### 小程序端逻辑分析 (index.js:150-191)

```javascript
async getTodayOverview() {
  // 1. 先调用 daily-tasks 生成任务
  await post('/students/' + studentId + '/daily-tasks')

  // 2. 然后从 review-plan API 获取 dueCount
  const data = await get('/review-plan/' + studentId)
  const mi = data && data.miniapp
  if (mi && mi.today) {
    return {
      dueCount: mi.today.dueCount || 0,  // ← 关键：从 miniapp.today.dueCount 获取
      ...
    }
  }

  // 3. 如果没有 miniapp 数据，fallback 到直接调用 daily-tasks
  let tasks = await get('/students/' + studentId + '/daily-tasks')
  const dueCount = Array.isArray(tasks) ? tasks.length : 0
}
```

### 服务端 API 问题 (/api/review-plan/[studentId]/route.ts)

当前返回格式：
```javascript
{
  student: {...},
  progress: {
    totalWords,      // 来自 study_plans 表
    masteredWords,   // 来自 study_plans 表
    needReview,      // 来自 study_plans 表 (status=LEARNING, nextReviewAt<=today)
    ...
  },
  recentActivity: [...]
}
```

**问题：没有 `miniapp` 字段！**

由于重构后 `study_plans` 表是空的（记录在学生首次学习时才创建），所以：
- `progress.needReview` = 0
- 小程序找不到 `data.miniapp`，fallback 到直接调用 daily-tasks
- 但 fallback 逻辑期望 `tasks` 是数组，而实际返回是 `{ tasks: [...], summary: {...} }`
- 所以 `Array.isArray(tasks)` = false，`dueCount` = 0

## 修复方案

### 方案 A：修改 review-plan API（推荐）

在 `/api/review-plan/[studentId]` 中添加 `miniapp` 字段，动态计算今日任务数：

```javascript
// 添加 miniapp 字段，兼容小程序
const dailyTasksData = await getDailyTasksForStudent(studentId)
return successResponse({
  student: {...},
  progress: {...},
  recentActivity: [...],
  miniapp: {
    today: {
      dueCount: dailyTasksData.newCount + dailyTasksData.reviewCount,
      completedCount: 0,  // 从 study_records 获取
      timeSpentSeconds: 0,
    }
  }
})
```

### 方案 B：修改 daily-tasks API 返回格式

让 `/api/students/[id]/daily-tasks` 直接返回数组（兼容小程序 fallback 逻辑）：

```javascript
// 当前返回
{ success: true, data: { tasks: [...], summary: {...} } }

// 修改为直接返回数组（或在 data 层级返回数组）
{ success: true, data: [...] }
```

### 推荐：方案 A

因为：
1. 不破坏 daily-tasks API 的结构化返回
2. review-plan API 本来就应该返回今日任务概览
3. 小程序主要依赖 review-plan API

## 实施步骤

1. 修改 `/api/review-plan/[studentId]/route.ts`
   - 复用 daily-tasks 的逻辑计算今日新词和复习词数量
   - 添加 `miniapp.today` 字段

2. 测试验证
   - 确认 API 返回正确的 dueCount
   - 小程序显示正确的任务数
