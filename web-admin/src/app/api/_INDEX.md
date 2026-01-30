# src/app/api 架构说明
Next.js 15 App Router API路由目录，包含内部API和图片服务
⚠️ 文件夹变化时请更新此文件

## 文件清单
| 文件名 | 地位 | 功能 |
|--------|------|------|
| images/[...path]/route.ts | 核心 | 图片API，通过/api/images/*提供静态文件访问（解决XDF反向代理环境静态文件无法访问的问题）|
