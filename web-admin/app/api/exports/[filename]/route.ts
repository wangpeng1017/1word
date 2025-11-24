import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

/**
 * 下载导出的文件
 * GET /api/exports/[filename]
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ filename: string }> }
) {
    const params = await context.params
    try {
        const { filename } = params

        // 安全检查：防止路径遍历攻击
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return NextResponse.json(
                { success: false, error: '无效的文件名' },
                { status: 400 }
            )
        }

        const filepath = path.join('/tmp', 'exports', filename)

        // 检查文件是否存在
        if (!fs.existsSync(filepath)) {
            return NextResponse.json(
                { success: false, error: '文件不存在' },
                { status: 404 }
            )
        }

        // 读取文件
        const fileBuffer = fs.readFileSync(filepath)

        // 确定文件类型
        const ext = path.extname(filename).toLowerCase()
        let contentType = 'application/octet-stream'
        if (ext === '.pdf') {
            contentType = 'application/pdf'
        } else if (ext === '.docx') {
            contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        } else if (ext === '.zip') {
            contentType = 'application/zip'
        }

        // 返回文件
        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
                'Content-Length': fileBuffer.length.toString(),
            },
        })
    } catch (error) {
        console.error('下载文件错误:', error)
        return NextResponse.json(
            { success: false, error: '下载文件失败' },
            { status: 500 }
        )
    }
}
