import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import path from 'path'

/**
 * @file 动态文件服务 API
 * @desc 服务 data/uploads 目录下的文件，解决 Next.js 静态文件限制
 */

// 文件类型到 MIME 类型的映射
const mimeTypes: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.pdf': 'application/pdf',
  '.json': 'application/json',
}

/**
 * GET /api/files/[...path]
 * 动态服务上传的文件
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params

    if (!pathSegments || pathSegments.length === 0) {
      return NextResponse.json({ error: '文件路径不能为空' }, { status: 400 })
    }

    // 构建文件路径：data/uploads/{type}/{filename}
    const relativePath = pathSegments.join('/')
    const filePath = path.join(process.cwd(), 'data', 'uploads', relativePath)

    // 安全检查：防止路径遍历攻击
    const uploadsDir = path.join(process.cwd(), 'data', 'uploads')
    const resolvedPath = path.resolve(filePath)
    if (!resolvedPath.startsWith(uploadsDir)) {
      return NextResponse.json({ error: '无效的文件路径' }, { status: 403 })
    }

    // 检查文件是否存在
    try {
      const fileStat = await stat(filePath)
      if (!fileStat.isFile()) {
        return NextResponse.json({ error: '不是有效的文件' }, { status: 404 })
      }
    } catch {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 })
    }

    // 读取文件
    const fileBuffer = await readFile(filePath)

    // 获取文件扩展名和 MIME 类型
    const ext = path.extname(filePath).toLowerCase()
    const contentType = mimeTypes[ext] || 'application/octet-stream'

    // 返回文件，设置缓存头
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable', // 1年缓存
      },
    })
  } catch (error: any) {
    console.error('文件服务错误:', error)
    return NextResponse.json(
      { error: '文件读取失败' },
      { status: 500 }
    )
  }
}
