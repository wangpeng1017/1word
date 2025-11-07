# Vercel 数据库迁移说明

## 问题
数据库 schema 中已定义 `audioUrl` 字段，但线上 Vercel Postgres 数据库尚未应用此字段。

## Schema定义
```prisma
model Vocabulary {
  ...
  audioUrl        String?        @map(\"audio_url\") // 音频URL（用于听力题）
  ...
}
```

## 迁移方法

### 方法一：通过 Vercel CLI (推荐)

1. 安装 Vercel CLI（如果还没有）:
```bash
npm i -g vercel
```

2. 登录 Vercel:
```bash
vercel login
```

3. 链接项目:
```bash
cd web-admin
vercel link
```

4. 获取数据库连接字符串:
```bash
vercel env pull .env.local
```

5. 运行数据库迁移:
```bash
npx prisma db push
```

### 方法二：通过 Vercel Dashboard

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入项目 -> Storage -> Postgres 数据库
3. 在 Query 标签页执行以下 SQL:

```sql
-- 添加 audio_url 列到 vocabularies 表
ALTER TABLE vocabularies ADD COLUMN IF NOT EXISTS audio_url TEXT;
```

### 方法三：本地迁移后同步

如果你有本地数据库的访问权限：

```bash
# 生成迁移文件
npx prisma migrate dev --name add_audio_url

# 应用到生产数据库
npx prisma migrate deploy
```

## 验证迁移

迁移完成后，运行验证脚本：

```bash
node test-update-single.js
```

成功的输出应该显示 `audioUrl` 字段被正确更新。

## 后续步骤

迁移完成后，运行音频URL更新脚本：

```bash
node update-audio-urls.js
```

这将为所有50个词汇添加来自 thousandlemons 项目的音频URL。

## 注意事项

- 生产环境迁移需要谨慎操作
- 建议先在开发环境测试迁移脚本
- 确保有数据库备份（Vercel Postgres 自动备份）
- audioUrl 字段是可选的（`String?`），不会影响现有数据
