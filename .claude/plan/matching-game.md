# 连线小游戏实现计划

## 需求概述

在小程序学习过程中增加连线配对小游戏，作为学习的调剂和趣味性补充。

### 核心需求
1. **交互形式**：左侧中文释义，右侧英文单词，用户点击配对
2. **反馈方式**：正确/错误从底部弹出提示（复用现有 result-bar 样式）
3. **触发时机**：每答题20个时自动触发
4. **题目来源**：当日学习计划内的单词
5. **独立性**：不计入积分、记忆曲线、错题，玩完即走

---

## 技术方案

### 1. 新增页面

```
wechat-miniapp/pages/matching-game/
├── matching-game.js      # 游戏逻辑
├── matching-game.wxml    # 页面结构
├── matching-game.wxss    # 样式
└── matching-game.json    # 页面配置
```

---

### 2. app.json 修改内容

**文件**：`wechat-miniapp/app.json`

**修改位置**：在 `pages` 数组中添加新页面路径

```json
{
  "pages": [
    "pages/index/index",
    "pages/study/study",
    "pages/study/result",
    "pages/matching-game/matching-game",  // ← 新增此行
    "pages/wrong/wrong",
    "pages/test/test",
    "pages/profile/profile",
    "pages/study-history/study-history",
    "pages/achievements/achievements",
    "pages/leaderboard/leaderboard",
    "pages/points-history/points-history",
    "pages/change-password/change-password",
    "pages/login/login"
  ],
  // ... 其他配置保持不变
}
```

**说明**：
- 只需在 `pages` 数组中添加一行
- 建议放在 `study/result` 之后，因为功能相关
- 不需要修改 tabBar（小游戏不需要底部导航入口）
- 不需要修改 window 配置

---

### 3. 游戏数据结构

```javascript
{
  words: [
    { id: 'vocab_1', word: 'abandon', meaning: '放弃' },
    { id: 'vocab_2', word: 'absorb', meaning: '吸收' },
    { id: 'vocab_3', word: 'abstract', meaning: '抽象的' },
    { id: 'vocab_4', word: 'abundant', meaning: '丰富的' },
    { id: 'vocab_5', word: 'abuse', meaning: '滥用' },
  ],
  leftItems: [],       // 左侧中文列表（打乱顺序）
  rightItems: [],      // 右侧英文列表（打乱顺序）
  leftSelected: null,  // 左侧选中索引
  rightSelected: null, // 右侧选中索引
  matchedIds: [],      // 已配对成功的 id 列表
  showResult: false,   // 是否显示结果
  isCorrect: false,    // 当前配对是否正确
  progress: 0,         // 进度百分比
}
```

---

### 4. 游戏交互流程

```
1. 进入游戏 → 从当日单词随机抽取5个
                   ↓
2. 显示界面 → 左侧：打乱的中文释义
              右侧：打乱的英文单词
                   ↓
3. 用户点击 → 先点左侧（高亮）→ 再点右侧
                   ↓
4. 检查配对 → 正确：绿色提示 → 该对消失
              错误：红色提示 → 点"知道了"重选
                   ↓
5. 全部完成 → 显示完成弹窗 → 返回学习页面
```

---

### 5. UI 设计规范

#### 布局结构（参考设计稿）
```
┌──────────────────────────────────┐
│  ×          ████░░░░░░░░░░░░░   │  进度条
│  选择配对                        │  标题
├──────────────────────────────────┤
│                                  │
│  ┌────────┐    ┌────────┐       │
│  │  放弃  │    │ absorb │       │
│  └────────┘    └────────┘       │
│                                  │
│  ┌────────┐    ┌────────┐       │
│  │  吸收  │    │abundant│       │
│  └────────┘    └────────┘       │
│                                  │
│  ┌────────┐    ┌────────┐       │
│  │ 抽象的 │    │ abandon│       │
│  └────────┘    └────────┘       │
│                                  │
│  ┌────────┐    ┌────────┐       │
│  │ 丰富的 │    │abstract│       │
│  └────────┘    └────────┘       │
│                                  │
│  ┌────────┐    ┌────────┐       │
│  │  滥用  │    │  abuse │       │
│  └────────┘    └────────┘       │
│                                  │
├──────────────────────────────────┤
│         [    检查    ]           │  检查按钮
└──────────────────────────────────┘
```

#### 卡片状态样式
| 状态 | 边框 | 背景 | 文字颜色 |
|------|------|------|----------|
| 默认 | #E5E7EB | #FFFFFF | #374151 |
| 选中 | #FF7A7A | #FFF5F5 | #374151 |
| 已配对 | 无 | #F3F4F6 | #9CA3AF（变灰） |

#### 底部反馈栏（复用现有 result-bar 样式）
- **正确**：淡绿色背景 `#D9FFC4`，图标 ✓，文字"正确！"
- **错误**：淡粉色背景 `#FFE1E1`，图标 ✗，文字"不正确"，副文字"再试一次吧"，按钮"知道了"

---

### 6. 触发机制

**修改文件**：`pages/study/study.js`

在 `nextQuestion()` 方法中添加判断：

```javascript
nextQuestion() {
  const { currentIndex, totalCount } = this.data

  // 每答20题触发一次小游戏（且不是最后一题）
  if ((currentIndex + 1) % 20 === 0 && currentIndex + 1 < totalCount) {
    const gameWords = this.getGameWords(5)  // 随机抽5个
    wx.navigateTo({
      url: '/pages/matching-game/matching-game?words=' +
           encodeURIComponent(JSON.stringify(gameWords))
    })
    return
  }

  // 原有逻辑...
}
```

---

### 7. 中文释义处理

**规则**：取简短释义，便于显示
1. 优先使用 `word_meanings` 的第一条
2. 取第一个分号/逗号前的内容
3. 最多8个汉字

**示例**：
| 原始 | 处理后 |
|------|--------|
| 回想，回忆；召回；取消 | 回想 |
| 叛逆的，难以控制的 | 叛逆的 |
| 合理的，通情达理的 | 合理的 |

---

## 实现步骤

### 第一阶段：创建游戏页面
1. 创建 `pages/matching-game/` 目录及4个文件
2. 在 `app.json` 的 pages 数组中添加页面路径
3. 实现基础布局（头部、进度条、卡片区域、按钮）

### 第二阶段：游戏核心逻辑
4. 实现卡片点击选中逻辑（左右联动）
5. 实现配对检查和反馈显示
6. 实现已配对项的状态变化
7. 实现游戏完成判定和返回

### 第三阶段：触发集成
8. 修改 study.js 添加触发逻辑
9. 实现中文释义简化函数
10. 测试完整流程

---

## 文件变更清单

| 操作 | 文件路径 | 说明 |
|------|----------|------|
| 新增 | `pages/matching-game/matching-game.js` | 游戏逻辑 |
| 新增 | `pages/matching-game/matching-game.wxml` | 页面结构 |
| 新增 | `pages/matching-game/matching-game.wxss` | 样式 |
| 新增 | `pages/matching-game/matching-game.json` | 页面配置 |
| 修改 | `app.json` | pages数组添加一行 |
| 修改 | `pages/study/study.js` | 添加触发逻辑 |

---

## 确认的设计决定

1. **游戏单词数量**：每次5个配对 ✓
2. **跳过功能**：不允许跳过，必须完成 ✓
3. **触发间隔**：每20题触发一次 ✓
