# 小程序迭代 V2 实施计划

> 创建日期: 2026-01-31 | 开发模式: TDD | 约束: 不修改数据库结构

---

## 一、需求清单

| ID | 模块 | 需求 | 优先级 |
|----|------|------|--------|
| R1 | 错题本 | 去掉【筛选重测】按钮 | P0 |
| R2 | 错题本 | 修复【全部重测】逻辑：答对删除，答错保留原数据不新增 | P0 |
| R3 | 错题本 | 错题重测不记录到学习历史 | P0 |
| R4 | 音频 | 过滤无音频单词，不放入题目 | P1 |
| R5 | 音频 | 预缓冲下一题音频 | P1 |
| R6 | 勋章 | 修复勋章自动发放逻辑 | P0 |
| R7 | 勋章 | 补发历史遗漏勋章 | P0 |
| R8 | 词汇测试 | 排查小程序只显示33题问题 | P1 |
| R9 | 磁盘策略 | 1年后自动删除详细记录 | P2 |

---

## 二、实施计划

### Phase 1: 错题本优化 (R1-R3)

#### 1.1 去掉筛选重测按钮 (R1)

**文件**: `wechat-miniapp/pages/wrong/wrong.wxml`

**改动**:
- 删除筛选重测按钮的 WXML 代码

**测试**: 手动验证 UI

---

#### 1.2 修复全部重测逻辑 (R2)

**问题分析**:
- 当前: 答错时会通过 `/study-records` API 新增错题记录
- 期望: 答错时保留原错题数据，不新增

**文件**:
- `wechat-miniapp/pages/study/study.js` - 小程序端
- `web-admin/app/api/study-records/route.ts` - 后端 API

**改动方案**:

小程序端 (`study.js`):
```javascript
// submitAnswer() 中，重测模式下答错不调用错题新增逻辑
if (this.data.isRetestMode) {
  if (isCorrect) {
    // 答对：删除错题（已实现）
    this.removeWrongQuestion(currentQuestion.id)
  }
  // 答错：什么都不做，保留原数据
}
```

后端 (`study-records/route.ts`):
```typescript
// 检查 isRetestMode，跳过错题记录逻辑
if (body.isRetestMode) {
  // 不记录错题
}
```

**TDD 测试用例**:
```typescript
// web-admin/tests/unit/api/study-records-retest.test.ts
describe('错题重测模式', () => {
  it('重测模式下答错不应新增错题记录', async () => {
    // 准备: 创建一条错题记录
    // 执行: 提交重测答题结果(答错)
    // 验证: 错题记录数量不变
  })

  it('重测模式下答对应删除错题记录', async () => {
    // 准备: 创建一条错题记录
    // 执行: 提交重测答题结果(答对)
    // 验证: 错题记录被删除
  })
})
```

---

#### 1.3 错题重测不记录学习历史 (R3)

**问题分析**:
- 当前: `finishStudy()` 调用 `post('/study-records', ...)` 或 `completeSession()`
- 期望: 重测模式下不创建 study_records

**改动方案**:

小程序端 (`study.js`):
```javascript
async finishStudy() {
  // 重测模式：直接跳转结果页，不提交学习记录
  if (this.data.isRetestMode) {
    const { correctCount, wrongCount, answers } = this.data
    wx.redirectTo({
      url: `/pages/study/result?correct=${correctCount}&wrong=${wrongCount}&total=${answers.length}&mode=retest`
    })
    return
  }
  // 原有逻辑...
}
```

**TDD 测试用例**:
```typescript
describe('错题重测不记录历史', () => {
  it('重测完成后不应创建 study_records', async () => {
    // 准备: 记录当前 study_records 数量
    // 执行: 完成一次重测
    // 验证: study_records 数量不变
  })
})
```

---

### Phase 2: 勋章修复 (R6-R7)

#### 2.1 修复勋章自动发放逻辑 (R6)

**问题分析**:
- `achievement-checker.ts` 的 `unlockAchievement()` 函数中有发放勋章的代码
- 但历史成就没有发放勋章，说明代码可能有 bug 或早期版本缺失

**文件**: `web-admin/lib/achievement-checker.ts`

**检查点**:
1. `unlockAchievement()` 中发放勋章的代码是否被正确执行
2. 是否有异常被静默吞掉

**TDD 测试用例**:
```typescript
// web-admin/tests/unit/lib/achievement-badge-grant.test.ts
describe('成就解锁时自动发放勋章', () => {
  it('解锁成就后应自动发放关联勋章', async () => {
    // 准备: 创建成就和关联勋章
    // 执行: 解锁成就
    // 验证: student_badges 中有对应记录
  })

  it('已拥有勋章时不应重复发放', async () => {
    // 准备: 学生已有该勋章
    // 执行: 再次解锁成就
    // 验证: 勋章数量不变
  })
})
```

---

#### 2.2 补发历史遗漏勋章 (R7)

**脚本**: `web-admin/scripts/fix-missing-badges.ts`

**逻辑**:
```typescript
// 1. 查询所有 student_achievements 记录
// 2. 对每条记录，检查对应的 badge 是否已发放
// 3. 如果未发放，创建 student_badges 记录
```

**执行方式**: 一次性脚本，手动执行

---

### Phase 3: 音频优化 (R4-R5)

#### 3.1 过滤无音频单词 (R4)

**文件**: `web-admin/app/api/students/[id]/daily-tasks/route.ts`

**改动**:
```typescript
// 生成每日任务时，过滤掉 audio_url 为空的单词
const vocabularies = await prisma.vocabularies.findMany({
  where: {
    id: { in: vocabularyIds },
    audio_url: { not: null }  // 新增过滤条件
  }
})
```

**TDD 测试用例**:
```typescript
describe('每日任务过滤无音频单词', () => {
  it('生成任务时应排除无音频单词', async () => {
    // 准备: 创建有音频和无音频的单词
    // 执行: 生成每日任务
    // 验证: 任务中不包含无音频单词
  })
})
```

---

#### 3.2 预缓冲下一题音频 (R5)

**文件**: `wechat-miniapp/pages/study/study.js`

**改动**:
```javascript
// loadCurrentQuestion() 中，预加载下一题音频
loadCurrentQuestion() {
  // 原有逻辑...

  // 预加载下一题音频
  this.preloadNextAudio()
}

preloadNextAudio() {
  const { tasks, currentIndex } = this.data
  const nextIndex = currentIndex + 1
  if (nextIndex < tasks.length) {
    const nextTask = tasks[nextIndex]
    if (nextTask.vocabulary?.audioUrl) {
      // 创建隐藏的 audio context 预加载
      const preloadCtx = wx.createInnerAudioContext()
      preloadCtx.src = nextTask.vocabulary.audioUrl
      preloadCtx.volume = 0
      // 不播放，只加载
    }
  }
}
```

---

### Phase 4: 词汇测试排查 (R8)

**排查步骤**:
1. 检查小程序网络请求返回的题目数量
2. 检查前端渲染逻辑是否有过滤
3. 检查是否有本地缓存干扰

**文件**: `wechat-miniapp/pages/vocabulary-test/vocabulary-test.js`

---

### Phase 5: 磁盘策略 (R9)

**脚本**: `web-admin/scripts/cleanup-old-data.ts`

**清理规则**:
| 表 | 保留时间 | 清理条件 |
|----|----------|----------|
| question_answers | 1年 | answeredAt < 1年前 |
| point_history | 1年 | createdAt < 1年前 |
| daily_tasks | 1年 | taskDate < 1年前 |

**执行方式**: 定时任务 (cron) 每月执行一次

---

## 三、开发顺序

```
Phase 1: 错题本优化
├── 1.1 去掉筛选重测按钮 (UI改动，无需测试)
├── 1.2 修复全部重测逻辑 (TDD)
│   ├── 编写测试用例
│   ├── 运行测试 (RED)
│   ├── 实现代码
│   └── 运行测试 (GREEN)
└── 1.3 错题重测不记录历史 (TDD)

Phase 2: 勋章修复
├── 2.1 修复自动发放逻辑 (TDD)
└── 2.2 补发历史遗漏勋章 (脚本)

Phase 3: 音频优化
├── 3.1 过滤无音频单词 (TDD)
└── 3.2 预缓冲下一题音频 (小程序端)

Phase 4: 词汇测试排查

Phase 5: 磁盘策略 (脚本)
```

---

## 四、验收标准

| ID | 验收条件 |
|----|----------|
| R1 | 错题本页面无筛选重测按钮 |
| R2 | 重测答错后，错题记录数量不变 |
| R3 | 重测完成后，学习历史无新增记录 |
| R4 | 每日任务中无 audio_url 为空的单词 |
| R5 | 切换题目时音频播放流畅 |
| R6 | 解锁成就后自动获得关联勋章 |
| R7 | 账号 13099990001 显示 4 个勋章 |
| R8 | 词汇测试显示 50 道题目 |
| R9 | 1年前的详细记录被清理 |

---

## 五、风险与约束

1. **不修改数据库结构** - 所有改动仅限代码逻辑
2. **TDD 模式** - 先写测试，再写实现
3. **向后兼容** - 不影响现有功能
