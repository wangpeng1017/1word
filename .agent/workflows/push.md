---
description: Github 推送并部署到阿里云
---

# GitHub 推送并阿里云部署流程

## 前置条件
- 确保已配置 Git 远程仓库
- 阿里云服务器 SSH 可访问

## 步骤

### 1. 查看当前变更
```bash
cd e:\trae\1word
git status
```

### 2. 添加所有变更
```bash
git add .
```

### 3. 提交变更
```bash
git commit -m "feat: 描述本次变更"
```

### 4. 推送到 GitHub
```bash
git push origin main
```

### 5. SSH 登录阿里云并拉取最新代码
```bash
ssh root@47.92.96.143
cd /www/1word
git pull origin main
```

### 6. 重新构建并重启应用
```bash
cd /www/1word/web-admin
npm install
npm run build
pm2 restart all
```

---

## 快速部署（单命令）

// turbo-all
```bash
# 在本地执行
cd e:\trae\1word && git add . && git commit -m "update" && git push origin main

# 然后 SSH 到服务器执行
ssh root@47.92.96.143 "cd /www/1word && git pull && cd web-admin && npm install && npm run build && pm2 restart all"
```

---

## 仅推送代码（不部署）

```bash
cd e:\trae\1word
git add .
git commit -m "feat: 你的提交信息"
git push origin main
```
