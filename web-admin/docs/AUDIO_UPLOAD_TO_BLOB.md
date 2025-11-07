# 音频上传到 Vercel Blob 指南

## 概述

本文档介绍如何将单词音频文件上传到 Vercel Blob 存储，并更新数据库中的 `audioUrl` 字段。

## 前置要求

### 1. 确保已安装依赖

```bash
cd web-admin
npm install
```

### 2. 配置 Vercel Blob Token

在 `web-admin/.env.local` 文件中添加：

```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_your_token_here
```

获取 Token 的步骤：
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 Storage 选项卡
4. 创建或选择一个 Blob Store
5. 复制 `BLOB_READ_WRITE_TOKEN`

### 3. 下载音频数据索引

```bash
npm run data:fetch-audio
```

这会下载包含 119,376 个单词音频链接的索引文件到 `web-admin/data/audio-data.json`。

## 使用方法

### 方式 1: 上传数据库中的前 20 个单词

```bash
npm run audio:upload-to-blob
```

或者使用 `--from-db` 参数指定数量：

```bash
npm run audio:upload-to-blob -- --from-db 50
```

### 方式 2: 上传指定的单词列表

```bash
npm run audio:upload-to-blob -- hello world ambitious adapt adopt
```

### 方式 3: 直接运行脚本

```bash
node scripts/upload-audio-to-blob.js word1 word2 word3
```

## 工作流程

脚本会自动执行以下步骤：

1. **查找音频源**
   - 从 `data/audio-data.json` 中查找单词的音频 URL
   - 支持 119,376 个英文单词

2. **下载音频文件**
   - 从 Google Static CDN 下载 MP3 音频
   - 源地址：`https://ssl.gstatic.com/dictionary/static/sounds/oxford/`

3. **上传到 Vercel Blob**
   - 文件路径格式：`audio/words/{word}.mp3`
   - 设置为公开访问
   - 自动设置 MIME 类型为 `audio/mpeg`

4. **更新数据库**
   - 将 Blob URL 写入 `vocabularies.audioUrl` 字段
   - 如果单词不在数据库中，仅上传文件

## 输出示例

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

============================================================
📊 上传结果汇总
============================================================
✅ 成功: 18
❌ 失败: 1
⚠️  未找到: 1

成功上传的单词:
  1. hello - https://xxxxx.blob.vercel-storage.com/audio/words/hello.mp3
  2. world - https://xxxxx.blob.vercel-storage.com/audio/words/world.mp3
  ...
```

## 注意事项

### 速率限制
- 脚本在每个单词处理之间添加了 500ms 延迟
- 避免触发 API 速率限制

### 文件命名
- 所有文件名统一使用小写
- 格式：`audio/words/{word}.mp3`

### 错误处理
- 如果单词在音频数据库中找不到，会跳过该单词
- 下载失败会记录错误并继续处理下一个
- 所有结果在最后统一汇总显示

### 存储成本
- Vercel Blob 免费额度：100 GB 存储 + 100 GB 带宽/月
- 平均每个音频文件约 10-20 KB
- 1000 个单词约占用 10-20 MB

## 数据库结构

音频 URL 存储在 `vocabularies` 表中：

```prisma
model Vocabulary {
  id              String   @id @default(cuid())
  word            String   @unique
  audioUrl        String?  @map("audio_url")  // 存储 Blob URL
  // ... 其他字段
}
```

## 故障排查

### 问题 1: `BLOB_READ_WRITE_TOKEN` 未配置

**错误信息**：
```
❌ 缺少 BLOB_READ_WRITE_TOKEN 环境变量
```

**解决方案**：
在 `.env.local` 中添加 Token。

### 问题 2: 音频数据文件不存在

**错误信息**：
```
❌ 音频数据文件不存在，请先运行: npm run data:fetch-audio
```

**解决方案**：
```bash
npm run data:fetch-audio
```

### 问题 3: 下载超时

**可能原因**：
- 网络问题
- Google CDN 访问受限

**解决方案**：
- 检查网络连接
- 使用代理或 VPN
- 稍后重试

## 高级用法

### 批量上传所有单词

```bash
# 获取所有单词并上传（需要修改脚本中的 limit）
node scripts/upload-audio-to-blob.js --from-db 1000
```

### 仅上传缺失音频的单词

修改脚本中的查询条件：

```javascript
const words = await prisma.vocabulary.findMany({
  where: {
    audioUrl: null,  // 只查询没有音频的单词
  },
  take: limit,
  select: {
    word: true,
  },
});
```

## 相关文档

- [Vercel Blob 官方文档](https://vercel.com/docs/storage/vercel-blob)
- [音频数据源](https://github.com/thousandlemons/English-words-pronunciation-mp3-audio-download)
- [项目上传 API 文档](./UPLOAD_GUIDE.md)
