# 学习计划 - 删除"添加词汇"功能

## 目标
删除学习计划模块中的"添加词汇"功能，只保留通过班级批量生成计划的逻辑。

## 影响范围分析

### 需要删除的文件
| 文件 | 说明 |
|------|------|
| `web-admin/app/api/study-plans/add-words/route.ts` | 添加词汇 API |
| `web-admin/components/AddWordsDialog.tsx` | 添加词汇对话框组件 |

### 需要修改的文件
| 文件 | 修改内容 |
|------|----------|
| `web-admin/app/admin/study-plans/page.tsx` | 移除 AddWordsDialog 引用和相关状态/方法 |

## 实施步骤

### 步骤 1: 修改 study-plans/page.tsx
- 删除 `AddWordsDialog` 导入
- 删除 `addWordsOpen` 状态
- 删除 `selectedStudentId` 状态
- 删除 `handleAddWords` 方法
- 删除检测单个学生的 `useEffect`
- 删除"添加词汇"按钮
- 删除 `<AddWordsDialog />` 组件

### 步骤 2: 删除文件
- 删除 `web-admin/components/AddWordsDialog.tsx`
- 删除 `web-admin/app/api/study-plans/add-words/route.ts`

## 验收标准
- [ ] 学习计划页面正常加载
- [ ] "批量生成计划"按钮正常工作
- [ ] 无"添加词汇"按钮
- [ ] 无编译错误
