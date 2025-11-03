# 部署命令

## 立即执行（Git Bash）

```bash
cd /e/trae/1单词

# 添加所有更改
git add .

# 提交
git commit -m "Fix Next.js 15 API route types for Vercel deployment"

# 推送
git push origin main
```

## 等待部署完成

Vercel会自动检测到推送并重新部署，大约2-3分钟。

## 验证部署

部署完成后测试：

1. **首页**: https://11word.vercel.app/
2. **健康检查**: https://11word.vercel.app/api/health
3. **登录API**: https://11word.vercel.app/api/auth/login

## 修复内容

- ✅ 修复了Next.js 15动态路由参数类型
- ✅ 所有API路由现在使用正确的`Promise<{ id: string }>`类型
- ✅ 删除了根目录的vercel.json（已由用户完成）

## 下一步

部署成功后：
1. 初始化数据库（运行 `npm run db:push` 和 `npm run db:init`）
2. 创建测试账号
3. 配置微信小程序
