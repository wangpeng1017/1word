# 学习数据页面筛选优化

## 目标
1. 增加班级和学生筛选功能
2. 优化排序，让中断状态的记录排在前面

## 当前状态
- 后端 API 已支持 classId 和 studentId 参数
- 前端缺少班级和学生筛选组件
- 排序按 taskDate DESC, lastUpdatedAt DESC

## 实施步骤

### 步骤 1: 前端增加筛选组件
修改 `web-admin/app/admin/learning-data/page.tsx`：
- 添加班级下拉选择器
- 添加学生下拉选择器（根据班级联动）
- 加载班级和学生列表数据

### 步骤 2: 优化后端排序
修改 `web-admin/app/api/learning-data/route.ts`：
- 调整排序逻辑，中断状态优先

## 验收标准
- [ ] 可按班级筛选学习数据
- [ ] 可按学生筛选学习数据
- [ ] 班级和学生联动（选班级后学生列表过滤）
- [ ] 中断状态的记录排在前面
