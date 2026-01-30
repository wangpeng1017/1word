# students API 索引
> 学生管理相关接口

⚠️ 文件夹变化时请更新此文件

## 文件清单
| 文件 | 功能 |
|------|------|
| route.ts | GET 学生列表, POST 创建学生 |
| [id]/route.ts | GET/PUT/DELETE 单个学生操作 |
| [id]/reset-password/route.ts | POST 重置学生密码 |
| [id]/daily-tasks/route.ts | GET 学生每日任务（含图片URL转换: /images/ → /api/images/）|
| [id]/wrong-questions/route.ts | GET 学生错题 |
| import/route.ts | POST 批量导入学生 |

## 权限说明
- TEACHER 和 ADMIN 角色可访问

## 变更记录
- 2026-01-30: 新增图片URL转换功能(transformImageUrl)，解决XDF环境小程序图片无法显示问题
- 2025-12-25: 修复权限，允许ADMIN角色访问
