# pronunciation 索引
> 单词发音服务，提供音标和音频URL

⚠️ 文件夹变化时请更新此文件

| 文件 | 功能 |
|------|------|
| [word]/route.ts | 获取单个单词发音（调用 Free Dictionary API） |
| batch-update/route.ts | 批量获取并更新单词音频URL |

## API 说明

### GET /api/pronunciation/{word}
获取单词的音标和音频URL

**响应示例：**
```json
{
  "success": true,
  "data": {
    "word": "run",
    "phonetic": "/ɹʌn/",
    "phoneticUS": "/ɹʌn/",
    "phoneticUK": "/ɹʊn/",
    "audioUS": "https://api.dictionaryapi.dev/media/pronunciations/en/run-us.mp3",
    "audioUK": "https://api.dictionaryapi.dev/media/pronunciations/en/run-au.mp3"
  }
}
```

### POST /api/pronunciation/batch-update
批量获取并更新数据库中单词的音频URL（需要教师权限）

**请求体：**
```json
{
  "prefix": "r",  // 可选，按首字母筛选
  "limit": 50     // 可选，每次处理数量，默认50
}
```
