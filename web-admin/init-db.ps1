# Database initialization script
Write-Host "Initializing database..." -ForegroundColor Green

$env:DATABASE_URL = "postgres://70b463f0b437de031fed82ef1e60a31c4764574b5b85f2971518520d47db953d:sk_ppgr1YQhsciDLwChczX1t@db.prisma.io:5432/postgres?sslmode=require"

Write-Host "`n1. Pushing database schema..." -ForegroundColor Yellow
npx prisma db push

Write-Host "`n2. Initializing data..." -ForegroundColor Yellow
node scripts/init-db.js

Write-Host "`nDone!" -ForegroundColor Green
