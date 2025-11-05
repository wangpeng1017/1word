# 数据库迁移脚本使用指南

## 快速执行迁移

由于 Prisma Studio 没有 SQL 编辑器，我们创建了一个 Node.js 脚本来执行迁移。

### 方法一：直接在 Vercel 部署（推荐）

**最简单的方法是直接部署代码，让 Vercel 自动执行：**

1. **提交代码到 Git**
   ```bash
   cd E:\trae\1单词\web-admin
   git add .
   git commit -m "feat: 添加听力题和填空题字段"
   git push
   ```

2. **Vercel 会自动部署并执行 Prisma 迁移**

### 方法二：本地执行（需要数据库连接）

如果你有线上数据库的连接字符串：

1. **更新 `.env` 文件**
   
   将 `.env` 中的 `DATABASE_URL` 替换为线上数据库连接字符串：
   ```
   DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
   ```

2. **运行迁移脚本**
   ```bash
   cd E:\trae\1单词\web-admin
   node scripts/migrate-add-fields.js
   ```

3. **查看输出**
   如果成功，会看到：
   ```
   ✅ vocabularies.audio_url 字段添加成功
   ✅ questions.sentence 字段添加成功
   ✅ 迁移成功！所有字段已正确添加。
   ```

### 方法三：手动在 Prisma Console 执行

如果 Prisma Data Platform 有 Console：

1. 在左侧菜单找到 **"Console"** 或类似的 SQL 执行工具
2. 复制以下 SQL 并执行：

```sql
-- 添加字段
ALTER TABLE vocabularies ADD COLUMN IF NOT EXISTS audio_url VARCHAR(500);
ALTER TABLE questions ADD COLUMN IF NOT EXISTS sentence TEXT;

-- 添加注释
COMMENT ON COLUMN vocabularies.audio_url IS '音频URL，用于听力题快速访问';
COMMENT ON COLUMN questions.sentence IS '填空题的完整句子，FILL_IN_BLANK 题型使用';
```

## 验证迁移

执行以下查询验证字段是否添加成功：

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE (table_name = 'vocabularies' AND column_name = 'audio_url')
   OR (table_name = 'questions' AND column_name = 'sentence');
```

应该返回 2 行结果。

## 如果遇到错误

### 错误：连接数据库失败
- 确认 `.env` 中的 `DATABASE_URL` 正确
- 检查网络连接
- 确认数据库允许外部连接

### 错误：字段已存在
- 这是正常的，说明字段之前已经添加过了
- 脚本使用了 `IF NOT EXISTS`，不会重复添加

## 下一步

迁移完成后：
1. 重新部署到 Vercel（如果还没部署）
2. 在小程序中测试听力题和填空题功能
3. 准备音频资源和句子数据
