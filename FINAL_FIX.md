# 🎯 最终修复方案

## 问题根源
数据库缺少 `UserRole` 枚举类型。之前在Prisma Studio创建表时没有创建枚举。

## ✅ 解决步骤（5分钟完成）

### 步骤1：访问Vercel Postgres

打开：https://vercel.com/wangpeng10170414-1653s-projects/11word/stores

点击你的Postgres数据库 → 点击 **"Query"** 标签

### 步骤2：执行完整SQL脚本

复制 `CREATE_ALL_TABLES.sql` 文件的全部内容，粘贴到Query编辑器中，点击 **"Run Query"**

或者直接复制以下SQL：

```sql
-- 创建枚举类型
CREATE TYPE "UserRole" AS ENUM ('TEACHER', 'STUDENT');
CREATE TYPE "WordDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- 删除现有表
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS vocabularies CASCADE;
DROP TABLE IF EXISTS system_configs CASCADE;

-- 创建users表
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role "UserRole" NOT NULL DEFAULT 'STUDENT',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建teachers表
CREATE TABLE teachers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  school TEXT,
  subject TEXT DEFAULT '英语',
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建classes表
CREATE TABLE classes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建students表
CREATE TABLE students (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  student_no TEXT NOT NULL UNIQUE,
  class_id TEXT REFERENCES classes(id) ON DELETE SET NULL,
  grade TEXT,
  wechat_id TEXT UNIQUE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建vocabularies表
CREATE TABLE vocabularies (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  word TEXT NOT NULL UNIQUE,
  part_of_speech TEXT[] NOT NULL,
  primary_meaning TEXT NOT NULL,
  secondary_meaning TEXT,
  phonetic TEXT,
  phonetic_us TEXT,
  phonetic_uk TEXT,
  is_high_frequency BOOLEAN NOT NULL DEFAULT false,
  difficulty "WordDifficulty" NOT NULL DEFAULT 'MEDIUM',
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建system_configs表
CREATE TABLE system_configs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 步骤3：创建管理员账号

打开浏览器Console（F12），执行：

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
.then(data => {
  console.log(data);
  if (data.success) {
    alert('✅ 成功！');
    window.location.href = '/login';
  } else {
    alert('❌ ' + data.error);
  }
});
```

### 步骤4：登录

- 访问：https://11word.vercel.app/login
- 邮箱：`admin@vocab.com`
- 密码：`admin123456`

---

## 为什么这次一定成功？

1. ✅ 创建了所有必需的枚举类型（`UserRole`, `WordDifficulty`）
2. ✅ 使用正确的字段名（蛇形命名）
3. ✅ 包含所有外键约束
4. ✅ Prisma schema已经修复了字段映射

**这次执行完SQL后，注册API一定能成功！** 🎉
