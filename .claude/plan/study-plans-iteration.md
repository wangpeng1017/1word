# 学习计划模块迭代规划

## 目标定义

对学习计划管理模块进行两项优化：
1. **列表展示改为班级维度** - 每行显示一个班级的学习计划，学生和单词平铺显示
2. **批量生成时显示学生名字** - 选择班级后能看到该班级所有学生的名字

## 功能分解

### 功能1：班级维度列表展示

**当前状态：**
- 扁平的表格列表，每行一条学习计划记录（学生+单词）
- 列：班级、学生、单词、高频词、状态、复习次数、下次复习、创建时间、操作

**目标状态：**
- 每行 = 一个班级的一批学习计划（按复习日期分组）
- 列：班级、学生（Tag平铺）、单词（Tag平铺）、记忆天数、下次复习、创建时间、操作
- 学生/单词超过5个显示"更多"，点击展开全部
- 去掉字段：高频词、状态、复习次数

**UI 设计：**
```
┌──────────┬─────────────────────┬─────────────────────┬────────┬──────────┬────────┬──────┐
│ 班级     │ 学生                │ 单词                │记忆天数│ 下次复习 │ 创建时间│ 操作 │
├──────────┼─────────────────────┼─────────────────────┼────────┼──────────┼────────┼──────┤
│ 三年级   │ [张三] [李四] [王五]│ [apple] [banana]    │ Day 1  │2025-12-20│12-15   │[编辑]│
│ 一班     │ [赵六] [更多...]    │ [orange] [更多...]  │        │          │10:00   │[删除]│
├──────────┼─────────────────────┼─────────────────────┼────────┼──────────┼────────┼──────┤
│ 三年级   │ [张三] [李四] [王五]│ [cat] [dog] [bird]  │ Day 2  │2025-12-21│12-15   │[编辑]│
│ 一班     │ [赵六] [更多...]    │ [fish] [更多...]    │        │          │10:00   │[删除]│
└──────────┴─────────────────────┴─────────────────────┴────────┴──────────┴────────┴──────┘
```

**记忆天数说明：**
- 显示艾宾浩斯记忆曲线的天数：Day 1, Day 2, Day 4, Day 7, Day 15, Day 30 等
- 从学习计划的 reviewCount 或计算得出

### 功能2：批量生成显示学生名字

**当前状态：**
- 班级下拉框显示：`班级名 (年级) - X人`
- 选择后无法看到具体学生

**目标状态：**
- 选择班级后，在下方显示该班级所有学生的名字（Tag形式）
- 按班级分组显示

## 实施步骤

### 步骤1：后端 API 调整

**文件：** `web-admin/app/api/study-plans/route.ts`

修改内容：
- 新增 `groupBy=class` 查询参数
- 返回按班级+复习日期分组的数据：
```typescript
{
  plans: [
    {
      id: string,              // 组合ID (classId-nextReviewAt)
      classId: string,
      className: string,
      grade: string,
      students: [{ id, name }],
      vocabularies: [{ id, word, primaryMeaning }],
      dayNumber: number,       // 记忆曲线天数 (1, 2, 4, 7, 15, 30...)
      nextReviewAt: Date,
      createdAt: Date,
      planIds: string[]        // 原始计划ID列表，用于批量操作
    }
  ]
}
```

### 步骤2：前端列表页面重构

**文件：** `web-admin/app/admin/study-plans/page.tsx`

修改内容：
1. 调用 API 时添加 `groupBy=class` 参数
2. 修改表格列定义：
   - 班级：显示班级名称
   - 学生：Tag 平铺，超过5个显示"更多"
   - 单词：Tag 平铺，超过5个显示"更多"
   - 记忆天数：显示 Day X
   - 下次复习、创建时间、操作
3. 移除：高频词、状态、复习次数列
4. 操作按钮改为批量操作（编辑/删除整组计划）

### 步骤3：批量生成对话框优化

**文件：** `web-admin/components/BatchGenerateDialog.tsx`

修改内容：
1. 监听班级选择变化
2. 选择班级后，从 classes 数据中提取学生信息
3. 在班级选择器下方添加学生展示区域（按班级分组的 Tag 列表）

## 验收标准

### 功能1验收：
- [ ] 学习计划列表每行显示一个班级的计划
- [ ] 学生和单词以 Tag 形式平铺显示
- [ ] 超过5个显示"更多"按钮，点击展开
- [ ] 显示记忆天数（Day 1, Day 2 等）
- [ ] 已移除高频词、状态、复习次数字段
- [ ] 筛选和分页功能正常

### 功能2验收：
- [ ] 批量生成对话框选择班级后显示学生名字
- [ ] 多选班级时按班级分组显示学生
- [ ] 学生名字以 Tag 形式展示

---

## 当前进度 (2025-12-16)

### 已完成：
1. 后端 API 已添加基础修改：
   - 导入 `REVIEW_INTERVALS`
   - 添加 `getDayLabel` 函数
   - 添加 `groupBy` 参数解析

### 待完成：
需要在 `route.ts` 的第 93 行后（创建时间筛选之后）添加以下班级分组逻辑代码：

```typescript
    // 按班级分组模式
    if (groupBy === 'class') {
      const allRows = await prisma.study_plans.findMany({
        where,
        orderBy: [{ nextReviewAt: 'asc' }, { createdAt: 'desc' }],
        include: {
          students: {
            include: {
              user: { select: { name: true } },
              classes: { select: { id: true, name: true, grade: true } },
            },
          },
          vocabularies: {
            select: {
              id: true,
              word: true,
              word_meanings: {
                orderBy: { orderIndex: 'asc' },
                take: 1,
                select: { meaning: true },
              },
            },
          },
        },
      })

      // 按 班级ID + 下次复习日期 + reviewCount 分组
      const groupMap = new Map<string, {
        classId: string
        className: string
        grade: string
        students: Map<string, { id: string; name: string }>
        vocabularies: Map<string, { id: string; word: string; primaryMeaning: string }>
        reviewCount: number
        dayLabel: string
        nextReviewAt: Date | null
        createdAt: Date
        planIds: string[]
      }>()

      for (const sp of allRows) {
        const classInfo = (sp as any).students?.classes
        if (!classInfo) continue

        const nextReviewDate = sp.nextReviewAt ? new Date(sp.nextReviewAt).toISOString().split('T')[0] : 'null'
        const groupKey = `${classInfo.id}-${nextReviewDate}-${sp.reviewCount}`

        if (!groupMap.has(groupKey)) {
          groupMap.set(groupKey, {
            classId: classInfo.id,
            className: classInfo.name,
            grade: classInfo.grade || '',
            students: new Map(),
            vocabularies: new Map(),
            reviewCount: sp.reviewCount,
            dayLabel: getDayLabel(sp.reviewCount),
            nextReviewAt: sp.nextReviewAt,
            createdAt: sp.createdAt,
            planIds: [],
          })
        }

        const group = groupMap.get(groupKey)!
        group.planIds.push(sp.id)

        const studentInfo = (sp as any).students
        if (studentInfo?.user?.name) {
          group.students.set(sp.studentId, {
            id: sp.studentId,
            name: studentInfo.user.name,
          })
        }

        if (sp.vocabularies) {
          group.vocabularies.set(sp.vocabularyId, {
            id: sp.vocabularyId,
            word: sp.vocabularies.word,
            primaryMeaning: (sp.vocabularies as any).word_meanings?.[0]?.meaning || '',
          })
        }

        if (sp.createdAt < group.createdAt) {
          group.createdAt = sp.createdAt
        }
      }

      const groupedPlans = Array.from(groupMap.values())
        .map(g => ({
          id: `${g.classId}-${g.nextReviewAt?.toISOString().split('T')[0] || 'null'}-${g.reviewCount}`,
          classId: g.classId,
          className: g.className,
          grade: g.grade,
          students: Array.from(g.students.values()),
          vocabularies: Array.from(g.vocabularies.values()),
          reviewCount: g.reviewCount,
          dayLabel: g.dayLabel,
          nextReviewAt: g.nextReviewAt,
          createdAt: g.createdAt,
          planIds: g.planIds,
        }))
        .sort((a, b) => {
          if (a.nextReviewAt && b.nextReviewAt) {
            return new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime()
          }
          return 0
        })

      const total = groupedPlans.length
      const paginatedPlans = groupedPlans.slice(skip, skip + limit)

      return successResponse({
        studyPlans: paginatedPlans,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      })
    }

    // 原有的扁平列表模式（在这行之前插入上面的代码）
```

然后将原来的 `const [rows, total] = await Promise.all([` 前面加上注释 `// 原有的扁平列表模式`
