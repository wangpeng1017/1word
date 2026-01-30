import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

/**
 * 图片API接口
 * 解决静态文件在反向代理环境下无法访问的问题
 * 访问路径: /api/images/words/wedding.webp
 * 实际文件: public/images/words/wedding.webp
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: imagePathSegments } = await params

  // 构建文件路径
  const relativePath = imagePathSegments.join('/')
  const fullPath = path.join(process.cwd(), 'public', relativePath)

  // 安全检查：确保路径在public目录内
  const resolvedPath = path.resolve(fullPath)
  const publicPath = path.resolve(process.cwd(), 'public')
  if (!resolvedPath.startsWith(publicPath)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 403 })
  }

  // 检查文件是否存在
  if (!existsSync(resolvedPath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  try {
    // 读取文件
    const fileBuffer = await readFile(resolvedPath)

    // 根据扩展名设置Content-Type
    const ext = path.extname(resolvedPath).toLowerCase()
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
    }
    const contentType = contentTypes[ext] || 'application/octet-stream'

    // 设置缓存头（1天）
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    })
  } catch (error) {
    console.error('[Image API] Error serving file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
