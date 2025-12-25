# classes API 索引
> 班级管理相关接口

⚠️ 文件夹变化时请更新此文件

## 文件清单
| 文件 | 功能 |
|------|------|
| route.ts | GET 班级列表, POST 创建班级 |
| [id]/route.ts | GET/PUT/DELETE 单个班级操作 |

## 权限说明
- TEACHER 和 ADMIN 角色可访问
- teacher_id 为可选字段（班级可暂时无老师）

## 变更记录
- 2025-12-25: 修复权限，允许ADMIN角色访问；teacher_id改为可选
