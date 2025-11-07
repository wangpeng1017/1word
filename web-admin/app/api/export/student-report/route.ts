import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { errorResponse, unauthorizedResponse } from '@/lib/response'
import ExcelJS from 'exceljs'

/**
 * 导出学生学习报告（Excel格式）
 * GET /api/export/student-report?studentId=xxx&startDate=xxx&endDate=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以导出数据')
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
        class: true,
      },
    })

    if (!student) {
      return errorResponse('学生不存在', 404)
    }

    // 构建日期筛选条件
    const dateFilter: any = {}
    if (startDate) dateFilter.gte = new Date(startDate)
    if (endDate) dateFilter.lte = new Date(endDate)

    // 获取学习记录
    const studyRecords = await prisma.study_records.findMany({
      where: {
        studentId,
        ...(Object.keys(dateFilter).length > 0 ? { taskDate: dateFilter } : {}),
      },
      orderBy: {
        taskDate: 'desc',
      },
    })

    // 获取词汇掌握情况
    const wordMasteries = await prisma.word_masteries.findMany({
      where: { studentId },
      include: {
        vocabularies: {
          select: {
            word: true,
            primaryMeaning: true,
            difficulty: true,
          },
        },
      },
    })

    // 获取错题记录
    const wrongQuestions = await prisma.wrong_questions.findMany({
      where: {
        studentId,
        ...(Object.keys(dateFilter).length > 0 ? { wrongAt: dateFilter } : {}),
      },
      include: {
        vocabularies: {
          select: {
            word: true,
            primaryMeaning: true,
          },
        },
      },
      orderBy: {
        wrongAt: 'desc',
      },
    })

    // 创建Excel工作簿
    const workbook = new ExcelJS.Workbook()
    workbook.creator = '智能词汇复习助手'
    workbook.created = new Date()

    // ========== 第一个工作表：学生基本信息 ==========
    const infoSheet = workbook.addWorksheet('学生信息')
    
    // 标题样式
    const titleStyle = {
      font: { bold: true, size: 14, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } } as ExcelJS.FillPattern,
      alignment: { vertical: 'middle', horizontal: 'center' } as ExcelJS.Alignment,
    }

    infoSheet.columns = [
      { key: 'label', width: 20 },
      { key: 'value', width: 30 },
    ]

    infoSheet.addRow(['学生信息', '']).font = { bold: true, size: 16 }
    infoSheet.mergeCells('A1:B1')
    infoSheet.getRow(1).height = 30
    infoSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' }

    const studentInfo = [
      ['姓名', student.user.name],
      ['学号', student.studentNo],
      ['年级', student.grade || '-'],
      ['班级', student.classes.name || '-'],
      ['统计日期', `${startDate || '开始'} 至 ${endDate || '今天'}`],
    ]

    studentInfo.forEach(([label, value]) => {
      const row = infoSheet.addRow({ label, value })
      row.getCell(1).font = { bold: true }
    })

    // ========== 第二个工作表：学习统计 ==========
    const statsSheet = workbook.addWorksheet('学习统计')
    
    statsSheet.columns = [
      { key: 'metric', width: 25 },
      { key: 'value', width: 20 },
    ]

    // 标题行
    statsSheet.addRow(['学习统计数据', '']).font = { bold: true, size: 16 }
    statsSheet.mergeCells('A1:B1')
    statsSheet.getRow(1).height = 30
    statsSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' }

    // 计算统计数据
    const totalSessions = studyRecords.length
    const completedSessions = studyRecords.filter(r => r.isCompleted).length
    const totalWords = studyRecords.reduce((sum, r) => sum + r.completedWords, 0)
    const totalCorrect = studyRecords.reduce((sum, r) => sum + r.correctCount, 0)
    const totalWrong = studyRecords.reduce((sum, r) => sum + r.wrongCount, 0)
    const avgAccuracy = totalWords > 0 ? ((totalCorrect / (totalCorrect + totalWrong)) * 100).toFixed(1) : '0'
    const totalTime = Math.floor(studyRecords.reduce((sum, r) => sum + r.totalTime, 0) / 60)

    const masteredCount = wordMasteries.filter(m => m.isMastered).length
    const learningCount = wordMasteries.filter(m => !m.isMastered).length
    const difficultCount = wordMasteries.filter(m => m.isDifficult).length

    const stats = [
      ['学习总次数', totalSessions],
      ['完成次数', completedSessions],
      ['学习总词数', totalWords],
      ['正确答题数', totalCorrect],
      ['错误答题数', totalWrong],
      ['平均正确率', `${avgAccuracy}%`],
      ['总学习时长', `${totalTime} 分钟`],
      ['已掌握词汇', masteredCount],
      ['学习中词汇', learningCount],
      ['难点词汇', difficultCount],
    ]

    stats.forEach(([metric, value]) => {
      const row = statsSheet.addRow({ metric, value })
      row.getCell(1).font = { bold: true }
      row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } } as ExcelJS.FillPattern
    })

    // ========== 第三个工作表：学习记录明细 ==========
    const recordsSheet = workbook.addWorksheet('学习记录')
    
    recordsSheet.columns = [
      { key: 'date', header: '日期', width: 15 },
      { key: 'words', header: '完成词数', width: 12 },
      { key: 'correct', header: '正确数', width: 12 },
      { key: 'wrong', header: '错误数', width: 12 },
      { key: 'accuracy', header: '正确率', width: 12 },
      { key: 'time', header: '用时(分钟)', width: 15 },
      { key: 'status', header: '状态', width: 12 },
    ]

    // 设置表头样式
    recordsSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } } as ExcelJS.FillPattern
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })

    studyRecords.forEach((record) => {
      recordsSheet.addRow({
        date: record.taskDate.toISOString().split('T')[0],
        words: record.completedWords,
        correct: record.correctCount,
        wrong: record.wrongCount,
        accuracy: `${(record.accuracy * 100).toFixed(1)}%`,
        time: Math.floor(record.totalTime / 60),
        status: record.isCompleted ? '已完成' : '未完成',
      })
    })

    // ========== 第四个工作表：错题记录 ==========
    const wrongSheet = workbook.addWorksheet('错题记录')
    
    wrongSheet.columns = [
      { key: 'date', header: '日期', width: 15 },
      { key: 'word', header: '单词', width: 20 },
      { key: 'meaning', header: '释义', width: 30 },
      { key: 'wrongAnswer', header: '错误答案', width: 25 },
      { key: 'correctAnswer', header: '正确答案', width: 25 },
    ]

    wrongSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6B6B' } } as ExcelJS.FillPattern
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })

    wrongQuestions.forEach((wq) => {
      wrongSheet.addRow({
        date: wq.wrongAt.toISOString().split('T')[0],
        word: wq.vocabularies.word,
        meaning: wq.vocabularies.primaryMeaning,
        wrongAnswer: wq.wrongAnswer,
        correctAnswer: wq.correctAnswer,
      })
    })

    // ========== 第五个工作表：词汇掌握详情 ==========
    const masterySheet = workbook.addWorksheet('词汇掌握详情')
    
    masterySheet.columns = [
      { key: 'word', header: '单词', width: 20 },
      { key: 'meaning', header: '释义', width: 30 },
      { key: 'difficulty', header: '难度', width: 12 },
      { key: 'wrongCount', header: '错误次数', width: 12 },
      { key: 'consecutiveCorrect', header: '连续正确', width: 12 },
      { key: 'status', header: '掌握状态', width: 15 },
    ]

    masterySheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF52C41A' } } as ExcelJS.FillPattern
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })

    wordMasteries.forEach((mastery) => {
      const difficultyMap: Record<string, string> = {
        EASY: '简单',
        MEDIUM: '中等',
        HARD: '困难',
      }
      
      masterySheet.addRow({
        word: mastery.vocabularies.word,
        meaning: mastery.vocabularies.primaryMeaning,
        difficulty: difficultyMap[mastery.vocabularies.difficulty],
        wrongCount: mastery.totalWrongCount,
        consecutiveCorrect: mastery.consecutiveCorrect,
        status: mastery.isMastered ? '已掌握' : mastery.isDifficult ? '重点难点' : '学习中',
      })
    })

    // 生成Excel文件
    const buffer = await workbook.xlsx.writeBuffer()

    // 返回文件
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(student.user.name)}_学习报告_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('导出学习报告错误:', error)
    return errorResponse('导出学习报告失败', 500)
  }
}
