import { NextRequest } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { unauthorizedResponse, errorResponse, successResponse } from '@/lib/response'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

/**
 * 上传文件到本地存储
 * POST /api/upload
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')

    const payload = verifyToken(token || '')
    if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
      return unauthorizedResponse('只有教师或管理员可以上传文件')
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string || 'general' // audio, image, qrcode, general

    if (!file) {
      return errorResponse('请选择文件')
    }

    // 验证文件类型和大小
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return errorResponse('文件大小不能超过10MB')
    }

    // 验证文件类型
    const allowedTypes: Record<string, string[]> = {
      audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'],
      image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      qrcode: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      general: ['*/*'],
    }

    if (type !== 'general' && !allowedTypes[type]?.includes(file.type)) {
      return errorResponse(`不支持的${type === 'audio' ? '音频' : '图片'}格式`)
    }

    // 生成文件名（使用时间戳和随机字符串避免冲突）
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const extension = file.name.split('.').pop()
    const filename = `${timestamp}-${randomStr}.${extension}`

    // 保存到本地 public/uploads/{type}/ 目录
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', type)

    // 确保目录存在
    await mkdir(uploadDir, { recursive: true })

    // 写入文件
    const filePath = path.join(uploadDir, filename)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    // 返回相对URL（可通过 /uploads/{type}/{filename} 访问）
    const url = `/uploads/${type}/${filename}`

    return successResponse({
      url,
      filename: file.name,
      size: file.size,
      type: file.type,
    }, '文件上传成功')
  } catch (error: any) {
    console.error('文件上传错误:', error)
    return errorResponse('文件上传失败', 500)
  }
}

/**
 * 删除文件
 * DELETE /api/upload?url=xxx
 */
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')

    const payload = verifyToken(token || '')
    if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
      return unauthorizedResponse('只有教师或管理员可以删除文件')
    }

    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return errorResponse('缺少文件URL')
    }

    // 只处理本地上传的文件（以 /uploads/ 开头）
    if (url.startsWith('/uploads/')) {
      const { unlink } = await import('fs/promises')
      const filePath = path.join(process.cwd(), 'public', url)
      try {
        await unlink(filePath)
      } catch (e) {
        // 文件可能不存在，忽略错误
      }
    }

    return successResponse(null, '文件删除成功')
  } catch (error) {
    console.error('文件删除错误:', error)
    return errorResponse('文件删除失败', 500)
  }
}
