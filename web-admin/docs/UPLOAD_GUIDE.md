# 音频和图片上传使用指南

本文档介绍如何使用 Vercel Blob 存储直接上传音频和图片文件。

## 功能概述

AudioManager 和 ImageManager 组件现在支持两种上传方式:

1. **文件直接上传** (推荐) - 从本地选择文件直接上传到 Vercel Blob
2. **URL 输入** - 手动输入已存在的文件 URL

## 环境配置

### 1. 本地开发环境

确保 `.env.local` 文件包含 Vercel Blob Token:

```env
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_XXXXXXXXXXXXX"
```

### 2. 生产环境

Vercel 会自动注入 `BLOB_READ_WRITE_TOKEN` 环境变量,无需手动配置。

## 使用方法

### 音频上传

1. 在词汇详情页,点击 "多媒体资源" 卡片
2. 切换到 "音频管理" Tab
3. 点击 "添加音频" 按钮
4. 选择上传方式:
   - **上传文件**: 点击选择音频文件(MP3, WAV, OGG)
   - **输入URL**: 手动输入音频 URL
5. 选择口音(美式/英式)
6. 点击 "保存"

**支持格式**:
- MP3 (.mp3)
- WAV (.wav)
- OGG (.ogg)

**文件大小限制**: 10 MB

### 图片上传

1. 在词汇详情页,点击 "多媒体资源" 卡片
2. 切换到 "图片管理" Tab
3. 点击 "添加图片" 按钮
4. 选择上传方式:
   - **上传文件**: 点击上传区域选择图片
   - **输入URL**: 手动输入图片 URL
5. (可选)添加图片描述
6. 点击 "保存"

**支持格式**:
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

**文件大小限制**: 10 MB

## 技术实现

### 上传流程

```
用户选择文件 
    ↓
前端验证(大小、格式)
    ↓
调用 /api/upload 接口
    ↓
上传到 Vercel Blob
    ↓
获取文件 URL
    ↓
保存到数据库
```

### API 接口

#### 上传文件

```typescript
POST /api/upload
Headers: 
  Authorization: Bearer {token}
Body (FormData):
  - file: File
  - type: 'audio' | 'image'

Response:
{
  "success": true,
  "data": {
    "url": "https://xxx.public.blob.vercel-storage.com/audio/xxx.mp3",
    "filename": "example.mp3",
    "size": 1234567,
    "type": "audio/mpeg"
  },
  "message": "文件上传成功"
}
```

#### 删除文件

```typescript
DELETE /api/upload?url={fileUrl}
Headers:
  Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "文件删除成功"
}
```

### 组件使用

#### AudioManager

```tsx
import AudioManager from '@/components/AudioManager';

<AudioManager 
  vocabularyId={vocabularyId} 
  word="hello" 
/>
```

#### ImageManager

```tsx
import ImageManager from '@/components/ImageManager';

<ImageManager 
  vocabularyId={vocabularyId} 
  word="hello" 
/>
```

## 最佳实践

### 1. 音频优化

- **格式选择**: 推荐使用 MP3 格式(压缩比好,兼容性强)
- **比特率**: 推荐 128 kbps(音质与文件大小的平衡)
- **采样率**: 44.1 kHz 或 48 kHz
- **时长**: 单个单词发音通常 1-3 秒

### 2. 图片优化

- **格式选择**: 
  - 照片: JPEG(文件小)
  - 插图/透明背景: PNG
  - 动画: GIF
- **尺寸**: 建议 800x600 像素以内
- **压缩**: 上传前使用工具压缩(TinyPNG, ImageOptim 等)
- **文件大小**: 建议控制在 500KB 以内

### 3. 文件命名

系统会自动生成唯一文件名,格式为:
```
{type}/{timestamp}-{random}.{extension}
```

示例:
- `audio/1703123456789-abc123.mp3`
- `image/1703123456789-xyz789.jpg`

### 4. 存储管理

- **定期清理**: 删除不再使用的文件
- **备份**: 重要文件建议本地备份
- **监控**: 定期检查 Vercel Blob 存储使用量

## 故障排查

### 上传失败

**问题**: 点击保存后显示 "上传失败"

**可能原因**:
1. 文件大小超过 10MB
2. 文件格式不支持
3. 网络连接问题
4. Token 无效或过期

**解决方案**:
1. 检查文件大小: `文件属性 → 详细信息`
2. 确认文件格式符合要求
3. 检查网络连接
4. 查看浏览器控制台错误信息
5. 重新配置 `BLOB_READ_WRITE_TOKEN`

### Token 配置错误

**问题**: "文件存储服务未配置"

**解决方案**:
1. 确认 `.env.local` 包含正确的 Token
2. 重启开发服务器: `npm run dev`
3. 检查 Vercel Dashboard 中 Token 是否有效

### 文件无法播放/显示

**问题**: 文件上传成功但无法播放或显示

**可能原因**:
1. 文件已被删除
2. URL 无效
3. 浏览器不支持该格式
4. CORS 问题

**解决方案**:
1. 在新标签页直接访问文件 URL 确认可访问
2. 尝试使用不同浏览器
3. 检查浏览器控制台错误信息
4. 重新上传文件

## 费用说明

### Vercel Blob Storage 定价

- **Hobby 计划**: 1GB 免费存储
- **Pro 计划**: 100GB 存储
- 超出部分按使用量计费

### 存储容量估算

**音频文件**:
- MP3 (128 kbps): 约 1MB/分钟
- 单词发音(2秒): 约 32KB
- 1GB 可存储约 30,000 个单词发音

**图片文件**:
- 压缩后 JPEG: 50-200KB
- PNG: 100-500KB
- 1GB 可存储约 2,000-20,000 张图片

## 安全性

### 访问控制

- 上传和删除文件需要教师权限
- Token 存储在环境变量中,不会暴露给客户端
- 文件 URL 是公开的,任何人都可以访问

### 数据隐私

- 上传的文件存储在 Vercel Blob(美国服务器)
- 文件 URL 包含随机字符串,难以猜测
- 删除文件时会从 Vercel Blob 彻底删除

## 相关资源

- [Vercel Blob 官方文档](https://vercel.com/docs/storage/vercel-blob)
- [Vercel Blob 定价](https://vercel.com/docs/storage/vercel-blob/usage-and-pricing)
- [音频格式对比](https://en.wikipedia.org/wiki/Audio_file_format)
- [图片优化工具](https://tinypng.com/)

## 常见问题 (FAQ)

### Q1: 可以批量上传文件吗?

A: 目前不支持批量上传。每次只能上传一个文件。如需批量导入,请使用数据导入脚本。

### Q2: 上传的文件可以修改吗?

A: 文件上传后 URL 不可修改。如需更换文件,请删除旧文件后重新上传。

### Q3: 文件会自动备份吗?

A: Vercel Blob 有自动备份机制,但建议重要文件在本地保留副本。

### Q4: 可以上传视频吗?

A: 目前不支持视频上传。如需视频,建议使用 YouTube 等视频平台,然后嵌入 URL。

### Q5: 为什么编辑时不能重新上传文件?

A: 编辑时只能修改元数据(如口音、描述),不能替换文件。如需更换文件,请删除后重新添加。

## 开发说明

### 修改文件大小限制

编辑 `app/api/upload/route.ts`:

```typescript
const maxSize = 20 * 1024 * 1024; // 改为 20MB
```

### 添加新文件类型

编辑 `app/api/upload/route.ts`:

```typescript
const allowedTypes: Record<string, string[]> = {
  audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'], // 添加 m4a
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'], // 添加 svg
  // ...
};
```

### 自定义上传逻辑

参考 `AudioManager.tsx` 和 `ImageManager.tsx` 中的 `handleUploadFile` 方法。
