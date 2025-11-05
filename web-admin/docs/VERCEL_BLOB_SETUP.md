# Vercel Blob Storage 配置指南

## 简介

本项目使用 Vercel Blob Storage 来存储和管理词汇的音频和图片文件。Vercel Blob 提供了简单、快速的文件存储解决方案。

## 配置步骤

### 1. 创建 Vercel Blob Store

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 **Storage** 标签页
4. 点击 **Create Database** 或 **Connect Store**
5. 选择 **Blob** 类型
6. 给你的 Blob store 命名（例如：`vocab-files`）
7. 点击 **Create**

### 2. 获取访问令牌

创建完成后，Vercel 会自动生成一个 `BLOB_READ_WRITE_TOKEN` 环境变量。

你可以在以下位置找到它：
- 项目设置 → Environment Variables
- 或在 Storage 页面中直接查看

### 3. 配置本地开发环境

1. 复制 `.env.example` 为 `.env.local`:
```bash
cp .env.example .env.local
```

2. 在 `.env.local` 中添加你的 Blob token:
```env
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_XXXXXXXXXXXXX"
```

⚠️ **重要**: 不要将 `.env.local` 提交到 Git 仓库中！

### 4. 生产环境配置

在 Vercel 项目设置中，环境变量会自动注入，无需手动配置。

如果你使用其他部署平台，需要手动添加 `BLOB_READ_WRITE_TOKEN` 环境变量。

## 功能特性

### 支持的文件类型

- **音频文件**: `.mp3`, `.wav`, `.ogg`
- **图片文件**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`

### 文件大小限制

- 单个文件最大: **10 MB**
- 如需更大文件支持，可在 `app/api/upload/route.ts` 中修改 `maxSize` 配置

### 文件命名规则

上传的文件会自动重命名为以下格式：
```
{type}/{timestamp}-{random}.{extension}
```

示例：
- `audio/1703123456789-abc123.mp3`
- `image/1703123456789-xyz789.jpg`

## API 接口

### 上传文件
```typescript
POST /api/upload
Headers: Authorization: Bearer {token}
Body: FormData
  - file: File
  - type: 'audio' | 'image'
```

### 获取词汇文件列表
```typescript
GET /api/vocabularies/{id}/files?type=audio|image|all
Headers: Authorization: Bearer {token}
```

### 删除文件
```typescript
DELETE /api/vocabularies/{id}/files/{fileId}
Headers: Authorization: Bearer {token}
```

## 使用示例

### 前端上传音频

```typescript
const formData = new FormData()
formData.append('file', audioFile)
formData.append('type', 'audio')

const response = await fetch('/api/upload', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
})

const result = await response.json()
if (result.success) {
  console.log('上传成功:', result.data.url)
}
```

### 前端播放音频

```tsx
<audio controls src={audioUrl}>
  您的浏览器不支持音频播放
</audio>
```

### 前端显示图片

```tsx
import { Image } from 'antd'

<Image
  src={imageUrl}
  alt="词汇配图"
  style={{ width: 200, height: 150, objectFit: 'cover' }}
/>
```

## 故障排查

### 错误: "文件存储服务未配置"

**原因**: 缺少 `BLOB_READ_WRITE_TOKEN` 环境变量

**解决方案**:
1. 确认 `.env.local` 文件中有正确的 token
2. 重启开发服务器: `npm run dev`
3. 检查 token 是否有效（未过期）

### 错误: "上传失败"

**可能原因**:
1. 文件大小超过限制（10MB）
2. 文件类型不支持
3. 网络连接问题
4. Token 权限不足

**解决方案**:
1. 检查文件大小和类型
2. 查看浏览器控制台的详细错误信息
3. 确认网络连接正常
4. 重新生成并配置 token

### 错误: "删除失败"

**可能原因**:
1. 文件已被删除
2. Token 权限不足
3. 数据库记录不存在

**解决方案**:
1. 刷新页面重新加载文件列表
2. 检查 token 权限
3. 查看服务器日志获取详细错误信息

## 费用说明

Vercel Blob Storage 定价:
- **Hobby 计划**: 免费 1GB 存储
- **Pro 计划**: 100GB 存储
- 超出部分按使用量计费

详细定价: https://vercel.com/docs/storage/vercel-blob/usage-and-pricing

## 最佳实践

1. **图片优化**: 上传前压缩图片以节省存储空间
2. **音频格式**: 推荐使用 MP3 格式（压缩比好，兼容性强）
3. **定期清理**: 删除不再使用的文件以释放空间
4. **备份策略**: 定期备份重要的音频和图片文件
5. **权限控制**: 仅教师账号可上传和删除文件

## 相关资源

- [Vercel Blob 官方文档](https://vercel.com/docs/storage/vercel-blob)
- [@vercel/blob NPM 包](https://www.npmjs.com/package/@vercel/blob)
- [Vercel Dashboard](https://vercel.com/dashboard)
