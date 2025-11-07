import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'
import * as XLSX from 'xlsx'

// Excel 导入题目
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以导入题目')
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return errorResponse('请上传文件')
    }

    // 读取Excel文件
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet) as any[]

    if (data.length === 0) {
      return errorResponse('文件内容为空')
    }

    // 验证必填字段
    const requiredFields = ['word', 'type', 'content', 'correctAnswer']
    const firstRow = data[0]
    const missingFields = requiredFields.filter(field => !(field in firstRow))
    
    if (missingFields.length > 0) {
      return errorResponse(`缺少必填列: ${missingFields.join(', ')}`)
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    // 使用事务批量导入
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        const rowNum = i + 2 // Excel行号（从2开始，1是标题行）

        try {
          // 查找或创建词汇
          let vocabulary = await tx.vocabulary.findFirst({
            where: { word: row.word?.trim() },
          })

          if (!vocabulary) {
            // 自动创建词汇
            let primaryMeaning = ''
            let phonetic = ''

            // 从英译中题目中提取释义和音标
            if (row.type === 'ENGLISH_TO_CHINESE') {
              const phoneticMatch = row.content?.match(/\/(.+?)\//)  
              if (phoneticMatch) {
                phonetic = `/${phoneticMatch[1]}/`
              }
              primaryMeaning = row.correctAnswer?.trim() || ''
            } else if (row.type === 'CHINESE_TO_ENGLISH') {
              // 从中译英题目中提取释义
              primaryMeaning = row.content?.trim() || ''
            }

            vocabulary = await tx.vocabulary.create({
              data: {
                word: row.word?.trim(),
                partOfSpeech: 'n.,v.,adj.',
                primaryMeaning: primaryMeaning || row.word?.trim(),
                phonetic: phonetic || '',
                isHighFrequency: true,
                difficulty: 'MEDIUM'
              }
            })
          }

          // 验证题型
          const validTypes = ['ENGLISH_TO_CHINESE', 'CHINESE_TO_ENGLISH', 'LISTENING', 'FILL_IN_BLANK']
          if (!validTypes.includes(row.type)) {
            results.failed++
            results.errors.push(`行${rowNum}: 无效的题型 "${row.type}"`)
            continue
          }

          // 解析选项（假设格式为：A.选项1|B.选项2|C.选项3|D.选项4）
          let options: any[] = []
          if (row.options) {
            const optionParts = row.options.split('|').map((opt: string) => opt.trim())
            options = optionParts.map((opt: string, index: number) => {
              const content = opt.replace(/^[A-D]\.\s*/, '') // 去掉前缀
              return {
                content,
                isCorrect: content === row.correctAnswer?.trim(),
                order: index,
              }
            })
          }

          // 检查是否已存在相同题目（幂等性）
          const existingQuestion = await tx.question.findFirst({
            where: {
              vocabularyId: vocabulary.id,
              type: row.type,
              content: row.content?.trim(),
            },
          })

          if (existingQuestion) {
            // 更新现有题目
            await tx.questionOption.deleteMany({
              where: { questionId: existingQuestion.id },
            })

            await tx.question.update({
              where: { id: existingQuestion.id },
              data: {
                sentence: row.sentence?.trim() || null,
                audioUrl: row.audioUrl?.trim() || null,
                correctAnswer: row.correctAnswer?.trim(),
                options: {
                  create: options,
                },
              },
            })
          } else {
            // 创建新题目
            await tx.question.create({
              data: {
                vocabularyId: vocabulary.id,
                type: row.type,
                content: row.content?.trim(),
                sentence: row.sentence?.trim() || null,
                audioUrl: row.audioUrl?.trim() || null,
                correctAnswer: row.correctAnswer?.trim(),
                options: {
                  create: options,
                },
              },
            })
          }

          results.success++
        } catch (error: any) {
          results.failed++
          results.errors.push(`行${rowNum}: ${error.message}`)
        }
      }
    })

    return successResponse(
      {
        success: results.success,
        failed: results.failed,
        errors: results.errors.slice(0, 10), // 最多返回前10条错误
      },
      `导入完成，成功 ${results.success} 条，失败 ${results.failed} 条`
    )
  } catch (error: any) {
    console.error('导入题目错误:', error)
    return errorResponse(`导入题目失败: ${error?.message || '未知错误'}`, 500)
  }
}
