# 📚 智能词汇复习助手 - 文档中心

欢迎使用智能词汇复习助手的文档中心！这里汇集了系统的所有文档，帮助您快速了解和使用本系统。

## 🗂️ 文档分类

### 1️⃣ 核心功能文档

#### [题目管理功能文档](./testword.md) ⭐
**最重要的核心文档**，全面介绍题目管理系统：
- ✅ 4种题型设计（中译英、英译中、选词填空、听力题）
- ✅ 完整的API接口文档（CRUD操作）
- ✅ 数据模型定义（Prisma Schema）
- ✅ 前端管理界面说明
- ✅ 批量导入功能（Excel）
- ✅ testword.md数据源（50词汇×4题型=200题目）
- ✅ 使用场景示例
- ✅ 技术实现细节

**适合阅读对象**: 开发人员、产品经理、测试人员

---

### 2️⃣ Vercel Blob 存储文档

#### [Vercel Blob集成总览](./VERCEL_BLOB_INTEGRATION_SUMMARY.md)
Vercel Blob存储服务的完整集成方案：
- 📦 Blob存储概述和优势
- 🔧 集成架构设计
- 📝 实施步骤和配置
- 🎯 使用场景和最佳实践

**适合阅读对象**: 架构师、后端开发

#### [Vercel Blob设置指南](./VERCEL_BLOB_SETUP.md)
详细的Blob服务配置教程：
- 🔑 API Token获取
- ⚙️ 环境变量配置
- 🧪 功能测试验证
- 🐛 常见问题排查

**适合阅读对象**: 运维人员、DevOps

#### [音频上传指南](./AUDIO_UPLOAD_TO_BLOB.md)
听力题音频文件上传实现：
- 🎵 音频格式要求
- 📤 上传接口设计
- 🔗 URL生成和管理
- 🎯 听力题集成

**适合阅读对象**: 前端开发、后端开发

#### [上传功能指南](./UPLOAD_GUIDE.md)
通用文件上传功能说明：
- 📋 支持的文件类型
- 🔄 上传流程设计
- 🛡️ 安全性考虑
- 💡 使用建议

**适合阅读对象**: 全栈开发

#### [上传测试清单](./UPLOAD_TEST_CHECKLIST.md)
上传功能的完整测试检查项：
- ✅ 功能测试要点
- 🐛 边界条件测试
- 🔒 安全性测试
- 📊 性能测试

**适合阅读对象**: 测试人员、QA

---

### 3️⃣ 数据初始化文档

#### [测试数据创建报告](../测试数据创建完成-testword版.md)
基于testword.md的测试数据初始化报告：
- 📊 数据规模统计
- 👥 测试账号信息
- 📚 词汇和题目清单
- 🔄 初始化脚本使用
- ✅ 验证结果

**适合阅读对象**: 测试人员、开发人员

---

## 🚀 快速开始

### 新用户推荐阅读顺序

1. **第一步**: 阅读 [题目管理功能文档](./testword.md) 了解核心功能
2. **第二步**: 查看 [测试数据创建报告](../测试数据创建完成-testword版.md) 了解现有数据
3. **第三步**: 根据需要阅读 Vercel Blob 相关文档

### 开发人员推荐阅读顺序

1. [题目管理功能文档](./testword.md) - 理解业务逻辑和数据结构
2. [Vercel Blob集成总览](./VERCEL_BLOB_INTEGRATION_SUMMARY.md) - 了解存储架构
3. [音频上传指南](./AUDIO_UPLOAD_TO_BLOB.md) - 实现听力题功能
4. [上传测试清单](./UPLOAD_TEST_CHECKLIST.md) - 确保功能质量

### 运维人员推荐阅读顺序

1. [Vercel Blob设置指南](./VERCEL_BLOB_SETUP.md) - 配置存储服务
2. [上传功能指南](./UPLOAD_GUIDE.md) - 了解上传机制
3. [测试数据创建报告](../测试数据创建完成-testword版.md) - 初始化测试环境

---

## 📊 系统概览

### 核心功能

| 功能模块 | 状态 | 文档链接 |
|---------|------|---------|
| 题目管理 | ✅ 已完成 | [testword.md](./testword.md) |
| 词汇管理 | ✅ 已完成 | - |
| 学生管理 | ✅ 已完成 | - |
| 班级管理 | ✅ 已完成 | - |
| 学习计划 | ✅ 已完成 | - |
| 每日任务 | ✅ 已完成 | - |
| 学习记录 | ✅ 已完成 | - |
| 错题本 | ✅ 已完成 | - |
| 文件上传 | ✅ 已完成 | [UPLOAD_GUIDE.md](./UPLOAD_GUIDE.md) |
| 音频存储 | ✅ 已完成 | [AUDIO_UPLOAD_TO_BLOB.md](./AUDIO_UPLOAD_TO_BLOB.md) |

### 技术栈

**后端**:
- Next.js 15 (App Router)
- Prisma ORM
- SQLite数据库
- JWT身份认证
- Vercel Blob存储

**前端**:
- React 18
- Ant Design 5
- TypeScript
- XLSX (Excel处理)

**部署**:
- Vercel平台
- 自动CI/CD

---

## 🎯 数据统计

### testword.md 数据源

基于 `E:\trae\1单词\testword.md` 文件：

| 数据类型 | 数量 | 说明 |
|---------|------|------|
| 词汇总数 | 50个 | 高考核心词汇 |
| 题目总数 | 200个 | 50词汇 × 4题型 |
| 中译英题目 | 50个 | 25% |
| 英译中题目 | 50个 | 25% |
| 选词填空题目 | 50个 | 25% |
| 听力题目 | 50个 | 25% |

### 测试数据

| 数据类型 | 数量 | 说明 |
|---------|------|------|
| 教师账号 | 1个 | teacher@test.com |
| 学生账号 | 3个 | 学号: 2025001-2025003 |
| 班级 | 1个 | 高三1班 |
| 学习计划 | 150个 | 3学生 × 50词汇 |
| 今日任务 | 60个 | 3学生 × 20词汇 |

---

## 🔧 常用命令

### 数据初始化

```bash
# 基于testword.md初始化完整测试数据
node scripts/init-from-testword.js

# 验证数据完整性
node scripts/verify-current-data.js

# 检查题目详情
node scripts/check-questions.js
```

### 数据库操作

```bash
# 生成Prisma客户端
npx prisma generate

# 推送数据库结构
npx prisma db push

# 打开数据库管理界面
npx prisma studio
```

### 开发调试

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行生产版本
npm start
```

---

## 📖 API文档快速查询

### 题目管理API

| 接口 | 方法 | 说明 | 文档位置 |
|-----|------|------|----------|
| `/api/questions` | GET | 获取题目列表 | [testword.md#api接口](./testword.md#api接口) |
| `/api/questions` | POST | 创建题目 | 同上 |
| `/api/questions` | PUT | 更新题目 | 同上 |
| `/api/questions` | DELETE | 删除题目 | 同上 |
| `/api/vocabularies/:id/questions` | GET | 获取词汇题目 | 同上 |

### 文件上传API

| 接口 | 方法 | 说明 | 文档位置 |
|-----|------|------|----------|
| `/api/upload/audio` | POST | 上传音频文件 | [AUDIO_UPLOAD_TO_BLOB.md](./AUDIO_UPLOAD_TO_BLOB.md) |
| `/api/upload` | POST | 通用文件上传 | [UPLOAD_GUIDE.md](./UPLOAD_GUIDE.md) |

---

## 🐛 问题排查

### 常见问题

**Q: 题目数据初始化失败？**  
A: 检查testword.md文件路径是否正确，确保文件存在于 `E:\trae\1单词\testword.md`

**Q: 音频上传失败？**  
A: 检查Vercel Blob配置，确保 `BLOB_READ_WRITE_TOKEN` 环境变量已设置

**Q: 数据库连接错误？**  
A: 检查 `DATABASE_URL` 环境变量，确保SQLite数据库文件路径正确

**Q: 前端页面无法访问？**  
A: 确保已运行 `npm run dev` 启动开发服务器

### 获取帮助

- 📧 技术支持: 查看各文档中的"注意事项"章节
- 🔍 代码搜索: 使用全文搜索查找相关实现
- 📚 扩展阅读: 查看 [主项目README](../README.md)

---

## 📝 文档维护

### 文档更新记录

| 日期 | 文档 | 更新内容 | 版本 |
|------|------|---------|------|
| 2025-11-07 | testword.md | 创建题目管理完整文档 | 1.0.0 |
| 2025-11-07 | README.md | 创建文档中心索引 | 1.0.0 |

### 贡献指南

欢迎贡献文档改进！

1. 发现问题或改进点
2. 更新相应文档
3. 更新本索引文件
4. 记录更新日志

---

## 🎉 总结

本文档中心包含了系统的全部技术文档，涵盖：
- ✅ 核心功能设计和实现
- ✅ API接口完整规范
- ✅ 数据模型和业务逻辑
- ✅ 存储服务集成方案
- ✅ 测试数据和验证方法
- ✅ 部署和运维指南

选择您需要的文档开始探索吧！

---

**文档版本**: 1.0.0  
**最后更新**: 2025年11月7日  
**维护者**: 开发团队  
**状态**: ✅ 持续更新中
