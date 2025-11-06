# 词汇管理增强功能使用指南

## 📋 功能概述

本次更新为词汇管理系统增加了以下功能：

1. **音标信息** - 支持英式/美式音标可选展示
2. **发音音频** - 集成开源音频资源,支持点击播放
3. **实物图片匹配** - 为单词添加图片辅助记忆

---

## 🗂️ 数据源

### 1. ECDICT 词典数据库
- **项目地址**: https://github.com/skywind3000/ECDICT
- **数据内容**: 音标、词性、翻译、词频等
- **数据规模**: 数十万条英汉词汇

### 2. English Words Pronunciation MP3
- **项目地址**: https://github.com/thousandlemons/English-words-pronunciation-mp3-audio-download
- **数据内容**: 119,376个单词的MP3发音文件
- **音频格式**: MP3, 美式发音为主

---

## 🚀 快速开始

### 步骤 1: 下载外部数据源

```bash
cd web-admin

# 下载ECDICT音标数据
node scripts/fetch-ecdict-data.js

# 下载音频URL数据
node scripts/fetch-audio-data.js
```

执行后会在 `web-admin/data/` 目录下生成：
- `ecdict.csv` - ECDICT词典数据
- `audio-data.json` - 音频URL映射表

### 步骤 2: 批量导入到数据库

```bash
# 批量导入所有缺少音标的词汇（推荐）
node scripts/import-phonetic-and-audio.js

# 或导入指定单词
node scripts/import-phonetic-and-audio.js hello world example
```

导入过程会：
1. ✅ 为词汇添加音标（phonetic, phoneticUS, phoneticUK）
2. ✅ 创建WordAudio记录关联音频URL
3. ✅ 自动跳过已存在的数据

---

## 📱 前端组件使用

### 1. 音频播放器 (AudioPlayer)

```tsx
import AudioPlayer from '@/components/AudioPlayer';

<AudioPlayer
  audioUrl="https://example.com/audio.mp3"
  accent="US"  // 'US' 或 'UK'
  word="hello"
  size="middle"
  showAccent={true}
/>
```

### 2. 音频管理器 (AudioManager)

```tsx
import AudioManager from '@/components/AudioManager';

<AudioManager
  vocabularyId="词汇ID"
  word="单词"
/>
```

功能包括：
- 📝 添加/编辑/删除音频
- 🎵 在线播放测试
- 🏷️ 标记英式/美式

### 3. 图片管理器 (ImageManager)

```tsx
import ImageManager from '@/components/ImageManager';

<ImageManager
  vocabularyId="词汇ID"
  word="单词"
/>
```

功能包括：
- 🖼️ 添加/编辑/删除图片
- 👁️ 图片预览
- 📝 图片描述

---

## 🔌 API 接口说明

### 音频管理 API

#### 获取词汇音频列表
```
GET /api/vocabularies/{id}/audios
```

#### 添加音频
```
POST /api/vocabularies/{id}/audios
Content-Type: application/json

{
  "audioUrl": "https://example.com/audio.mp3",
  "accent": "US",  // "US" 或 "UK"
  "duration": 2    // 可选，秒
}
```

#### 更新音频
```
PUT /api/vocabularies/{id}/audios/{audioId}
Content-Type: application/json

{
  "audioUrl": "https://example.com/new-audio.mp3",
  "accent": "UK",
  "duration": 3
}
```

#### 删除音频
```
DELETE /api/vocabularies/{id}/audios/{audioId}
```

### 图片管理 API

#### 获取词汇图片列表
```
GET /api/vocabularies/{id}/images
```

#### 添加图片
```
POST /api/vocabularies/{id}/images
Content-Type: application/json

{
  "imageUrl": "https://example.com/image.jpg",
  "description": "图片描述（可选）"
}
```

#### 更新图片
```
PUT /api/vocabularies/{id}/images/{imageId}
Content-Type: application/json

{
  "imageUrl": "https://example.com/new-image.jpg",
  "description": "新的描述"
}
```

#### 删除图片
```
DELETE /api/vocabularies/{id}/images/{imageId}
```

---

## 📊 数据库结构

### Vocabulary 表（词汇）
```prisma
model Vocabulary {
  // ... 其他字段
  phonetic        String?    // 通用音标
  phoneticUS      String?    // 美式音标
  phoneticUK      String?    // 英式音标
  audioUrl        String?    // 主音频URL（已废弃，使用WordAudio）
  
  audios          WordAudio[]  // 关联的音频
  images          WordImage[]  // 关联的图片
}
```

### WordAudio 表（音频）
```prisma
model WordAudio {
  id           String
  vocabularyId String
  audioUrl     String       // 音频URL
  accent       String       // 'US' 或 'UK'
  duration     Int?         // 时长（秒）
  createdAt    DateTime
}
```

### WordImage 表（图片）
```prisma
model WordImage {
  id           String
  vocabularyId String
  imageUrl     String       // 图片URL
  description  String?      // 描述
  createdAt    DateTime
}
```

---

## 💡 使用建议

### 1. 音频资源
- 使用开源音频数据库可以快速为大量单词添加发音
- 对于特殊词汇，可以手动上传自定义音频
- 建议同时提供英式和美式发音供学生选择

### 2. 图片资源
- 优先使用描述性强的实物图片
- 图片URL建议使用CDN或OSS服务
- 为图片添加描述，便于搜索和理解

### 3. 批量导入
- 首次导入建议分批进行（limit参数控制）
- 定期检查并更新缺失的音标和音频
- 可以为新增词汇单独运行导入脚本

### 4. 前端展示
- 在词汇列表中显示音标和播放按钮
- 在词汇详情页集成AudioManager和ImageManager
- 在练习题中使用AudioPlayer组件

---

## 🔍 故障排查

### 问题1: 下载数据失败
```bash
# 检查网络连接
curl -I https://raw.githubusercontent.com

# 手动下载数据文件
# ECDICT: https://github.com/skywind3000/ECDICT/raw/master/ecdict.mini.csv
# Audio: https://github.com/thousandlemons/English-words-pronunciation-mp3-audio-download/raw/master/data.json
```

### 问题2: 找不到单词的音标/音频
- ECDICT和音频数据库不是100%覆盖所有词汇
- 对于未找到的单词，可以手动添加
- 检查单词拼写是否正确

### 问题3: 音频播放失败
- 检查音频URL是否可访问
- 确认音频格式浏览器支持（MP3/WAV）
- 查看浏览器控制台错误信息

---

## 📝 TODO 清单

未来可以增强的功能：

- [ ] 支持音频文件直接上传（需要OSS集成）
- [ ] 支持图片文件直接上传
- [ ] 音频自动时长检测
- [ ] 图片智能推荐（基于单词含义）
- [ ] 批量导入时显示进度条
- [ ] 音频和图片的预览功能
- [ ] 支持多个图片的轮播展示

---

## 📚 参考资源

- [ECDICT 项目文档](https://github.com/skywind3000/ECDICT/blob/master/README.md)
- [English Words Pronunciation 项目](https://github.com/thousandlemons/English-words-pronunciation-mp3-audio-download)
- [Prisma 文档](https://www.prisma.io/docs)
- [Ant Design 组件库](https://ant.design/components/overview-cn/)

---

## 🎉 完成

恭喜！你已经成功为词汇管理系统添加了音标、音频和图片功能。

如有任何问题，请查看项目文档或提交Issue。
