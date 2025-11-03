@echo off
echo 正在初始化数据库...
echo.

set DATABASE_URL=postgres://70b463f0b437de031fed82ef1e60a31c4764574b5b85f2971518520d47db953d:sk_ppgr1YQhsciDLwChczX1t@db.prisma.io:5432/postgres?sslmode=require

echo 1. 推送数据库结构...
npx prisma db push

echo.
echo 2. 初始化数据...
node scripts/init-db.js

echo.
echo 完成！
pause
