# 快速开始：上传 20 个单词音频到 Vercel Blob

## 一键执行步骤

### 1. 进入项目目录

```bash
cd E:\trae\1单词\web-admin
```

### 2. 配置环境变量

创建或编辑 `.env.local` 文件：

```bash
# 复制示例文件
copy .env.example .env.local

# 然后编辑 .env.local，添加你的 Vercel Blob Token
# BLOB_READ_WRITE_TOKEN=vercel_blob_rw_your_token_here
```

**获取 Token**：
- 访问：https://vercel.com/dashboard
- 选择项目 → Storage → 创建/选择 Blob Store
- 复制 `BLOB_READ_WRITE_TOKEN`

### 3. 下载音频数据索引（仅首次需要）

```bash
npm run data:fetch-audio
```

这会下载 119,376 个单词的音频链接索引。

### 4. 上传音频到 Vercel Blob

**方式 A：上传数据库中的前 20 个单词**
```bash
npm run audio:upload-to-blob
```

**方式 B：上传指定单词**
```bash
npm run audio:upload-to-blob -- hello world love happy sad angry beautiful ugly
```

**方式 C：上传更多单词（比如 50 个）**
```bash
npm run audio:upload-to-blob -- --from-db 50
```

## 示例：上传常用单词

```bash
npm run audio:upload-to-blob -- hello goodbye thank sorry please welcome morning evening good bad
```

## 预期输出

```
🎵 开始批量上传音频到 Vercel Blob

待处理单词数: 20

[1/20] 处理单词: hello
  源音频: https://ssl.gstatic.com/dictionary/static/sounds/oxford/hello--_us_1.mp3
  ⬇️ 下载中...
  ✅ 下载完成 (12.34 KB)
  ⬆️ 上传到 Vercel Blob...
  ✅ 上传成功: https://xxxxx.public.blob.vercel-storage.com/audio/words/hello.mp3
  💾 更新数据库...
  ✅ 数据库更新成功

...

============================================================
📊 上传结果汇总
============================================================
✅ 成功: 20
❌ 失败: 0
⚠️  未找到: 0

成功上传的单词:
  1. hello - https://xxxxx.blob.vercel-storage.com/audio/words/hello.mp3
  2. world - https://xxxxx.blob.vercel-storage.com/audio/words/world.mp3
  ...
```

## 验证上传结果

### 方法 1：在数据库中检查

```sql
SELECT word, audioUrl FROM vocabularies WHERE audioUrl IS NOT NULL LIMIT 20;
```

### 方法 2：在前端测试播放

1. 启动开发服务器：`npm run dev`
2. 访问词汇管理页面
3. 点击单词的音频播放按钮

### 方法 3：直接访问 Blob URL

复制输出中的 URL，在浏览器中打开即可播放。

## 常见问题

### Q1: 提示 "BLOB_READ_WRITE_TOKEN 未配置"
**A**: 检查 `.env.local` 文件是否存在，Token 是否正确配置。

### Q2: 提示 "音频数据文件不存在"
**A**: 运行 `npm run data:fetch-audio` 下载音频索引。

### Q3: 某些单词上传失败
**A**: 可能该单词在音频库中不存在，或网络问题。查看输出的失败列表。

### Q4: 想上传所有单词
**A**: 分批上传，避免一次性处理过多：
```bash
npm run audio:upload-to-blob -- --from-db 100
```

## 成本估算

- **Vercel Blob 免费额度**：100 GB 存储 + 100 GB 带宽/月
- **平均音频大小**：10-20 KB/个
- **1000 个单词**：约 10-20 MB
- **10000 个单词**：约 100-200 MB

20 个单词完全在免费额度内，无需担心成本。

## 下一步

- 查看完整文档：`web-admin/docs/AUDIO_UPLOAD_TO_BLOB.md`
- 集成到前端播放器
- 设置定期批量上传任务
- 添加音频质量验证

## 脚本位置

- **上传脚本**：`web-admin/scripts/upload-audio-to-blob.js`
- **音频索引**：`web-admin/data/audio-data.json`
- **配置文件**：`web-admin/.env.local`
