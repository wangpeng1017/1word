# 快速迁移指南

## 已完成的工作

✅ 数据库连接字符串已配置  
✅ 已安装 xlsx 依赖  
✅ Schema 已更新（Student 强制班级、新增 PlanClass）  
✅ 迁移 SQL 脚本已生成  

## 下一步操作（按顺序执行）

### 步骤 1: 推送 Schema 变更到数据库

```bash
npx prisma db push --accept-data-loss
```

**说明**：此命令会：
- 创建 `plan_classes` 表
- 修改 `students` 表，将 `class_id` 和 `grade` 改为必填
- 如果有学生没有班级，数据库会报错，需要先手动分配

**如果遇到错误**，请到 Prisma Studio 手动执行 `scripts/migration.sql` 中的 SQL。

### 步骤 2: 重新生成 Prisma Client

```bash
npx prisma generate
```

### 步骤 3: 构建验证

```bash
npm run build
```

### 步骤 4: 启动开发服务器

```bash
npm run dev
```

## 手动迁移（如果自动迁移失败）

打开 Prisma Studio: https://console.prisma.io → Studio → Console

执行 `scripts/migration.sql` 中的 SQL 脚本。

## 验证迁移结果

在 Prisma Studio 中运行：

```sql
-- 检查学生班级分配情况
SELECT 
    COUNT(*) as total_students,
    COUNT(CASE WHEN class_id IS NOT NULL THEN 1 END) as students_with_class
FROM students;

-- 查看未分配班级的学生
SELECT s.student_no, u.name, c.name as class_name
FROM students s
LEFT JOIN users u ON s.user_id = u.id
LEFT JOIN classes c ON s.class_id = c.id
WHERE c.name = '未分配班级';
```

## 完成后

1. 登录管理后台
2. 进入"学生管理"
3. 为"未分配班级"的学生手动分配正确的班级
4. 测试新功能：题目管理、学习计划批量下发
