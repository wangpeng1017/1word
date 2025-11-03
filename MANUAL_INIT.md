# 手动初始化数据库

## 方法：直接在Vercel上创建测试账号

由于本地数据库连接有问题，我们直接使用API在线上创建账号。

### 步骤1：打开浏览器Console

1. 访问：https://11word.vercel.app/
2. 按 F12 打开开发者工具
3. 切换到 "Console" 标签

### 步骤2：执行以下代码创建管理员账号

复制以下代码，粘贴到Console中，按回车执行：

```javascript
fetch('https://11word.vercel.app/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'admin@vocab.com',
    password: 'admin123456',
    name: '系统管理员',
    role: 'TEACHER'
  })
})
.then(res => res.json())
.then(data => {
  console.log('创建结果:', data);
  if (data.success) {
    alert('✅ 管理员账号创建成功！\n邮箱: admin@vocab.com\n密码: admin123456');
  } else {
    alert('❌ 创建失败: ' + data.error);
  }
})
.catch(err => {
  console.error('错误:', err);
  alert('❌ 网络错误');
});
```

### 步骤3：创建测试学生账号

```javascript
fetch('https://11word.vercel.app/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    phone: '2024001',
    password: '123456',
    name: '张三',
    role: 'STUDENT'
  })
})
.then(res => res.json())
.then(data => {
  console.log('创建结果:', data);
  if (data.success) {
    alert('✅ 学生账号创建成功！\n学号: 2024001\n密码: 123456');
  } else {
    alert('❌ 创建失败: ' + data.error);
  }
});
```

### 步骤4：测试登录

1. 访问：https://11word.vercel.app/login
2. 输入：
   - 邮箱：`admin@vocab.com`
   - 密码：`admin123456`
3. 点击登录

### 步骤5：查看后台

登录成功后会自动跳转到：https://11word.vercel.app/dashboard

---

## 🎉 完成！

现在您可以：
- ✅ 登录Web后台
- ✅ 测试微信小程序（使用学生账号）
- ✅ 继续开发其他功能

---

## 📱 配置微信小程序

修改 `wechat-miniapp/app.js` 第3行：

```javascript
apiUrl: 'https://11word.vercel.app/api',
```

然后在微信开发者工具中测试！

---

## 💡 提示

如果提示"邮箱已存在"，说明账号已经创建成功，直接登录即可。
