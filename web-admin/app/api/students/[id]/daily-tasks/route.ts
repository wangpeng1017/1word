import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'
import { allocateQuestionTypes, selectQuestionByType } from '@/lib/question-type-allocator'
import { getTodayBeijing, toBeijingDate } from '@/lib/date-utils'

// 每日新学单词上限
const MAX_NEW_WORDS_PER_DAY = 2000

// 艾宾浩斯记忆曲线：第N天学的单词，在第N+1, N+2, N+4, N+7, N+15天复习
const REVIEW_INTERVALS = [1, 2, 4, 7, 15]

// 将相对路径转换为完整URL
function toAbsoluteUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  // 使用阿里云域名
  const baseUrl = process.env.NEXT_PUBLIC_STATIC_URL || 'https://ienglish.xdf.cn'
  return `${baseUrl}${path}`
}

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
    // Fix: Use || instead of ?? to handle empty strings and ensure fallback works
    const defaultAudio = audioUs || audioUk || v.audioUrl || v.audio_url || null

    // 转换为完整URL
    const audioUsAbsolute = toAbsoluteUrl(audioUs)
    const audioUkAbsolute = toAbsoluteUrl(audioUk)
    const defaultAudioAbsolute = toAbsoluteUrl(defaultAudio)

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
        audioUrl: defaultAudioAbsolute,
        audioUs: audioUsAbsolute,
        audioUk: audioUkAbsolute,
        imageUrl: v.word_images?.[0]?.imageUrl ?? null, // 单词实物图片（保持原始路径）
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
  console.log('[daily-tasks] 开始处理, studentId:', studentId)
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
    console.log('[daily-tasks] 学生信息:', student)
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
                        word_images: { take: 1 }, // 只取第一张图片
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
    console.log('[daily-tasks] planClass found:', !!planClass, 'pack:', planClass?.vocabulary_packs?.name)

    const today = getTodayBeijing()

    // 3. 获取已掌握的词汇ID
    const masteredWords = await prisma.word_masteries.findMany({
      where: { studentId, isMastered: true },
      select: { vocabularyId: true }
    })
    const masteredVocabIds = new Set(masteredWords.map(w => w.vocabularyId))

    // 4. 计算今日新学单词和复习单词
    let newWords: any[] = []
    let reviewWords: { vocabulary: any }[] = []
    let dayNumber = 0
    let totalDays = 0

    // 获取查询参数中的 day (用于补打卡)
    const { searchParams } = new URL(request.url)
    const forcedDayStr = searchParams.get('day')
    const forcedDay = forcedDayStr ? parseInt(forcedDayStr) : null

    if (planClass?.vocabulary_packs) {
      const pack = planClass.vocabulary_packs
      totalDays = pack.totalDays

      // 计算今天是学习的第几天（使用北京时间）
      const startDateBeijing = toBeijingDate(planClass.start_date)
      const diffTime = today.getTime() - startDateBeijing.getTime()
      let currentDayNumber = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1

      // 如果指定了 day 参数（补打卡），则使用指定的 day，否则使用今天
      dayNumber = forcedDay || currentDayNumber

      console.log('[daily-tasks] dayNumber:', dayNumber, 'forcedDay:', forcedDay, 'totalDays:', totalDays)

      // 获取当天的新学单词
      if (dayNumber >= 1 && dayNumber <= totalDays) {
        const packDay = pack.pack_days.find(d => d.dayNumber === dayNumber)
        if (packDay) {
          newWords = packDay.day_words
            .map(dw => dw.vocabulary)
            .filter(v => v && !masteredVocabIds.has(v.id))
            .filter(v => v.questions && v.questions.length > 0)
            .filter(v => v.word_audios && v.word_audios.length > 0)
            .slice(0, MAX_NEW_WORDS_PER_DAY)
        }
      }

      // 获取需要复习的单词（基于记忆曲线，从过去天数的词汇包中获取）
      // 注意：如果是补打卡模式 (forcedDay)，则不需要加载复习词，只学新词
      if (!forcedDay) {
        const newWordIds = new Set(newWords.map(v => v.id))
        const seenVocabIds = new Set<string>()

        for (const interval of REVIEW_INTERVALS) {
          const targetDay = dayNumber - interval
          if (targetDay >= 1 && targetDay <= totalDays) {
            const packDay = pack.pack_days.find(d => d.dayNumber === targetDay)
            if (packDay) {
              const dayReviewWords = packDay.day_words
                .map(dw => dw.vocabulary)
                .filter(v => v && !masteredVocabIds.has(v.id) && !newWordIds.has(v.id) && !seenVocabIds.has(v.id))
                .filter(v => v.questions && v.questions.length > 0)
                .filter(v => v.word_audios && v.word_audios.length > 0)

              dayReviewWords.forEach(v => {
                seenVocabIds.add(v.id)
                reviewWords.push({ vocabulary: v })
              })
            }
          }
        }
      }
    }

    // 5. 合并任务并标记新学/复习
    const isNewMap = new Map<string, boolean>()
    newWords.forEach(v => isNewMap.set(v.id, true))
    reviewWords.forEach(r => isNewMap.set(r.vocabulary.id, false))

    const allTasks = [
      ...newWords.map(v => ({ vocabulary: v })),
      ...reviewWords
    ]

    // 6. 分配题型
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
    console.log('[daily-tasks] 返回任务数:', shaped.length, 'newCount:', newWords.length, 'reviewCount:', reviewWords.length)

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
