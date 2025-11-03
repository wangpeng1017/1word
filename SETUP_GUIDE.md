# 🚀 系统设置指南

## 新的部署方案

由于 Vercel 构建环境无法连接数据库，我们改用**运行时初始化**方案。

## 已完成的修改

1. ✅ 移除构建时的 `prisma db push`
2. ✅ 创建 `/api/setup` 初始化接口
3. ✅ 创建 `/setup` 设置页面
4. ✅ 在首页添加"首次设置"按钮

## 立即部署

```bash
cd /e/trae/1单词

git add .
git commit -m "Add runtime database initialization"
git push origin main
```

## 部署完成后的设置流程

### 方法1：使用设置页面（推荐）

1. **访问设置页面**：https://11word.vercel.app/setup

2. **点击"开始初始化"按钮**

3. **等待初始化完成**，系统会自动：
   - 创建数据库表
   - 创建默认管理员账号
   - 跳转到登录页

4. **使用默认账号登录**：
   - 邮箱：`admin@vocab.com`
   - 密码：`admin123456`

### 方法2：使用API（备用）

在浏览器 Console 中执行：

```javascript
fetch('https://11word.vercel.app/api/setup', {
  method: 'POST'
})
.then(res => res.json())
.then(data => {
  console.log(data);
  if (data.success) {
    alert('✅ 初始化成功！\n\n' + 
          '邮箱: admin@vocab.com\n' +
          '密码: admin123456');
  } else {
    alert('❌ ' + data.error);
  }
});
```

## 测试流程

### 1. 检查初始化状态

访问：https://11word.vercel.app/api/setup

应该返回：
```json
{
  "success": true,
  "data": {
    "initialized": false,
    "userCount": 0,
    "needsSetup": true
  }
}
```

### 2. 执行初始化

访问：https://11word.vercel.app/setup

点击"开始初始化"

### 3. 登录测试

访问：https://11word.vercel.app/login

- 邮箱：`admin@vocab.com`
- 密码：`admin123456`

### 4. 查看后台

登录成功后自动跳转：https://11word.vercel.app/dashboard

## 创建更多测试账号

登录后台后，可以使用注册接口创建更多账号：

```javascript
// 创建学生账号
fetch('https://11word.vercel.app/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  },
  body: JSON.stringify({
    phone: '2024001',
    password: '123456',
    name: '张三',
    role: 'STUDENT'
  })
})
.then(res => res.json())
.then(console.log);
```

## 配置微信小程序

修改 `wechat-miniapp/app.js` 第3行：

```javascript
apiUrl: 'https://11word.vercel.app/api',
```

然后在微信开发者工具中测试！

## 优势

✅ 不需要本地数据库连接
✅ 不需要 Vercel CLI
✅ 一键初始化
✅ 可视化设置流程
✅ 自动创建管理员账号

## 注意事项

- 初始化只能执行一次
- 如果需要重置，需要在 Vercel Postgres 中手动清空数据
- 首次初始化可能需要几秒钟时间

---

**现在可以推送代码并测试了！** 🎉
