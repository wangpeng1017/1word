# lib 索引
> 核心工具库，提供数据库、认证、响应等基础功能

⚠️ 文件夹变化时请更新此文件

| 文件 | 功能 |
|------|------|
| prisma.ts | Prisma ORM 客户端单例 |
| db.ts | 原生 pg 数据库连接（绕过 Prisma 硬编码问题） |
| auth.ts | JWT 认证、密码加密验证 |
| response.ts | 统一 API 响应格式 |
| log.ts | 操作日志记录 |
| redis.ts | Redis 缓存客户端 |
| id-generator.ts | UUID 生成器 |
| date-utils.ts | 日期工具函数 |
| constants.ts | 常量定义 |
| ebbinghaus.ts | 艾宾浩斯遗忘曲线算法 |
| achievement-checker.ts | 成就检测器 |
| question-type-allocator.ts | 题型分配器 |
| report-generator.ts | 报告生成器 |
| task-interrupt-detector.ts | 任务中断检测 |
| create-tables.ts | 数据库表创建脚本 |
| cron/ | 定时任务目录 |
