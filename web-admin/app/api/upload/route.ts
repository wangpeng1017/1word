import { NextRequest, NextResponse } from 'next/server'
import { put, del } from '@vercel/blob'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { unauthorizedResponse, errorResponse, successResponse } from '@/lib/response'

/**
 * 上传文件到Vercel Blob
 * POST /api/upload
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以上传文件')
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string || 'general' // audio, image, general

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
      general: ['*/*'],
    }

    if (type !== 'general' && !allowedTypes[type]?.includes(file.type)) {
      return errorResponse(`不支持的${type === 'audio' ? '音频' : '图片'}格式`)
    }

    // 生成文件名（使用时间戳和随机字符串避免冲突）
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const extension = file.name.split('.').pop()
    const filename = `${type}/${timestamp}-${randomStr}.${extension}`

    // 上传到Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
    })

    return successResponse({
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
    }, '文件上传成功')
  } catch (error: any) {
    console.error('文件上传错误:', error)
    
    // 如果是Vercel Blob配置错误
    if (error.message?.includes('BLOB_READ_WRITE_TOKEN')) {
      return errorResponse('文件存储服务未配置，请在Vercel项目设置中添加Blob Storage')
    }
    
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
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以删除文件')
    }

    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return errorResponse('缺少文件URL')
    }

    // 从Vercel Blob删除文件
    await del(url)

    return successResponse(null, '文件删除成功')
  } catch (error) {
    console.error('文件删除错误:', error)
    return errorResponse('文件删除失败', 500)
  }
}
