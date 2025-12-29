# matching-game 配对小游戏

中英文配对游戏页面，学习过程中的调剂功能。
每答20题自动触发，4个单词配对，完成后返回学习。

⚠️ 文件夹变化时请更新此文件

## 文件清单

| 文件名 | 功能 |
|--------|------|
| matching-game.js | 游戏逻辑：初始化、选中、配对检查、完成判定 |
| matching-game.wxml | 页面结构：卡片列表、进度条、反馈弹窗 |
| matching-game.wxss | 样式：卡片状态、动画、完成弹窗 |
| matching-game.json | 页面配置：导航栏标题和颜色 |

## 数据流

```
study.js (每20题)
    ↓ navigateTo + words参数
matching-game.js
    ↓ 完成配对
wx.navigateBack()
    ↓
study.js (继续学习)
```
