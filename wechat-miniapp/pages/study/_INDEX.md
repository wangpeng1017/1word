# study 学习模块

小程序核心学习功能，包含答题和结果展示两个页面。
支持离线学习、进度同步、配对小游戏触发、错题重测。

⚠️ 文件夹变化时请更新此文件

## 文件清单

| 文件名 | 功能 |
|--------|------|
| study.js | 学习主逻辑：加载任务、答题、进度同步、游戏触发、错题重测 |
| study.wxml | 学习页面结构：题目卡片、选项、反馈 |
| study.wxss | 学习页面样式 |
| study.json | 学习页面配置 |
| result.js | 结果页逻辑：统计展示、完成处理 |
| result.wxml | 结果页面结构 |
| result.wxss | 结果页面样式 |
| result.json | 结果页面配置 |

## 关键流程

```
index.js (开始学习)
    ↓
study.js (答题循环)
    ├── 每20题 → matching-game (配对游戏)
    └── 全部完成 → result.js (结果页)

错题本 (错题重测)
    ↓
study.js?mode=retest (加载错题列表)
    ├── 答对 → 提交答题记录到 question_answers 表（自动从错题列表消失）
    └── 全部完成 → result.js (结果页)
```

## 图片展示逻辑

- 仅**新学单词**(isNew=true)显示实物图片
- 复习单词(isNew=false)不显示图片
- 图片URL自动从相对路径拼接为完整URL

## 更新记录

- 2026-01-17: 修复错题重测加载报错，将 wq.question 转换为 vocabulary.questions 数组格式
