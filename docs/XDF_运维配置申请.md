# 新东方词汇助手 - 运维配置申请

> **申请日期**: 2026-01-21
> **申请人**: 王鹏
> **项目名称**: 英语词汇学习助手 (iEnglish)

---

## 一、配置需求总览

| 序号 | 配置项 | 状态 | 备注 |
|------|--------|------|------|
| 1 | 应用部署 | ✅ 已完成 | Next.js 应用已在服务器运行 |
| 2 | **域名解析** | ⏳ 待配置 | 需要运维/IT 配置 |
| 3 | **Nginx 反向代理** | ⏳ 待配置 | 需要运维配置 |
| 4 | **SSL 证书** | ⏳ 待配置 | 需要运维配置 |

---

## 二、服务器信息

| 项目 | 值 |
|------|-----|
| **服务器 IP** | 172.20.234.44 |
| **操作系统** | Ubuntu 22.04.5 LTS |
| **应用目录** | /home/dontovertime/apps/1word/web-admin |
| **应用端口** | 3000 |
| **进程管理** | PM2 (进程名: word-app) |
| **运行用户** | dontovertime |

### 应用当前状态

```
┌────┬──────────┬───────┬────────┬───────┬────────┐
│ id │ name     │ mode  │ status │ cpu   │ memory │
├────┼──────────┼───────┼────────┼───────┼────────┤
│ 0  │ word-app │ fork  │ online │ 0%    │ 56.3mb │
└────┴──────────┴───────┴────────┴───────┴────────┘
```

**本地测试结果**: `curl http://127.0.0.1:3000` 返回 HTTP 200 OK ✓

---

## 三、域名解析配置【需 IT/运维】

### 3.1 域名信息

| 项目 | 值 |
|------|-----|
| **域名** | ienglish.xdf.cn |
| **目标 IP** | 服务器公网 IP（或内网负载均衡 IP） |

### 3.2 DNS 记录配置

| 记录类型 | 主机记录 | 记录值 | TTL |
|----------|----------|--------|-----|
| A | ienglish | 服务器 IP | 600 |

> **说明**: 如果公司使用内部 DNS 或负载均衡，请按实际情况配置。

---

## 四、SSL 证书配置【需运维】

### 4.1 证书需求

| 项目 | 值 |
|------|-----|
| **域名** | ienglish.xdf.cn |
| **证书类型** | 单域名证书 |
| **有效期** | 建议 1 年以上 |

### 4.2 证书获取方式

**方式一：公司统一证书**（推荐）
- 使用新东方统一申请的 *.xdf.cn 泛域名证书

**方式二：免费证书**
- Let's Encrypt 免费证书（需配置自动续期）

```bash
# Let's Encrypt 申请示例（如适用）
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d ienglish.xdf.cn
```

### 4.3 证书文件存放建议

```
/etc/nginx/ssl/ienglish.xdf.cn.pem      # 证书文件
/etc/nginx/ssl/ienglish.xdf.cn.key      # 私钥文件
```

---

## 五、Nginx 配置【需运维】

### 5.1 安装 Nginx（如未安装）

```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 5.2 配置文件

**文件路径**: `/etc/nginx/sites-available/ienglish.xdf.cn`

```nginx
# ============================================
# ienglish.xdf.cn - 英语词汇学习助手
# ============================================

# HTTP -> HTTPS 重定向
server {
    listen 80;
    server_name ienglish.xdf.cn;
    return 301 https://$server_name$request_uri;
}

# HTTPS 主配置
server {
    listen 443 ssl http2;
    server_name ienglish.xdf.cn;

    # ----- SSL 证书 -----
    ssl_certificate     /etc/nginx/ssl/ienglish.xdf.cn.pem;
    ssl_certificate_key /etc/nginx/ssl/ienglish.xdf.cn.key;

    # ----- SSL 安全配置 -----
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # ----- 日志 -----
    access_log /var/log/nginx/ienglish.access.log;
    error_log  /var/log/nginx/ienglish.error.log;

    # ----- 反向代理到 Next.js 应用 -----
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        # WebSocket 支持（Next.js 热更新需要）
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        # 传递客户端真实信息
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 缓存控制
        proxy_cache_bypass $http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # ----- 静态资源缓存优化 -----
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /public {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=86400";
    }
}
```

### 5.3 启用配置

```bash
# 1. 创建软链接启用站点
sudo ln -s /etc/nginx/sites-available/ienglish.xdf.cn /etc/nginx/sites-enabled/

# 2. 测试配置语法
sudo nginx -t

# 3. 重新加载 Nginx
sudo systemctl reload nginx
```

---

## 六、配置完成后验证

### 6.1 运维自检

```bash
# 检查 Nginx 状态
sudo systemctl status nginx

# 检查配置语法
sudo nginx -t

# 检查端口监听
sudo netstat -tlnp | grep -E '80|443'

# 测试本地代理
curl -I http://127.0.0.1:3000
```

### 6.2 外部访问测试

```bash
# HTTP 应返回 301 重定向
curl -I http://ienglish.xdf.cn

# HTTPS 应返回 200 OK
curl -I https://ienglish.xdf.cn
```

### 6.3 预期结果

| 访问地址 | 预期响应 |
|----------|----------|
| http://ienglish.xdf.cn | 301 → https://ienglish.xdf.cn |
| https://ienglish.xdf.cn | 200 OK |
| https://ienglish.xdf.cn/login | 200 OK（登录页面） |

---

## 七、数据库信息（已配置）

| 项目 | 值 |
|------|-----|
| **类型** | MySQL (阿里云 RDS) |
| **主库地址** | rm-2zel9bu41o5s0v0j8.mysql.rds.aliyuncs.com:3306 |
| **从库地址** | rr-2zenk118a3dkqgu1f.mysql.rds.aliyuncs.com:3306 |
| **数据库名** | bdcxcx |
| **读写账号** | PRO_RDS_bdcxcx_RW |
| **只读账号** | PRO_RDS_bdcxcx_RO |
| **状态** | ✅ 已连接正常 |

> ⚠️ **注意**: 请确认 RDS 白名单已包含服务器 IP (47.94.235.91 和 172.20.234.44)


