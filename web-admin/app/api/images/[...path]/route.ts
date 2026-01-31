/**
 * @file route.ts
 * @desc 图片API - 提供静态图片访问
 * 解决反向代理环境下静态文件无法访问的问题
 */

import { NextRequest } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

const PUBLIC_DIR = join(process.cwd(), 'public')

// GET /api/images/[...path] - 返回静态图片文件
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params

    // 安全检查：防止路径穿越攻击
    const safePath = path.filter(segment => {
      return segment !== '..' && segment !== '.' && !segment.includes('\\')
    })

    const filePath = join(PUBLIC_DIR, 'images', ...safePath)

    // 尝试读取文件
    const file = await readFile(filePath)

    // 根据扩展名设置 Content-Type
    const ext = path[path.length - 1]?.toLowerCase().split('.')[1] || ''
    const contentTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'ico': 'image/x-icon',
    }

    const contentType = contentTypes[ext] || 'image/jpeg'

    return new Response(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // 缓存 1 年
      },
    })
  } catch (error) {
    // 文件不存在，返回 404
    return new Response('Not Found', { status: 404 })
  }
}
