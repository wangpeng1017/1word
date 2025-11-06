# OSS集成方案 - 音频和图片直接上传

## 📋 概述

为了支持音频和图片文件的直接上传，本文档提供了OSS（对象存储服务）的集成方案。

---

## 🎯 推荐方案

### 方案1: 阿里云OSS（生产环境推荐）⭐

#### 优势
- ✅ 国内访问速度快
- ✅ 价格合理（存储+流量）
- ✅ 完善的SDK支持
- ✅ 支持图片处理、音视频转码
- ✅ 可与阿里云其他服务集成

#### 实施步骤

##### 1. 安装依赖
```bash
cd web-admin
npm install ali-oss @types/ali-oss
```

##### 2. 创建OSS配置文件
```typescript
// lib/oss-config.ts
export const ossConfig = {
  region: process.env.OSS_REGION || 'oss-cn-shanghai',
  accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
  bucket: process.env.OSS_BUCKET || 'vocab-media',
};
```

##### 3. 创建OSS上传API
```typescript
// app/api/upload/oss/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OSS from 'ali-oss';
import { ossConfig } from '@/lib/oss-config';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'audio' | 'image'
    
    if (!file) {
      return NextResponse.json({ error: '文件不能为空' }, { status: 400 });
    }

    // 初始化OSS客户端
    const client = new OSS(ossConfig);

    // 生成文件名
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const filename = `${type}/${timestamp}-${Math.random().toString(36).slice(2)}.${ext}`;

    // 读取文件为Buffer
    const buffer = await file.arrayBuffer();

    // 上传到OSS
    const result = await client.put(filename, Buffer.from(buffer));

    return NextResponse.json({
      success: true,
      data: {
        url: result.url,
        filename: file.name,
        size: file.size,
        type: file.type,
      }
    });

  } catch (error: any) {
    console.error('OSS上传失败:', error);
    return NextResponse.json(
      { error: error.message || '上传失败' },
      { status: 500 }
    );
  }
}
```

##### 4. 创建前端上传组件
```typescript
// components/OSSUpload.tsx
'use client';

import { Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';

interface OSSUploadProps {
  type: 'audio' | 'image';
  onSuccess?: (url: string) => void;
  accept?: string;
}

export default function OSSUpload({ type, onSuccess, accept }: OSSUploadProps) {
  const customRequest: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess: uploadSuccess, onError } = options;

    try {
      const formData = new FormData();
      formData.append('file', file as File);
      formData.append('type', type);

      const response = await fetch('/api/upload/oss', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        message.success('上传成功');
        uploadSuccess?.(result.data, file as any);
        onSuccess?.(result.data.url);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      message.error(error.message || '上传失败');
      onError?.(error);
    }
  };

  return (
    <Upload
      customRequest={customRequest}
      accept={accept}
      showUploadList={false}
    >
      <Button icon={<UploadOutlined />}>上传文件</Button>
    </Upload>
  );
}
```

##### 5. 环境变量配置
```bash
# .env.local
OSS_REGION=oss-cn-shanghai
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_BUCKET=vocab-media
```

---

### 方案2: Vercel Blob Storage（开发环境推荐）

#### 优势
- ✅ 与Vercel无缝集成
- ✅ 简单易用，无需配置
- ✅ 自动CDN加速
- ✅ 按需付费

#### 实施步骤

##### 1. 安装依赖
```bash
npm install @vercel/blob
```

##### 2. 创建上传API
```typescript
// app/api/upload/vercel-blob/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ error: '文件不能为空' }, { status: 400 });
    }

    // 上传到Vercel Blob
    const blob = await put(file.name, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        url: blob.url,
        filename: file.name,
        size: file.size,
      }
    });

  } catch (error: any) {
    console.error('上传失败:', error);
    return NextResponse.json(
      { error: error.message || '上传失败' },
      { status: 500 }
    );
  }
}
```

##### 3. 环境变量
```bash
# Vercel会自动注入这个变量
BLOB_READ_WRITE_TOKEN=your_token
```

---

### 方案3: 本地存储 + Nginx（测试环境）

#### 适用场景
- 开发测试环境
- 小规模部署
- 无法使用云服务

#### 实施步骤

##### 1. 创建本地上传API
```typescript
// app/api/upload/local/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ error: '文件不能为空' }, { status: 400 });
    }

    // 保存到public目录
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const filename = `${type}-${timestamp}.${ext}`;
    const filepath = path.join(process.cwd(), 'public', 'uploads', type, filename);

    await writeFile(filepath, buffer);

    return NextResponse.json({
      success: true,
      data: {
        url: `/uploads/${type}/${filename}`,
        filename: file.name,
        size: file.size,
      }
    });

  } catch (error: any) {
    console.error('上传失败:', error);
    return NextResponse.json(
      { error: error.message || '上传失败' },
      { status: 500 }
    );
  }
}
```

---

## 💰 成本对比

| 方案 | 存储成本 | 流量成本 | 适用场景 |
|------|---------|---------|---------|
| 阿里云OSS | ¥0.12/GB/月 | ¥0.5/GB | 生产环境 |
| Vercel Blob | $0.15/GB/月 | 含在流量中 | 小型项目 |
| 本地存储 | 服务器成本 | 带宽成本 | 测试环境 |

---

## 🚀 推荐实施方案

### 阶段1: Demo阶段（当前）
使用 **Vercel Blob Storage** 或 **本地存储**
- 快速实现
- 无需复杂配置
- 满足演示需求

### 阶段2: 生产阶段
迁移到 **阿里云OSS**
- 成本更低
- 性能更好
- 功能更丰富

---

## 📝 集成清单

### 前端改造
- [ ] 安装OSS相关依赖
- [ ] 创建OSSUpload组件
- [ ] 修改AudioManager使用OSSUpload
- [ ] 修改ImageManager使用OSSUpload

### 后端改造
- [ ] 创建/api/upload/oss路由
- [ ] 配置OSS客户端
- [ ] 添加文件类型验证
- [ ] 添加文件大小限制

### 配置
- [ ] 申请OSS账号
- [ ] 创建Bucket
- [ ] 配置CORS规则
- [ ] 设置环境变量

### 数据库
- [ ] 保持现有WordAudio和WordImage表结构
- [ ] audioUrl/imageUrl存储OSS返回的完整URL

---

## 🔒 安全建议

### 1. 文件类型限制
```typescript
const allowedAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3'];
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
```

### 2. 文件大小限制
```typescript
const maxAudioSize = 10 * 1024 * 1024; // 10MB
const maxImageSize = 5 * 1024 * 1024;  // 5MB
```

### 3. AccessKey保护
- 使用环境变量存储
- 不要提交到Git
- 定期轮换密钥

### 4. 防盗链配置
在OSS控制台配置Referer白名单

---

## 📚 相关文档

- [阿里云OSS文档](https://help.aliyun.com/product/31815.html)
- [Vercel Blob文档](https://vercel.com/docs/storage/vercel-blob)
- [ali-oss SDK](https://github.com/ali-sdk/ali-oss)

---

## 💡 下一步行动

1. **选择方案**: 根据当前阶段选择合适的方案
2. **创建测试**: 先在测试环境验证
3. **集成到项目**: 按清单逐步集成
4. **文档更新**: 更新用户使用文档

**推荐**: 先使用Vercel Blob快速实现，生产环境再迁移到阿里云OSS。
