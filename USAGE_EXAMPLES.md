# 词汇管理增强功能使用示例

## 🎯 快速上手

### 1. 安装依赖并初始化数据

```bash
cd web-admin

# 安装依赖
npm install

# 推送数据库schema
npm run db:push
```

### 2. 下载外部数据源

```bash
# 方式1: 使用npm scripts（推荐）
npm run data:fetch-ecdict   # 下载ECDICT音标数据
npm run data:fetch-audio     # 下载音频URL数据

# 方式2: 直接运行脚本
node scripts/fetch-ecdict-data.js
node scripts/fetch-audio-data.js
```

### 3. 批量导入数据到数据库

```bash
# 方式1: 使用npm script
npm run data:import-all

# 方式2: 指定参数运行
node scripts/import-phonetic-and-audio.js

# 方式3: 只导入指定单词
node scripts/import-phonetic-and-audio.js hello world example
```

---

## 📝 代码示例

### 示例1: 在词汇详情页集成音频和图片管理

创建文件: `web-admin/src/app/admin/vocabularies/[id]/page.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, Space } from 'antd';
import AudioManager from '@/components/AudioManager';
import ImageManager from '@/components/ImageManager';

export default function VocabularyDetailPage({ params }: { params: { id: string } }) {
  const [vocabulary, setVocabulary] = useState<any>(null);

  useEffect(() => {
    fetchVocabulary();
  }, [params.id]);

  const fetchVocabulary = async () => {
    const response = await fetch(`/api/vocabularies/${params.id}`);
    const data = await response.json();
    setVocabulary(data.data);
  };

  if (!vocabulary) return <div>加载中...</div>;

  return (
    <div style={{ padding: 24 }}>
      <Card title={`词汇详情: ${vocabulary.word}`}>
        <Descriptions column={2}>
          <Descriptions.Item label="单词">{vocabulary.word}</Descriptions.Item>
          <Descriptions.Item label="词性">
            {vocabulary.partOfSpeech.map((pos: string) => (
              <Tag key={pos}>{pos}</Tag>
            ))}
          </Descriptions.Item>
          
          <Descriptions.Item label="核心释义">{vocabulary.primaryMeaning}</Descriptions.Item>
          <Descriptions.Item label="延伸释义">{vocabulary.secondaryMeaning || '-'}</Descriptions.Item>
          
          <Descriptions.Item label="音标">
            <Space direction="vertical">
              {vocabulary.phoneticUS && (
                <div><Tag color="blue">美式</Tag> {vocabulary.phoneticUS}</div>
              )}
              {vocabulary.phoneticUK && (
                <div><Tag color="green">英式</Tag> {vocabulary.phoneticUK}</div>
              )}
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item label="难度">
            <Tag color={vocabulary.difficulty === 'EASY' ? 'green' : vocabulary.difficulty === 'HARD' ? 'red' : 'orange'}>
              {vocabulary.difficulty}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 音频管理 */}
      <div style={{ marginTop: 16 }}>
        <AudioManager vocabularyId={params.id} word={vocabulary.word} />
      </div>

      {/* 图片管理 */}
      <div style={{ marginTop: 16 }}>
        <ImageManager vocabularyId={params.id} word={vocabulary.word} />
      </div>
    </div>
  );
}
```

### 示例2: 在词汇列表中显示音频播放按钮

修改文件: `web-admin/src/app/admin/vocabularies/page.tsx`

```tsx
import { Table } from 'antd';
import AudioPlayer from '@/components/AudioPlayer';

const columns = [
  {
    title: '单词',
    dataIndex: 'word',
    key: 'word',
  },
  {
    title: '音标',
    key: 'phonetic',
    render: (record: any) => (
      <div>
        {record.phoneticUS && <div>{record.phoneticUS} (US)</div>}
        {record.phoneticUK && <div>{record.phoneticUK} (UK)</div>}
      </div>
    ),
  },
  {
    title: '发音',
    key: 'audio',
    render: (record: any) => {
      // 如果有音频记录，显示播放器
      if (record.audios && record.audios.length > 0) {
        return record.audios.map((audio: any) => (
          <AudioPlayer
            key={audio.id}
            audioUrl={audio.audioUrl}
            accent={audio.accent}
            size="small"
            showAccent={true}
          />
        ));
      }
      return '-';
    },
  },
  // ... 其他列
];

// 在查询时包含关联数据
const fetchVocabularies = async () => {
  const response = await fetch('/api/vocabularies?include=audios,images');
  // ...
};
```

### 示例3: 修改API以包含关联数据

修改文件: `web-admin/src/app/api/vocabularies/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const include = searchParams.get('include')?.split(',') || [];
    
    // 构建include对象
    const includeObj: any = {};
    if (include.includes('audios')) includeObj.audios = true;
    if (include.includes('images')) includeObj.images = true;

    const vocabularies = await prisma.vocabulary.findMany({
      include: includeObj,
      orderBy: { word: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: vocabularies
    });
  } catch (error) {
    console.error('获取词汇列表失败:', error);
    return NextResponse.json(
      { error: '获取词汇列表失败' },
      { status: 500 }
    );
  }
}
```

### 示例4: 创建词汇编辑表单（包含音标字段）

```tsx
import { Form, Input, Select, Switch, Space } from 'antd';

const VocabularyForm = () => {
  return (
    <Form layout="vertical">
      {/* 基础信息 */}
      <Form.Item label="单词" name="word" rules={[{ required: true }]}>
        <Input placeholder="请输入单词" />
      </Form.Item>

      {/* 音标信息 */}
      <Space.Compact style={{ width: '100%' }}>
        <Form.Item label="美式音标" name="phoneticUS" style={{ flex: 1 }}>
          <Input placeholder="/əˈmɪʃ·əs/" />
        </Form.Item>
        
        <Form.Item label="英式音标" name="phoneticUK" style={{ flex: 1 }}>
          <Input placeholder="/æmˈbɪʃəs/" />
        </Form.Item>
      </Space.Compact>

      {/* 词性 */}
      <Form.Item label="词性" name="partOfSpeech" rules={[{ required: true }]}>
        <Select
          mode="multiple"
          placeholder="选择词性"
          options={[
            { label: '名词', value: 'n.' },
            { label: '动词', value: 'v.' },
            { label: '形容词', value: 'adj.' },
            { label: '副词', value: 'adv.' },
            // ...
          ]}
        />
      </Form.Item>

      {/* 释义 */}
      <Form.Item label="核心释义" name="primaryMeaning" rules={[{ required: true }]}>
        <Input.TextArea rows={2} placeholder="主要含义" />
      </Form.Item>

      <Form.Item label="延伸释义" name="secondaryMeaning">
        <Input.TextArea rows={2} placeholder="次要含义（可选）" />
      </Form.Item>

      {/* 难度和高频词 */}
      <Space>
        <Form.Item label="难度" name="difficulty">
          <Select style={{ width: 120 }}>
            <Select.Option value="EASY">简单</Select.Option>
            <Select.Option value="MEDIUM">中等</Select.Option>
            <Select.Option value="HARD">困难</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="高频词" name="isHighFrequency" valuePropName="checked">
          <Switch checkedChildren="是" unCheckedChildren="否" />
        </Form.Item>
      </Space>
    </Form>
  );
};
```

---

## 🔧 高级用法

### 1. 自定义音频播放器样式

```tsx
import AudioPlayer from '@/components/AudioPlayer';

// 紧凑型播放器（用于表格）
<AudioPlayer
  audioUrl={url}
  accent="US"
  size="small"
  showAccent={false}
/>

// 完整播放器（用于详情页）
<AudioPlayer
  audioUrl={url}
  accent="UK"
  word="ambitious"
  size="large"
  showAccent={true}
/>
```

### 2. 批量导入时显示进度

修改 `import-phonetic-and-audio.js`:

```javascript
const cliProgress = require('cli-progress');

async function batchImportData(options = {}) {
  // 创建进度条
  const progressBar = new cliProgress.SingleBar({
    format: '导入进度 |{bar}| {percentage}% | {value}/{total} 词汇'
  }, cliProgress.Presets.shades_classic);

  progressBar.start(vocabularies.length, 0);

  for (let i = 0; i < vocabularies.length; i++) {
    await updateVocabularyWithData(vocabularies[i]);
    progressBar.update(i + 1);
  }

  progressBar.stop();
}
```

### 3. 从Excel导入词汇时自动补充音标

```javascript
const { batchFindWords } = require('./fetch-ecdict-data');
const { batchFindAudioUrls } = require('./fetch-audio-data');

async function importFromExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  for (const row of data) {
    const word = row['单词'];
    
    // 查找音标
    const ecdictInfo = findWordInECDICT(word);
    const audioInfo = findAudioUrl(word);

    // 创建词汇记录
    await prisma.vocabulary.create({
      data: {
        word,
        partOfSpeech: row['词性'].split(','),
        primaryMeaning: row['释义'],
        phoneticUS: ecdictInfo?.phonetic,
        phoneticUK: ecdictInfo?.phonetic,
        // ...
      }
    });

    // 创建音频记录
    if (audioInfo) {
      await prisma.wordAudio.create({
        data: {
          vocabularyId: vocabulary.id,
          audioUrl: audioInfo.audioUrl,
          accent: 'US'
        }
      });
    }
  }
}
```

---

## 🎨 UI/UX 最佳实践

### 1. 词汇卡片设计

```tsx
import { Card, Space, Typography, Tag } from 'antd';
import { SoundOutlined, PictureOutlined } from '@ant-design/icons';
import AudioPlayer from '@/components/AudioPlayer';

const VocabularyCard = ({ vocabulary }: any) => {
  return (
    <Card
      hoverable
      cover={
        vocabulary.images?.[0] && (
          <img
            alt={vocabulary.word}
            src={vocabulary.images[0].imageUrl}
            style={{ height: 200, objectFit: 'cover' }}
          />
        )
      }
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Typography.Title level={3}>{vocabulary.word}</Typography.Title>
        
        {vocabulary.phoneticUS && (
          <Typography.Text type="secondary">{vocabulary.phoneticUS}</Typography.Text>
        )}

        <Typography.Text>{vocabulary.primaryMeaning}</Typography.Text>

        {vocabulary.audios?.length > 0 && (
          <div>
            <SoundOutlined /> 发音:
            {vocabulary.audios.map((audio: any) => (
              <AudioPlayer
                key={audio.id}
                audioUrl={audio.audioUrl}
                accent={audio.accent}
                size="small"
              />
            ))}
          </div>
        )}

        <div>
          {vocabulary.partOfSpeech.map((pos: string) => (
            <Tag key={pos}>{pos}</Tag>
          ))}
          {vocabulary.isHighFrequency && <Tag color="red">高频</Tag>}
        </div>
      </Space>
    </Card>
  );
};
```

### 2. 学习模式 - 听音选词

```tsx
import { useState } from 'react';
import { Button, Space, Radio } from 'antd';
import AudioPlayer from '@/components/AudioPlayer';

const ListeningQuiz = ({ question }: any) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string>();

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <AudioPlayer
          audioUrl={question.audioUrl}
          accent="US"
          size="large"
          showAccent={false}
        />
      </div>

      <Radio.Group
        onChange={(e) => setSelectedAnswer(e.target.value)}
        value={selectedAnswer}
      >
        <Space direction="vertical">
          {question.options.map((option: string) => (
            <Radio key={option} value={option}>
              {option}
            </Radio>
          ))}
        </Space>
      </Radio.Group>

      <Button type="primary" onClick={handleSubmit}>
        提交答案
      </Button>
    </Space>
  );
};
```

---

## 🐛 调试技巧

### 1. 检查数据完整性

```bash
# 检查有多少词汇缺少音标
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.vocabulary.count({
  where: { phoneticUS: null }
}).then(count => {
  console.log('缺少美式音标的词汇:', count);
  process.exit(0);
});
"
```

### 2. 验证音频链接

```bash
# 测试音频URL是否可访问
node -e "
const https = require('https');
const url = 'YOUR_AUDIO_URL';

https.get(url, (res) => {
  console.log('状态码:', res.statusCode);
  console.log('Content-Type:', res.headers['content-type']);
}).on('error', (e) => {
  console.error('错误:', e.message);
});
"
```

### 3. 查看导入日志

```bash
# 导入时生成详细日志
node scripts/import-phonetic-and-audio.js > import.log 2>&1
cat import.log
```

---

## 💡 性能优化建议

1. **分批处理**: 大量词汇时使用limit参数分批导入
2. **缓存数据**: 将ECDICT和音频数据缓存在本地
3. **延迟加载**: 图片使用懒加载技术
4. **CDN加速**: 音频和图片使用CDN服务
5. **并发控制**: 避免同时发起过多请求

---

## 📚 更多资源

- [完整文档](./PHONETIC_AUDIO_IMAGE_GUIDE.md)
- [API参考](./PHONETIC_AUDIO_IMAGE_GUIDE.md#🔌-api-接口说明)
- [故障排查](./PHONETIC_AUDIO_IMAGE_GUIDE.md#🔍-故障排查)

---

祝你使用愉快！🎉
