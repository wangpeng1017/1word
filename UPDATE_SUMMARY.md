# 更新总结

## ✅ 已完成的功能

### 1. 题目管理独立化

**后端实现**：
- ✅ `/api/questions` - CRUD 完整接口
- ✅ `/api/questions/import` - Excel 批量导入（支持幂等、去重、字段校验）

**前端实现**：
- ✅ 新增"题目管理"左侧菜单项（位于"词汇管理"下方）
- ✅ 题目列表页面（分页、筛选）
- ✅ 新增/编辑题目表单
- ✅ 批量删除功能
- ✅ Excel 导入弹窗 + 模板下载

**特性**：
- 支持 4 种题型：英选汉、汉选英、听音选词、选词填空
- Excel 导入自动校验并匹配词汇
- 导入失败返回详细错误信息

---

### 2. 学生强制班级归属

**数据模型变更**：
```prisma
// students 表
classId: String   // 改为必填
grade:   String   // 改为必填

// 新增索引
@@index([classId])
@@index([grade])
```

**迁移脚本**：
- ✅ `scripts/migrate-student-class.ts` - 自动为存量学生分配默认班级

**说明**：
- 新建学生必须选择班级
- 班级删除改为 `Cascade`（删除班级时同步删除学生）
- 学生的 `grade` 字段与班级 `grade` 字段保持一致

---

### 3. 学习计划批量下发给班级

**数据模型新增**：
```prisma
model PlanClass {
  id           String
  classId      String           // 班级ID
  vocabularyId String           // 词汇ID
  status       StudyPlanStatus
  startDate    DateTime         // 计划开始日期
  endDate      DateTime?        // 计划结束日期（可选）
  
  @@unique([classId, vocabularyId])  // 防重复
}
```

**后端实现**：
- ✅ `/api/plan-classes` - CRUD 完整接口
- ✅ 批量创建支持多班级 × 多词汇笛卡尔积
- ✅ `skipDuplicates` 实现幂等操作

**前端实现**：
- ✅ 学习计划页面改版
- ✅ "批量生成计划"改为多班级选择（替代原来的单班级/学生选择）
- ✅ 支持同时选择多个班级和多个词汇
- ✅ 新增开始/结束日期选择

**工作流程**：
1. 教师选择 1+ 班级
2. 选择 1+ 词汇
3. 指定日期范围
4. 系统自动为所有班级 × 词汇组合创建计划
5. 自动去重（同一班级同一词汇不重复创建）

---

## 📁 新增文件

### 后端 API
- `web-admin/app/api/questions/route.ts`
- `web-admin/app/api/questions/import/route.ts`
- `web-admin/app/api/plan-classes/route.ts`

### 前端页面
- `web-admin/app/admin/questions/page.tsx`

### 脚本
- `web-admin/scripts/migrate-student-class.ts`

### 文档
- `MIGRATION_GUIDE.md` - 完整迁移指南
- `UPDATE_SUMMARY.md` - 本文件

---

## 🔧 修改文件

### Schema
- `web-admin/prisma/schema.prisma`
  - Student 模型强制 classId/grade
  - 新增 PlanClass 模型
  - 添加索引

### 前端
- `web-admin/app/admin/layout.tsx` - 新增"题目管理"菜单项
- `web-admin/app/admin/study-plans/page.tsx` - 改为批量班级下发

---

## 📦 依赖变更

新增：
- `xlsx` - Excel 解析库

---

## 🚀 部署步骤

### 1. 安装依赖
```bash
cd web-admin
npm install xlsx
```

### 2. 生成 Prisma Client
```bash
npx prisma generate
```

### 3. 推送 Schema（⚠️ 修改数据库结构）
```bash
npx prisma db push
```

### 4. 数据迁移（如果有存量学生）
```bash
npx tsx scripts/migrate-student-class.ts
```

### 5. 构建验证
```bash
npm run build
```

### 6. 重启服务
```bash
npm run dev  # 或部署到生产环境
```

---

## ⚠️ 注意事项

1. **数据库备份**：迁移前务必备份数据库
2. **学生班级分配**：运行迁移脚本后，登录管理后台为学生手动分配正确班级
3. **Excel 导入格式**：参考模板，词汇必须提前存在于数据库
4. **兼容性**：原 StudyPlan（per-student）保留，新增 PlanClass（per-class）

---

## 🐛 已知问题

- 学习计划页面当前仍显示 per-student 计划，未整合 PlanClass 视图（可后续迭代）
- 题目编辑时需输入词汇 ID 或单词，未做下拉选择优化

---

## 📝 后续优化建议

1. **题目管理**：
   - 词汇选择改为下拉搜索框
   - 支持题目预览和测试
   
2. **学习计划**：
   - 统一显示 StudyPlan + PlanClass
   - 支持按班级/学生双维度筛选统计
   
3. **学生管理**：
   - 批量导入学生时自动分配班级
   - 支持班级批量迁移

---

## 技术栈

- **后端**：Next.js App Router + Prisma ORM
- **前端**：React 18 + Ant Design 5 + TypeScript
- **数据库**：PostgreSQL
- **Excel 处理**：xlsx
