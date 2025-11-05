# 批量修复Next.js 15动态路由参数类型

$files = @(
    "app\api\review-plan\[studentId]\route.ts",
    "app\api\students\[id]\route.ts",
    "app\api\students\[id]\daily-tasks\route.ts",
    "app\api\students\[id]\wrong-questions\route.ts",
    "app\api\vocabularies\[id]\route.ts",
    "app\api\vocabularies\[id]\files\route.ts",
    "app\api\vocabularies\[id]\questions\route.ts",
    "app\api\vocabularies\[id]\questions\[questionId]\route.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Processing $file..." -ForegroundColor Cyan
        $content = Get-Content $file -Raw
        
        # 修复 { params }: { params: { ... } } 为 { params }: { params: Promise<{ ... }> }
        $content = $content -replace '(\{ params \}:\s*\{\s*params:\s*)(\{[^}]+\})', '$1Promise<$2>'
        
        # 修复 const { ... } = params 为 const { ... } = await params
        $content = $content -replace '(const\s+\{[^}]+\}\s*=\s*)params\s*$', '$1await params'
        $content = $content -replace '(const\s+\{[^}]+\}\s*=\s*)params(\s+)', '$1await params$2'
        
        Set-Content $file -Value $content -NoNewline
        Write-Host "✓ Fixed $file" -ForegroundColor Green
    } else {
        Write-Host "✗ File not found: $file" -ForegroundColor Red
    }
}

Write-Host "`n✨ All files processed!" -ForegroundColor Green
