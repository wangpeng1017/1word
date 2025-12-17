# 小程序第三页优化 - 执行计划

## 任务概述
优化小程序第三个页面（学习数据/profile），精简内容并增强积分等级功能。

## 需求
1. 删除排行榜入口
2. 精简成就列表（20个→10个）
3. 在成就页面添加积分等级卡片，显示等级定义和升级进度

## 已完成的修改

### 1. 小程序 profile 页面
- **文件**: `wechat-miniapp/pages/profile/profile.wxml`
  - 删除排行榜入口 `<view class="quick-link-item" bindtap="goToLeaderboard">`
- **文件**: `wechat-miniapp/pages/profile/profile.js`
  - 删除 `goToLeaderboard()` 方法

### 2. 小程序 achievements 页面
- **文件**: `wechat-miniapp/pages/achievements/achievements.wxml`
  - 添加积分等级卡片，显示：
    - 当前等级和等级名称
    - 当前积分
    - 升级进度条
    - 距离下一等级所需积分
- **文件**: `wechat-miniapp/pages/achievements/achievements.js`
  - 添加 `LEVEL_DEFINITIONS` 等级定义常量
  - 添加 `loadPointsInfo()` 方法
  - 添加 `calculateLevelInfo()` 方法
- **文件**: `wechat-miniapp/pages/achievements/achievements.wxss`
  - 添加积分等级卡片样式

### 3. 后端 points API
- **文件**: `web-admin/app/api/points/route.ts`
  - 添加 `LEVEL_DEFINITIONS` 等级定义
  - 添加 `calculateLevel()` 函数
  - GET 接口返回 `levelDefinitions`
  - 更新等级计算逻辑（递增式）

### 4. 后端 achievement-checker
- **文件**: `web-admin/lib/achievement-checker.ts`
  - 更新等级计算逻辑为递增式

### 5. 成就初始化脚本
- **文件**: `web-admin/scripts/init-achievements.js`
  - 精简成就列表为10个
  - 添加停用旧成就的逻辑

## 等级定义（递增式）

| 等级 | 所需积分 | 等级名称 |
|------|----------|----------|
| Lv.1 | 0 | 初学者 |
| Lv.2 | 100 | 入门学徒 |
| Lv.3 | 300 | 勤奋学员 |
| Lv.4 | 600 | 进阶达人 |
| Lv.5 | 1000 | 词汇能手 |
| Lv.6 | 1500 | 学习精英 |
| Lv.7 | 2100 | 词汇大师 |
| Lv.8 | 2800 | 语言专家 |
| Lv.9 | 3600 | 词汇宗师 |
| Lv.10 | 4500 | 传奇学霸 |

## 精简后的成就列表（10个）

| 类型 | 成就名称 | 条件 | 积分 |
|------|----------|------|------|
| 学习 | 初学者 | 完成第一次学习 | 10 |
| 学习 | 学习达人 | 累计学习500个单词 | 200 |
| 测试 | 测试新手 | 完成第一次测试 | 20 |
| 测试 | 考试专家 | 完成10次测试 | 100 |
| 连续 | 坚持三天 | 连续学习3天 | 20 |
| 连续 | 坚持一周 | 连续学习7天 | 70 |
| 连续 | 月度冠军 | 连续学习30天 | 300 |
| 掌握 | 词汇新星 | 掌握10个单词 | 30 |
| 掌握 | 词汇大师 | 掌握100个单词 | 200 |
| 掌握 | 词汇宗师 | 掌握500个单词 | 1000 |

## 部署步骤

1. 运行成就初始化脚本更新数据库：
   ```bash
   cd web-admin
   node scripts/init-achievements.js
   ```

2. 重新部署后端服务

3. 更新小程序代码并发布

## 注意事项

- 排行榜功能仅隐藏入口，后端API保留
- 被停用的成就通过 `isActive=false` 标记，已解锁的成就不受影响
- 等级计算逻辑已同步更新到所有相关位置
