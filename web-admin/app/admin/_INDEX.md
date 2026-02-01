# admin 管理后台模块

> 管理后台所有功能页面，包含学生管理、词汇管理、词汇包配置、数据统计等

⚠️ 文件夹变化时请更新此文件

## 文件清单

| 文件 | 功能 |
|------|------|
| layout.tsx | 管理后台布局框架 |
| page.tsx | 管理后台首页/仪表盘 |
| students/page.tsx | 学生列表管理 |
| students/[id]/page.tsx | 学生详情页 |
| classes/page.tsx | 班级管理 |
| vocabularies/page.tsx | 词汇列表 |
| vocabularies/[id]/page.tsx | 词汇详情编辑 |
| vocabulary-packs/page.tsx | 词汇包列表管理 |
| vocabulary-packs/[id]/page.tsx | 词汇包每日单词配置（支持批量粘贴添加） |
| questions/page.tsx | 题目管理 |
| wrong-questions/page.tsx | 错题本管理 |
| vocabulary-quiz/page.tsx | 词汇测验管理 |
| proficiency-tests/page.tsx | 等级测试管理 |
| test-records/page.tsx | 测试记录查询 |
| study-plans/page.tsx | 学习计划管理 |
| learning-data/page.tsx | 学习数据统计 |
| word-mastery/page.tsx | 单词掌握度统计 |
| student-levels/page.tsx | 学生等级管理 |
| settings/page.tsx | 系统设置 |
| settings/components/AccountsManagement.tsx | 账号管理组件 |
| settings/components/OperationLogs.tsx | 操作日志组件 |
| settings/components/BasicSettings.tsx | 基础设置组件 |

## 核心功能

### 词汇包批量配置（vocabulary-packs/[id]）
- Transfer穿梭框选择单词
- 批量粘贴添加（支持逗号、换行、分号、空格分隔）
- 自动去重（跳过已配置到其他天的单词）
- 匹配结果反馈

## 更新记录

- 2026-01-17: 新增批量粘贴添加单词功能
