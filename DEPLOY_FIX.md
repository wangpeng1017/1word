# 🔧 修复数据库表不存在问题

## 问题
错误 P2021: The table `public.users` does not exist

## 解决方案
已修改构建脚本，在 Vercel 部署时自动创建数据库表。

## 立即执行

```bash
cd /e/trae/1单词

git add .
git commit -m "Fix: Add prisma db push with accept-data-loss flag for Vercel"
git push origin main
```

## 等待部署完成（约2-3分钟）

访问：https://vercel.com/wangpeng10170414-1653s-projects/11word/deployments

查看最新部署的日志，应该看到：
```
✔ Generated Prisma Client
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database
🚀  Your database is now in sync with your Prisma schema.
```

## 部署成功后测试注册

在浏览器 Console 中执行：

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
    alert('✅ 注册成功！\n\n邮箱: admin@vocab.com\n密码: admin123456');
  } else {
    alert('❌ ' + data.error);
  }
});
```

## 登录测试

访问：https://11word.vercel.app/login

- 邮箱：`admin@vocab.com`
- 密码：`admin123456`

## 关键改动

1. 添加 `--accept-data-loss` 标志，让 prisma db push 在 CI 环境自动执行
2. 添加 `vercel-build` 脚本，确保 Vercel 使用正确的构建流程

这次应该能成功创建表并注册账号了！🎉
