import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'
import ExcelJS from 'exceljs'

/**
 * 批量导入词汇
 * POST /api/vocabularies/import
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以导入词汇')
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return errorResponse('请上传Excel文件')
    }

    // 读取Excel文件
    const buffer = await file.arrayBuffer()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)

    const worksheet = workbook.getWorksheet(1)
    if (!worksheet) {
      return errorResponse('Excel文件格式错误')
    }

    const vocabularies: any[] = []
    const errors: string[] = []

    // 跳过标题行，从第二行开始读取
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return // 跳过标题行

      try {
        const word = row.getCell(1).value?.toString().trim()
        const partOfSpeechStr = row.getCell(2).value?.toString().trim()
        const primaryMeaning = row.getCell(3).value?.toString().trim()
        const secondaryMeaning = row.getCell(4).value?.toString().trim()
        const phonetic = row.getCell(5).value?.toString().trim()
        const difficultyStr = row.getCell(6).value?.toString().trim()
        const isHighFrequencyStr = row.getCell(7).value?.toString().trim()

        // 验证必填字段
        if (!word) {
          errors.push(`第${rowNumber}行：单词不能为空`)
          return
        }

        if (!partOfSpeechStr) {
          errors.push(`第${rowNumber}行：词性不能为空`)
          return
        }

        if (!primaryMeaning) {
          errors.push(`第${rowNumber}行：核心释义不能为空`)
          return
        }

        // 解析词性（支持逗号分隔）
        const partOfSpeech = partOfSpeechStr
          .split(/[,，、]/)
          .map(p => p.trim())
          .filter(p => p)

        if (partOfSpeech.length === 0) {
          errors.push(`第${rowNumber}行：词性格式错误`)
          return
        }

        // 验证词性值
        const validPartOfSpeech = ['n.', 'v.', 'adj.', 'adv.', 'prep.', 'pron.', 'conj.', 'interj.']
        const invalidPos = partOfSpeech.filter(p => !validPartOfSpeech.includes(p))
        if (invalidPos.length > 0) {
          errors.push(`第${rowNumber}行：词性 "${invalidPos.join(', ')}" 无效，有效值为：${validPartOfSpeech.join(', ')}`)
          return
        }

        // 解析难度
        let difficulty = 'MEDIUM'
        if (difficultyStr) {
          const difficultyMap: Record<string, string> = {
            '简单': 'EASY',
            'easy': 'EASY',
            'EASY': 'EASY',
            '中等': 'MEDIUM',
            'medium': 'MEDIUM',
            'MEDIUM': 'MEDIUM',
            '困难': 'HARD',
            'hard': 'HARD',
            'HARD': 'HARD',
          }
          difficulty = difficultyMap[difficultyStr] || 'MEDIUM'
        }

        // 解析是否高频
        let isHighFrequency = false
        if (isHighFrequencyStr) {
          isHighFrequency = ['是', 'true', 'TRUE', 'yes', 'YES', '1'].includes(isHighFrequencyStr)
        }

        vocabularies.push({
          word,
          partOfSpeech,
          primaryMeaning,
          secondaryMeaning: secondaryMeaning || undefined,
          phonetic: phonetic || undefined,
          difficulty,
          isHighFrequency,
        })
      } catch (error) {
        errors.push(`第${rowNumber}行：解析错误 - ${error}`)
      }
    })

    if (errors.length > 0) {
      return errorResponse(`导入失败，发现 ${errors.length} 个错误：\n${errors.slice(0, 10).join('\n')}${errors.length > 10 ? '\n...' : ''}`)
    }

    if (vocabularies.length === 0) {
      return errorResponse('未找到有效的词汇数据')
    }

    // 批量创建词汇（跳过已存在的）
    let successCount = 0
    let skippedCount = 0
    const skipped: string[] = []

    for (const vocab of vocabularies) {
      try {
        // 检查是否已存在
        const existing = await prisma.vocabulary.findUnique({
          where: { word: vocab.word },
        })

        if (existing) {
          skippedCount++
          skipped.push(vocab.word)
          continue
        }

        await prisma.vocabulary.create({
          data: vocab,
        })
        successCount++
      } catch (error) {
        console.error(`创建词汇 ${vocab.word} 失败:`, error)
      }
    }

    return successResponse({
      total: vocabularies.length,
      success: successCount,
      skipped: skippedCount,
      skippedWords: skipped.slice(0, 20),
    }, `成功导入 ${successCount} 个词汇${skippedCount > 0 ? `，跳过 ${skippedCount} 个已存在的词汇` : ''}`)
  } catch (error) {
    console.error('导入词汇错误:', error)
    return errorResponse('导入词汇失败', 500)
  }
}

/**
 * 下载词汇导入模板
 * GET /api/vocabularies/import
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以下载模板')
    }

    // 创建Excel工作簿
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('词汇导入模板')

    // 设置列
    worksheet.columns = [
      { header: '单词*', key: 'word', width: 20 },
      { header: '词性*', key: 'partOfSpeech', width: 15 },
      { header: '核心释义*', key: 'primaryMeaning', width: 30 },
      { header: '延伸释义', key: 'secondaryMeaning', width: 30 },
      { header: '音标', key: 'phonetic', width: 20 },
      { header: '难度', key: 'difficulty', width: 12 },
      { header: '高考高频', key: 'isHighFrequency', width: 12 },
    ]

    // 设置表头样式
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } } as ExcelJS.FillPattern
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })

    // 添加示例数据
    const examples = [
      {
        word: 'hello',
        partOfSpeech: 'n.,interj.',
        primaryMeaning: '你好；问候',
        secondaryMeaning: '表示惊讶或引起注意',
        phonetic: '/həˈloʊ/',
        difficulty: '简单',
        isHighFrequency: '否',
      },
      {
        word: 'world',
        partOfSpeech: 'n.',
        primaryMeaning: '世界；地球',
        secondaryMeaning: '领域；界',
        phonetic: '/wɜːrld/',
        difficulty: '简单',
        isHighFrequency: '是',
      },
      {
        word: 'important',
        partOfSpeech: 'adj.',
        primaryMeaning: '重要的；有重大影响的',
        secondaryMeaning: '',
        phonetic: '/ɪmˈpɔːrtnt/',
        difficulty: '中等',
        isHighFrequency: '是',
      },
    ]

    examples.forEach((example) => {
      worksheet.addRow(example)
    })

    // 添加说明工作表
    const instructionSheet = workbook.addWorksheet('导入说明')
    instructionSheet.columns = [
      { key: 'instruction', width: 80 },
    ]

    const instructions = [
      '词汇批量导入说明',
      '',
      '1. 必填字段（带*号）：',
      '   - 单词：英文单词，如 hello',
      '   - 词性：词性缩写，多个词性用逗号分隔，如 n.,v.',
      '     有效值：n. v. adj. adv. prep. pron. conj. interj.',
      '   - 核心释义：主要中文释义',
      '',
      '2. 可选字段：',
      '   - 延伸释义：其他中文释义',
      '   - 音标：国际音标，如 /həˈloʊ/',
      '   - 难度：简单/中等/困难（默认：中等）',
      '   - 高考高频：是/否（默认：否）',
      '',
      '3. 注意事项：',
      '   - 请勿修改模板的列名',
      '   - 第一行为表头，从第二行开始填写数据',
      '   - 已存在的单词会自动跳过',
      '   - 建议每次导入不超过1000个词汇',
      '',
      '4. 常见错误：',
      '   - 单词重复',
      '   - 词性格式错误',
      '   - 必填字段为空',
    ]

    instructions.forEach((instruction, index) => {
      const row = instructionSheet.addRow({ instruction })
      if (index === 0) {
        row.font = { bold: true, size: 14 }
        row.height = 25
      } else if (instruction.startsWith('1.') || instruction.startsWith('2.') || instruction.startsWith('3.') || instruction.startsWith('4.')) {
        row.font = { bold: true, color: { argb: 'FF4472C4' } }
      }
    })

    // 生成Excel文件
    const buffer = await workbook.xlsx.writeBuffer()

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="vocabulary_import_template_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('生成模板错误:', error)
    return errorResponse('生成模板失败', 500)
  }
}
