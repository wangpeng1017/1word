# 多词性多释义功能迁移指南

## 📋 功能说明

支持一个单词有多个词性，每个词性对应不同的释义。

### 示例

**register**
- **n.** 登记，注册；登记表，注册簿
- **v.** 注册，登记，记录，挂号

**ability**
- **n.** 能力，才能

## 🗂️ 数据结构设计

### 新增表: word_meanings

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| id | STRING | 主键 | wm_xxx |
| vocabularyId | STRING | 词汇ID | v_xxx |
| partOfSpeech | STRING | 词性 | n., v., adj., adv. |
| meaning | TEXT | 释义 | 登记，注册；登记表 |
| orderIndex | INT | 显示顺序 | 0, 1, 2 |
| examples | STRING[] | 例句 | ["句子1", "句子2"] |

### 关系
- `vocabularies` 1 → N `word_meanings`
- 一个单词可以有多个词性和释义

## 🚀 部署步骤

### 步骤1: 执行数据库迁移

```bash
cd web-admin

# 方式1: 使用Node脚本 (推荐)
node scripts/add-word-meanings-table.js

# 方式2: 手动执行SQL
# 在Prisma Console执行 prisma/migrations/add_word_meanings_table.sql
```

### 步骤2: 生成Prisma Client

```bash
npx prisma generate
```

### 步骤3: 准备数据

由于PDF文件过大，请提供数据有以下方式：

#### 方式1: 提供文本格式数据

格式如下：
```
单词: register
音标: /ˈredʒɪstə(r)/
美式: /ˈredʒɪstər/
英式: /ˈredʒɪstə(r)/
---
n. 登记，注册；登记表，注册簿
v. 注册，登记，记录，挂号
===

单词: ability
音标: /əˈbɪləti/
---
n. 能力，才能
===
```

#### 方式2: 提供JSON格式

```json
[
  {
    "word": "register",
    "phonetic": "/ˈredʒɪstə(r)/",
    "phoneticUS": "/ˈredʒɪstər/",
    "phoneticUK": "/ˈredʒɪstə(r)/",
    "meanings": [
      {
        "partOfSpeech": "n.",
        "meaning": "登记，注册；登记表，注册簿",
        "examples": []
      },
      {
        "partOfSpeech": "v.",
        "meaning": "注册，登记，记录，挂号",
        "examples": []
      }
    ]
  }
]
```

### 步骤4: 导入数据

1. 将数据填入 `scripts/import-word-meanings.js` 的 `wordsData` 数组
2. 运行导入脚本：

```bash
node scripts/import-word-meanings.js
```

## 📊 前端展示

### 词汇管理页面

```
单词: register
━━━━━━━━━━━━━━━━━━━━
📖 n. 登记，注册；登记表，注册簿
📖 v. 注册，登记，记录，挂号
```

### 小程序展示

```
┌─────────────────┐
│   register      │
│  /ˈredʒɪstə(r)/ │
├─────────────────┤
│ n. 登记，注册   │
│    登记表，注册簿│
├─────────────────┤
│ v. 注册，登记   │
│    记录，挂号   │
└─────────────────┘
```

## 🔄 API 变化

### GET /api/vocabularies/:id

**响应新增字段**:
```json
{
  "id": "v_xxx",
  "word": "register",
  "meanings": [
    {
      "id": "wm_xxx",
      "partOfSpeech": "n.",
      "meaning": "登记，注册；登记表，注册簿",
      "orderIndex": 0,
      "examples": []
    },
    {
      "id": "wm_xxx",
      "partOfSpeech": "v.",
      "meaning": "注册，登记，记录，挂号",
      "orderIndex": 1,
      "examples": []
    }
  ]
}
```

## 📝 待完成任务

- [x] 设计数据模型
- [x] 创建数据库表
- [x] 更新Prisma schema
- [x] 创建导入脚本
- [ ] 获取PDF数据
- [ ] 执行数据库迁移
- [ ] 导入数据
- [ ] 更新前端UI
- [ ] 更新API接口
- [ ] 更新小程序

## 💡 数据提供方式

**请您选择以下方式之一提供数据：**

1. **提取部分数据**: 复制PDF中前10-20个单词的数据，粘贴为文本
2. **截图**: 提供PDF页面截图，我来手动转换
3. **Excel/CSV**: 如果有Excel版本更方便
4. **分批处理**: 先处理一小部分验证流程，然后批量处理

**数据格式要求**:
- 单词（英文）
- 音标（可选）
- 词性 + 释义（可以有多个）

---

**创建时间**: 2025-11-17  
**维护者**: AI Assistant
