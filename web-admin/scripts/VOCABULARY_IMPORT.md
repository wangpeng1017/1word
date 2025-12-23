# PDF 词汇导入工具使用说明

## 概述

由于 `2000词基础信息.pdf` 文件较大(2.27GB),直接解析可能导致性能问题。本工具提供了灵活的导入方案。

## 快速开始

### 方案A: 使用示例数据测试（推荐用于测试）

1. **编辑示例数据**

编辑 `scripts/import-vocabulary.ts` 文件中的 `sampleVocabularies` 数组，添加你的词汇数据

2. **准备图片**

将词汇相关的图片放到 `public/uploads/vocabulary-images/` 目录下

3. **运行导入脚本**

```bash
cd web-admin
npx ts-node scripts/import-vocabulary.ts
```

### 方案B: 从JSON文件批量导入

1. 创建 `scripts/vocabulary-data.json` 文件
2. 在脚本中读取JSON数据
3. 运行导入

### 方案C: 手动从PDF提取数据

1. 打开PDF文件
2. 手动复制词汇信息
3. 整理成JSON格式
4. 保存图片到指定目录

## 功能说明

- ✅ 自动创建词汇、释义、图片记录
- ✅ 自动从Google TTS下载音频
- ✅ 自动创建R开头词汇库
- ✅ 检查重复，避免重复导入

## 数据格式

详见 `import-vocabulary.ts` 中的类型定义。

## 常见问题

详见完整文档。
