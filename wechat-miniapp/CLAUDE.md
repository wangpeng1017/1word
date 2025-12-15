# 微信小程序模块文档

[根目录](../CLAUDE.md) > **wechat-miniapp**

## 变更记录 (Changelog)

- **2025-12-15 10:29:09**: 初始化模块文档

---

## 模块职责

微信小程序是学生端应用，提供：

1. **每日学习**：基于艾宾浩斯曲线的智能复习任务
2. **答题练习**：4 种题型（英译中、中译英、听力、填空）
3. **错题本**：记录和复习错题
4. **学习数据**：学习进度、积分、成就、排行榜
5. **离线模式**：支持离线答题和数据同步（开发中）

---

## 入口与启动

### 主入口文件

- **应用入口**: `app.js` - 小程序全局逻辑
- **应用配置**: `app.json` - 页面路由、窗口样式、TabBar 配置
- **全局样式**: `app.wxss` - 全局样式定义

### 启动方式

1. 使用微信开发者工具打开项目目录
2. 配置 `config/env.js` 中的 API 地址
3. 修改 `project.config.json` 中的 `appid`
4. 点击"编译"运行

### 环境配置

编辑 `config/env.js`：

```javascript
module.exports = {
  name: 'development',  // 或 'production'
  apiUrl: 'http://localhost:3000/api',  // 后端 API 地址
  debug: true
}
```

---

## 对外接口

小程序通过 `utils/request.js` 封装的请求工具调用后端 API。

### 请求工具

```javascript
const request = require('./utils/request.js')

// GET 请求
request.get('/vocabularies', { page: 1 })

// POST 请求
request.post('/study-records', { data: {...} })
```

### 主要调用的 API

- `POST /api/auth/login` - 学生登录
- `GET /api/auth/me` - 获取用户信息
- `GET /api/students/[id]/daily-tasks` - 获取每日任务
- `POST /api/study-records` - 提交学习记录
- `GET /api/wrong-questions` - 获取错题列表
- `GET /api/points` - 获取积分信息
- `GET /api/achievements` - 获取成就列表
- `GET /api/leaderboard` - 获取排行榜

---

## 关键依赖与配置

### 项目配置

`project.config.json` 主要配置：

```json
{
  "appid": "wx132f0943597b61b7",
  "projectname": "vocab-assistant",
  "libVersion": "3.5.0",
  "compileType": "miniprogram",
  "setting": {
    "es6": true,
    "minified": true,
    "urlCheck": true
  }
}
```

### 页面配置

`app.json` 配置：

- **页面路由**: 13 个页面（首页、学习、错题、个人中心等）
- **TabBar**: 3 个 Tab（今日复习、错题本、学习数据）
- **窗口样式**: 主题色 `#FF7A7A`

---

## 数据模型

### 全局数据 (globalData)

```javascript
{
  userInfo: null,      // 用户信息
  token: null,         // JWT Token
  apiUrl: string,      // API 地址
  debug: boolean,      // 调试模式
  envName: string      // 环境名称
}
```

### 本地存储

使用 `wx.setStorageSync` / `wx.getStorageSync` 存储：

- `token` - 登录凭证
- `userInfo` - 用户信息
- 其他业务数据（待实现）

---

## 页面结构

### TabBar 页面

| 页面路径 | 功能 | 状态 |
|---------|------|------|
| `pages/index/index` | 今日复习（首页） | ✅ 已完成 |
| `pages/wrong/wrong` | 错题本 | ✅ 已完成 |
| `pages/profile/profile` | 学习数据（个人中心） | ✅ 已完成 |

### 功能页面

| 页面路径 | 功能 | 状态 |
|---------|------|------|
| `pages/login/login` | 登录页面 | ✅ 已完成 |
| `pages/study/study` | 答题页面 | ✅ 已完成 |
| `pages/study/result` | 答题结果页 | ✅ 已完成 |
| `pages/test/test` | 熟练度测试 | ✅ 已完成 |
| `pages/study-history/study-history` | 学习历史 | ✅ 已完成 |
| `pages/achievements/achievements` | 成就页面 | ✅ 已完成 |
| `pages/leaderboard/leaderboard` | 排行榜 | ✅ 已完成 |
| `pages/points-history/points-history` | 积分历史 | ✅ 已完成 |

---

## 测试与质量

### 测试覆盖

- ⚠️ 缺少单元测试
- ⚠️ 缺少集成测试
- ⚠️ 需要手动测试

### 调试方法

1. 开启 `config/env.js` 中的 `debug: true`
2. 查看 `utils/request.js` 的请求日志
3. 使用微信开发者工具的调试面板

---

## 常见问题 (FAQ)

### 1. 如何配置后端 API 地址？

编辑 `config/env.js`：

```javascript
module.exports = {
  apiUrl: 'https://your-api-domain.com/api'
}
```

### 2. 登录失败怎么办？

检查：
1. 后端 API 是否正常运行
2. `apiUrl` 配置是否正确
3. 学号和密码是否正确
4. 网络请求是否被拦截（`urlCheck` 设置）

### 3. 如何添加新页面？

1. 在 `pages/` 下创建页面目录
2. 创建 `.js`, `.json`, `.wxml`, `.wxss` 四个文件
3. 在 `app.json` 的 `pages` 数组中注册页面路径

### 4. 如何调用后端 API？

使用封装的 `request` 工具：

```javascript
const request = require('../../utils/request.js')

// 在页面中调用
request.get('/api/endpoint', { param: 'value' })
  .then(res => {
    if (res.success) {
      // 处理数据
    }
  })
```

### 5. 离线模式如何实现？

（开发中）计划使用：
1. `wx.setStorageSync` 缓存题目数据
2. 离线答题后存储到本地
3. 联网后同步到服务器

---

## 相关文件清单

### 核心文件

- `app.js` - 应用入口，全局状态管理
- `app.json` - 应用配置（页面、窗口、TabBar）
- `app.wxss` - 全局样式

### 工具函数 (`utils/`)

- `request.js` - HTTP 请求封装（带 Token 认证）
- `util.js` - 通用工具函数
- `storage.js` - 本地存储封装

### 配置文件 (`config/`)

- `env.js` - 环境配置（API 地址、调试开关）

### 页面文件 (`pages/`)

每个页面包含 4 个文件：
- `.js` - 页面逻辑
- `.json` - 页面配置
- `.wxml` - 页面结构
- `.wxss` - 页面样式

---

## 功能实现状态

### 已完成 ✅

- 用户登录与认证
- 首页（今日任务、学习统计）
- 答题功能（4 种题型）
- 答题结果展示
- 错题本
- 学习历史记录
- 积分系统
- 成就系统
- 排行榜

### 开发中 🚧

- 离线模式
- 进度保存与恢复
- 数据同步优化

### 待开发 📋

- 单词收藏功能
- 学习提醒推送
- 分享功能
- 个性化设置

---

## 性能优化

### 已实现

- ✅ 按需加载页面（`lazyCodeLoading: "requiredComponents"`）
- ✅ 请求防抖（待验证）

### 待优化

- ⚠️ 图片懒加载
- ⚠️ 列表虚拟滚动（长列表）
- ⚠️ 音频预加载

---

## 用户体验

### 设计规范

- **主题色**: `#FF7A7A`（珊瑚红）
- **背景色**: `#F3F4F6`（浅灰）
- **文字色**: `#6B7280`（中灰）、`#1F2937`（深灰）
- **字体**: 系统默认字体

### 交互反馈

- 加载状态：`wx.showLoading()`
- 操作提示：`wx.showToast()`
- 错误提示：`wx.showModal()`

---

## 部署与发布

### 发布流程

1. 在微信开发者工具中点击"上传"
2. 填写版本号和备注
3. 登录微信公众平台提交审核
4. 审核通过后发布

### 版本管理

建议使用语义化版本号：
- `1.0.0` - 初始版本
- `1.1.0` - 新增功能
- `1.0.1` - Bug 修复

---

## 注意事项

1. **AppID 配置**: 发布前必须修改 `project.config.json` 中的 `appid`
2. **域名白名单**: 在微信公众平台配置服务器域名（request 合法域名）
3. **HTTPS 要求**: 生产环境必须使用 HTTPS
4. **隐私协议**: 需要在小程序中展示隐私政策
5. **用户授权**: 获取用户信息需要用户主动授权
