# Vercel 最佳实践 - 数据库初始化

## 问题分析

根据Vercel官方文档，我们之前的方案存在以下问题：

1. ❌ 在API路由中执行数据库迁移（违反无服务器函数最佳实践）
2. ❌ 在构建时连接生产数据库（构建环境无法访问）
3. ❌ 使用`npx`命令（无服务器环境限制）

## ✅ Vercel推荐的方案

### 方案1：使用Vercel Postgres SQL编辑器（最简单）

1. 访问：https://vercel.com/wangpeng10170414-1653s-projects/11word/stores

2. 点击你的Postgres数据库

3. 点击"Query"标签

4. 执行以下SQL创建表：

```sql
-- 创建users表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'STUDENT',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建teachers表
CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL UNIQUE,
  school TEXT,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建students表
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL UNIQUE,
  student_no TEXT NOT NULL UNIQUE,
  class_id TEXT,
  grade TEXT,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建classes表
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);

-- 添加class_id外键
ALTER TABLE students ADD CONSTRAINT students_class_id_fkey 
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL;

-- 创建vocabularies表
CREATE TABLE IF NOT EXISTS vocabularies (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  word TEXT NOT NULL UNIQUE,
  part_of_speech TEXT[] NOT NULL,
  primary_meaning TEXT NOT NULL,
  secondary_meaning TEXT,
  phonetic TEXT,
  phonetic_us TEXT,
  phonetic_uk TEXT,
  is_high_frequency BOOLEAN NOT NULL DEFAULT false,
  difficulty TEXT NOT NULL DEFAULT 'MEDIUM',
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

5. 执行完成后，使用注册API创建管理员账号

### 方案2：使用Prisma Migrate（推荐用于生产）

```bash
# 本地生成迁移文件
cd web-admin
npx prisma migrate dev --name init

# 部署到Vercel后，在项目设置中添加部署命令
# Settings → General → Build & Development Settings
# Build Command: prisma migrate deploy && next build
```

### 方案3：保持当前的运行时初始化（临时方案）

当前的`/api/setup`方案虽然不是最佳实践，但对于MVP阶段是可接受的。

## 🚀 立即执行（推荐方案1）

1. **访问Vercel Postgres Query界面**
   https://vercel.com/wangpeng10170414-1653s-projects/11word/stores

2. **执行上面的SQL**

3. **使用浏览器Console创建管理员**：
```javascript
fetch('https://11word.vercel.app/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@vocab.com',
    password: 'admin123456',
    name: '系统管理员',
    role: 'TEACHER'
  })
})
.then(res => res.json())
.then(console.log)
```

4. **登录测试**
   https://11word.vercel.app/login

## 为什么方案1最好？

- ✅ 符合Vercel最佳实践
- ✅ 不占用无服务器函数执行时间
- ✅ 可以查看执行结果
- ✅ 可以手动回滚
- ✅ 不依赖代码逻辑

## 后续改进

对于生产环境，应该：
1. 使用Prisma Migrate管理数据库schema
2. 在CI/CD中执行迁移
3. 使用Vercel的部署钩子
4. 不在API路由中执行数据库迁移

---

**建议：先用方案1快速完成初始化，后续再迁移到Prisma Migrate。**
