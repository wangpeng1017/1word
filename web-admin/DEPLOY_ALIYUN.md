# 阿里云部署指南

## 环境变量配置

部署时需要配置以下环境变量：

### 必需的环境变量

```bash
# 数据库连接
DATABASE_URL="postgresql://用户名:密码@主机:端口/数据库名"

# JWT密钥（用于用户认证）
JWT_SECRET="你的JWT密钥，建议32位以上随机字符串"

# 定时任务密钥（保护Cron接口）
CRON_SECRET="你的Cron密钥，建议32位随机字符串"
```

### 可选的环境变量

```bash
# Node环境
NODE_ENV="production"

# 应用端口（如果需要自定义）
PORT=3000
```

### 生成随机密钥命令

```bash
# 生成32位随机字符串
openssl rand -base64 32

# 或使用Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 定时任务配置

### 需要配置的定时任务

| 任务 | 接口路径 | 执行频率 | 说明 |
|-----|---------|---------|------|
| 积分重置 | `/api/cron/reset-points` | 每天 00:00 | 重置每日/周/月积分 |
| 数据归档 | `/api/cron/data-archive` | 每周日 03:00 | 清理90天前的旧数据 |

### 阿里云函数计算 (FC) 定时触发器

如果使用阿里云函数计算，配置触发器：

```yaml
# 积分重置 - 每天凌晨0点（北京时间）
Cron表达式: 0 0 0 * * *
# 或: CRON_TZ=Asia/Shanghai 0 0 * * *

# 数据归档 - 每周日凌晨3点（北京时间）
Cron表达式: 0 0 3 ? * SUN
# 或: CRON_TZ=Asia/Shanghai 0 3 * * 0
```

### 阿里云 ARMS/云监控 定时任务

如果使用云监控的定时任务功能：

```bash
# 积分重置
curl -X POST https://你的域名/api/cron/reset-points \
  -H "Authorization: Bearer ${CRON_SECRET}"

# 数据归档
curl -X POST https://你的域名/api/cron/data-archive \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

### 使用 crontab（ECS服务器）

如果部署在 ECS 服务器，编辑 crontab：

```bash
crontab -e
```

添加以下内容：

```cron
# 积分重置 - 每天凌晨0点
0 0 * * * curl -X POST https://你的域名/api/cron/reset-points -H "Authorization: Bearer 你的CRON_SECRET" >> /var/log/cron-reset-points.log 2>&1

# 数据归档 - 每周日凌晨3点
0 3 * * 0 curl -X POST https://你的域名/api/cron/data-archive -H "Authorization: Bearer 你的CRON_SECRET" >> /var/log/cron-data-archive.log 2>&1
```

---

## 部署检查清单

### 部署前

- [ ] 确认 PostgreSQL 数据库已创建并可访问
- [ ] 确认数据库已执行 Prisma 迁移 (`npx prisma migrate deploy`)
- [ ] 准备好所有环境变量
- [ ] 生成 CRON_SECRET 密钥

### 部署时

- [ ] 设置环境变量 `DATABASE_URL`
- [ ] 设置环境变量 `JWT_SECRET`
- [ ] 设置环境变量 `CRON_SECRET`
- [ ] 设置环境变量 `NODE_ENV=production`

### 部署后

- [ ] 验证应用可以正常访问
- [ ] 验证数据库连接正常
- [ ] 配置定时任务
- [ ] 手动测试定时任务接口：
  ```bash
  # 测试积分重置
  curl -X GET https://你的域名/api/cron/reset-points \
    -H "Authorization: Bearer 你的CRON_SECRET"

  # 测试数据归档统计
  curl -X GET https://你的域名/api/cron/data-archive \
    -H "Authorization: Bearer 你的CRON_SECRET"
  ```
- [ ] 检查定时任务日志，确认正常执行

---

## 接口说明

### 积分重置接口

```
POST /api/cron/reset-points
Authorization: Bearer {CRON_SECRET}

响应示例：
{
  "success": true,
  "message": "积分重置完成",
  "results": {
    "daily": 50,    // 重置了50个学生的每日积分
    "weekly": 0,    // 今天不是周一，不重置周积分
    "monthly": 0    // 今天不是1号，不重置月积分
  }
}
```

### 数据归档接口

```
POST /api/cron/data-archive
Authorization: Bearer {CRON_SECRET}

响应示例：
{
  "success": true,
  "message": "数据归档完成",
  "archive": {
    "questionAnswers": { "deleted": 1000, "cutoffDate": "2024-09-12" },
    "wrongQuestions": { "deleted": 200, "cutoffDate": "2024-06-12" },
    "pointHistory": { "deleted": 50, "cutoffDate": "2023-12-12" }
  },
  "stats": {
    "before": { "questionAnswers": 5000, ... },
    "after": { "questionAnswers": 4000, ... }
  }
}

# 仅获取统计（不执行归档）
GET /api/cron/data-archive
```

---

## 数据保留策略

| 数据表 | 保留天数 | 说明 |
|-------|---------|------|
| `question_answers` | 90天 | 答题记录，掌握判定只需最近3条 |
| `wrong_questions` | 180天 | 错题记录，保留更长用于分析 |
| `point_history` | 365天 | 积分历史，保留一年 |

如需修改保留策略，编辑 `lib/cron/data-archive.ts` 中的 `ARCHIVE_CONFIG`。

---

## 常见问题

### Q: 定时任务没有执行？

1. 检查 `CRON_SECRET` 是否正确配置
2. 检查定时任务的 Cron 表达式是否正确
3. 检查网络是否可以访问应用

### Q: 积分没有重置？

1. 检查定时任务是否在凌晨0点触发
2. 手动调用接口测试：`POST /api/cron/reset-points`
3. 检查日志输出

### Q: 数据归档删除了不该删的数据？

归档只会删除超过保留期限的旧数据，不会影响：
- 最近90天的答题记录
- 最近180天的错题记录
- 最近365天的积分历史

---

## 联系支持

如有问题，请检查：
1. 应用日志
2. 数据库连接状态
3. 定时任务执行日志
