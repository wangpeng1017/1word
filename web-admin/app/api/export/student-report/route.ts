/**
 * @file route.ts
 * @desc 导出学生学习报告（Word .docx 格式）
 * @see PRD: docs/PRD.md
 */
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { errorResponse, unauthorizedResponse } from '@/lib/response'
import {
  Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun,
  AlignmentType, HeadingLevel, WidthType, VerticalAlign,
  ShadingType,
} from 'docx'

// ========== 辅助函数 ==========

/** 创建简单两列表格行 */
function row2(label: string, value: string, bold = false): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
        verticalAlign: VerticalAlign.CENTER,
        width: { size: 30, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: value, bold })] })],
        verticalAlign: VerticalAlign.CENTER,
      }),
    ],
  })
}

/** 创建表头单元格 */
function headerCell(text: string, widthPct?: number): TableCell {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 20 })],
      alignment: AlignmentType.CENTER,
    })],
    verticalAlign: VerticalAlign.CENTER,
    shading: { type: ShadingType.SOLID, color: '4472C4', fill: '4472C4' },
    ...(widthPct ? { width: { size: widthPct, type: WidthType.PERCENTAGE } } : {}),
  })
}

/** 创建普通单元格 */
function cell(text: string, center = false): TableCell {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, size: 20 })],
      alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
    })],
    verticalAlign: VerticalAlign.CENTER,
  })
}

/** 创建分隔段落 */
function spacer(size = 200): Paragraph {
  return new Paragraph({ text: '', spacing: { before: size } })
}

/**
 * 导出学生学习报告（Word 格式）
 * GET /api/export/student-report?studentId=xxx&startDate=xxx&endDate=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')

    const payload = verifyToken(token || '')
    if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
      return unauthorizedResponse('只有教师或管理员可以导出数据')
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!studentId) {
      return errorResponse('缺少学生ID')
    }

    // 获取学生信息
    const student = await prisma.students.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        classes: true,
      },
    })

    if (!student) {
      return errorResponse('学生不存在', 404)
    }

    // 构建日期筛选条件 — 修复 endDate 截断问题
    const dateFilter: any = {}
    if (startDate) dateFilter.gte = new Date(startDate)
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      dateFilter.lte = end
    }
    const hasDateFilter = Object.keys(dateFilter).length > 0

    // ========== 并行查询所有数据 ==========
    const [studyRecords, wordMasteries, wrongQuestions] = await Promise.all([
      // 学习记录（按日期过滤）
      prisma.study_records.findMany({
        where: {
          studentId,
          ...(hasDateFilter ? { taskDate: dateFilter } : {}),
        },
        orderBy: { taskDate: 'desc' },
      }),
      // 词汇掌握（无需日期过滤）
      prisma.word_masteries.findMany({
        where: { studentId },
        include: {
          vocabularies: {
            select: { word: true, primary_meaning: true, difficulty: true },
          },
        },
        orderBy: { totalWrongCount: 'desc' },
      }),
      // 错题记录（只导出活跃错题，不按日期过滤）
      prisma.wrong_questions.findMany({
        where: {
          studentId,
          status: 'ACTIVE',
        },
        include: {
          vocabularies: {
            select: { word: true, primary_meaning: true },
          },
        },
        orderBy: { wrongCount: 'desc' },
      }),
    ])

    // ========== 计算统计数据 ==========
    const totalSessions = studyRecords.length
    const completedSessions = studyRecords.filter(r => r.isCompleted).length
    const totalWords = studyRecords.reduce((sum, r) => sum + r.completedWords, 0)
    const totalCorrect = studyRecords.reduce((sum, r) => sum + r.correctCount, 0)
    const totalWrong = studyRecords.reduce((sum, r) => sum + r.wrongCount, 0)
    const avgAccuracy = (totalCorrect + totalWrong) > 0
      ? ((totalCorrect / (totalCorrect + totalWrong)) * 100).toFixed(1) : '0'
    const totalTimeMin = Math.floor(studyRecords.reduce((sum, r) => sum + r.totalTime, 0) / 60)

    const masteredCount = wordMasteries.filter(m => m.isMastered).length
    const learningCount = wordMasteries.filter(m => !m.isMastered).length
    const difficultCount = wordMasteries.filter(m => m.isDifficult).length

    const periodText = startDate && endDate
      ? `${startDate} 至 ${endDate}`
      : '全部学习周期'

    // ========== 构建 Word 文档 ==========
    const children: (Paragraph | Table)[] = []

    // ─── 标题 ───
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `${student.user.name} 学习报告`, bold: true, size: 36 })],
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `生成时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`, color: '888888', size: 18 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
      }),
    )

    // ─── 一、学生信息 ───
    children.push(
      new Paragraph({
        text: '一、学生信息',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 100 },
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          row2('姓名', student.user.name),
          row2('学号', student.student_no),
          row2('班级', student.classes?.name || '未分配'),
          row2('统计周期', periodText),
        ],
      }),
    )

    // ─── 二、学习统计 ───
    children.push(
      new Paragraph({
        text: '二、学习统计',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 100 },
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          row2('学习总次数', `${totalSessions} 次`),
          row2('完成次数', `${completedSessions} 次`),
          row2('学习总词数', `${totalWords} 个`),
          row2('正确答题数', `${totalCorrect}`),
          row2('错误答题数', `${totalWrong}`),
          row2('平均正确率', `${avgAccuracy}%`, true),
          row2('总学习时长', `${totalTimeMin} 分钟`),
          row2('已掌握词汇', `${masteredCount} 个`),
          row2('学习中词汇', `${learningCount} 个`),
          row2('难点词汇', `${difficultCount} 个`),
          row2('活跃错题数', `${wrongQuestions.length} 个`),
        ],
      }),
    )

    // ─── 三、学习记录明细 ───
    children.push(
      new Paragraph({
        text: '三、学习记录明细',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 100 },
      }),
    )

    if (studyRecords.length > 0) {
      const recordRows: TableRow[] = [
        new TableRow({
          children: [
            headerCell('日期', 18),
            headerCell('完成词数', 14),
            headerCell('正确', 12),
            headerCell('错误', 12),
            headerCell('正确率', 14),
            headerCell('用时(分)', 14),
            headerCell('状态', 16),
          ],
        }),
      ]

      studyRecords.forEach(record => {
        recordRows.push(new TableRow({
          children: [
            cell(record.taskDate.toISOString().split('T')[0], true),
            cell(`${record.completedWords}`, true),
            cell(`${record.correctCount}`, true),
            cell(`${record.wrongCount}`, true),
            cell(`${(record.accuracy * 100).toFixed(1)}%`, true),
            cell(`${Math.floor(record.totalTime / 60)}`, true),
            cell(record.isCompleted ? '已完成' : '未完成', true),
          ],
        }))
      })

      children.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: recordRows,
      }))
    } else {
      children.push(new Paragraph({
        children: [new TextRun({ text: '暂无学习记录', italics: true, color: '888888' })],
      }))
    }

    // ─── 四、错题记录 ───
    children.push(
      new Paragraph({
        text: '四、错题记录',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 100 },
      }),
    )

    if (wrongQuestions.length > 0) {
      const wrongRows: TableRow[] = [
        new TableRow({
          children: [
            headerCell('单词', 20),
            headerCell('释义', 30),
            headerCell('错误答案', 20),
            headerCell('正确答案', 20),
            headerCell('错误次数', 10),
          ],
        }),
      ]

      wrongQuestions.forEach(wq => {
        wrongRows.push(new TableRow({
          children: [
            cell(wq.vocabularies.word),
            cell((wq.vocabularies as any).primary_meaning),
            cell(wq.wrongAnswer || '-'),
            cell(wq.correctAnswer),
            cell(`${wq.wrongCount}`, true),
          ],
        }))
      })

      children.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: wrongRows,
      }))
    } else {
      children.push(new Paragraph({
        children: [new TextRun({ text: '暂无错题记录', italics: true, color: '888888' })],
      }))
    }

    // ─── 五、词汇掌握详情 ───
    children.push(
      new Paragraph({
        text: '五、词汇掌握详情',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 100 },
      }),
    )

    if (wordMasteries.length > 0) {
      const difficultyMap: Record<string, string> = {
        EASY: '简单', MEDIUM: '中等', HARD: '困难',
      }

      const masteryRows: TableRow[] = [
        new TableRow({
          children: [
            headerCell('单词', 18),
            headerCell('释义', 28),
            headerCell('难度', 10),
            headerCell('错误次数', 12),
            headerCell('连续正确', 12),
            headerCell('掌握状态', 20),
          ],
        }),
      ]

      wordMasteries.forEach(mastery => {
        const status = mastery.isMastered ? '✅ 已掌握'
          : mastery.isDifficult ? '⚠️ 重点难点'
            : '📖 学习中'

        masteryRows.push(new TableRow({
          children: [
            cell(mastery.vocabularies.word),
            cell((mastery.vocabularies as any).primary_meaning),
            cell(difficultyMap[mastery.vocabularies.difficulty] || mastery.vocabularies.difficulty, true),
            cell(`${mastery.totalWrongCount}`, true),
            cell(`${mastery.consecutiveCorrect}`, true),
            cell(status, true),
          ],
        }))
      })

      children.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: masteryRows,
      }))
    } else {
      children.push(new Paragraph({
        children: [new TextRun({ text: '暂无词汇掌握数据', italics: true, color: '888888' })],
      }))
    }

    // ─── 页脚 ───
    children.push(spacer(400))
    children.push(new Paragraph({
      children: [new TextRun({ text: '— iEnglish 智能词汇复习助手 —', color: 'AAAAAA', size: 16 })],
      alignment: AlignmentType.CENTER,
    }))

    // ========== 生成 Word 文件 ==========
    const doc = new Document({
      creator: 'iEnglish 智能词汇复习助手',
      description: `${student.user.name} 学习报告`,
      sections: [{ properties: {}, children }],
    })

    const buffer = await Packer.toBuffer(doc)

    // 返回文件
    const fileName = `${student.user.name}_学习报告_${new Date().toISOString().split('T')[0]}.docx`
    const encodedFileName = encodeURIComponent(fileName)
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`,
      },
    })
  } catch (error) {
    console.error('导出学习报告错误:', error)
    return errorResponse('导出学习报告失败', 500)
  }
}
