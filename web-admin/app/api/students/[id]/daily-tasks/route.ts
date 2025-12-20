import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'
import { allocateQuestionTypes, selectQuestionByType } from '@/lib/question-type-allocator'
import { getDateRangeUTC, getTodayBeijing } from '@/lib/date-utils'

// 每日新学单词上限
const MAX_NEW_WORDS_PER_DAY = 200

// 映射任务数据为小程序格式
function mapTasksForMiniapp(tasks: any[], isNewMap: Map<string, boolean>) {
  return tasks.map((t: any) => {
    const v = t.vocabulary || t.vocabularies || {}
    const questions = (v.questions || []).map((q: any) => ({
      id: q.id,
      type: q.type,
      content: q.content,
      sentence: q.sentence,
      audioUrl: q.audioUrl,
      correctAnswer: q.correctAnswer,
      options: (q.question_options || q.options || [])
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
        .map((o: any) => ({
          id: o.id,
          content: o.content,
          isCorrect: o.isCorrect,
          order: o.order,
        })),
    }))

    const audios = v.word_audios || v.audios || []
    const audioUs = audios.find((a: any) => (a.accent || '').toUpperCase() === 'US')?.audioUrl
    const audioUk = audios.find((a: any) => (a.accent || '').toUpperCase() === 'UK')?.audioUrl
    const defaultAudio = audioUs ?? audioUk ?? v.audioUrl ?? v.audio_url ?? null

    const meanings = (v.word_meanings || []).map((m: any) => ({
      id: m.id,
      partOfSpeech: m.partOfSpeech ?? m.part_of_speech,
      meaning: m.meaning,
      orderIndex: m.orderIndex ?? m.order_index,
      examples: m.examples || [],
    }))

    return {
      id: t.id || `task_${v.id}`,
      vocabularyId: v.id,
      isNew: isNewMap.get(v.id) ?? false,
      targetQuestionType: t.targetQuestionType || null,
      selectedQuestionId: t.selectedQuestionId || null,
      vocabulary: {
        id: v.id,
        word: v.word,
        primaryMeaning: v.primaryMeaning ?? v.primary_meaning,
        secondaryMeaning: v.secondaryMeaning ?? v.secondary_meaning,
        meanings,
        audioUrl: defaultAudio,
        audioUs,
        audioUk,
        difficulty: v.difficulty,
        isHighFrequency: v.isHighFrequency ?? v.is_high_frequency,
        questions,
      },
    }
  })
}

// GET /api/students/[id]/daily-tasks - 动态生成学生当日任务
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: studentId } = await params
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return apiResponse.unauthorized('未授权')

    const payload = verifyToken(token)
    if (!payload) return apiResponse.unauthorized('Token无效')

    // 1. 获取学生信息和班级
    const student = await prisma.students.findUnique({
      where: { id: studentId },
      select: { id: true, class_id: true }
    })
    if (!student) return apiResponse.error('学生不存在')

    // 2. 获取班级的活跃词汇库计划
    const planClass = await prisma.plan_classes.findFirst({
      where: {
        class_id: student.class_id,
        status: 'ACTIVE'
      },
      include: {
        vocabulary_packs: {
          include: {
            pack_days: {
              include: {
                day_words: {
                  include: {
                    vocabulary: {
                      include: {
                        word_audios: true,
                        word_meanings: { orderBy: { orderIndex: 'asc' } },
                        questions: {
                          include: {
                            question_options: { orderBy: { order: 'asc' } }
                          }
                        }
                      }
                    }
                  }
                }
              },
              orderBy: { dayNumber: 'asc' }
            }
          }
        }
      }
    })

    const { end: endOfToday } = getDateRangeUTC()
    const today = getTodayBeijing()

    // 3. 获取已掌握的词汇ID
    const masteredWords = await prisma.word_masteries.findMany({
      where: { studentId, isMastered: true },
      select: { vocabularyId: true }
    })
    const masteredVocabIds = new Set(masteredWords.map(w => w.vocabularyId))

    // 4. 获取已有学习记录的词汇ID
    const existingPlans = await prisma.study_plans.findMany({
      where: { studentId },
      select: { vocabularyId: true }
    })
    const learnedVocabIds = new Set(existingPlans.map(p => p.vocabularyId))

    // 5. 计算今日新学单词
    let newWords: any[] = []
    let dayNumber = 0
    let totalDays = 0

    if (planClass?.vocabulary_packs) {
      const pack = planClass.vocabulary_packs
      totalDays = pack.totalDays

      // 计算今天是学习的第几天
      const startDate = new Date(planClass.start_date)
      const diffTime = today.getTime() - startDate.getTime()
      dayNumber = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1

      // 如果在词汇库天数范围内，获取当天的新学单词
      if (dayNumber >= 1 && dayNumber <= totalDays) {
        const packDay = pack.pack_days.find(d => d.dayNumber === dayNumber)
        if (packDay) {
          newWords = packDay.day_words
            .map(dw => dw.vocabulary)
            .filter(v => v && !masteredVocabIds.has(v.id) && !learnedVocabIds.has(v.id))
            .filter(v => v.questions && v.questions.length > 0)
            .slice(0, MAX_NEW_WORDS_PER_DAY)
        }
      }
    }

    // 6. 获取今日复习单词
    const reviewPlans = await prisma.study_plans.findMany({
      where: {
        studentId,
        status: 'LEARNING',
        nextReviewAt: { lte: endOfToday }
      },
      include: {
        vocabularies: {
          include: {
            word_audios: true,
            word_meanings: { orderBy: { orderIndex: 'asc' } },
            questions: {
              include: {
                question_options: { orderBy: { order: 'asc' } }
              }
            }
          }
        }
      }
    })

    // 获取难点词汇用于排序
    const reviewVocabIds = reviewPlans.map(p => p.vocabularyId)
    const difficultWords = await prisma.word_masteries.findMany({
      where: {
        studentId,
        vocabularyId: { in: reviewVocabIds },
        isDifficult: true
      },
      select: { vocabularyId: true }
    })
    const difficultVocabIds = new Set(difficultWords.map(w => w.vocabularyId))

    // 排序：难点词汇优先
    const reviewWords = reviewPlans
      .filter(p => p.vocabularies && p.vocabularies.questions?.length > 0)
      .sort((a, b) => {
        const aIsDifficult = difficultVocabIds.has(a.vocabularyId) ? 1 : 0
        const bIsDifficult = difficultVocabIds.has(b.vocabularyId) ? 1 : 0
        return bIsDifficult - aIsDifficult
      })
      .map(p => ({ vocabulary: p.vocabularies }))

    // 7. 合并任务并标记新学/复习
    const isNewMap = new Map<string, boolean>()
    newWords.forEach(v => isNewMap.set(v.id, true))
    reviewWords.forEach(r => isNewMap.set(r.vocabulary.id, false))

    const allTasks = [
      ...newWords.map(v => ({ vocabulary: v })),
      ...reviewWords
    ]

    // 8. 分配题型
    const vocabularyIds = allTasks.map(t => t.vocabulary.id)
    const hasAudioMap = new Map<string, boolean>(
      allTasks.map(t => [t.vocabulary.id, (t.vocabulary.word_audios?.length || 0) > 0])
    )
    const allocation = allocateQuestionTypes(vocabularyIds, hasAudioMap)

    const tasksWithSelection = allTasks.map(t => {
      const targetType = allocation.get(t.vocabulary.id)
      const selected = selectQuestionByType(
        (t.vocabulary.questions || []).map((q: any) => ({ id: q.id, type: q.type })),
        targetType as any
      )
      return { ...t, targetQuestionType: targetType, selectedQuestionId: selected }
    })

    const shaped = mapTasksForMiniapp(tasksWithSelection, isNewMap)

    return apiResponse.success({
      tasks: shaped,
      summary: {
        newCount: newWords.length,
        reviewCount: reviewWords.length,
        dayNumber,
        totalDays
      }
    })
  } catch (error: any) {
    console.error('获取每日任务失败:', error)
    return apiResponse.error(`获取每日任务失败: ${error?.message || '未知错误'}`)
  }
}

// POST 保留用于兼容，但逻辑与 GET 相同
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return GET(request, { params })
}
