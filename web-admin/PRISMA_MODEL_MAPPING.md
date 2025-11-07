# Prisma 模型名称映射参考

PostgreSQL数据库表名与Prisma模型名称映射关系。

## 核心原则

- **数据库表名**: snake_case 复数形式
- **Prisma访问**: 使用数据库表名（复数）
- **前端期望**: camelCase
- **需要数据转换层**: 在API响应时转换

## 模型名称映射表

| 错误用法 ❌ | 正确用法 ✅ | 说明 |
|----------|----------|------|
| `prisma.student` | `prisma.students` | 学生表 |
| `prisma.class` | `prisma.classes` | 班级表 |
| `prisma.teacher` | `prisma.teachers` | 教师表 |
| `prisma.vocabulary` | `prisma.vocabularies` | 词汇表 |
| `prisma.question` | `prisma.questions` | 题目表 |
| `prisma.questionOption` | `prisma.question_options` | 题目选项表 |
| `prisma.studyPlan` | `prisma.study_plans` | 学习计划表 |
| `prisma.studyRecord` | `prisma.study_records` | 学习记录表 |
| `prisma.dailyTask` | `prisma.daily_tasks` | 每日任务表 |
| `prisma.planClass` | `prisma.plan_classes` | 班级计划表 |
| `prisma.wordMastery` | `prisma.word_masteries` | 单词掌握度表 |
| `prisma.wrongQuestion` | `prisma.wrong_questions` | 错题表 |
| `prisma.wordAudio` | `prisma.word_audios` | 单词音频表 |
| `prisma.wordImage` | `prisma.word_images` | 单词图片表 |

## 关联字段映射

| 错误用法 ❌ | 正确用法 ✅ | 说明 |
|----------|----------|------|
| `.student` | `.students` | 关联到学生 |
| `.class` | `.classes` | 关联到班级 |
| `.teacher` | `.teachers` | 关联到教师 |
| `.vocabulary` | `.vocabularies` | 关联到词汇 |
| `.question` | `.questions` | 关联到题目 |
| `.options` | `.question_options` | 关联到题目选项 |
| `.studyPlan` | `.study_plans` | 关联到学习计划 |
| `.dailyTask` | `.daily_tasks` | 关联到每日任务 |
| `.studyRecords` | `.study_records` | 关联到学习记录 |
| `.wrongQuestions` | `.wrong_questions` | 关联到错题 |
| `.audios` | `.word_audios` | 关联到音频 |
| `.images` | `.word_images` | 关联到图片 |

## 字段名称映射

### 数据库字段 -> 前端字段

| 数据库 (snake_case) | 前端 (camelCase) |
|-------------------|-----------------|
| `student_no` | `studentNo` |
| `user_id` | `userId` |
| `class_id` | `classId` |
| `teacher_id` | `teacherId` |
| `vocabulary_id` | `vocabularyId` |
| `question_id` | `questionId` |
| `is_active` | `isActive` |
| `is_correct` | `isCorrect` |
| `is_mastered` | `isMastered` |
| `is_difficult` | `isDifficult` |
| `is_high_frequency` | `isHighFrequency` |
| `created_at` | `createdAt` |
| `updated_at` | `updatedAt` |
| `started_at` | `startedAt` |
| `completed_at` | `completedAt` |
| `part_of_speech` | `partOfSpeech` |
| `primary_meaning` | `primaryMeaning` |
| `secondary_meaning` | `secondaryMeaning` |
| `phonetic_us` | `phoneticUs` |
| `phonetic_uk` | `phoneticUk` |
| `audio_url` | `audioUrl` |
| `image_url` | `imageUrl` |
| `wechat_id` | `wechatId` |
| `start_date` | `startDate` |
| `end_date` | `endDate` |
| `task_date` | `taskDate` |
| `next_review_at` | `nextReviewAt` |
| `last_review_at` | `lastReviewAt` |
| `review_count` | `reviewCount` |
| `total_words` | `totalWords` |
| `completed_words` | `completedWords` |
| `correct_count` | `correctCount` |
| `wrong_count` | `wrongCount` |
| `total_time` | `totalTime` |
| `correct_answer` | `correctAnswer` |
| `wrong_answer` | `wrongAnswer` |
| `consecutive_correct` | `consecutiveCorrect` |
| `total_wrong_count` | `totalWrongCount` |
| `last_practice_at` | `lastPracticeAt` |

## 数据转换函数示例

```typescript
// 学生数据转换
function formatStudentData(student: any) {
  return {
    ...student,
    userId: student.user_id,
    studentNo: student.student_no,
    classId: student.class_id,
    wechatId: student.wechat_id,
    createdAt: student.created_at,
    updatedAt: student.updated_at,
  }
}

// 班级数据转换
function formatClassData(classData: any) {
  return {
    ...classData,
    isActive: classData.is_active,
    teacherId: classData.teacher_id,
    createdAt: classData.created_at,
    updatedAt: classData.updated_at,
  }
}

// 词汇数据转换
function formatVocabularyData(vocab: any) {
  return {
    ...vocab,
    partOfSpeech: vocab.part_of_speech,
    primaryMeaning: vocab.primary_meaning,
    secondaryMeaning: vocab.secondary_meaning,
    phoneticUs: vocab.phonetic_us,
    phoneticUk: vocab.phonetic_uk,
    audioUrl: vocab.audio_url,
    isHighFrequency: vocab.is_high_frequency,
    createdAt: vocab.created_at,
    updatedAt: vocab.updated_at,
  }
}

// 题目数据转换
function formatQuestionData(question: any) {
  return {
    ...question,
    vocabularyId: question.vocabularyId,
    correctAnswer: question.correctAnswer,
    audioUrl: question.audioUrl,
    createdAt: question.createdAt,
    updatedAt: question.updatedAt,
    options: question.question_options?.map((opt: any) => ({
      ...opt,
      questionId: opt.questionId,
      isCorrect: opt.isCorrect,
      createdAt: opt.createdAt,
    })) || [],
  }
}

// 学习计划数据转换
function formatStudyPlanData(plan: any) {
  return {
    ...plan,
    studentId: plan.studentId,
    vocabularyId: plan.vocabularyId,
    reviewCount: plan.reviewCount,
    lastReviewAt: plan.lastReviewAt,
    nextReviewAt: plan.nextReviewAt,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  }
}
```

## 常见错误示例

### ❌ 错误

```typescript
// 错误的模型名称
const students = await prisma.student.findMany()
const classes = await prisma.class.findMany()
const vocabulary = await prisma.vocabulary.findUnique()

// 错误的关联名称
include: {
  student: { ... },
  class: { ... },
  vocabulary: { ... },
}

// 错误的字段名称
where: { studentNo: '123' }  // 应该是 student_no
data: { isActive: true }      // 应该是 is_active
```

### ✅ 正确

```typescript
// 正确的模型名称
const students = await prisma.students.findMany()
const classes = await prisma.classes.findMany()
const vocabulary = await prisma.vocabularies.findUnique()

// 正确的关联名称
include: {
  students: { ... },
  classes: { ... },
  vocabularies: { ... },
}

// 正确的字段名称
where: { student_no: '123' }
data: { is_active: true }

// 然后使用转换函数返回给前端
const formattedStudents = students.map(formatStudentData)
```

## 检查清单

在编写/修改API时，确保：

- [ ] 所有 `prisma.xxx` 使用正确的复数/snake_case表名
- [ ] 所有 `include` 关联使用正确的字段名
- [ ] 所有 `where` 条件使用snake_case字段名
- [ ] 所有 `data` 更新使用snake_case字段名
- [ ] 添加数据转换函数，返回camelCase给前端
- [ ] 创建时添加ID生成（nanoid）
- [ ] 更新时添加 `updated_at: new Date()`
- [ ] 测试API是否正常工作

## 批量查找替换

可以使用以下正则表达式查找需要修复的代码：

```regex
prisma\.(student|class|teacher|vocabulary|question|questionOption|studyPlan|studyRecord|dailyTask|planClass|wordMastery|wrongQuestion|wordAudio|wordImage)\.
```

替换规则：
- `prisma.student.` → `prisma.students.`
- `prisma.class.` → `prisma.classes.`
- `prisma.vocabulary.` → `prisma.vocabularies.`
- 等等...
